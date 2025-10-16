/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/reboot-test.mjs
 *	@Date: 2025-10-15 15:13:52 -07:00 (1760566432)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 06:44:46 -07:00 (1760622286)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Actual Reboot Test - Performs a real reboot and waits for boot completion
 * ⚠️ WARNING: This will actually reboot your Fire TV device!
 *
 * Usage: node test/reboot-test.mjs [ip]
 */

import createRemote from "../src/lib/android-tv-remote.mjs";

/**
 * Enhanced logger
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {any} data - Additional data
 */
const log = (level, message, data = null) => {
	const timestamp = new Date().toISOString();
	const prefix = `[${timestamp}] [REBOOT-TEST] [${level.toUpperCase()}]`;
	console.log(`${prefix} ${message}`);
	if (data !== null && data !== undefined) {
		if (typeof data === "object") {
			console.log(`${prefix} Data:`, JSON.stringify(data, null, 2));
		} else {
			console.log(`${prefix} Data:`, data);
		}
	}
};

/**
 * Sleep function for delays
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Test actual reboot and wait for boot completion
 */
const testActualReboot = async (ip = "10.6.0.18") => {
	log("INFO", "=== ACTUAL REBOOT TEST ===");
	log("WARN", "⚠️ This will actually reboot your Fire TV device!");
	log("INFO", `Target device: ${ip}`);

	const remote = await createRemote({ ip, autoConnect: false });

	// Set up event listeners
	remote.on("log", (data) => {
		log(data.level, `[REMOTE] ${data.message}`, data.data);
	});

	remote.on("error", (data) => {
		log("ERROR", `[REMOTE] ${data.source}: ${data.message}`, {
			error: data.error.message
		});
	});

	try {
		// Step 1: Connect to device
		log("INFO", "Step 1: Connecting to device...");
		await remote.connect();
		log("SUCCESS", "Connected to device");

		// Step 2: Verify device is responsive before reboot
		log("INFO", "Step 2: Verifying device is responsive...");
		const initialStatus = await remote.getConnectionStatus(true);
		log("INFO", `Initial connection status: ${initialStatus}`);

		// Step 3: Send reboot command
		log("INFO", "Step 3: Sending reboot command...");
		log("WARN", "⚠️ Device will reboot now - connection will be lost!");

		const rebootResult = await remote.reboot();
		log("SUCCESS", `Reboot command sent successfully: ${rebootResult}`);

		// Step 4: Wait for device to go offline
		log("INFO", "Step 4: Waiting for device to go offline...");
		await sleep(5000); // Give device time to start rebooting

		// Step 5: Wait for device to come back online and boot complete
		log("INFO", "Step 5: Waiting for device to come back online...");

		let attempts = 0;
		const maxAttempts = 30; // 5 minutes max wait time
		let deviceOnline = false;

		while (attempts < maxAttempts && !deviceOnline) {
			attempts++;
			log("INFO", `Attempt ${attempts}/${maxAttempts}: Checking if device is back online...`);

			try {
				// Create a new remote instance since the old one lost connection
				const newRemote = await createRemote({ ip, autoConnect: false });

				// Set up minimal logging for reconnection attempts
				newRemote.on("error", () => {
					// Suppress connection errors during boot wait
				});

				await newRemote.connect();

				// If we get here, device is responding
				log("SUCCESS", "Device is back online! Checking boot completion...");

				// Step 6: Wait for boot completion
				log("INFO", "Step 6: Waiting for boot completion...");
				const bootComplete = await newRemote.waitBootComplete(30000); // 30 second timeout

				if (bootComplete) {
					log("SUCCESS", "🎉 Device has completed booting!");
					deviceOnline = true;

					// Verify device is fully functional
					log("INFO", "Step 7: Verifying device functionality...");
					const finalStatus = await newRemote.getConnectionStatus(true);
					log("SUCCESS", `Final connection status: ${finalStatus}`);

					// Clean disconnect
					await newRemote.disconnect();
					log("SUCCESS", "Test completed successfully - device is fully operational");
				} else {
					log("WARN", "Boot completion check returned false, but device is responding");
					deviceOnline = true;
					await newRemote.disconnect();
				}
			} catch (error) {
				// Device not ready yet, wait and retry
				log("INFO", `Device not ready yet (${error.message}), waiting 10 seconds...`);
				await sleep(10000);
			}
		}

		if (!deviceOnline) {
			throw new Error(`Device did not come back online within ${maxAttempts * 10} seconds`);
		}
	} catch (error) {
		log("ERROR", "Reboot test failed:", error.message);
		throw error;
	}
};

/**
 * Main test function - performs actual reboot
 */
const runRebootTest = async () => {
	// Parse command line arguments
	const args = process.argv.slice(2);
	const deviceIP = args[0] || "10.6.0.18";

	console.log("");
	console.log("🔥 ACTUAL REBOOT TEST");
	console.log("====================");
	console.log("⚠️  WARNING: This will actually reboot your Fire TV device!");
	console.log("⚠️  Make sure no important processes are running on the device!");
	console.log("⚠️  Test will take several minutes to complete.");
	console.log("");
	console.log(`Target IP: ${deviceIP}`);
	console.log(`Start time: ${new Date().toISOString()}`);
	console.log("");

	// Give user time to cancel
	log("WARN", "This test will perform an actual reboot. Proceeding in 5 seconds...");
	log("INFO", "Press Ctrl+C now if you want to cancel!");

	await sleep(5000);

	try {
		// Perform actual reboot test
		await testActualReboot(deviceIP);

		log("SUCCESS", "🎉 Actual reboot test completed successfully!");
		return true;
	} catch (error) {
		log("ERROR", "Reboot test failed:", {
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

// Run the test
log("INFO", "Starting reboot command test...");
runRebootTest()
	.then(() => {
		log("INFO", "Reboot test completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		log("ERROR", "Reboot test failed:", { error: error.message });
		process.exit(1);
	});
