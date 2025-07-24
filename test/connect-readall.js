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
