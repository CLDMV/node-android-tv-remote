/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/screencap/no-resize-speed-test.mjs
 *	@Date: 2025-10-15 18:05:25 -07:00 (1760576725)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-15 21:50:14 -07:00 (1760590214)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

import { createRemote } from "../../index.mjs";

async function test() {
	const remote = await createRemote({
		ip: "10.6.0.133",
		quiet: false
	});

	console.log("🧪 Testing file save performance WITHOUT resizing...");

	// Add timing listener
	remote.on("screencap-saved", (data) => {
		console.log("💾 File saved:", {
			filepath: data.filepath,
			timing: data.timing
		});
	});

	remote.on("error", (error) => {
		console.error("❌ Remote Error:", error.message);
	});

	try {
		console.log("📸 Starting file save test (no resizing)...");
		const start = performance.now();

		// Test file save WITHOUT processing (no width/height)
		await remote.screencap({ filepath: "./speed-test-no-resize.png" });

		const duration = performance.now() - start;
		console.log(`✅ File save completed in ${duration.toFixed(2)}ms`);

		// Wait for background operations
		console.log("⏳ Waiting for background save...");
		await new Promise((resolve) => setTimeout(resolve, 8000));

		await remote.disconnect();
		console.log("✅ Test completed");
	} catch (error) {
		console.error("❌ Test error:", error.message);
	}
}

test().catch(console.error);
