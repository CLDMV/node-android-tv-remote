/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/screencap/raw-stream-test.mjs
 *	@Date: 2025-10-15 18:48:10 -07:00 (1760579290)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 06:42:14 -07:00 (1760622134)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

import { createRemote } from "../../index.mjs";
import { createWriteStream } from "fs";

async function test() {
	const remote = await createRemote({
		ip: "10.6.0.18",
		quiet: false
	});

	console.log("🧪 Testing raw ADB screencap stream...");

	try {
		console.log("📸 Getting raw screencap stream...");

		await remote.connect();

		// Get the raw screencap stream without any processing
		const stream = await remote.screencap();

		if (stream) {
			console.log("✅ Got screencap stream, saving raw data...");
			const writeStream = createWriteStream("./raw-screencap.data");
			stream.pipe(writeStream);

			writeStream.on("finish", () => {
				console.log("✅ Raw screencap saved to raw-screencap.data");
			});

			await new Promise((resolve) => {
				writeStream.on("finish", resolve);
				writeStream.on("error", resolve);
			});
		} else {
			console.log("❌ No stream returned");
		}

		await remote.disconnect();
		console.log("✅ Test completed");
	} catch (error) {
		console.error("❌ Test error:", error.message);
		console.error("❌ Stack:", error.stack);
	}
}

test().catch(console.error);
