/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /tests/adb-client.test.vitest.mjs
 *	@Date: 2026-11-01T15:18:05-08:00 (1793575085)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T15:27:16-08:00 (1793575636)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * Every code path in the remote that calls into @devicefarmer/adbkit: client
 * creation, connect/disconnect, the heartbeat and connection check, shell
 * commands (keys, long presses, text, settings, power state), reboot,
 * screencap/thumbnail and waitBootComplete.
 *
 * @devicefarmer/adbkit is mocked with the same surface the remote uses, so no
 * ADB server, device or socket is involved. The last block loads the real
 * package and checks that surface still exists there.
 */

import { describe, test, expect, vi, beforeEach, afterEach, afterAll } from "vitest";
import { PassThrough } from "node:stream";
import { mkdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const device = {
	shell: vi.fn(),
	reboot: vi.fn(),
	screencap: vi.fn(),
	waitBootComplete: vi.fn()
};

const client = {
	connect: vi.fn(),
	disconnect: vi.fn(),
	listDevices: vi.fn(),
	getDevice: vi.fn(() => device)
};

const createClient = vi.fn(() => client);

/** Collects a stream (or a string the shell mock resolved with) into a Buffer, like adbkit's util.readAll. */
async function readAll(stream) {
	if (typeof stream === "string") return Buffer.from(stream);
	const chunks = [];
	for await (const chunk of stream) chunks.push(Buffer.from(chunk));
	return Buffer.concat(chunks);
}

/**
 * When set, the remote's file writes go through a stream that holds the data
 * and only writes the file in final(), 50ms after it's ended, the way a slow
 * disk would. Lets a test tell "the stream was ended" apart from "the file
 * is written".
 */
let slowWrites = false;

vi.mock("fs", async (importOriginal) => {
	const fs = await importOriginal();
	const { Writable } = await import("node:stream");
	const createWriteStream = (file, ...rest) => {
		if (!slowWrites) return fs.createWriteStream(file, ...rest);
		const chunks = [];
		return new Writable({
			write(chunk, _encoding, cb) {
				chunks.push(chunk);
				cb();
			},
			final(cb) {
				setTimeout(() => {
					fs.writeFileSync(file, Buffer.concat(chunks));
					cb();
				}, 50);
			}
		});
	};
	return { ...fs, default: { ...fs, createWriteStream }, createWriteStream };
});

vi.mock("@devicefarmer/adbkit", () => {
	const Adb = { createClient: (...args) => createClient(...args), util: { readAll: (s) => readAll(s) } };
	return { default: { Adb }, Adb };
});

const { default: createRemote } = await import("../src/lib/android-tv-remote.mjs");

const HOST = "10.0.0.1";
const scratch = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "tmp", "tests-adb-client");

/** Config for a remote that doesn't connect on creation and runs no timers. */
const offline = (extra = {}) => ({ ip: HOST, autoConnect: false, maintainConnection: false, quiet: false, ...extra });

/** Collects every log event a remote emits. */
function logsOf(remote) {
	const logs = [];
	remote.on("log", (entry) => logs.push(entry));
	return logs;
}

const messages = (logs) => logs.map((l) => l.message);

/** A small real PNG, so sharp has something to decode. */
const png = await sharp({ create: { width: 64, height: 32, channels: 3, background: { r: 10, g: 20, b: 30 } } })
	.png()
	.toBuffer();

/** A stream that yields the PNG, the way device.screencap() resolves. */
function pngStream() {
	const s = new PassThrough();
	s.end(png);
	return s;
}

/** Shell output for `dumpsys power`. */
const dumpsys = (powered, wakefulness, ready) =>
	`POWER MANAGER\n  mIsPowered=${powered}\n  mWakefulness=${wakefulness}\n  mDisplayReady=${ready}\n`;

beforeEach(() => {
	createClient.mockClear();
	client.getDevice.mockClear();
	client.connect.mockReset().mockResolvedValue("10.0.0.1:5555");
	client.disconnect.mockReset().mockResolvedValue(device);
	client.listDevices.mockReset().mockResolvedValue([]);
	device.shell.mockReset().mockResolvedValue("");
	device.reboot.mockReset().mockResolvedValue(true);
	device.screencap.mockReset().mockImplementation(async () => pngStream());
	device.waitBootComplete.mockReset().mockResolvedValue(true);
});

afterEach(() => {
	vi.useRealTimers();
	slowWrites = false;
});

afterAll(() => {
	rmSync(scratch, { recursive: true, force: true });
});

describe("client creation", () => {
	test("creates the client with the default timeout and targets ip:5555", async () => {
		await createRemote(offline());

		expect(createClient).toHaveBeenCalledWith({ timeout: 10000 });
		expect(client.getDevice).toHaveBeenCalledWith(`${HOST}:5555`);
	});

	test("passes connectTimeout and a custom port through", async () => {
		await createRemote(offline({ port: 5556, connectTimeout: 2500 }));

		expect(createClient).toHaveBeenCalledWith({ timeout: 2500 });
		expect(client.getDevice).toHaveBeenCalledWith(`${HOST}:5556`);
	});

	test("rejects a config without an ip", async () => {
		await expect(createRemote({})).rejects.toThrow("Missing required 'ip' property");
	});
});

describe("initial auto-connect", () => {
	test("a device already in listDevices counts as connected without calling connect", async () => {
		client.listDevices.mockResolvedValue([{ id: `${HOST}:5555`, type: "device" }]);

		const remote = await createRemote({ ip: HOST, maintainConnection: false });

		expect(remote.isConnected).toBe(true);
		expect(client.connect).not.toHaveBeenCalled();
		await expect(remote.initPromise).resolves.toBeUndefined();
	});

	test("a device missing from listDevices is connected with client.connect(ip, port)", async () => {
		const remote = await createRemote({ ip: HOST, maintainConnection: false });

		expect(client.connect).toHaveBeenCalledWith(HOST, 5555);
		expect(remote.isConnected).toBe(true);
		await expect(remote.initPromise).resolves.toBeUndefined();
	});

	test("a listDevices failure reports 'unknown' and still tries to connect", async () => {
		client.listDevices.mockRejectedValue(new Error("adb server down"));

		const remote = await createRemote({ ip: HOST, maintainConnection: false });

		expect(client.connect).toHaveBeenCalledTimes(1);
		expect(remote.isConnected).toBe(true);
	});
});

describe("connect", () => {
	test("connects once and reports 'Already connected' on the second call", async () => {
		const remote = await createRemote(offline());
		const logs = logsOf(remote);

		await remote.connect();
		await remote.connect();

		expect(client.connect).toHaveBeenCalledTimes(1);
		expect(messages(logs)).toEqual([`Connected to ${HOST}:5555`, `Already connected to ${HOST}:5555`]);
	});

	test("an 'already connected' error from adb counts as connected", async () => {
		client.connect.mockRejectedValue(new Error("already connected to 10.0.0.1:5555"));
		const remote = await createRemote(offline());

		await expect(remote.connect()).resolves.toBe(true);
		expect(remote.isConnected).toBe(true);
	});

	test("an unauthorized device gets the authorization hints", async () => {
		const failure = new Error("device unauthorized");
		client.connect.mockRejectedValue(failure);
		const remote = await createRemote(offline());
		const logs = logsOf(remote);
		const errors = [];
		remote.on("error", (e) => errors.push(e));

		await expect(remote.connect()).resolves.toBe(failure);

		expect(errors.map((e) => e.message)).toEqual(["device unauthorized", "Device unauthorized - authentication required"]);
		expect(messages(logs).some((m) => m.includes("accept the authorization dialog"))).toBe(true);
	});

	test("a refused connection gets the enable-ADB steps", async () => {
		client.connect.mockRejectedValue(new Error("connect ECONNREFUSED: actively refused"));
		const remote = await createRemote(offline());
		const logs = logsOf(remote);
		remote.on("error", () => {});

		await remote.connect();

		expect(messages(logs)).toContain("6. On your computer, run: adb connect <device-ip>:5555");
	});

	test("supports the callback style", async () => {
		const remote = await createRemote(offline());

		const result = await new Promise((resolve, reject) => remote.connect((err, value) => (err ? reject(err) : resolve(value))));

		expect(result).toBeUndefined();
		expect(remote.isConnected).toBe(true);
	});
});

describe("disconnect", () => {
	test("calls client.disconnect(ip, port) and clears the connected state", async () => {
		const remote = await createRemote(offline());
		await remote.connect();

		await expect(remote.disconnect()).resolves.toBe(true);

		expect(client.disconnect).toHaveBeenCalledWith(HOST, 5555);
		expect(remote.isConnected).toBe(false);
	});

	test("an 'already disconnected' error still counts as disconnected", async () => {
		client.disconnect.mockRejectedValue(new Error("device disconnected"));
		const remote = await createRemote(offline());
		await remote.connect();

		await expect(remote.disconnect()).resolves.toBe(true);
		expect(remote.isConnected).toBe(false);
	});

	test("any other error is returned and reported", async () => {
		const failure = new Error("socket hang up");
		client.disconnect.mockRejectedValue(failure);
		const remote = await createRemote(offline());
		const errors = [];
		remote.on("error", (e) => errors.push(e));

		await expect(remote.disconnect()).resolves.toBe(failure);
		expect(errors[0]).toMatchObject({ error: failure, source: "handleDisconnectError" });
	});
});

describe("connection status", () => {
	test("getConnectionStatus(true) follows listDevices", async () => {
		const remote = await createRemote(offline());

		client.listDevices.mockResolvedValue([{ id: `${HOST}:5555` }]);
		expect(await remote.getConnectionStatus(true)).toBe("connected");
		expect(await remote.getConnectionStatus()).toBe("connected");

		client.listDevices.mockResolvedValue([{ id: "other:5555" }]);
		expect(await remote.getConnectionStatus(true)).toBe("disconnected");

		client.listDevices.mockRejectedValue(new Error("boom"));
		expect(await remote.getConnectionStatus(true)).toBe("unknown");
		expect(remote.isConnected).toBe(false);
	});
});

describe("heartbeat and connection check", () => {
	test("sends a heartbeat shell command and reconnects when the device drops out of listDevices", async () => {
		vi.useFakeTimers();
		const remote = await createRemote(offline({ maintainConnection: true, heartbeatInterval: 1000, connectionCheckInterval: 5000 }));
		const logs = logsOf(remote);
		await remote.connect();

		await vi.advanceTimersByTimeAsync(1000);
		expect(device.shell).toHaveBeenCalledWith("echo heartbeat");

		await vi.advanceTimersByTimeAsync(4000);
		expect(client.listDevices).toHaveBeenCalled();
		expect(client.connect).toHaveBeenCalledTimes(2);
		expect(messages(logs)).toContain(`Device ${HOST}:5555 not found in adb devices list. Attempting reconnect...`);

		await remote.disconnect();
	});

	test("a failing heartbeat is ignored and a failing listDevices is logged as a warning", async () => {
		vi.useFakeTimers();
		device.shell.mockRejectedValue(new Error("closed"));
		client.listDevices.mockRejectedValue(new Error("adb server gone"));
		const remote = await createRemote(offline({ maintainConnection: true, heartbeatInterval: 1000, connectionCheckInterval: 1000 }));
		const logs = logsOf(remote);
		await remote.connect();

		await vi.advanceTimersByTimeAsync(1000);

		expect(logs).toContainEqual(
			expect.objectContaining({ level: "warn", message: "Error checking device connection: adb server gone", source: "connectionCheck" })
		);
		await remote.disconnect();
	});

	test("a device still listed keeps the connection as is", async () => {
		vi.useFakeTimers();
		client.listDevices.mockResolvedValue([{ id: `${HOST}:5555` }]);
		const remote = await createRemote(offline({ maintainConnection: true, connectionCheckInterval: 1000 }));
		await remote.connect();

		await vi.advanceTimersByTimeAsync(1000);

		expect(client.connect).toHaveBeenCalledTimes(1);
		await remote.disconnect();
	});
});

describe("auto-disconnect", () => {
	test("disconnects after the idle timeout following a command", async () => {
		vi.useFakeTimers();
		const remote = await createRemote({
			ip: HOST,
			autoConnect: true,
			autoDisconnect: true,
			disconnectTimeout: 2,
			maintainConnection: false
		});
		client.listDevices.mockResolvedValue([]);

		await remote.inputKeycode(3);
		expect(client.disconnect).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(2000);
		expect(client.disconnect).toHaveBeenCalledWith(HOST, 5555);
	});
});

describe("shell commands", () => {
	test("inputKeycode auto-connects and sends 'input keyevent'", async () => {
		const remote = await createRemote({ ip: HOST, autoConnect: true, maintainConnection: false });
		client.connect.mockClear();
		await remote.disconnect();

		await remote.inputKeycode(26);

		expect(client.connect).toHaveBeenCalledTimes(1);
		expect(device.shell).toHaveBeenCalledWith("input keyevent 26");
	});

	test("press keys map onto keycodes", async () => {
		const remote = await createRemote(offline());

		for (const key of ["ok", "up", "down", "left", "right", "play", "pause", "mute", "input", "home"]) {
			await remote.press[key]();
		}

		const sent = device.shell.mock.calls.map(([cmd]) => cmd);
		expect(sent).toHaveLength(10);
		for (const cmd of sent) expect(cmd).toMatch(/^input keyevent \d+$/);
	});

	test("long presses send a sendevent down/up pair on the input device", async () => {
		const remote = await createRemote(offline({ inputDevice: "/dev/input/event3" }));

		for (const key of ["ok", "up", "down", "left", "right", "play", "pause", "mute", "input", "home"]) {
			await remote.press.long[key]();
		}

		const sent = device.shell.mock.calls.map(([cmd]) => cmd);
		expect(sent).toHaveLength(10);
		for (const cmd of sent)
			expect(cmd).toMatch(/^sendevent \/dev\/input\/event3 1 \d+ 1 && sleep 1 && sendevent \/dev\/input\/event3 1 \d+ 0$/);
	});

	test("keyboard.text escapes spaces for 'input text'", async () => {
		const remote = await createRemote(offline());

		await remote.keyboard.text("hello big world");

		expect(device.shell).toHaveBeenCalledWith('input text "hello%sbig%sworld"');
	});

	test("keyboard keys go out as text, as keycodes or shifted", async () => {
		const remote = await createRemote(offline());

		await remote.keyboard.key("a");
		await remote.keyboard.key("a", { forceKeycode: true });
		await remote.keyboard.key.a();
		await remote.keyboard.key.a({ forceKeycode: true });
		await remote.keyboard.key.a.keycode();
		await remote.keyboard.key.shift.a();

		const sent = device.shell.mock.calls.map(([cmd]) => cmd);
		expect(sent[0]).toBe('input text "a"');
		expect(sent[1]).toMatch(/^input keyevent \d+$/);
		expect(sent[2]).toBe('input text "a"');
		expect(sent[3]).toBe(sent[1]);
		expect(sent[4]).toBe(sent[1]);
		expect(sent[5]).toBe('input text "A"');
	});

	test("a shell failure rejects the command and supports the callback style", async () => {
		device.shell.mockRejectedValue(new Error("closed"));
		const remote = await createRemote(offline());

		await expect(remote.inputKeycode(3)).rejects.toThrow("closed");
		const err = await new Promise((resolve) => remote.inputKeycode(3, (e) => resolve(e)));
		expect(err.message).toBe("closed");
	});
});

describe("setSettings", () => {
	test("'set' writes the core and additional settings", async () => {
		const remote = await createRemote(offline());

		await remote.setSettings();

		const sent = device.shell.mock.calls.map(([cmd]) => cmd);
		expect(sent).toEqual([
			"settings put system screen_off_timeout 2147483647",
			"settings put secure sleep_timeout 0",
			"settings put global stay_on_while_plugged_in 3",
			"settings put system screen_brightness_mode 0",
			"settings put system screen_brightness 255",
			"svc power stayon true"
		]);
	});

	test("'get' reads each core setting through readAll", async () => {
		device.shell.mockImplementation(async (cmd) => (cmd.endsWith("sleep_timeout") ? "0\n" : "42\n"));
		const remote = await createRemote(offline());
		const logs = logsOf(remote);

		await remote.setSettings("get");

		expect(device.shell).toHaveBeenCalledTimes(3);
		expect(messages(logs)).toContain("secure sleep_timeout: 0");
		expect(messages(logs)).toContain("system screen_off_timeout: 42");
	});

	test("a shell failure is reported and rethrown", async () => {
		device.shell.mockRejectedValue(new Error("permission denied"));
		const remote = await createRemote(offline());
		const errors = [];
		remote.on("error", (e) => errors.push(e));

		await expect(remote.setSettings()).rejects.toThrow("permission denied");
		expect(errors[0]).toMatchObject({ source: "setSettings", message: "Failed to configure Android TV settings" });
	});
});

describe("ensureAwake", () => {
	test("a device that is already awake needs no keycodes", async () => {
		device.shell.mockResolvedValue(dumpsys("true", "Awake", "true"));
		const remote = await createRemote(offline());

		await expect(remote.ensureAwake()).resolves.toBe(true);
		expect(device.shell.mock.calls.map(([c]) => c)).toEqual(["dumpsys power", "dumpsys power"]);
	});

	test("a sleeping device gets POWER and WAKEUP and is checked again", async () => {
		vi.useFakeTimers();
		let reads = 0;
		device.shell.mockImplementation(async (cmd) => {
			if (cmd !== "dumpsys power") return "";
			reads += 1;
			return reads === 1 ? dumpsys("false", "Asleep", "false") : dumpsys("true", "Awake", "true");
		});
		const remote = await createRemote(offline());

		const result = remote.ensureAwake();
		await vi.advanceTimersByTimeAsync(5000);

		await expect(result).resolves.toBe(true);
		const keyevents = device.shell.mock.calls.map(([c]) => c).filter((c) => c.startsWith("input keyevent"));
		expect(keyevents).toHaveLength(3);
	});

	test("a device that stays asleep resolves false and reports the issues", async () => {
		vi.useFakeTimers();
		device.shell.mockImplementation(async (cmd) => (cmd === "dumpsys power" ? "nothing useful" : ""));
		const remote = await createRemote(offline());
		const errors = [];
		remote.on("error", (e) => errors.push(e));

		const result = remote.ensureAwake();
		await vi.advanceTimersByTimeAsync(5000);

		await expect(result).resolves.toBe(false);
		expect(errors[0].error.message).toContain("ensureAwake failed with 3 persistent issue(s)");
	});

	test("a shell failure is reported and rethrown", async () => {
		device.shell.mockRejectedValue(new Error("closed"));
		const remote = await createRemote(offline());
		remote.on("error", () => {});

		await expect(remote.ensureAwake()).rejects.toThrow("closed");
	});
});

describe("reboot", () => {
	test("calls device.reboot() and drops the connection a second later", async () => {
		vi.useFakeTimers();
		const remote = await createRemote(offline());
		await remote.connect();

		await expect(remote.reboot()).resolves.toBe(true);
		expect(device.reboot).toHaveBeenCalledTimes(1);
		expect(remote.isConnected).toBe(true);

		await vi.advanceTimersByTimeAsync(1000);
		expect(remote.isConnected).toBe(false);
	});

	test("a timeout while rebooting counts as success", async () => {
		device.reboot.mockRejectedValue(new Error("socket timeout"));
		const remote = await createRemote(offline());

		await expect(remote.reboot()).resolves.toBe(true);
	});

	test.each([
		["device unauthorized", "Device unauthorized - ensure ADB debugging is enabled and device is authorized"],
		["device not found", "Device not found - check IP address and ADB connection"],
		["permission denied", "Permission denied - reboot may require root access on some devices"]
	])("a '%s' failure is reported and rethrown", async (msg, hint) => {
		device.reboot.mockRejectedValue(new Error(msg));
		const remote = await createRemote(offline());
		const logs = logsOf(remote);
		remote.on("error", () => {});

		await expect(remote.reboot()).rejects.toThrow(msg);
		expect(messages(logs)).toContain(hint);
	});
});

describe("screencap", () => {
	test("returns the raw PNG stream from device.screencap()", async () => {
		const remote = await createRemote(offline());
		const events = [];
		for (const name of ["screencap-start", "screencap-captured", "screencap-ready", "screencap-complete"]) {
			remote.on(name, () => events.push(name));
		}

		const stream = await remote.screencap();

		expect(await readAll(stream)).toEqual(png);
		expect(remote.lastScreencapData).toBe(stream);
		expect(events).toEqual(["screencap-start", "screencap-captured", "screencap-ready", "screencap-complete"]);
	});

	test("resizes through sharp when a width is given", async () => {
		const remote = await createRemote(offline());

		const stream = await remote.screencap({ width: 32 });
		const meta = await sharp(await readAll(stream)).metadata();

		expect(meta).toMatchObject({ format: "png", width: 32, height: 16 });
	});

	test("thumbnail defaults to 240px wide without upscaling", async () => {
		const remote = await createRemote(offline());

		const stream = await remote.thumbnail({ height: 8 });
		const meta = await sharp(await readAll(stream)).metadata();

		expect(meta).toMatchObject({ width: 16, height: 8 });
	});

	test("saves the raw PNG to a file in the background", async () => {
		mkdirSync(scratch, { recursive: true });
		const file = path.join(scratch, "raw.png");
		const remote = await createRemote(offline());
		const saved = new Promise((resolve) => remote.once("screencap-saved", resolve));

		await expect(remote.screencap({ filepath: file })).resolves.toBeUndefined();
		await saved;
		await remote.disconnect();

		expect(readFileSync(file)).toEqual(png);
	});

	test("saves a resized PNG to a file, and disconnect waits for it", async () => {
		mkdirSync(scratch, { recursive: true });
		const file = path.join(scratch, "small.png");
		const remote = await createRemote(offline());
		const done = new Promise((resolve) => remote.once("screencap-complete", resolve));

		await remote.screencap({ width: 16, filepath: file });
		await remote.disconnect();
		await done;

		expect(await sharp(remote.lastScreencapData).metadata()).toMatchObject({ format: "png", width: 16, height: 8 });
		expect(readFileSync(file)).toEqual(remote.lastScreencapData);
	});

	test("the resized file is fully written when 'screencap-saved' and 'screencap-complete' fire (#86)", async () => {
		mkdirSync(scratch, { recursive: true });
		const file = path.join(scratch, "complete.png");
		rmSync(file, { force: true });
		slowWrites = true;
		const remote = await createRemote(offline());
		const read = () => (existsSync(file) ? readFileSync(file) : null);
		const onDisk = {};
		const done = new Promise((resolve) => {
			remote.once("screencap-saved", () => (onDisk.saved = read()));
			remote.once("screencap-complete", () => {
				onDisk.complete = read();
				resolve();
			});
		});

		await remote.screencap({ width: 16, filepath: file });
		await done;

		expect(onDisk.saved).toEqual(remote.lastScreencapData);
		expect(onDisk.complete).toEqual(remote.lastScreencapData);
		await remote.disconnect();
	});

	test("a failed write of a resized file emits an error and no completion (#86)", async () => {
		const file = path.join(scratch, "missing-dir", "resized.png");
		const remote = await createRemote(offline());
		const errors = [];
		const completed = vi.fn();
		remote.on("error", (e) => errors.push(e));
		remote.on("screencap-complete", completed);

		await remote.screencap({ width: 16, filepath: file });
		await remote.disconnect();

		expect(errors).toHaveLength(1);
		expect(errors[0]).toMatchObject({ source: "screencap", error: expect.objectContaining({ code: "ENOENT" }) });
		expect(completed).not.toHaveBeenCalled();
		expect(existsSync(file)).toBe(false);
	});

	test("a write failure in the background is reported", async () => {
		const file = path.join(scratch, "missing-dir", "nope.png");
		const remote = await createRemote(offline());
		const errors = [];
		remote.on("error", (e) => errors.push(e));

		await remote.screencap({ filepath: file });
		await remote.disconnect();

		expect(existsSync(file)).toBe(false);
		expect(errors[0]).toMatchObject({ source: "screencap" });
	});

	test.each([
		["device unauthorized", "Device unauthorized - ensure ADB debugging is enabled and device is authorized"],
		["device not found", "Device not found - check IP address and ADB connection"],
		["screencap failed", "Screencap utility may not be available - automatic fallback to framebuffer attempted"],
		["ENOENT: no such file", "File path error: ENOENT: no such file"]
	])("a '%s' failure is reported and rethrown", async (msg, hint) => {
		device.screencap.mockRejectedValue(new Error(msg));
		const remote = await createRemote(offline());
		const logs = logsOf(remote);
		remote.on("error", () => {});

		await expect(remote.screencap()).rejects.toThrow(msg);
		expect(messages(logs)).toContain(hint);
	});
});

describe("waitBootComplete", () => {
	test("resolves with device.waitBootComplete()'s result", async () => {
		const remote = await createRemote(offline());

		await expect(remote.waitBootComplete()).resolves.toBe(true);
		expect(device.waitBootComplete).toHaveBeenCalledTimes(1);
	});

	test("passes the timeout to adbkit as an AbortSignal (#85)", async () => {
		const remote = await createRemote(offline());

		await remote.waitBootComplete(1234);

		const [options] = device.waitBootComplete.mock.calls[0];
		expect(options.signal).toBeInstanceOf(AbortSignal);
		expect(options.signal.aborted).toBe(false);
	});

	test("gives up once the timeout passes instead of waiting for the device (#85)", async () => {
		// Like adbkit 4: the wait rejects with signal.reason when the signal aborts.
		// Without a signal it would only finish when the device does, after 2s here.
		device.waitBootComplete.mockImplementation(
			(options) =>
				new Promise((resolve, reject) => {
					const finished = setTimeout(() => resolve(true), 2000);
					options?.signal?.addEventListener("abort", () => {
						clearTimeout(finished);
						reject(options.signal.reason);
					});
				})
		);
		const remote = await createRemote(offline());
		const logs = logsOf(remote);
		remote.on("error", () => {});

		await expect(remote.waitBootComplete(50)).rejects.toMatchObject({ name: "TimeoutError" });
		expect(messages(logs)).toContain("Boot completion timeout after 50ms - device may still be starting");
	});

	test.each([
		["unauthorized", "Device unauthorized - ensure ADB debugging is enabled and device is authorized"],
		["device not found", "Device not found - check IP address and ADB connection"],
		["timeout", "Boot completion timeout after 5000ms - device may still be starting"],
		["connection reset", "Connection lost while waiting for boot completion"]
	])("a '%s' failure is reported and rethrown", async (msg, hint) => {
		device.waitBootComplete.mockRejectedValue(new Error(msg));
		const remote = await createRemote(offline());
		const logs = logsOf(remote);
		remote.on("error", () => {});

		await expect(remote.waitBootComplete(5000)).rejects.toThrow(msg);
		expect(messages(logs)).toContain(hint);
	});
});

describe("the real @devicefarmer/adbkit still has the surface the remote uses", () => {
	test("client, device and util methods exist and return native promises", async () => {
		const real = await vi.importActual("@devicefarmer/adbkit");
		const Adb = real.Adb ?? real.default?.Adb ?? real.default;

		expect(typeof Adb.createClient).toBe("function");
		expect(typeof Adb.util.readAll).toBe("function");

		const realClient = Adb.createClient({ timeout: 1000 });
		for (const name of ["connect", "disconnect", "listDevices", "getDevice"]) {
			expect(typeof realClient[name]).toBe("function");
		}
		const realDevice = realClient.getDevice(`${HOST}:5555`);
		for (const name of ["shell", "reboot", "screencap", "waitBootComplete"]) {
			expect(typeof realDevice[name]).toBe("function");
		}

		const stream = new PassThrough();
		const read = Adb.util.readAll(stream);
		stream.end("hello");
		expect(read).toBeInstanceOf(Promise);
		expect((await read).toString()).toBe("hello");
	});
});
