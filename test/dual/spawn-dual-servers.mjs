/**
 * Dual server spawner - simulates two independent server processes
 * This script spawns two separate Node.js processes to test concurrent device management.
 *
 * Usage: node test/dual/spawn-dual-servers.mjs
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Enhanced logger for the spawner process
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {any} data - Additional data
 */
const log = (level, message, data = null) => {
	const timestamp = new Date().toISOString();
	const prefix = `[${timestamp}] [SPAWNER] [${level.toUpperCase()}]`;
	console.log(`${prefix} ${message}`);
	if (data) {
		console.log(`${prefix} Data:`, JSON.stringify(data, null, 2));
	}
};

/**
 * Spawns a child process for device testing
 * @param {string} scriptName - Name of the script to run
 * @param {string} deviceId - Device identifier for logging
 * @returns {Promise<{success: boolean, code: number, signal?: string, error?: Error}>}
 */
const spawnDeviceProcess = (scriptName, deviceId) => {
	return new Promise((resolve) => {
		const scriptPath = path.join(__dirname, scriptName);
		const startTime = Date.now();

		log("INFO", `Spawning ${deviceId} process: ${scriptName}`);

		const childProcess = spawn("node", [scriptPath], {
			stdio: "inherit", // Pass through all output
			cwd: path.resolve(__dirname, "../../"), // Set working directory to repo root
			env: {
				...process.env,
				DEVICE_ID: deviceId // Pass device ID as environment variable
			}
		});

		// Handle process events
		childProcess.on("spawn", () => {
			log("INFO", `${deviceId} process spawned successfully (PID: ${childProcess.pid})`);
		});

		childProcess.on("error", (error) => {
			const duration = Date.now() - startTime;
			log("ERROR", `${deviceId} process spawn error (${duration}ms)`, {
				error: error.message,
				script: scriptName
			});
			resolve({ success: false, code: -1, error });
		});

		childProcess.on("close", (code, signal) => {
			const duration = Date.now() - startTime;
			if (code === 0) {
				log("SUCCESS", `${deviceId} process completed successfully (${duration}ms)`, {
					code,
					signal: signal || "none"
				});
				resolve({ success: true, code, signal });
			} else {
				log("ERROR", `${deviceId} process failed (${duration}ms)`, {
					code,
					signal: signal || "none"
				});
				resolve({ success: false, code, signal });
			}
		});

		childProcess.on("exit", (code, signal) => {
			const duration = Date.now() - startTime;
			log("INFO", `${deviceId} process exited (${duration}ms)`, {
				code,
				signal: signal || "none"
			});
		});
	});
};

/**
 * Main spawner function
 */
const runDualServerTest = async () => {
	const overallStart = Date.now();

	console.log("========================================");
	console.log("DUAL SERVER SPAWN TEST");
	console.log("========================================");
	console.log(`Spawner Process ID: ${process.pid}`);
	console.log(`Start time: ${new Date().toISOString()}`);
	console.log("Target devices: 10.6.0.133, 10.6.0.18");
	console.log("========================================\n");

	try {
		log("INFO", "Starting concurrent device server processes...");

		// Spawn both processes concurrently
		const results = await Promise.allSettled([
			spawnDeviceProcess("device1.mjs", "DEVICE-1 (10.6.0.133)"),
			spawnDeviceProcess("device2.mjs", "DEVICE-2 (10.6.0.18)")
		]);

		const overallTime = Date.now() - overallStart;

		// Process results
		console.log("\n========================================");
		console.log("DUAL SERVER TEST RESULTS");
		console.log("========================================");

		const summary = {
			successful: 0,
			failed: 0,
			processes: {}
		};

		results.forEach((result, index) => {
			const deviceNames = ["DEVICE-1 (10.6.0.133)", "DEVICE-2 (10.6.0.18)"];
			const deviceName = deviceNames[index];

			if (result.status === "fulfilled") {
				const processResult = result.value;
				summary.processes[deviceName] = processResult;

				if (processResult.success) {
					summary.successful++;
					console.log(`✅ ${deviceName}: SUCCESS (code: ${processResult.code})`);
				} else {
					summary.failed++;
					console.log(`❌ ${deviceName}: FAILED (code: ${processResult.code})`);
					if (processResult.error) {
						console.log(`   Error: ${processResult.error.message}`);
					}
					if (processResult.signal) {
						console.log(`   Signal: ${processResult.signal}`);
					}
				}
			} else {
				summary.failed++;
				summary.processes[deviceName] = {
					success: false,
					code: -1,
					error: result.reason
				};
				console.log(`❌ ${deviceName}: PROMISE REJECTED`);
				console.log(`   Reason: ${result.reason.message}`);
			}
		});

		console.log("----------------------------------------");
		console.log(`Total execution time: ${overallTime}ms`);
		console.log(`Successful processes: ${summary.successful}/2`);
		console.log(`Failed processes: ${summary.failed}/2`);
		console.log("========================================");

		// Exit with appropriate code
		const exitCode = summary.failed > 0 ? 1 : 0;
		log("INFO", `Dual server test completed with exit code ${exitCode}`);

		return summary;
	} catch (error) {
		const overallTime = Date.now() - overallStart;
		log("ERROR", `Fatal error in dual server test (${overallTime}ms)`, {
			error: error.message,
			stack: error.stack
		});
		throw error;
	}
};

// Handle process signals
process.on("SIGINT", () => {
	log("INFO", "Spawner received SIGINT, shutting down...");
	process.exit(0);
});

process.on("SIGTERM", () => {
	log("INFO", "Spawner received SIGTERM, shutting down...");
	process.exit(0);
});

process.on("unhandledRejection", (reason, promise) => {
	log("ERROR", "Unhandled Rejection in spawner", { reason: reason.message, promise });
	process.exit(1);
});

process.on("uncaughtException", (error) => {
	log("ERROR", "Uncaught Exception in spawner", { error: error.message, stack: error.stack });
	process.exit(1);
});

// Run the dual server test
log("INFO", "Starting dual server spawner...");
runDualServerTest()
	.then((summary) => {
		const exitCode = summary.failed > 0 ? 1 : 0;
		process.exit(exitCode);
	})
	.catch((error) => {
		log("ERROR", "Fatal error in spawner execution", { error: error.message });
		process.exit(1);
	});
