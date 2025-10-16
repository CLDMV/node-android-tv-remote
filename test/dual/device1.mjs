/**
 * Individual device test script for 10.6.0.133
 * This simulates a single server process managing one Android TV device.
 *
 * Usage: node test/dual/device1.mjs
 */

import createRemote from "../../src/lib/android-tv-remote.mjs";

const DEVICE_IP = "10.6.0.133";
const DEVICE_PORT = 5555;

/**
 * Enhanced logger with process identification
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {any} data - Additional data
 */
const log = (level, message, data = null) => {
	const timestamp = new Date().toISOString();
	const processId = `PID:${process.pid}`;
	const prefix = `[${timestamp}] [${processId}] [${DEVICE_IP}] [${level.toUpperCase()}]`;
	console.log(`${prefix} ${message}`);
	if (data) {
		console.log(`${prefix} Data:`, JSON.stringify(data, null, 2));
	}
};

/**
 * Main test function for device 1
 */
const testDevice1 = async () => {
	const startTime = Date.now();
	let setup = null;

	try {
		log("INFO", "=== Device 1 Server Starting ===");
		log("INFO", `Process ID: ${process.pid}`);
		log("INFO", `Target Device: ${DEVICE_IP}:${DEVICE_PORT}`);

		// Create remote with comprehensive logging
		setup = await createRemote({
			ip: DEVICE_IP,
			port: DEVICE_PORT,
			autoConnect: false
		});

		// Set up event listeners
		setup.on("log", (logData) => {
			log(logData.level, logData.message, logData.data);
		});

		setup.on("error", (errorData) => {
			log("ERROR", `${errorData.source}: ${errorData.message}`, {
				error: errorData.error.message,
				stack: errorData.error.stack
			});
		});

		// Add remote event listeners
		if (setup.remote) {
			setup.remote.on("log", (logData) => {
				log(logData.level, `[REMOTE] ${logData.message}`, logData.data);
			});

			setup.remote.on("error", (errorData) => {
				log("ERROR", `[REMOTE] ${errorData.source}: ${errorData.message}`, {
					error: errorData.error.message
				});
			});
		}

		// Perform the test sequence
		log("INFO", "Connecting to device...");
		await setup.connect();

		log("INFO", "Ensuring device is awake...");
		await setup.ensureAwake();

		// Keep connection alive for a moment to simulate server behavior
		log("INFO", "Simulating server operation (holding connection for 2 seconds)...");
		await new Promise((resolve) => setTimeout(resolve, 2000));

		log("INFO", "Disconnecting from device...");
		await setup.disconnect();

		const totalTime = Date.now() - startTime;
		log("SUCCESS", `=== Device 1 Server Completed Successfully (${totalTime}ms) ===`);

		process.exit(0);
	} catch (error) {
		const totalTime = Date.now() - startTime;
		log("ERROR", `=== Device 1 Server Failed (${totalTime}ms) ===`, {
			error: error.message,
			stack: error.stack
		});

		// Attempt cleanup
		if (setup) {
			try {
				log("INFO", "Attempting cleanup disconnect...");
				await setup.disconnect();
				log("INFO", "Cleanup successful");
			} catch (cleanupError) {
				log("WARN", "Cleanup failed", { error: cleanupError.message });
			}
		}

		process.exit(1);
	}
};

// Handle process signals and errors
process.on("SIGINT", () => {
	log("INFO", "Received SIGINT, shutting down gracefully...");
	process.exit(0);
});

process.on("SIGTERM", () => {
	log("INFO", "Received SIGTERM, shutting down gracefully...");
	process.exit(0);
});

process.on("unhandledRejection", (reason, promise) => {
	log("ERROR", "Unhandled Rejection", { reason: reason.message, promise });
	process.exit(1);
});

process.on("uncaughtException", (error) => {
	log("ERROR", "Uncaught Exception", { error: error.message, stack: error.stack });
	process.exit(1);
});

// Start the test
log("INFO", "Starting Device 1 test process...");
testDevice1();
