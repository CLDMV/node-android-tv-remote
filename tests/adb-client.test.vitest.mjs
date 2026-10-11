/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /tests/adb-client.test.vitest.mjs
 *	@Date: 2026-11-01T15:18:05-08:00 (1793575085)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-07T09:43:32-08:00 (1794073412)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * Every code path in the remote that goes through its droidsock client: client
 * creation, connect/disconnect, shell commands (keys, long presses, text,
 * settings, power state), reboot, screencap/thumbnail and waitBootComplete.
 *
 * @cldmv/droidsock is mocked with the surface the remote uses, so no device or
 * socket is involved. droidsock.test.vitest.mjs covers the keep-alive options and
 * lifecycle events, and droidsock-socket.test.vitest.mjs runs the real package.
 */

import { describe, test, expect, vi, beforeEach, afterEach, afterAll } from "vitest";
import { mkdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const device = {
	on: vi.fn(() => device),
	isConnected: vi.fn(() => true),
	shell: vi.fn(),
	reboot: vi.fn()
};

const client = {
	connect: vi.fn(),
	disconnect: vi.fn()
};

const createDroid = vi.fn(async () => ({ device: client }));

/** Collects a stream into a Buffer. */
async function readAll(stream) {
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

vi.mock("@cldmv/droidsock", () => ({ default: (...args) => createDroid(...args) }));

const { default: createRemote } = await import("../src/lib/android-tv-remote.mjs");

const HOST = "10.0.0.1";
const scratch = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "tmp", "tests-adb-client");

/** Config for a remote that doesn't connect on creation and runs no timers. */
const offline = (extra = {}) => ({ ip: HOST, autoConnect: false, maintainConnection: false, quiet: false, ...extra });

/** A remote from offline() that has connected, so its shell calls reach the device. */
async function online(extra) {
	const remote = await createRemote(offline(extra));
	await remote.connect();
	return remote;
}

/** Every shell command the device has received. */
const sentCommands = () => device.shell.mock.calls.map(([cmd]) => cmd);

/** Makes the shell answer `screencap -p` the way droidsock does, as a latin1 string, and every other command with `other`. */
function shellWithScreen(other = "") {
	device.shell.mockImplementation(async (cmd) => (cmd === "screencap -p" ? png.toString("latin1") : other));
}

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

/** Shell output for `dumpsys power`. */
const dumpsys = (powered, wakefulness, ready) =>
	`POWER MANAGER\n  mIsPowered=${powered}\n  mWakefulness=${wakefulness}\n  mDisplayReady=${ready}\n`;

beforeEach(() => {
	createDroid.mockClear();
	client.connect.mockReset().mockResolvedValue(device);
	client.disconnect.mockReset().mockReturnValue(true);
	device.on.mockClear();
	device.isConnected.mockReset().mockReturnValue(true);
	device.shell.mockReset();
	shellWithScreen();
	device.reboot.mockReset().mockResolvedValue(true);
});

afterEach(() => {
	vi.useRealTimers();
	slowWrites = false;
});

afterAll(() => {
	rmSync(scratch, { recursive: true, force: true });
});

describe("client creation", () => {
	test("creates the client with the default timeout and connects to ip:5555", async () => {
		await online();

		expect(createDroid).toHaveBeenCalledWith({ config: { timeout: 10000 } });
		expect(client.connect).toHaveBeenCalledWith(HOST, 5555, {});
	});

	test("passes connectTimeout and a custom port through", async () => {
		await online({ port: 5556, connectTimeout: 2500 });

		expect(createDroid).toHaveBeenCalledWith({ config: { timeout: 2500 } });
		expect(client.connect).toHaveBeenCalledWith(HOST, 5556, {});
	});

	test("rejects a config without an ip", async () => {
		await expect(createRemote({})).rejects.toThrow("Missing required 'ip' property");
	});
});

describe("initial auto-connect", () => {
	test("connects on creation", async () => {
		const remote = await createRemote({ ip: HOST, maintainConnection: false });
		await expect(remote.initPromise).resolves.toBeUndefined();

		expect(client.connect).toHaveBeenCalledTimes(1);
		expect(remote.isConnected).toBe(true);
	});

	test("a failed connection rejects initPromise", async () => {
		client.connect.mockRejectedValue(new Error("connect ETIMEDOUT"));

		const remote = await createRemote({ ip: HOST, maintainConnection: false });

		await expect(remote.initPromise).rejects.toThrow("Failed to connect to device on initialization.");
		expect(remote.isConnected).toBe(false);
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

	test("droidsock's failed authentication gets the authorization hints", async () => {
		client.connect.mockRejectedValue(new Error("Authentication failed - expected CNXN (4e584e43) or OKAY (59414b4f), got 0"));
		const remote = await createRemote(offline());
		const logs = logsOf(remote);
		remote.on("error", () => {});

		await remote.connect();

		expect(messages(logs).some((m) => m.includes("accept the authorization dialog"))).toBe(true);
	});

	test("a refused connection gets the enable-ADB steps", async () => {
		client.connect.mockRejectedValue(new Error("connect ECONNREFUSED 10.0.0.1:5555"));
		const remote = await createRemote(offline());
		const logs = logsOf(remote);
		remote.on("error", () => {});

		await remote.connect();

		expect(messages(logs)).toContain("6. Connect again with remote.connect()");
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
		client.disconnect.mockImplementation(() => {
			throw new Error("device disconnected");
		});
		const remote = await createRemote(offline());
		await remote.connect();

		await expect(remote.disconnect()).resolves.toBe(true);
		expect(remote.isConnected).toBe(false);
	});

	test("any other error is returned and reported", async () => {
		const failure = new Error("socket hang up");
		client.disconnect.mockImplementation(() => {
			throw failure;
		});
		const remote = await createRemote(offline());
		const errors = [];
		remote.on("error", (e) => errors.push(e));

		await expect(remote.disconnect()).resolves.toBe(failure);
		expect(errors[0]).toMatchObject({ error: failure, source: "handleDisconnectError" });
	});
});

describe("connection status", () => {
	test("getConnectionStatus(true) follows the live socket", async () => {
		const remote = await createRemote(offline());

		expect(await remote.getConnectionStatus(true)).toBe("disconnected");

		await remote.connect();
		expect(await remote.getConnectionStatus(true)).toBe("connected");
		expect(await remote.getConnectionStatus()).toBe("connected");

		device.isConnected.mockReturnValue(false);
		expect(await remote.getConnectionStatus(true)).toBe("disconnected");
		expect(remote.isConnected).toBe(false);
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
		await remote.initPromise;

		await remote.inputKeycode(3);
		expect(client.disconnect).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(2000);
		expect(client.disconnect).toHaveBeenCalledWith(HOST, 5555);
	});

	test("another command restarts the idle timer", async () => {
		vi.useFakeTimers();
		const remote = await createRemote({ ip: HOST, autoDisconnect: true, disconnectTimeout: 2, maintainConnection: false });
		await remote.initPromise;

		await remote.inputKeycode(3);
		await vi.advanceTimersByTimeAsync(1500);
		await remote.inputKeycode(3);
		await vi.advanceTimersByTimeAsync(1500);
		expect(client.disconnect).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(500);
		expect(client.disconnect).toHaveBeenCalledTimes(1);
	});
});

describe("shell commands", () => {
	test("inputKeycode auto-connects and sends 'input keyevent'", async () => {
		const remote = await createRemote({ ip: HOST, autoConnect: true, maintainConnection: false });
		await remote.initPromise;
		client.connect.mockClear();
		await remote.disconnect();

		await remote.inputKeycode(26);

		expect(client.connect).toHaveBeenCalledTimes(1);
		expect(sentCommands()).toEqual(["input keyevent 26"]);
	});

	test("press keys map onto keycodes", async () => {
		const remote = await online();

		for (const key of ["ok", "up", "down", "left", "right", "play", "pause", "mute", "input", "home"]) {
			await remote.press[key]();
		}

		const sent = sentCommands();
		expect(sent).toHaveLength(10);
		for (const cmd of sent) expect(cmd).toMatch(/^input keyevent \d+$/);
	});

	test("long presses send a sendevent down/up pair on the input device", async () => {
		const remote = await online({ inputDevice: "/dev/input/event3" });

		for (const key of ["ok", "up", "down", "left", "right", "play", "pause", "mute", "input", "home"]) {
			await remote.press.long[key]();
		}

		const sent = sentCommands();
		expect(sent).toHaveLength(10);
		for (const cmd of sent)
			expect(cmd).toMatch(/^sendevent \/dev\/input\/event3 1 \d+ 1 && sleep 1 && sendevent \/dev\/input\/event3 1 \d+ 0$/);
	});

	test("keyboard.text escapes spaces for 'input text'", async () => {
		const remote = await online();

		await remote.keyboard.text("hello big world");

		expect(sentCommands()).toEqual(['input text "hello%sbig%sworld"']);
	});

	test("keyboard keys go out as text, as keycodes or shifted", async () => {
		const remote = await online();

		await remote.keyboard.key("a");
		await remote.keyboard.key("a", { forceKeycode: true });
		await remote.keyboard.key.a();
		await remote.keyboard.key.a({ forceKeycode: true });
		await remote.keyboard.key.a.keycode();
		await remote.keyboard.key.shift.a();

		const sent = sentCommands();
		expect(sent[0]).toBe('input text "a"');
		expect(sent[1]).toMatch(/^input keyevent \d+$/);
		expect(sent[2]).toBe('input text "a"');
		expect(sent[3]).toBe(sent[1]);
		expect(sent[4]).toBe(sent[1]);
		expect(sent[5]).toBe('input text "A"');
	});

	test("a command on a remote that never connected rejects", async () => {
		const remote = await createRemote(offline());

		await expect(remote.inputKeycode(3)).rejects.toThrow("Device not connected");
		expect(device.shell).not.toHaveBeenCalled();
	});

	test("a shell failure rejects the command and supports the callback style", async () => {
		device.shell.mockRejectedValue(new Error("closed"));
		const remote = await online();

		await expect(remote.inputKeycode(3)).rejects.toThrow("closed");
		const err = await new Promise((resolve) => remote.inputKeycode(3, (e) => resolve(e)));
		expect(err.message).toBe("closed");
	});
});

describe("setSettings", () => {
	test("'set' writes the core and additional settings", async () => {
		const remote = await online();

		await remote.setSettings();

		const sent = sentCommands();
		expect(sent).toEqual([
			"settings put system screen_off_timeout 2147483647",
			"settings put secure sleep_timeout 0",
			"settings put global stay_on_while_plugged_in 3",
			"settings put system screen_brightness_mode 0",
			"settings put system screen_brightness 255",
			"svc power stayon true"
		]);
	});

	test("'get' reads each core setting", async () => {
		device.shell.mockImplementation(async (cmd) => (cmd.endsWith("sleep_timeout") ? "0\n" : "42\n"));
		const remote = await online();
		const logs = logsOf(remote);

		await remote.setSettings("get");

		expect(device.shell).toHaveBeenCalledTimes(3);
		expect(messages(logs)).toContain("secure sleep_timeout: 0");
		expect(messages(logs)).toContain("system screen_off_timeout: 42");
	});

	test("a shell failure is reported and rethrown", async () => {
		device.shell.mockRejectedValue(new Error("permission denied"));
		const remote = await online();
		const errors = [];
		remote.on("error", (e) => errors.push(e));

		await expect(remote.setSettings()).rejects.toThrow("permission denied");
		expect(errors[0]).toMatchObject({ source: "setSettings", message: "Failed to configure Android TV settings" });
	});
});

describe("ensureAwake", () => {
	test("a device that is already awake needs no keycodes", async () => {
		device.shell.mockResolvedValue(dumpsys("true", "Awake", "true"));
		const remote = await online();

		await expect(remote.ensureAwake()).resolves.toBe(true);
		expect(sentCommands()).toEqual(["dumpsys power", "dumpsys power"]);
	});

	test("a sleeping device gets POWER and WAKEUP and is checked again", async () => {
		vi.useFakeTimers();
		let reads = 0;
		device.shell.mockImplementation(async (cmd) => {
			if (cmd !== "dumpsys power") return "";
			reads += 1;
			return reads === 1 ? dumpsys("false", "Asleep", "false") : dumpsys("true", "Awake", "true");
		});
		const remote = await online();

		const result = remote.ensureAwake();
		await vi.advanceTimersByTimeAsync(5000);

		await expect(result).resolves.toBe(true);
		const keyevents = sentCommands().filter((c) => c.startsWith("input keyevent"));
		expect(keyevents).toHaveLength(3);
	});

	test("a device that stays asleep resolves false and reports the issues", async () => {
		vi.useFakeTimers();
		device.shell.mockImplementation(async (cmd) => (cmd === "dumpsys power" ? "nothing useful" : ""));
		const remote = await online();
		const errors = [];
		remote.on("error", (e) => errors.push(e));

		const result = remote.ensureAwake();
		await vi.advanceTimersByTimeAsync(5000);

		await expect(result).resolves.toBe(false);
		expect(errors[0].error.message).toContain("ensureAwake failed with 3 persistent issue(s)");
	});

	test("a shell failure is reported and rethrown", async () => {
		device.shell.mockRejectedValue(new Error("closed"));
		const remote = await online();
		remote.on("error", () => {});

		await expect(remote.ensureAwake()).rejects.toThrow("closed");
	});
});

describe("reboot", () => {
	test("calls reboot on the device and drops the connection a second later", async () => {
		vi.useFakeTimers();
		const remote = await online();

		await expect(remote.reboot()).resolves.toBe(true);
		expect(device.reboot).toHaveBeenCalledTimes(1);
		expect(remote.isConnected).toBe(true);

		await vi.advanceTimersByTimeAsync(1000);
		expect(remote.isConnected).toBe(false);
	});

	test("a timeout while rebooting counts as success", async () => {
		device.reboot.mockRejectedValue(new Error("socket timeout"));
		const remote = await online();

		await expect(remote.reboot()).resolves.toBe(true);
	});

	test.each([
		["device unauthorized", "Device unauthorized - ensure ADB debugging is enabled and device is authorized"],
		["device not found", "Device not found - check IP address and ADB connection"],
		["permission denied", "Permission denied - reboot may require root access on some devices"]
	])("a '%s' failure is reported and rethrown", async (msg, hint) => {
		device.reboot.mockRejectedValue(new Error(msg));
		const remote = await online();
		const logs = logsOf(remote);
		remote.on("error", () => {});

		await expect(remote.reboot()).rejects.toThrow(msg);
		expect(messages(logs)).toContain(hint);
	});
});

describe("screencap", () => {
	test("returns the PNG from 'screencap -p' as a stream", async () => {
		const remote = await online();
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
		const remote = await online();

		const stream = await remote.screencap({ width: 32 });
		const meta = await sharp(await readAll(stream)).metadata();

		expect(meta).toMatchObject({ format: "png", width: 32, height: 16 });
	});

	test("thumbnail defaults to 240px wide without upscaling", async () => {
		const remote = await online();

		const stream = await remote.thumbnail({ height: 8 });
		const meta = await sharp(await readAll(stream)).metadata();

		expect(meta).toMatchObject({ width: 16, height: 8 });
	});

	test("saves the raw PNG to a file in the background", async () => {
		mkdirSync(scratch, { recursive: true });
		const file = path.join(scratch, "raw.png");
		const remote = await online();
		const saved = new Promise((resolve) => remote.once("screencap-saved", resolve));

		await expect(remote.screencap({ filepath: file })).resolves.toBeUndefined();
		await saved;
		await remote.disconnect();

		expect(readFileSync(file)).toEqual(png);
	});

	test("saves a resized PNG to a file, and disconnect waits for it", async () => {
		mkdirSync(scratch, { recursive: true });
		const file = path.join(scratch, "small.png");
		const remote = await online();
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
		const remote = await online();
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
		const remote = await online();
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
		const remote = await online();
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
		device.shell.mockRejectedValue(new Error(msg));
		const remote = await online();
		const logs = logsOf(remote);
		remote.on("error", () => {});

		await expect(remote.screencap()).rejects.toThrow(msg);
		expect(messages(logs)).toContain(hint);
	});
});

describe("waitBootComplete", () => {
	test("resolves true once sys.boot_completed reads 1", async () => {
		device.shell.mockResolvedValue("1\n");
		const remote = await online();

		await expect(remote.waitBootComplete()).resolves.toBe(true);
		expect(sentCommands()).toEqual(["getprop sys.boot_completed"]);
	});

	test("hands the time left to the shell, so a hung device can't outlast the timeout (#85)", async () => {
		device.shell.mockResolvedValue("1\n");
		const remote = await online();

		await remote.waitBootComplete(1234);

		const [, options] = device.shell.mock.calls[0];
		expect(options.timeout).toBeGreaterThan(0);
		expect(options.timeout).toBeLessThanOrEqual(1234);
	});

	test("gives up once the timeout passes instead of waiting for the device (#85)", async () => {
		// Like droidsock: the shell rejects when its own timeout runs out.
		device.shell.mockImplementation(
			(cmd, options) => new Promise((_, reject) => setTimeout(() => reject(new Error(`Command timeout: ${cmd}`)), options.timeout))
		);
		const remote = await online();
		const logs = logsOf(remote);
		remote.on("error", () => {});
		const started = Date.now();

		await expect(remote.waitBootComplete(50)).rejects.toThrow("Boot completion timeout after 50ms");

		expect(Date.now() - started).toBeLessThan(1000);
		expect(messages(logs)).toContain("Boot completion timeout after 50ms - device may still be starting");
	});

	test("doesn't sleep past the timeout between polls (#85)", async () => {
		device.shell.mockResolvedValue("0\n");
		const remote = await online();
		remote.on("error", () => {});
		const started = Date.now();

		await expect(remote.waitBootComplete(50)).rejects.toThrow("Boot completion timeout");

		expect(Date.now() - started).toBeLessThan(1000);
	});

	test("an unauthorized device fails right away with the hint", async () => {
		device.shell.mockRejectedValue(new Error("device unauthorized"));
		const remote = await online();
		const logs = logsOf(remote);
		remote.on("error", () => {});

		await expect(remote.waitBootComplete(5000)).rejects.toThrow("device unauthorized");

		expect(device.shell).toHaveBeenCalledTimes(1);
		expect(messages(logs)).toContain("Device unauthorized - ensure ADB debugging is enabled and device is authorized");
	});
});
