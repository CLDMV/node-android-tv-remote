/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /scripts/setup-device.mjs
 *	@Date: 2025-10-15 10:19:05 -07:00 (1760548745)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 06:45:06 -07:00 (1760622306)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */
import readline from "readline";
import AndroidTVSetup from "../src/lib/adb/setup.mjs";

/**
 * Interactive CLI for setting up a new Android TV device.
 * Prompts for IP and port, then runs setup.
 */
async function prompt(question, defaultValue) {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => {
		rl.question(`${question}${defaultValue ? ` [${defaultValue}]` : ""}: `, (answer) => {
			rl.close();
			resolve(answer || defaultValue);
		});
	});
}

async function main() {
	const ip = await prompt("Enter device IP address");
	if (!ip) {
		console.error("IP address is required.");
		process.exit(1);
	}
	const port = parseInt(await prompt("Enter device port", "5555"), 10) || 5555;
	const quiet = false;
	const setup = new AndroidTVSetup({ ip, port, quiet });
	try {
		await setup.connect();
		await setup.setSettings();
		await setup.ensureAwake();
		await setup.disconnect();
		console.log("\nSetup complete!");
	} catch (err) {
		console.error("Error:", err.message || err);
		process.exit(1);
	}
}

main();
