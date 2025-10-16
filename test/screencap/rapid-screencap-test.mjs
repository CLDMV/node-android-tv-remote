/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/screencap/rapid-screencap-test.mjs
 *	@Date: 2025-10-15 20:48:34 -07:00 (1760586514)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 06:42:08 -07:00 (1760622128)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Test multiple rapid screencap calls to reproduce the file save issue
 */

import createRemote from "../../src/lib/android-tv-remote.mjs";

const remote = await createRemote({
	ip: "10.6.0.133",
	autoConnect: true,
	quiet: false
});

console.log("🧪 Testing multiple rapid screencap calls...\n");

try {
	await remote.initPromise;
	console.log("✅ Connected to device\n");

	// Test multiple file saves in rapid succession
	console.log("📋 Test 1: Direct save (no processing)");
	await remote.screencap({ filepath: "./rapid-test-1-direct.png" });
	console.log("Called screencap 1 (direct)\n");

	console.log("📋 Test 2: Resized save (Sharp processing)");
	await remote.screencap({ width: 640, height: 360, filepath: "./rapid-test-2-resized.png" });
	console.log("Called screencap 2 (resized)\n");

	console.log("📋 Test 3: Another resized save (Sharp processing)");
	await remote.screencap({ width: 320, height: 180, filepath: "./rapid-test-3-resized.png" });
	console.log("Called screencap 3 (resized)\n");

	console.log("⏳ Waiting 5 seconds for all background operations to complete...");
	await new Promise((resolve) => setTimeout(resolve, 5000));

	console.log("🎉 Test completed - checking disconnect...");
	await remote.disconnect();
	console.log("✅ Disconnected");
} catch (error) {
	console.error("❌ Test failed:", error.message);
	console.error(error.stack);
}
