/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/screencap/screenshot-test.mjs
 *	@Date: 2025-10-15 15:22:19 -07:00 (1760566939)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 06:42:33 -07:00 (1760622153)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Screenshot Test
 * Tests the new screencap() functionality
 *
 * Usage: node test/screenshot-test.mjs [ip]
 */

import createRemote from "../../src/lib/android-tv-remote.mjs";
import fs from "fs";
import path from "path";

/**
 * Parse PNG file to get image dimensions
 * @param {string} filepath - Path to PNG file
 * @returns {{width: number, height: number}} Image dimensions
 */
const getPngDimensions = (filepath) => {
	const buffer = fs.readFileSync(filepath);

	// PNG file signature: 89 50 4E 47 0D 0A 1A 0A
	if (buffer.slice(0, 8).toString("hex") !== "89504e470d0a1a0a") {
		throw new Error("Not a valid PNG file");
	}

	// IHDR chunk starts at byte 8, dimensions at bytes 16-23
	const width = buffer.readUInt32BE(16);
	const height = buffer.readUInt32BE(20);

	return { width, height };
};

/**
 * Enhanced logger
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {any} data - Additional data
 */
const log = (level, message, data = null) => {
	const timestamp = new Date().toISOString();
	const prefix = `[${timestamp}] [SCREENSHOT-TEST] [${level.toUpperCase()}]`;
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
 * Test screencap functionality (saves screenshot to file)
 */
const testScreencap = async (ip = "10.6.0.18") => {
	log("INFO", "=== Testing Screenshot Functionality ===");

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
		log("INFO", "Connecting to device...");
		await remote.connect();

		log("INFO", "Taking screenshot...");

		// Start timing from screencap call
		const startTime = performance.now();
		const pngStream = await remote.screencap();
		const screencapTime = performance.now();

		// Save screenshot to file
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const filename = `screenshot-${timestamp}.png`;
		const filepath = path.join(process.cwd(), "test", filename);

		log("INFO", `Saving screenshot to: ${filepath}`);

		// Create write stream and pipe PNG data
		const writeStream = fs.createWriteStream(filepath);
		pngStream.pipe(writeStream);

		// Wait for file write to complete
		await new Promise((resolve, reject) => {
			writeStream.on("finish", () => {
				const endTime = performance.now();
				const totalTime = endTime - startTime;
				const captureTime = screencapTime - startTime;
				const writeTime = endTime - screencapTime;

				log("SUCCESS", `Screenshot saved successfully: ${filename}`);
				log("INFO", `⏱️  Timing: Capture=${captureTime.toFixed(1)}ms, Write=${writeTime.toFixed(1)}ms, Total=${totalTime.toFixed(1)}ms`);
				resolve();
			});
			writeStream.on("error", reject);
			pngStream.on("error", reject);
		});

		// Get file stats and resolution
		const stats = fs.statSync(filepath);
		const dimensions = getPngDimensions(filepath);

		log("INFO", `Screenshot file size: ${stats.size} bytes (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
		log("INFO", `📐 Image resolution: ${dimensions.width}x${dimensions.height} pixels`);

		await remote.disconnect();
		log("SUCCESS", "Screenshot test completed successfully");
	} catch (error) {
		log("ERROR", "Screenshot test failed:", error.message);
		throw error;
	}
};

/**
 * Main test runner - screenshot tests only
 */
const runScreenshotTests = async () => {
	const args = process.argv.slice(2);
	const ip = args[0] || "10.6.0.18";

	console.log("");
	console.log("📸 SCREENSHOT TEST");
	console.log("==================");
	console.log(`Target IP: ${ip}`);
	console.log(`Start time: ${new Date().toISOString()}`);
	console.log("");

	log("INFO", `Starting screenshot tests with IP: ${ip}`);
	log("INFO", "===============================================");

	try {
		// Test screencap via main remote interface
		await testScreencap(ip);

		log("SUCCESS", "🎉 Screenshot test completed successfully!");
	} catch (error) {
		log("ERROR", "❌ Screenshot test suite failed:", error.message);
		if (error.stack) {
			console.error(error.stack);
		}
		process.exit(1);
	}
};

// Run tests when script is executed directly
runScreenshotTests();

export { testScreencap };
