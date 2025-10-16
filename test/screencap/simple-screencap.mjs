/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/screencap/simple-screencap.mjs
 *	@Date: 2025-10-15 17:35:06 -07:00 (1760574906)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 06:42:44 -07:00 (1760622164)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

import { createRemote } from "../../index.mjs";

async function test() {
	const remote = await createRemote({
		ip: "10.6.0.18",
		quiet: false
	});

	console.log("🧪 Simple test - single resized screenshot...");

	// Add error listener to catch any errors
	remote.on("error", (error) => {
		console.error("❌ Remote Error:", error.message);
		console.error("❌ Stack:", error.stack);
	});

	try {
		console.log("📸 Starting single resized screenshot test...");
		const stream = await remote.screencap({ width: 640, height: 480 });
		console.log("✅ Screenshot completed successfully");
		console.log("📦 Received stream:", !!stream);

		await remote.disconnect();
		console.log("✅ Test completed");
	} catch (error) {
		console.error("❌ Test error:", error.message);
		console.error("❌ Stack:", error.stack);
	}
}

test().catch(console.error);
