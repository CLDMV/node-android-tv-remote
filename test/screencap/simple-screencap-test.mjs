/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/screencap/simple-screencap-test.mjs
 *	@Date: 2025-10-15 16:04:49 -07:00 (1760569489)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 06:42:39 -07:00 (1760622159)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Simple screencap test to verify PNG output without Sharp processing
 */

import createRemote from "../../src/lib/android-tv-remote.mjs";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";

async function runTest() {
	try {
		console.log("🔌 Creating remote connection...");
		const remote = await createRemote({
			ip: "10.6.0.18",
			quiet: false,
			autoConnect: true // Auto-connect is now handled internally
		});

		// Add error handling
		remote.on("error", (errorData) => {
			console.error(`❌ Remote Error from ${errorData.source}:`, errorData.error.message);
		});

		remote.on("log", (logData) => {
			console.log(`[${logData.level.toUpperCase()}] ${logData.message}`);
		});

		console.log("✅ Remote ready!");

		console.log("📸 Taking raw screenshot...");
		const screencapStream = await remote.screencap();

		console.log("💾 Saving directly to file...");
		const writeStream = createWriteStream("./raw-test.png");

		await pipeline(screencapStream, writeStream);

		console.log("✅ Raw screenshot saved successfully!");

		// Disconnect properly
		await remote.disconnect();
		console.log("🔌 Disconnected");
	} catch (error) {
		console.error("❌ Error:", error.message);
		process.exit(1);
	}
}

// Run the test
runTest().catch(console.error);
