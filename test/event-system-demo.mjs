/**
 * Event System Demonstration
 *
 * This example shows how to use the event-driven Android TV Remote.
 * All operations emit events instead of console logging.
 *
 * Usage: node test/event-system-demo.mjs
 */

import createRemote, { createAndroidTVRemote } from "../src/lib/android-tv-remote.mjs";

console.log("=== Android TV Remote Event System Demo ===\n");

// Example 1: Basic event handling
console.log("1. Creating remote with basic event handling...");
const remote = createRemote({
	ip: "127.0.0.1",
	autoConnect: false,
	quiet: false // Enable all log events
});

// Set up event listeners
remote.on("log", (data) => {
	const timestamp = new Date(data.timestamp).toLocaleTimeString();
	console.log(`[${timestamp}] ${data.level.toUpperCase()} [${data.source}]: ${data.message}`);
	if (data.data) {
		console.log(`  Data:`, data.data);
	}
});

remote.on("error", (data) => {
	const timestamp = new Date(data.timestamp).toLocaleTimeString();
	console.error(`[${timestamp}] ERROR [${data.source}]: ${data.message}`);
	console.error(`  Error:`, data.error.message);
});

console.log("✓ Event listeners set up");
console.log("✓ Remote created successfully");

// Example 2: Test API surface methods (these don't require device connection)
console.log("\n2. Testing API surface methods...");
try {
	const keyboardKeys = remote.getKeyboardKeys();
	console.log(`✓ Found ${keyboardKeys.length} keyboard keys`);

	const pressCommands = remote.getPressCommands();
	console.log(`✓ Found ${pressCommands.length} press commands`);
} catch (error) {
	console.error("✗ API surface test failed:", error.message);
}

// Example 3: Test unknown key error (should emit error event)
console.log("\n3. Testing error event emission...");
try {
	// This should emit an error event for unknown key
	await remote.keyboard.key("nonexistentkey");
} catch (error) {
	console.log("✓ Caught expected error for unknown key");
}

// Example 4: Demonstrate static create method
console.log("\n4. Demonstrating static create method...");
try {
	// This would normally wait for connection, but we disabled autoConnect
	const remote2 = await createAndroidTVRemote({
		ip: "192.168.1.100",
		autoConnect: false
	});

	remote2.on("log", (data) => {
		console.log(`[REMOTE2] ${data.level}: ${data.message}`);
	});

	console.log("✓ Static create method works");
} catch (error) {
	console.error("✗ Static create failed:", error.message);
}

// Example 5: Chaining event listeners
console.log("\n5. Demonstrating method chaining...");
const remote3 = createRemote({ ip: "10.0.0.1", autoConnect: false })
	.on("log", (data) => console.log(`[CHAIN] LOG: ${data.message}`))
	.on("error", (data) => console.log(`[CHAIN] ERROR: ${data.message}`))
	.once("log", (data) => console.log(`[CHAIN] FIRST LOG ONLY: ${data.message}`));

console.log("✓ Method chaining works");

// Example 6: Event listener management
console.log("\n6. Demonstrating event listener management...");
const testHandler = (data) => console.log(`Test handler: ${data.message}`);

remote3.on("log", testHandler);
console.log("✓ Added test handler");

remote3.off("log", testHandler);
console.log("✓ Removed test handler");

console.log("\n=== Demo Complete ===");
console.log("\nKey Features Demonstrated:");
console.log("• Event-driven architecture (no console.log/console.error)");
console.log("• Structured event data with timestamps and sources");
console.log("• Error events instead of thrown exceptions");
console.log("• Method chaining for event listeners");
console.log("• Static create method for async initialization");
console.log("• Separation of log levels (info, warn, error, debug)");
console.log("\nFor a real device, set autoConnect: true and provide a valid IP address.");
