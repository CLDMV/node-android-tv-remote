/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/screencap/enhanced-screencap-test.mjs
 *	@Date: 2025-10-15 15:50:17 -07:00 (1760568617)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 06:42:00 -07:00 (1760622120)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Test file for enhanced screencap functionality
 * Demonstrates the new width, height, filepath parameters and event emission
 */

import createRemote from "../../src/lib/android-tv-remote.mjs";

// Test configuration - update IP as needed
const config = {
	ip: "10.6.0.133", // Working Fire TV IP (not streaming)
	quiet: false // Enable logging
};

/**
 * Test basic screencap with events
 */
async function testBasicScreencap(remote) {
	console.log("\n=== Test 1: Basic Screenshot (no processing) ===");

	// Set up event listeners
	remote.on("screencap-start", (data) => {
		console.log("📸 Screenshot started:", data);
	});

	remote.on("screencap-captured", (data) => {
		console.log("✅ Raw capture complete:", `${(data.captureTime || data.timing?.capture || 0).toFixed(2)}ms`);
	});

	remote.on("screencap-ready", (data) => {
		console.log("🎯 Stream ready:", data);
	});

	remote.on("screencap-complete", (data) => {
		console.log("🏁 Operation complete:", `${(data.totalTime || data.timing?.total || 0).toFixed(2)}ms`);
	});

	try {
		const stream = await remote.screencap();
		console.log("📦 Received stream:", !!stream);
	} catch (error) {
		console.error("❌ Error:", error.message);
	}
}

/**
 * Test screencap with resizing
 */
async function testResizedScreencap(remote) {
	console.log("\n=== Test 2: Resized Screenshot (1280x720) ===");

	// Set up event listeners
	remote.on("screencap-processing", (data) => {
		console.log("🔄 Processing started:", data);
	});

	remote.on("screencap-ready", (data) => {
		console.log(
			"🎯 Processed stream ready:",
			`${(data.processTime || data.timing?.sharpProcess || 0).toFixed(2)}ms process, ${(data.totalTime || data.timing?.total || 0).toFixed(
				2
			)}ms total`
		);
	});

	remote.on("screencap-complete", (data) => {
		console.log("🏁 Resize complete:", data);
	});

	try {
		const stream = await remote.screencap({ width: 1280, height: 720 });
		console.log("📦 Received resized stream:", !!stream);
	} catch (error) {
		console.error("❌ Error:", error.message);
	}
}

/**
 * Test screencap save to file (non-blocking)
 */
async function testFileSave(remote) {
	console.log("\n=== Test 3: Save to File (Non-blocking) ===");
	const filepath = "./test-screenshot.png";

	// Set up event listeners
	remote.on("screencap-start", (data) => {
		console.log("📸 File save started:", data.options);
	});

	remote.on("screencap-captured", (data) => {
		console.log("✅ Raw capture for file save:", `${(data.captureTime || data.timing?.capture || 0).toFixed(2)}ms`);
	});

	remote.on("screencap-processing", (data) => {
		console.log("🔄 Processing for file save:", data.filepath);
	});

	remote.on("screencap-saved", (data) => {
		console.log("💾 File saved successfully:", {
			filepath: data.filepath,
			processTime: `${(data.processTime || data.timing?.sharpProcess || 0).toFixed(2)}ms`,
			totalTime: `${(data.totalTime || data.timing?.total || 0).toFixed(2)}ms`
		});
	});

	remote.on("screencap-complete", (data) => {
		console.log("🏁 File operation complete:", data);
	});

	try {
		// This should return immediately (no blocking)
		const result = await remote.screencap({ filepath });
		console.log("📦 Function returned (should be undefined for file save):", result);

		// Wait a bit to see the save complete event
		console.log("⏳ Waiting for background save to complete...");
		await new Promise((resolve) => setTimeout(resolve, 3000));
	} catch (error) {
		console.error("❌ Error:", error.message);
	}
}

/**
 * Test screencap with resizing and file save
 */
async function testResizeAndSave(remote) {
	console.log("\n=== Test 4: Resize + Save to File ===");
	const filepath = "./test-screenshot-small.png";

	// Set up event listeners
	remote.on("screencap-start", (data) => {
		console.log("📸 Resize + save started:", data.options);
	});

	remote.on("screencap-processing", (data) => {
		console.log("🔄 Processing resize + save:", {
			width: data.width,
			height: data.height,
			filepath: data.filepath
		});
	});

	remote.on("screencap-saved", (data) => {
		console.log("💾 Resized file saved:", {
			filepath: data.filepath,
			processTime: `${(data.processTime || data.timing?.sharpProcess || 0).toFixed(2)}ms`,
			totalTime: `${(data.totalTime || data.timing?.total || 0).toFixed(2)}ms`
		});
	});

	remote.on("screencap-complete", (data) => {
		console.log("🏁 Resize + save complete:", data);
	});

	try {
		const result = await remote.screencap({
			width: 640,
			height: 360,
			filepath
		});
		console.log("📦 Function returned (should be undefined):", result);

		// Wait for background processing
		console.log("⏳ Waiting for background resize + save...");
		await new Promise((resolve) => setTimeout(resolve, 3000));
	} catch (error) {
		console.error("❌ Error:", error.message);
	}
}

/**
 * Test multiple concurrent screencaps (demonstrates non-blocking nature)
 */
async function testConcurrentScreencaps(remote) {
	console.log("\n=== Test 5: Multiple Concurrent Screenshots ===");

	// Set up event listeners with operation IDs
	let operationCount = 0;
	remote.on("screencap-complete", (data) => {
		operationCount++;
		console.log(`🏁 Operation ${operationCount} complete:`, {
			filepath: data.filepath || "stream",
			totalTime: `${(data.totalTime || data.timing?.total || 0).toFixed(2)}ms`
		});
	});

	try {
		console.log("🚀 Starting 3 concurrent screenshot operations...");

		// Start all operations concurrently
		const promises = [
			remote.screencap({ filepath: "./concurrent-1.png" }),
			remote.screencap({ width: 800, filepath: "./concurrent-2-resized.png" }),
			remote.screencap({ width: 1280, height: 720 }) // Returns stream
		];

		const results = await Promise.all(promises);
		console.log("📦 All operations initiated:", {
			result1: results[0], // undefined (file)
			result2: results[1], // undefined (file)
			result3: !!results[2] // stream object
		});

		// Wait for background operations to complete
		console.log("⏳ Waiting for background operations...");
		await new Promise((resolve) => setTimeout(resolve, 5000));
	} catch (error) {
		console.error("❌ Error:", error.message);
	}
}

/**
 * Run all tests
 */
async function runTests() {
	console.log("🧪 Enhanced Screencap Functionality Tests");
	console.log("==========================================");

	try {
		// Create a single remote instance to share across all tests
		console.log("🔌 Creating remote connection...");
		const remote = await createRemote(config);

		// Add global error handler to prevent unhandled errors
		remote.on("error", (errorData) => {
			console.error(`❌ Remote Error from ${errorData.source}:`, errorData.error.message);
		});
		await testBasicScreencap(remote);
		await testResizedScreencap(remote);
		await testFileSave(remote);
		await testResizeAndSave(remote);
		await testConcurrentScreencaps(remote);

		console.log("\n✅ All tests completed!");

		// Properly disconnect to clean up timers and connections
		console.log("\n🔌 Disconnecting from device...");
		await remote.disconnect();

		console.log("🏁 Test suite completed cleanly!");
	} catch (error) {
		console.error("\n❌ Test suite failed:", error.message);

		// Still try to clean up on error
		try {
			await remote.disconnect();
		} catch (disconnectError) {
			console.error("Failed to disconnect:", disconnectError.message);
		}

		process.exit(1);
	}
}

// Run the tests
runTests();
