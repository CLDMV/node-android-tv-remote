// Interactive test script for Android TV Remote
// Prompts for IP and port, connects, and sends button presses at intervals.
// Usage: node test/interactive-remote.js

const readline = require("readline");
const AndroidTVSetup = require("../src/lib/adb/setup");

/**
 * Prompts the user for input in the terminal.
 * @param {string} query - The prompt message.
 * @returns {Promise<string>} The user's input.
 * @example
 * const ip = await prompt("Enter IP: ");
 */
function prompt(query) {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) =>
		rl.question(query, (ans) => {
			rl.close();
			resolve(ans);
		})
	);
}

/**
 * Runs the interactive remote test.
 * Prompts for IP/port, connects, and sends button presses.
 */
async function main() {
	const ip = (await prompt("Enter device IP: ")).trim();
	let portInput = await prompt("Enter port [5555]: ");
	const port = portInput.trim() ? parseInt(portInput.trim(), 10) : 5555;
	if (!ip) {
		console.error("IP address is required.");
		process.exit(1);
	}
	const setup = new AndroidTVSetup({ ip, port, quiet: false });
	try {
		await setup.connect();
		console.log(`Connected to ${ip}:${port}`);
		// List of buttons to press (as method names on setup.remote.press)
		const buttons = ["home", "up", "down", "left", "right", "ok", "back"];
		for (let i = 0; i < buttons.length; i++) {
			const btn = buttons[i];
			if (setup.remote && setup.remote.press && typeof setup.remote.press[btn] === "function") {
				console.log(`Pressing: ${btn}`);
				await setup.remote.press[btn]();
			} else {
				console.log(`Button '${btn}' not available.`);
			}
			if (btn === "home") {
				await new Promise((res) => setTimeout(res, 750)); // 750ms after home
			} else if (btn === "back") {
				await new Promise((res) => setTimeout(res, 2500)); // 2.5s for back
			} else {
				await new Promise((res) => setTimeout(res, 500));
			}
		}
		await setup.disconnect();
		console.log("Test complete. Disconnected.");
	} catch (err) {
		if (setup.errorWithTime) setup.errorWithTime("Error:", err.message || err);
		else console.error("Error:", err.message || err);
		process.exit(1);
	}
}

main();
