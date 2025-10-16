/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/connect-readall.mjs
 *	@Date: 2025-10-15 10:19:05 -07:00 (1760548745)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-15 12:06:51 -07:00 (1760555211)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

// Test script to connect to an ADB device and read settings.
// Usage: node test/connect-readall.mjs <ip> [port] [get|set] [--quiet]

import createRemote from "../src/lib/android-tv-remote.mjs";

/**
 * Parse and validate command line arguments with better error handling.
 * @returns {Object} Parsed configuration object
 */
function parseArgs() {
	const args = process.argv.slice(2);
	const config = {
		ip: null,
		port: 5555,
		mode: "get",
		quiet: false
	};

	// Check for help flag
	if (args.includes("--help") || args.includes("-h")) {
		console.log(`
Android TV Remote Test Script

Usage: node test/connect-readall.mjs <ip> [port] [mode] [options]

Arguments:
  ip              Device IP address (required)
  port            Device port number (optional, default: 5555)
  mode            Operation mode: "get" or "set" (optional, default: "get")

Options:
  --quiet         Suppress log output
  --help, -h      Show this help message

Examples:
  node test/connect-readall.mjs 192.168.1.100
  node test/connect-readall.mjs 192.168.1.100 5555 set
  node test/connect-readall.mjs 192.168.1.100 5555 get --quiet
		`);
		process.exit(0);
	}

	// Parse IP address (required)
	if (args.length === 0 || !args[0] || args[0].startsWith("--")) {
		console.error("Error: IP address is required");
		console.error("Usage: node test/connect-readall.mjs <ip> [port] [get|set] [--quiet]");
		console.error("Use --help for more information");
		process.exit(1);
	}
	config.ip = args[0];

	// Parse port (optional)
	if (args[1] && !args[1].startsWith("--") && !["get", "set"].includes(args[1])) {
		const portNum = parseInt(args[1], 10);
		if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
			console.error(`Error: Invalid port number "${args[1]}". Port must be between 1 and 65535`);
			process.exit(1);
		}
		config.port = portNum;
	}

	// Parse mode (optional)
	const modeArg = args.find((arg) => ["get", "set"].includes(arg));
	if (modeArg) {
		config.mode = modeArg;
	}

	// Parse quiet flag
	config.quiet = args.includes("--quiet");

	return config;
}

async function main() {
	const config = parseArgs();
	const { ip, port, mode, quiet } = config;

	if (!quiet) {
		console.log(`Running in ${mode} mode on ${ip}:${port}`);
	}

	try {
		const remote = await createRemote({ ip, port, autoConnect: true });

		// Set up event listeners for proper error handling
		remote.on("error", (errorData) => {
			console.error(`Error from ${errorData.source}:`, errorData.message);
			if (errorData.error && errorData.error.code === "ENOENT") {
				console.error("\nADB is not installed or not in your PATH.");
				console.error("Please install ADB first: https://developer.android.com/studio/releases/platform-tools");
			}
		});

		remote.on("log", (logData) => {
			if (!quiet || logData.level === "error") {
				const prefix = logData.level === "error" ? "ERROR" : logData.level === "warn" ? "WARN" : "INFO";
				console.log(`[${prefix}] ${logData.message}`);
			}
		});

		if (mode === "set") {
			await remote.setSettings();
		}
		await remote.ensureAwake();
		await remote.disconnect();

		if (!quiet) {
			console.log(`\nCompleted ${mode} mode on ${ip}:${port}`);
		}
	} catch (err) {
		console.error("Fatal error:", err.message || err);
		process.exit(1);
	}
}

main();
