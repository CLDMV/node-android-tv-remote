/**
 * Event behaviour of the remote: every remote has its own event emitter (#43),
 * and an `error` event with no listener never crashes the process — it goes to
 * the `log` channel and the pending promise instead (#44).
 *
 * @devicefarmer/adbkit is mocked, so no ADB server, device or socket is used.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";

const client = {
	connect: vi.fn(),
	disconnect: vi.fn(),
	listDevices: vi.fn(),
	getDevice: vi.fn(() => ({ shell: vi.fn(async () => "") }))
};

vi.mock("@devicefarmer/adbkit", () => {
	const Adb = { createClient: () => client, util: { readAll: async (x) => Buffer.from(String(x)) } };
	return { default: { Adb }, Adb };
});

const { default: createRemote } = await import("../src/lib/android-tv-remote.mjs");

/** Config for an offline remote: no auto-connect, no heartbeat timers. */
const offline = (extra = {}) => ({ ip: "10.0.0.1", autoConnect: false, maintainConnection: false, quiet: false, ...extra });

beforeEach(() => {
	client.connect.mockReset().mockResolvedValue(true);
	client.disconnect.mockReset().mockResolvedValue(true);
	client.listDevices.mockReset().mockResolvedValue([]);
});

describe("per-instance event emitter (#43)", () => {
	test("a listener on one remote doesn't receive another remote's events", async () => {
		const a = await createRemote(offline({ ip: "10.0.0.1" }));
		const b = await createRemote(offline({ ip: "10.0.0.2" }));
		const onA = vi.fn();
		const onB = vi.fn();
		a.on("log", onA);
		b.on("log", onB);

		await a.connect();

		expect(onA).toHaveBeenCalledWith(expect.objectContaining({ level: "info", message: "Connected to 10.0.0.1:5555", source: "connect" }));
		expect(onB).not.toHaveBeenCalled();

		a.emit("custom", 1);
		const onCustomB = vi.fn();
		b.on("custom", onCustomB);
		a.emit("custom", 2);
		expect(onCustomB).not.toHaveBeenCalled();
	});

	test("error events stay on the remote that failed", async () => {
		const a = await createRemote(offline({ ip: "10.0.0.1" }));
		const b = await createRemote(offline({ ip: "10.0.0.2" }));
		const errA = vi.fn();
		const errB = vi.fn();
		a.on("error", errA);
		b.on("error", errB);

		await expect(a.keyboard.key("no-such-key")).rejects.toThrow("Unknown keyboard key: no-such-key");

		expect(errA).toHaveBeenCalledTimes(1);
		expect(errB).not.toHaveBeenCalled();
	});

	test("removing a listener on one remote leaves the other remote's listener in place", async () => {
		const a = await createRemote(offline({ ip: "10.0.0.1" }));
		const b = await createRemote(offline({ ip: "10.0.0.2" }));
		const listener = vi.fn();
		a.on("ping", listener);
		b.on("ping", listener);

		a.off("ping", listener);
		a.emit("ping");
		b.emit("ping");

		expect(listener).toHaveBeenCalledTimes(1);
	});
});

describe("error events without a listener (#44)", () => {
	test("a connection error with no error listener doesn't throw and goes to the log channel", async () => {
		client.connect.mockRejectedValue(new Error("connection refused"));
		const remote = await createRemote(offline());
		const onLog = vi.fn();
		remote.on("log", onLog);

		const result = await remote.connect();

		expect(result).toBeInstanceOf(Error);
		expect(remote.isConnected).toBe(false);
		expect(onLog).toHaveBeenCalledWith(
			expect.objectContaining({ level: "error", message: "connection refused", source: "handleDisconnectError", data: { error: result } })
		);
	});

	test("a connection error is delivered to an attached error listener", async () => {
		const failure = new Error("connection refused");
		client.connect.mockRejectedValue(failure);
		const remote = await createRemote(offline());
		const onError = vi.fn();
		const onLog = vi.fn();
		remote.on("error", onError);
		remote.on("log", onLog);

		await remote.connect();

		expect(onError).toHaveBeenCalledWith(
			expect.objectContaining({ error: failure, source: "handleDisconnectError", message: "connection refused" })
		);
		expect(onLog).not.toHaveBeenCalledWith(expect.objectContaining({ level: "error", source: "handleDisconnectError" }));
	});

	test("an operation error with no listener rejects the operation's promise instead of throwing", async () => {
		const remote = await createRemote(offline());

		await expect(remote.keyboard.key("no-such-key")).rejects.toThrow("Unknown keyboard key: no-such-key");
	});

	test("a failed auto-connect with no listener resolves the remote and rejects initPromise", async () => {
		client.connect.mockRejectedValue(new Error("connection refused"));

		const remote = await createRemote({ ip: "10.0.0.1", maintainConnection: false });

		expect(remote.isConnected).toBe(false);
		await expect(remote.initPromise).rejects.toThrow("Failed to connect to device on initialization.");
	});
});
