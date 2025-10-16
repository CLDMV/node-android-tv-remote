/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/screencap/debug-background-timing.mjs
 *	@Date: 2025-10-15 20:43:58 -07:00 (1760586238)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 06:44:09 -07:00 (1760622249)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Focused test for background operations timing
 */

import createRemote from "../../src/lib/android-tv-remote.mjs";

const remote = await createRemote({
	ip: "10.6.0.133",
	autoConnect: true,
	quiet: false
});

console.log("🧪 Testing background operations with detailed logging...\n");

try {
	await remote.initPromise;
	console.log("✅ Connected to device\n");

	console.log("📋 Test: File save with background operation logging");
	const startTime = performance.now();

	// This should trigger background operation with detailed logging
	await remote.screencap({ filepath: "./debug-background-test.png" });

	const endTime = performance.now();
	console.log(`⏱️ screencap() call completed in: ${(endTime - startTime).toFixed(2)}ms`);
	console.log("📋 Now calling disconnect to see background operation timing...\n");

	const disconnectStartTime = performance.now();
	await remote.disconnect();
	const disconnectEndTime = performance.now();

	console.log(`⏱️ disconnect() completed in: ${(disconnectEndTime - disconnectStartTime).toFixed(2)}ms`);
	console.log("✅ Test completed");
} catch (error) {
	console.error("❌ Test failed:", error.message);
	console.error(error.stack);
}
