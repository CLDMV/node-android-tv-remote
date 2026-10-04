/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /scripts/setup-device.mjs
 *	@Date: 2025-10-15T10:19:05-07:00 (1760548745)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T12:16:14-07:00 (1790968574)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

import readline from "node:readline";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import createRemote from "../src/lib/android-tv-remote.mjs";

/**
 * Interactive CLI for setting up a new Android TV device.
 * Prompts for IP and port, then applies the keep-awake settings, wakes the
 * device and returns it to the home screen, using the v2 remote API.
 *
 * Usage: npm run setup-device
 */

/**
 * Ask a question on the terminal.
 * @param {string} question - Prompt text.
 * @param {string} [defaultValue] - Value used when the answer is empty.
 * @returns {Promise<string>} The answer, or the default.
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

/**
 * Connect to a device and prepare it for remote control: apply the keep-awake
 * settings, make sure it is awake, return to the home screen, then disconnect.
 * @param {object} options - Setup options.
 * @param {string} options.ip - Device IP address.
 * @param {number} [options.port=5555] - ADB port.
 * @param {boolean} [options.quiet=false] - Suppress progress logs.
 * @param {Function} [options.create=createRemote] - Remote factory (injectable for tests).
 * @param {Function} [options.log=console.log] - Log sink for progress and error events.
 * @returns {Promise<void>} Resolves once setup is complete; rejects on failure.
 */
export async function setupDevice({ ip, port = 5555, quiet = false, create = createRemote, log = console.log }) {
	const remote = await create({ ip, port, quiet, autoConnect: false, maintainConnection: false });
	remote.on("log", (data) => log(`[${data.level}] ${data.message}`));
	remote.on("error", (data) => log(`[error] ${data.message}`));

	const result = await remote.connect();
	if (!remote.isConnected) {
		throw result instanceof Error ? result : new Error(`Could not connect to ${ip}:${port}`);
	}
	try {
		await remote.setSettings();
		await remote.ensureAwake();
		await remote.press.home();
	} finally {
		await remote.disconnect();
	}
}

/**
 * CLI entry: prompt for the device address and run the setup.
 * @returns {Promise<void>}
 */
export async function main() {
	const ip = await prompt("Enter device IP address");
	if (!ip) {
		console.error("IP address is required.");
		process.exit(1);
	}
	const port = parseInt(await prompt("Enter device port", "5555"), 10) || 5555;
	try {
		await setupDevice({ ip, port });
		console.log("\nSetup complete!");
	} catch (err) {
		console.error("Error:", err.message || err);
		process.exit(1);
	}
}

// Run only when executed directly (`npm run setup-device`), not when imported.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	await main();
}
