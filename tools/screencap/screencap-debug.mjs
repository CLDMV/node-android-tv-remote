/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /tools/screencap/screencap-debug.mjs
 *	@Date: 2025-10-15 17:29:39 -07:00 (1760574579)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-15 21:50:08 -07:00 (1760590208)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

import { createRemote } from "../../index.mjs";

async function test() {
	const remote = await createRemote({
		ip: "10.6.0.18",
		quiet: false
	});

	console.log("🧪 Testing screencap file save with detailed error handling...");

	// Add error listener to catch any errors
	remote.on("error", (error) => {
		console.error("❌ Remote Error:", error.message);
		console.error("Stack:", error.stack);
	});

	// Add timing listener to see exact values
	remote.on("screencap-saved", (data) => {
		console.log("💾 File saved event:", JSON.stringify(data, null, 2));
	});

	remote.on("screencap-complete", (data) => {
		console.log("✅ Complete event:", JSON.stringify(data, null, 2));
	});

	try {
		// Simple file save test
		console.log("📸 Starting file save test...");
		await remote.screencap({ filepath: "./test-debug.png" });
		console.log("✅ File save completed");

		// Wait for background operations
		await new Promise((resolve) => setTimeout(resolve, 1000));

		await remote.disconnect();
	} catch (error) {
		console.error("❌ Test error:", error.message);
		console.error("Stack:", error.stack);
	}
}

test().catch(console.error);
