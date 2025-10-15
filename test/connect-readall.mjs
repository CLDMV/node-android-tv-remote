/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/connect-readall.mjs
 *	@Date: 2025-10-15 10:19:05 -07:00 (1760548745)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-15 10:57:06 -07:00 (1760551026)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

// Test script to connect to an ADB device and read settings.
// Usage: node test/connect-readall.mjs <ip> [port] [get|set] [--quiet]

import AndroidTVSetup from "../src/lib/adb/setup.mjs";
import readline from "readline";

async function main() {
	const ip = process.argv[2];
	const port = process.argv[3] ? parseInt(process.argv[3], 10) : 5555;
	const mode = process.argv[4] === "set" ? "set" : "get";
	const quiet = process.argv.includes("--quiet");

	if (!ip) {
		console.error("Usage: node test/connect-readall.mjs <ip> [port] [get|set] [--quiet]");
		process.exit(1);
	}

	if (!quiet) console.log(`Running in ${mode} mode on ${ip}:${port}`);

	const setup = new AndroidTVSetup({ ip, port, quiet });
	try {
		await setup.connect();
		if (mode === "set") {
			await setup.setSettings();
		}
		await setup.ensureAwake();
		await setup.disconnect();
	} catch (err) {
		setup.errorWithTime("Error:", err.message || err);
		process.exit(1);
	}

	if (!quiet) console.log(`Ran in ${mode} mode on ${ip}:${port}`);
}

main();
