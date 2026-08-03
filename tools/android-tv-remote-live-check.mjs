/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /tools/android-tv-remote-live-check.mjs
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Manual live-device sanity check for the android-tv-remote module.
 *
 * Exercises connect/disconnect, keycodes, text input, press shortcuts, and
 * settings get/set against a REAL Android TV / Fire TV device over ADB. This
 * is NOT part of the automated vitest suite (see tests/) — it requires a
 * reachable device and the `adb` binary, so it cannot run in CI.
 *
 * Originally written as a Jest suite (test/android-tv-remote.test.mjs);
 * converted to a plain sequential script when Jest was removed in favor of
 * @cldmv/vitest-runner, since the automated suite has no CI-safe way to
 * exercise live hardware.
 *
 * Usage:
 *   ANDROID_TV_IP=192.168.1.50 ANDROID_TV_PORT=5555 node tools/android-tv-remote-live-check.mjs
 */

import Remote from "../src/lib/android-tv-remote.mjs";

const TEST_IP = process.env.ANDROID_TV_IP || "192.168.1.100";
const TEST_PORT = process.env.ANDROID_TV_PORT ? parseInt(process.env.ANDROID_TV_PORT, 10) : 5555;

/** @type {import('../src/lib/android-tv-remote').RemoteConfig} */
const config = {
	ip: TEST_IP,
	port: TEST_PORT,
	quiet: true,
	autoConnect: true,
	autoDisconnect: true,
	disconnectTimeout: 5
};

const remote = Remote(config);

/**
 * Runs a single named check, logging pass/fail without throwing so the rest
 * of the checks still run.
 * @param {string} name - Human-readable description of the check.
 * @param {() => Promise<void>} fn - The check to run.
 * @returns {Promise<boolean>} Whether the check passed.
 */
async function check(name, fn) {
	try {
		await fn();
		console.log(`✅ PASS: ${name}`);
		return true;
	} catch (err) {
		console.error(`❌ FAIL: ${name} — ${err && err.message}`);
		return false;
	}
}

async function main() {
	console.log(`Connecting to ${TEST_IP}:${TEST_PORT} (set ANDROID_TV_IP / ANDROID_TV_PORT to override)\n`);

	const results = [];

	results.push(
		await check("connect and disconnect without error (promise)", async () => {
			await remote.connect();
			await remote.disconnect();
		})
	);

	results.push(
		await check("connect and disconnect without error (callback)", () => {
			return new Promise((resolve, reject) => {
				remote.connect((err) => {
					if (err) return reject(err);
					remote.disconnect((err2) => {
						if (err2) return reject(err2);
						resolve();
					});
				});
			});
		})
	);

	results.push(
		await check("send a keycode (HOME)", async () => {
			await remote.connect();
			await remote.inputKeycode(3); // 3 = KEYCODE_HOME
			await remote.disconnect();
		})
	);

	results.push(
		await check("send text input", async () => {
			await remote.connect();
			await remote.keyboard.text("test");
			await remote.disconnect();
		})
	);

	results.push(
		await check("call press.home()", async () => {
			await remote.connect();
			await remote.press.home();
			await remote.disconnect();
		})
	);

	results.push(
		await check("call keyboard.key.a()", async () => {
			await remote.connect();
			await remote.keyboard.key.a();
			await remote.disconnect();
		})
	);

	results.push(
		await check("call keyboard.key.shift.a()", async () => {
			await remote.connect();
			await remote.keyboard.key.shift.a();
			await remote.disconnect();
		})
	);

	results.push(await check("handle settings get", () => remote.setSettings("get")));
	results.push(await check("handle settings set", () => remote.setSettings("set")));

	const passed = results.filter(Boolean).length;
	console.log(`\n${passed}/${results.length} checks passed`);
	process.exit(passed === results.length ? 0 : 1);
}

main();
