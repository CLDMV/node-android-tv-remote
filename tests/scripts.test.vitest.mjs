/**
 * Smoke test for everything under scripts/: every script must import cleanly,
 * so a dangling import (like scripts/setup-device.mjs pointing at the removed
 * src/lib/adb/setup.mjs, #42) fails CI instead of shipping. Scripts only run
 * their CLI when executed directly, so importing them has no side effects.
 *
 * Also covers the setup-device flow against a fake remote — no ADB or network.
 */

import { describe, test, expect, vi } from "vitest";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "scripts");
const scriptFiles = readdirSync(scriptsDir).filter((f) => /\.(mjs|js|cjs)$/.test(f));

describe("scripts/ smoke test", () => {
	test("finds the scripts", () => {
		expect(scriptFiles.length).toBeGreaterThan(0);
	});

	test.each(scriptFiles)("%s imports without errors and exports main()", async (file) => {
		const mod = await import(pathToFileURL(path.join(scriptsDir, file)).href);
		expect(typeof mod.main).toBe("function");
	});
});

/**
 * Build a fake remote that records the calls made on it.
 * @param {object} [opts]
 * @param {boolean} [opts.connects=true] - Whether connect() succeeds.
 * @param {Error} [opts.settingsError] - Error thrown by setSettings().
 */
function fakeRemote({ connects = true, settingsError } = {}) {
	const calls = [];
	const listeners = {};
	let connected = false;
	const remote = {
		on(event, fn) {
			listeners[event] = fn;
			return remote;
		},
		listeners,
		calls,
		get isConnected() {
			return connected;
		},
		async connect() {
			calls.push("connect");
			if (!connects) return new Error("connection refused");
			connected = true;
		},
		async setSettings() {
			calls.push("setSettings");
			if (settingsError) throw settingsError;
		},
		async ensureAwake() {
			calls.push("ensureAwake");
			return true;
		},
		press: {
			async home() {
				calls.push("home");
			}
		},
		async disconnect() {
			calls.push("disconnect");
			connected = false;
		}
	};
	return remote;
}

describe("setup-device", () => {
	test("connects, applies settings, wakes, goes home and disconnects", async () => {
		const { setupDevice } = await import("../scripts/setup-device.mjs");
		const remote = fakeRemote();
		const create = vi.fn(async () => remote);
		const log = vi.fn();

		await setupDevice({ ip: "10.0.0.5", port: 5556, create, log });

		expect(create).toHaveBeenCalledWith(expect.objectContaining({ ip: "10.0.0.5", port: 5556, autoConnect: false }));
		expect(remote.calls).toEqual(["connect", "setSettings", "ensureAwake", "home", "disconnect"]);

		// log and error events are forwarded to the log sink
		remote.listeners.log({ level: "info", message: "hello" });
		remote.listeners.error({ message: "boom" });
		expect(log).toHaveBeenCalledWith("[info] hello");
		expect(log).toHaveBeenCalledWith("[error] boom");
	});

	test("rejects with the connection error when the device can't be reached", async () => {
		const { setupDevice } = await import("../scripts/setup-device.mjs");
		const remote = fakeRemote({ connects: false });

		await expect(setupDevice({ ip: "10.0.0.5", create: async () => remote, log: () => {} })).rejects.toThrow("connection refused");
		expect(remote.calls).toEqual(["connect"]);
	});

	test("still disconnects when a setup step fails", async () => {
		const { setupDevice } = await import("../scripts/setup-device.mjs");
		const remote = fakeRemote({ settingsError: new Error("settings failed") });

		await expect(setupDevice({ ip: "10.0.0.5", create: async () => remote, log: () => {} })).rejects.toThrow("settings failed");
		expect(remote.calls).toEqual(["connect", "setSettings", "disconnect"]);
	});
});
