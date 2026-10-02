/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /tools/screencap/raw-stream-test.mjs
 *	@Date: 2025-10-15T18:48:10-07:00 (1760579290)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T12:16:21-07:00 (1790968581)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
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
