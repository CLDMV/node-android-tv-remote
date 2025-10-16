/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/retry-init-adb.test.mjs
 *	@Date: 2025-10-15 10:19:05 -07:00 (1760548745)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-15 10:57:13 -07:00 (1760551033)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Test for ADB initialization retry logic using the real android-tv-remote module.
 *
 * To run: node test/retry-init-adb.test.mjs
 */

import assert from "assert";
import createRemote from "../src/lib/android-tv-remote.mjs";

/**
 * Attempts to initialize ADB repeatedly until successful or max attempts.
 * Calls remote.initPromise every 500ms until it resolves or rejects.
 * Logs each attempt and result for debugging.
 * @param {Object} remote - The remote instance from android-tv-remote.
 * @param {number} maxAttempts - Maximum attempts before giving up.
 * @returns {Promise<{success: boolean, attempts: number, error?: Error}>}
 */
async function tryInitADB(remote, maxAttempts = 10) {
	let attempt = 0;
	while (attempt < maxAttempts) {
		attempt++;
		console.log(`[init] tryInitADB attempt #${attempt}`);
		try {
			await Promise.race([
				remote.initPromise,
				new Promise((_, reject) => setTimeout(() => reject(new Error("initPromise timeout")), 4000))
			]);
			console.log(`[init] initADB result: true`);
			return { success: true, attempts: attempt };
		} catch (err) {
			console.warn(`[init] initADB failed: ${err && err.message}`);
			if (attempt >= maxAttempts) {
				return { success: false, attempts: attempt, error: err };
			}
			// Wait before retrying
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}
	return { success: false, attempts: attempt };
}

// --- TESTS ---
(async function runTests() {
	// Test: Should fail to connect to an unreachable device and retry
	// const remote = createRemote({ ip: "10.42.0.210", port: 5555, autoConnect: true, quiet: false }); // unreachable IP
	// const result = await tryInitADB(remote, 3);
	// assert.strictEqual(result.success, false, "Should fail to connect to unreachable device");
	// assert.ok(result.attempts >= 3, "Should attempt at least 3 times");
	// console.log("Test passed: Retries and fails as expected for unreachable device.");

	(async () => {
		const remote = await createRemote({ ip: "10.42.0.210", port: 5555, autoConnect: true, quiet: false });
		try {
			await remote.initPromise;
			console.log("initPromise resolved");
		} catch (err) {
			console.error("initPromise rejected:", err);
		}
	})();
	// Optionally, test a reachable device if you have one:
	// const remote2 = createRemote({ ip: "YOUR_DEVICE_IP", port: 5555, autoConnect: true, quiet: false });
	// const result2 = await tryInitADB(remote2, 2);
	// assert.strictEqual(result2.success, true, "Should connect to reachable device");
	// console.log("Test passed: Connects to reachable device.");
})();
