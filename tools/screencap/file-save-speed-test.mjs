/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /tools/screencap/file-save-speed-test.mjs
 *	@Date: 2025-10-15T17:50:15-07:00 (1760575815)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T12:16:20-07:00 (1790968580)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

import { createRemote } from "../../index.mjs";

async function test() {
	const remote = await createRemote({
		ip: "10.6.0.133",
		quiet: false
	});

	console.log("🧪 Testing file save performance...");

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
		console.log("📸 Starting file save test...");
		const start = performance.now();

		// Test file save with processing
		await remote.screencap({ width: 640, height: 480, filepath: "./speed-test.png" });

		const duration = performance.now() - start;
		console.log(`✅ File save completed in ${duration.toFixed(2)}ms`);

		// Wait for background operations
		console.log("⏳ Waiting for background save...");
		await new Promise((resolve) => setTimeout(resolve, 2000));

		await remote.disconnect();
		console.log("✅ Test completed");
	} catch (error) {
		console.error("❌ Test error:", error.message);
	}
}

test().catch(console.error);
