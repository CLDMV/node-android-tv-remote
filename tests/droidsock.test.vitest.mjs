/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /tests/droidsock.test.vitest.mjs
 *	@Date: 2026-11-07T09:36:49-08:00 (1794073009)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-07T09:43:34-08:00 (1794073414)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * The remote's use of @cldmv/droidsock: connect options, lifecycle events,
 * in-memory screencap bytes and boot polling. droidsock is mocked, so no
 * device or socket is used.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";

const handlers = {};
const leaf = {
	on: vi.fn((event, fn) => {
		handlers[event] = fn;
		return leaf;
	}),
	isConnected: vi.fn(() => true),
	shell: vi.fn(async () => ""),
	reboot: vi.fn(async () => true)
};
const connect = vi.fn();
const disconnect = vi.fn();
const create = vi.fn();

vi.mock("@cldmv/droidsock", () => ({
	default: async (options) => {
		create(options);
		return { device: { connect, disconnect } };
	}
}));

const { default: createRemote } = await import("@cldmv/node-android-tv-remote");

const config = (extra = {}) => ({ ip: "10.0.0.5", autoConnect: false, maintainConnection: true, quiet: false, ...extra });

beforeEach(() => {
	connect.mockReset().mockResolvedValue(leaf);
	disconnect.mockReset().mockReturnValue(true);
	leaf.shell.mockReset().mockResolvedValue("");
	leaf.isConnected.mockReset().mockReturnValue(true);
});

describe("connect options", () => {
	test("maintainConnection turns on droidsock auto-reconnect and the heartbeat", async () => {
		const remote = await createRemote(config({ heartbeatInterval: 5000 }));
		await remote.connect();
		expect(connect).toHaveBeenCalledWith("10.0.0.5", 5555, { autoReconnect: true, heartbeat: { interval: 5000 } });
	});

	test("maintainConnection: false passes no keep-alive options", async () => {
		const remote = await createRemote(config({ maintainConnection: false }));
		await remote.connect();
		expect(connect).toHaveBeenCalledWith("10.0.0.5", 5555, {});
	});

	test("the connect timeout reaches droidsock", async () => {
		await createRemote(config({ connectTimeout: 2500 }));
		expect(create).toHaveBeenLastCalledWith({ config: { timeout: 2500 } });
	});
});

describe("lifecycle events", () => {
	test("a drop clears the connected state and a reconnect is logged", async () => {
		const remote = await createRemote(config());
		const logs = [];
		remote.on("log", (e) => logs.push(e));
		await remote.connect();
		expect(remote.isConnected).toBe(true);

		handlers.disconnected({ intentional: false });
		expect(remote.isConnected).toBe(false);
		handlers.reconnecting({ attempt: 1, delay: 1000 });
		handlers.reconnected({ attempt: 1 });
		handlers.connected({});
		expect(remote.isConnected).toBe(true);
		expect(logs.map((l) => l.message)).toEqual(
			expect.arrayContaining(["Connection to 10.0.0.5:5555 dropped", "Reconnected to 10.0.0.5:5555"])
		);
	});

	test("an intentional disconnect is not logged as a drop; gave-up is an error", async () => {
		const remote = await createRemote(config());
		const logs = [];
		const errors = [];
		remote.on("log", (e) => logs.push(e));
		remote.on("error", (e) => errors.push(e));
		await remote.connect();

		handlers.disconnected({ intentional: true });
		expect(logs.some((l) => l.message.includes("dropped"))).toBe(false);

		handlers.disconnected({ intentional: false });
		handlers["gave-up"]({ reason: "max-attempts", error: new Error("refused") });
		expect(errors).toHaveLength(1);
		expect(errors[0].error.message).toBe("refused");
		handlers["gave-up"]({ reason: "auth" });
		expect(errors).toHaveLength(2);
		expect(errors[1].error.message).toContain("auth");
	});

	test("live status follows the droidsock handle", async () => {
		const remote = await createRemote(config());
		expect(await remote.getConnectionStatus(true)).toBe("disconnected");
		await remote.connect();
		leaf.isConnected.mockReturnValue(false);
		expect(await remote.getConnectionStatus(true)).toBe("disconnected");
		leaf.isConnected.mockReturnValue(true);
		expect(await remote.getConnectionStatus(true)).toBe("connected");
	});

	test("disconnect() hands the target to droidsock", async () => {
		const remote = await createRemote(config());
		await remote.connect();
		await remote.disconnect();
		expect(disconnect).toHaveBeenCalledWith("10.0.0.5", 5555);
		expect(remote.isConnected).toBe(false);
	});
});

describe("device calls", () => {
	test("screencap keeps every byte of the PNG", async () => {
		const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff, 0x80]);
		leaf.shell.mockResolvedValue(png.toString("latin1"));
		const remote = await createRemote(config({ autoConnect: true }));
		await remote.connect();
		const stream = await remote.screencap();
		const chunks = [];
		for await (const chunk of stream) chunks.push(chunk);
		expect(Buffer.concat(chunks).equals(png)).toBe(true);
		expect(leaf.shell).toHaveBeenCalledWith("screencap -p", expect.objectContaining({ encoding: "latin1" }));
	});

	test("waitBootComplete polls sys.boot_completed", async () => {
		vi.useFakeTimers();
		try {
			leaf.shell.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce("0\n").mockResolvedValue("1\n");
			const remote = await createRemote(config({ autoConnect: true }));
			await remote.connect();
			const done = remote.waitBootComplete(10000);
			await vi.advanceTimersByTimeAsync(3000);
			await expect(done).resolves.toBe(true);
			expect(leaf.shell).toHaveBeenCalledWith("getprop sys.boot_completed", expect.objectContaining({ timeout: expect.any(Number) }));
		} finally {
			vi.useRealTimers();
		}
	});

	test("waitBootComplete gives up at the timeout", async () => {
		vi.useFakeTimers();
		try {
			leaf.shell.mockResolvedValue("0\n");
			const remote = await createRemote(config({ autoConnect: true }));
			await remote.connect();
			const done = remote.waitBootComplete(2000);
			const settled = expect(done).rejects.toThrow("Boot completion timeout");
			await vi.advanceTimersByTimeAsync(4000);
			await settled;
		} finally {
			vi.useRealTimers();
		}
	});

	test("shell output reaches key and settings calls as a string", async () => {
		leaf.shell.mockResolvedValue("ok");
		const remote = await createRemote(config({ autoConnect: true }));
		await remote.connect();
		await remote.inputKeycode(26);
		expect(leaf.shell).toHaveBeenCalledWith("input keyevent 26", undefined);
	});
});
