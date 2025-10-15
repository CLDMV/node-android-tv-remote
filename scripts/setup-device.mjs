#!/usr/bin/env node

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
