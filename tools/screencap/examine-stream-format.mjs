/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /tools/screencap/examine-stream-format.mjs
 *	@Date: 2025-10-15 19:02:07 -07:00 (1760580127)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 06:41:49 -07:00 (1760622109)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

import { createRemote } from "../../index.mjs";
import { createWriteStream } from "fs";

async function test() {
	const remote = await createRemote({
		ip: "10.6.0.133",
		quiet: false
	});

	console.log("🧪 Testing raw ADB screencap stream format...");

	try {
		console.log("📸 Getting raw screencap stream...");

		// Get the raw screencap stream without any processing (no width/height/filepath)
		const rawStream = await remote.screencap();

		console.log("✅ Got screencap stream, saving first 100 bytes to examine format...");

		// Read first chunk to examine format
		rawStream.once("data", (chunk) => {
			console.log("📋 First 100 bytes (hex):");
			console.log(chunk.slice(0, 100).toString("hex"));
			console.log("📋 First 20 bytes as string:");
			console.log(chunk.slice(0, 20).toString("ascii"));

			// Check for PNG signature (89 50 4E 47 0D 0A 1A 0A)
			const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
			if (chunk.slice(0, 8).equals(pngSignature)) {
				console.log("✅ Stream starts with PNG signature - it's already PNG format!");
			} else {
				console.log("❌ Stream does NOT start with PNG signature");
				console.log("Expected PNG signature:", pngSignature.toString("hex"));
				console.log("Actual first 8 bytes:", chunk.slice(0, 8).toString("hex"));
			}
		});

		// Save raw stream to file
		const writeStream = createWriteStream("./raw-stream-test.data");
		rawStream.pipe(writeStream);

		await new Promise((resolve) => {
			writeStream.on("finish", () => {
				console.log("✅ Raw stream saved to raw-stream-test.data");
				resolve();
			});
		});

		await remote.disconnect();
		console.log("✅ Test completed - check raw-stream-test.data");
	} catch (error) {
		console.error("❌ Test error:", error.message);
		console.error("❌ Stack:", error.stack);
	}
}

test().catch(console.error);
