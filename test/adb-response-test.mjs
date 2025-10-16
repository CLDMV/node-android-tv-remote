/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/adb-response-test.mjs
 *	@Date: 2025-10-15 14:31:58 -07:00 (1760563918)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 06:43:24 -07:00 (1760622204)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * ADB Response Test - Analyzes what the ADB module returns for various commands
 * This helps us understand the actual response format from Fire TV devices.
 *
 * Usage: node test/adb-response-test.mjs [ip]
 */

import createRemote from "../src/lib/android-tv-remote.mjs";
import adbkit from "@devicefarmer/adbkit";

const Adb = adbkit.Adb;

/**
 * Enhanced logger with detailed response inspection
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {any} data - Additional data
 */
const log = (level, message, data = null) => {
	const timestamp = new Date().toISOString();
	const prefix = `[${timestamp}] [ADB-TEST] [${level.toUpperCase()}]`;
	console.log(`${prefix} ${message}`);
	if (data !== null && data !== undefined) {
		if (typeof data === "object") {
			console.log(`${prefix} Data:`, JSON.stringify(data, null, 2));
		} else {
			console.log(`${prefix} Raw Data:`, data);
			console.log(`${prefix} Data Type:`, typeof data);
			console.log(`${prefix} Data Length:`, data.length || "N/A");
		}
	}
};

/**
 * Test a specific ADB shell command and analyze the response
 * @param {Object} device - ADB device object
 * @param {string} command - Shell command to execute
 * @param {string} description - Description of what the command does
 */
const testCommand = async (device, command, description) => {
	log("INFO", `========================================`);
	log("INFO", `Testing: ${description}`);
	log("INFO", `Command: ${command}`);
	log("INFO", `========================================`);

	try {
		// Execute the shell command
		const stream = await device.shell(command);

		log("INFO", "Command executed, processing response...");

		// Get the raw response
		const rawResponse = await Adb.util.readAll(stream);

		log("INFO", "Raw response received");
		log("INFO", "Raw response type:", typeof rawResponse);
		log("INFO", "Raw response constructor:", rawResponse.constructor.name);
		log("INFO", "Raw response length:", rawResponse.length || "N/A");

		// Convert to string
		const stringResponse = rawResponse.toString();

		log("INFO", "String conversion:");
		log("INFO", "String length:", stringResponse.length);
		log("INFO", "String content (first 200 chars):", stringResponse.substring(0, 200));

		// Check for common patterns
		const patterns = [
			{ name: "Empty response", test: (str) => str.length === 0 },
			{ name: "Whitespace only", test: (str) => str.trim().length === 0 },
			{ name: "Contains newlines", test: (str) => str.includes("\n") },
			{ name: "Contains carriage returns", test: (str) => str.includes("\r") },
			{ name: "Contains error keywords", test: (str) => /error|fail|exception|denied/i.test(str) },
			{ name: "Contains success indicators", test: (str) => /success|ok|complete|done/i.test(str) },
			{ name: "Numeric only", test: (str) => /^\d+$/.test(str.trim()) },
			{ name: "Contains equals signs", test: (str) => str.includes("=") }
		];

		log("INFO", "Pattern analysis:");
		patterns.forEach((pattern) => {
			const matches = pattern.test(stringResponse);
			log("INFO", `  ${pattern.name}: ${matches ? "✅ YES" : "❌ NO"}`);
		});

		// Show hex dump of first 50 bytes for binary analysis
		const hexDump = Array.from(rawResponse.slice(0, 50))
			.map((byte) => byte.toString(16).padStart(2, "0"))
			.join(" ");
		log("INFO", "Hex dump (first 50 bytes):", hexDump);

		// Line by line analysis for multi-line responses
		const lines = stringResponse.split("\n");
		if (lines.length > 1) {
			log("INFO", `Response has ${lines.length} lines:`);
			lines.forEach((line, index) => {
				if (index < 10) {
					// Show first 10 lines
					log("INFO", `  Line ${index}: "${line}"`);
				}
			});
			if (lines.length > 10) {
				log("INFO", `  ... and ${lines.length - 10} more lines`);
			}
		}

		return {
			success: true,
			rawResponse,
			stringResponse,
			command,
			description
		};
	} catch (error) {
		log("ERROR", "Command failed:", {
			error: error.message,
			stack: error.stack
		});
		return {
			success: false,
			error,
			command,
			description
		};
	}
};

/**
 * Main test function
 */
const runADBResponseTest = async () => {
	// Parse command line arguments
	const args = process.argv.slice(2);
	const deviceIP = args[0] || "10.6.0.18"; // Default to known working IP
	const devicePort = 5555;
	const host = `${deviceIP}:${devicePort}`;

	console.log("========================================");
	console.log("ADB RESPONSE ANALYSIS TEST");
	console.log("========================================");
	console.log(`Target device: ${host}`);
	console.log(`Start time: ${new Date().toISOString()}`);
	console.log("========================================\n");

	try {
		// Create ADB client and device
		const client = Adb.createClient();
		const device = client.getDevice(host);

		log("INFO", "Connecting to device...");

		// Test connection first
		await client.connect(deviceIP, devicePort);
		log("INFO", "Connected successfully");

		// Test various commands to see response formats
		const testCommands = [
			{ cmd: 'echo "hello world"', desc: "Simple echo command" },
			{ cmd: "echo", desc: "Echo with no arguments" },
			{ cmd: "pwd", desc: "Print working directory" },
			{ cmd: "whoami", desc: "Current user" },
			{ cmd: "id", desc: "User ID information" },
			{ cmd: "input keyevent 3", desc: "HOME keycode (should be silent)" },
			{ cmd: "input keyevent 4", desc: "BACK keycode (should be silent)" },
			{ cmd: "dumpsys power | head -20", desc: "Power status (first 20 lines)" },
			{ cmd: "getprop ro.build.version.release", desc: "Android version" },
			{ cmd: "ps | grep system_server | head -1", desc: "System process info" },
			{ cmd: "ls /system/bin | head -5", desc: "System binaries (first 5)" },
			{ cmd: "nonexistentcommand", desc: "Invalid command (should error)" }
		];

		const results = [];

		for (const test of testCommands) {
			const result = await testCommand(device, test.cmd, test.desc);
			results.push(result);

			// Wait between commands to avoid overwhelming the device
			await new Promise((resolve) => setTimeout(resolve, 500));
		}

		// Disconnect
		log("INFO", "Disconnecting...");
		await client.disconnect(deviceIP, devicePort);
		log("INFO", "Disconnected successfully");

		// Summary
		console.log("\n========================================");
		console.log("TEST RESULTS SUMMARY");
		console.log("========================================");

		const successful = results.filter((r) => r.success).length;
		const failed = results.filter((r) => !r.success).length;

		log("INFO", `Total commands tested: ${results.length}`);
		log("INFO", `Successful: ${successful}`);
		log("INFO", `Failed: ${failed}`);

		results.forEach((result, index) => {
			const status = result.success ? "✅" : "❌";
			const responseInfo = result.success
				? `(${result.stringResponse.length} chars, ${result.stringResponse.split("\n").length} lines)`
				: `(Error: ${result.error.message})`;

			console.log(`${status} ${index + 1}. ${result.description} ${responseInfo}`);
		});

		return results;
	} catch (error) {
		log("ERROR", "Test failed:", {
			error: error.message,
			stack: error.stack
		});
		throw error;
	}
};

// Handle process signals and errors
process.on("unhandledRejection", (reason, promise) => {
	log("ERROR", "Unhandled Rejection", { reason: reason.message, promise });
	process.exit(1);
});

process.on("uncaughtException", (error) => {
	log("ERROR", "Uncaught Exception", { error: error.message, stack: error.stack });
	process.exit(1);
});

// Debug the execution check
console.log("DEBUG: import.meta.url =", import.meta.url);
console.log("DEBUG: process.argv[1] =", process.argv[1]);
console.log("DEBUG: Comparison =", import.meta.url === `file://${process.argv[1]}`);

// Run the test
console.log("Starting ADB response analysis test...");
runADBResponseTest()
	.then((results) => {
		log("INFO", "Test completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		log("ERROR", "Test failed:", { error: error.message });
		process.exit(1);
	});
