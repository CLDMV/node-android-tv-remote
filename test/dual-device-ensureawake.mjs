/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/dual-device-ensureawake.mjs
 *	@Date: 2025-10-15 12:36:48 -07:00 (1760557008)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 06:44:22 -07:00 (1760622262)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Comprehensive test script for dual device ensureAwake operations.
 * Tests both 10.6.0.133 and 10.6.0.18 devices simultaneously.
 *
 * Usage: node test/dual-device-ensureawake.mjs
 */

import createRemote from "../src/lib/android-tv-remote.mjs";

/**
 * Enhanced logger that prefixes output with device identifier and timestamp
 * @param {string} deviceId - Device identifier (e.g., "10.6.0.133")
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {any} data - Additional data
 */
const log = (deviceId, level, message, data = null) => {
	const timestamp = new Date().toISOString();
	const prefix = `[${timestamp}] [${deviceId}] [${level.toUpperCase()}]`;
	console.log(`${prefix} ${message}`);
	if (data) {
		console.log(`${prefix} Data:`, JSON.stringify(data, null, 2));
	}
};

/**
 * Creates and configures a device remote with comprehensive event handling
 * @param {string} ip - Device IP address
 * @param {number} port - Device port
 * @returns {Promise<Object>} Configured remote instance
 */
const createDeviceRemote = async (ip, port = 5555) => {
	const remote = await createRemote({
		ip,
		port,
		autoConnect: false // We'll control connection manually
	});

	// Set up comprehensive event listeners
	remote.on("log", (logData) => {
		log(ip, logData.level, logData.message, logData.data);
	});

	remote.on("error", (errorData) => {
		log(ip, "ERROR", `${errorData.source}: ${errorData.message}`, {
			error: errorData.error.message,
			stack: errorData.error.stack
		});
	});

	remote.on("connect", () => {
		log(ip, "INFO", "Connected successfully");
	});

	remote.on("disconnect", () => {
		log(ip, "INFO", "Disconnected successfully");
	});

	return remote;
};

/**
 * Performs the complete test sequence for a single device
 * @param {string} ip - Device IP address
 * @returns {Promise<{success: boolean, error?: Error, timing: Object}>}
 */
const testDevice = async (ip) => {
	const startTime = Date.now();
	const timing = {};
	let remote = null;

	try {
		log(ip, "INFO", "=== Starting device test sequence ===");

		// Create remote
		const remoteStart = Date.now();
		remote = await createDeviceRemote(ip);
		timing.remoteCreated = Date.now() - remoteStart;
		log(ip, "INFO", `Remote created (${timing.remoteCreated}ms)`);

		// Connect
		const connectStart = Date.now();
		await remote.connect();
		timing.connected = Date.now() - connectStart;
		log(ip, "INFO", `Connected successfully (${timing.connected}ms)`);

		// Ensure awake
		const awakeStart = Date.now();
		await remote.ensureAwake();
		timing.ensureAwake = Date.now() - awakeStart;
		log(ip, "INFO", `ensureAwake completed (${timing.ensureAwake}ms)`);

		// Disconnect
		const disconnectStart = Date.now();
		await remote.disconnect();
		timing.disconnected = Date.now() - disconnectStart;
		log(ip, "INFO", `Disconnected successfully (${timing.disconnected}ms)`);

		timing.total = Date.now() - startTime;
		log(ip, "SUCCESS", `=== Test completed successfully (${timing.total}ms total) ===`);

		return { success: true, timing };
	} catch (error) {
		timing.total = Date.now() - startTime;
		log(ip, "ERROR", `=== Test failed (${timing.total}ms total) ===`, {
			error: error.message,
			stack: error.stack
		});

		// Attempt cleanup
		if (remote) {
			try {
				log(ip, "INFO", "Attempting cleanup disconnect...");
				await remote.disconnect();
				log(ip, "INFO", "Cleanup disconnect successful");
			} catch (cleanupError) {
				log(ip, "WARN", "Cleanup disconnect failed", {
					error: cleanupError.message
				});
			}
		}

		return { success: false, error, timing };
	}
};

/**
 * Main test execution function
 */
const runDualDeviceTest = async () => {
	const devices = ["10.6.0.133", "10.6.0.18"];
	const overallStart = Date.now();

	console.log("========================================");
	console.log("DUAL DEVICE ENSURE AWAKE TEST");
	console.log("========================================");
	console.log(`Testing devices: ${devices.join(", ")}`);
	console.log(`Start time: ${new Date().toISOString()}`);
	console.log("========================================\n");

	// Test devices in parallel
	log("MAIN", "INFO", "Starting parallel device tests...");

	const results = await Promise.allSettled(devices.map((ip) => testDevice(ip)));

	const overallTime = Date.now() - overallStart;

	// Process results
	console.log("\n========================================");
	console.log("TEST RESULTS SUMMARY");
	console.log("========================================");

	const summary = {
		successful: 0,
		failed: 0,
		devices: {}
	};

	results.forEach((result, index) => {
		const ip = devices[index];

		if (result.status === "fulfilled") {
			const deviceResult = result.value;
			summary.devices[ip] = deviceResult;

			if (deviceResult.success) {
				summary.successful++;
				console.log(`✅ ${ip}: SUCCESS (${deviceResult.timing.total}ms)`);
				console.log(`   - Connect: ${deviceResult.timing.connected}ms`);
				console.log(`   - EnsureAwake: ${deviceResult.timing.ensureAwake}ms`);
				console.log(`   - Disconnect: ${deviceResult.timing.disconnected}ms`);
			} else {
				summary.failed++;
				console.log(`❌ ${ip}: FAILED (${deviceResult.timing.total}ms)`);
				console.log(`   - Error: ${deviceResult.error.message}`);
			}
		} else {
			summary.failed++;
			summary.devices[ip] = {
				success: false,
				error: result.reason,
				timing: { total: 0 }
			};
			console.log(`❌ ${ip}: PROMISE REJECTED`);
			console.log(`   - Reason: ${result.reason.message}`);
		}
	});

	console.log("----------------------------------------");
	console.log(`Total time: ${overallTime}ms`);
	console.log(`Successful: ${summary.successful}/${devices.length}`);
	console.log(`Failed: ${summary.failed}/${devices.length}`);
	console.log("========================================\n");

	// Exit with appropriate code
	const exitCode = summary.failed > 0 ? 1 : 0;
	log("MAIN", "INFO", `Test completed with exit code ${exitCode}`);

	return summary;
};

// Handle unhandled rejections and exceptions
process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
	process.exit(1);
});

process.on("uncaughtException", (error) => {
	console.error("Uncaught Exception:", error);
	process.exit(1);
});

// Run the test
runDualDeviceTest()
	.then((summary) => {
		const exitCode = summary.failed > 0 ? 1 : 0;
		process.exit(exitCode);
	})
	.catch((error) => {
		console.error("Fatal error in test execution:", error);
		process.exit(1);
	});
