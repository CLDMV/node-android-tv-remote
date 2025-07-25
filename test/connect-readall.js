const adb = require("adbkit");

/**
 * Test script to connect to an ADB device and read settings.
 * Usage: node test/connect-readall.js <ip> [port]
 */

/**
 * Get or set Android settings via ADB.
 * @param {string} ip
 * @param {number} port
 * @param {string} mode - 'get' or 'set'
 * @returns {Promise<void>}
 */

function logWithTime(...args) {
	const now = new Date().toISOString();
	console.log(`[${now}]`, ...args);
}
function warnWithTime(...args) {
	const now = new Date().toISOString();
	console.warn(`[${now}]`, ...args);
}
function errorWithTime(...args) {
	const now = new Date().toISOString();
	console.error(`[${now}]`, ...args);
}

/**
 * Parses the output of 'dumpsys power' to extract power, wake, and display state.
 * @param {string} output - The full output string from 'dumpsys power'.
 * @returns {{ mIsPowered: string, mWakefulness: string, mDisplayReady: string }}
 * @example
 * const parsed = parsePowerState(dumpsysOutput);
 * console.log(parsed.mIsPowered, parsed.mWakefulness, parsed.mDisplayReady);
 */
function parsePowerState(output) {
	const mIsPoweredMatch = output.match(/^\s*mIsPowered=([a-zA-Z0-9]+)/m);
	const mWakefulnessMatch = output.match(/^\s*mWakefulness=([a-zA-Z0-9]+)/m);
	const mDisplayReadyMatch = output.match(/^\s*mDisplayReady=([a-zA-Z0-9]+)/m);
	return {
		mIsPowered: mIsPoweredMatch ? mIsPoweredMatch[1] : "unknown",
		mWakefulness: mWakefulnessMatch ? mWakefulnessMatch[1] : "unknown",
		mDisplayReady: mDisplayReadyMatch ? mDisplayReadyMatch[1] : "unknown"
	};
}

/**
 * Connects to an ADB device, gets or sets Android settings, and prints power state.
 *
 * @param {string} ip - The IP address of the ADB device.
 * @param {number} port - The port number for the ADB connection (default 5555).
 * @param {string} mode - Either 'get' to read settings or 'set' to update them.
 * @param {boolean} [quiet=true] - If true, suppresses log output except for results.
 * @returns {Promise<void>} Resolves when all operations are complete.
 *
 * @example
 * // Get settings and power state from device at 192.168.1.100:5555
 * handleSettings('192.168.1.100', 5555, 'get', false);
 *
 * @example
 * // Set settings on device at 192.168.1.101:5555 quietly
 * handleSettings('192.168.1.101', 5555, 'set', true);
 */
function handleSettings(ip, port, mode, quiet = true) {
	const client = adb.createClient();
	const host = `${ip}:${port}`;
	const keys = [
		{ ns: "system", key: "screen_off_timeout", value: 2147483647 },
		{ ns: "secure", key: "sleep_timeout", value: 0 },
		{ ns: "global", key: "stay_on_while_plugged_in", value: 3 }
	];

	return client
		.connect(ip, port)
		.then(() => {
			if (!quiet) logWithTime(`Connected to ${host}`);
			let chain = Promise.resolve();
			keys.forEach((item) => {
				chain = chain.then(() => {
					let cmd;
					if (mode === "set") {
						cmd = `settings put ${item.ns} ${item.key} ${item.value}`;
					} else {
						cmd = `settings get ${item.ns} ${item.key}`;
					}
					return client
						.shell(host, cmd)
						.then(adb.util.readAll)
						.then((result) => {
							if (!quiet) {
								if (mode === "set") {
									logWithTime(`Set ${item.ns} ${item.key} to ${item.value}`);
								} else {
									logWithTime(`${item.ns} ${item.key}: ${result.toString().trim()}`);
								}
							}
						});
				});
			});
			chain = chain.then(() => {
				return client
					.shell(host, "dumpsys power")
					.then(adb.util.readAll)
					.then(async (result) => {
						const output = result.toString();
						const parsed = parsePowerState(output);
						console.log("\n--- Power State ---");
						console.log(`mIsPowered: ${parsed.mIsPowered}`);
						console.log(`mWakefulness: ${parsed.mWakefulness}`);
						console.log(`mDisplayReady: ${parsed.mDisplayReady}`);
						console.log("-------------------\n");

						// Helper to send a keyevent
						/**
						 * Sends an input keyevent to the device.
						 * @param {number} keycode - Android keycode to send.
						 * @returns {Promise<void>}
						 */
						function sendKey(keycode) {
							return client.shell(host, `input keyevent ${keycode}`).then(adb.util.readAll);
						}

						let commands = [];
						// If not powered, send POWER (26)
						if (parsed.mIsPowered !== "true") {
							commands.push(sendKey(26));
						}
						// If not awake, send WAKEUP (224)
						if (parsed.mWakefulness !== "Awake") {
							commands.push(sendKey(224));
						}
						// If display is off, send POWER (26) to toggle screen
						if (parsed.mDisplayReady !== "true") {
							commands.push(sendKey(26));
						}
						// Always send HOME (3) at the end
						commands.push(sendKey(3));
						// Run all commands in sequence
						for (const cmd of commands) {
							await cmd;
						}
					});
			});
			return chain;
		})
		.then(() => client.disconnect(ip, port))
		.then(() => {
			if (!quiet) logWithTime("Disconnected cleanly");
		})
		.catch((err) => {
			if (err.message && err.message.includes("disconnected")) {
				if (!quiet) warnWithTime("Warning: Device already disconnected before explicit disconnect call.");
			} else {
				errorWithTime("Error:", err.message || err);
				if (err.message && err.message.includes("device unauthorized")) {
					errorWithTime(
						"Your device is unauthorized. Please check your TV and accept the authorization dialog to allow this computer to connect via ADB."
					);
				}
				process.exit(1);
			}
		});
}

// CLI usage

const ip = process.argv[2];
const port = process.argv[3] ? parseInt(process.argv[3], 10) : 5555;
const mode = process.argv[4] === "set" ? "set" : "get";
const quiet = process.argv.includes("--quiet");

if (!ip) {
	errorWithTime("Usage: node test/connect-readall.js <ip> [port] [get|set] [--quiet]");
	process.exit(1);
}

if (!quiet) logWithTime(`Running in ${mode} mode on ${ip}:${port}`);

handleSettings(ip, port, mode, quiet);

if (!quiet) logWithTime(`Ran in ${mode} mode on ${ip}:${port}`);
