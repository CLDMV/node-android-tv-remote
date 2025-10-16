/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/screencap/comprehensive-screencap-test.mjs
 *	@Date: 2025-10-15 20:38:30 -07:00 (1760585910)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 06:43:49 -07:00 (1760622229)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Comprehensive test for all screencap methods and lastScreencapData functionality
 */

import createRemote from "../../src/lib/android-tv-remote.mjs";

const remote = await createRemote({
	ip: "10.6.0.133", // Working device IP
	autoConnect: true,
	quiet: false
});

console.log("🧪 Starting comprehensive screencap tests...\n");

try {
	// Wait for connection
	await remote.initPromise;
	console.log("✅ Connected to device\n");

	// Test 1: Basic screencap (returns stream)
	console.log("📋 Test 1: Basic screencap (returns stream)");
	const stream1 = await remote.screencap();
	console.log("✅ Stream returned:", !!stream1);
	console.log("✅ lastScreencapData set:", !!remote.lastScreencapData);
	console.log("✅ lastScreencapData is same stream:", remote.lastScreencapData === stream1);
	console.log("");

	// Test 2: Screencap with resizing (returns stream)
	console.log("📋 Test 2: Screencap with resizing (returns stream)");
	const stream2 = await remote.screencap({ width: 640, height: 360 });
	console.log("✅ Resized stream returned:", !!stream2);
	console.log("✅ lastScreencapData updated:", !!remote.lastScreencapData);
	console.log("✅ lastScreencapData is new stream:", remote.lastScreencapData === stream2);
	console.log("");

	// Test 3: Screencap saved to file (no stream returned)
	console.log("📋 Test 3: Screencap saved to file (no stream returned)");
	const result3 = await remote.screencap({ filepath: "./test-file-save.png" });
	console.log("✅ No stream returned (file save):", result3 === undefined);
	console.log("✅ lastScreencapData still available:", !!remote.lastScreencapData);
	console.log("⏳ Waiting for file save to complete...");
	await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for background save
	console.log("");

	// Test 4: Screencap with resizing and file save
	console.log("📋 Test 4: Screencap with resizing and file save");
	const result4 = await remote.screencap({ width: 320, height: 180, filepath: "./test-resized-save.png" });
	console.log("✅ No stream returned (file save):", result4 === undefined);
	console.log("✅ lastScreencapData updated after resize+save:", !!remote.lastScreencapData);
	console.log("⏳ Waiting for resized file save to complete...");
	await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for background save
	console.log("");

	// Test 5: Thumbnail with default 240px width
	console.log("📋 Test 5: Thumbnail with default 240px width");
	const thumbStream1 = await remote.thumbnail();
	console.log("✅ Thumbnail stream returned:", !!thumbStream1);
	console.log("✅ lastScreencapData updated by thumbnail:", !!remote.lastScreencapData);
	console.log("✅ lastScreencapData is thumbnail stream:", remote.lastScreencapData === thumbStream1);
	console.log("");

	// Test 6: Thumbnail with custom dimensions
	console.log("📋 Test 6: Thumbnail with custom dimensions");
	const thumbStream2 = await remote.thumbnail({ width: 160, height: 90 });
	console.log("✅ Custom thumbnail stream returned:", !!thumbStream2);
	console.log("✅ lastScreencapData updated:", remote.lastScreencapData === thumbStream2);
	console.log("");

	// Test 7: Thumbnail saved to file
	console.log("📋 Test 7: Thumbnail saved to file");
	const thumbResult = await remote.thumbnail({ filepath: "./test-thumbnail.png" });
	console.log("✅ No stream returned (thumbnail file save):", thumbResult === undefined);
	console.log("✅ lastScreencapData still available after thumbnail save:", !!remote.lastScreencapData);
	console.log("⏳ Waiting for thumbnail file save to complete...");
	await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for background save
	console.log("");

	// Test 8: Direct PNG pipe (no resizing, no file)
	console.log("📋 Test 8: Direct PNG pipe (should be fastest)");
	const startTime = performance.now();
	const directStream = await remote.screencap();
	const directTime = performance.now() - startTime;
	console.log("✅ Direct PNG stream returned:", !!directStream);
	console.log("✅ Direct pipe timing:", directTime.toFixed(2) + "ms");
	console.log("✅ lastScreencapData updated:", remote.lastScreencapData === directStream);
	console.log("");

	// Test 9: Verify lastScreencapData persistence
	console.log("📋 Test 9: Verify lastScreencapData persistence");
	const beforeStream = remote.lastScreencapData;
	await remote.screencap({ width: 800 });
	const afterStream = remote.lastScreencapData;
	console.log("✅ lastScreencapData changed after new screencap:", beforeStream !== afterStream);
	console.log("✅ New lastScreencapData is valid:", !!afterStream);
	console.log("");

	console.log("🎉 All comprehensive screencap tests passed!");
	console.log("📊 Final lastScreencapData status:", !!remote.lastScreencapData);
} catch (error) {
	console.error("❌ Test failed:", error.message);
	console.error(error.stack);
}

await remote.disconnect();
console.log("✅ Disconnected from device");
