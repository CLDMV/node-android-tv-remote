/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/keyboard-test.mjs
 *	@Date: 2025-10-16 07:26:36 -07:00 (1760624796)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 07:27:00 -07:00 (1760624820)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

import createRemote from '../src/lib/android-tv-remote.mjs';

async function testKeyboardKeys() {
	console.log("🔍 Testing Keyboard Keys Available...");

	// Create remote without connecting
	const remote = await createRemote({
		ip: "192.168.1.100",
		autoConnect: false
	});

	console.log("\n📋 Available keyboard.key functions:");
	const keyboardKeys = Object.keys(remote.keyboard.key).filter((key) => typeof remote.keyboard.key[key] === "function");
	keyboardKeys.sort().forEach((key) => {
		console.log(`  remote.keyboard.key.${key}()`);
	});

	console.log("\n📋 Available keyboard.key.shift functions:");
	const shiftKeys = Object.keys(remote.keyboard.key.shift).filter((key) => typeof remote.keyboard.key.shift[key] === "function");
	shiftKeys.sort().forEach((key) => {
		console.log(`  remote.keyboard.key.shift.${key}()`);
	});

	console.log(`\n📊 Summary:`);
	console.log(`  Total keyboard keys: ${keyboardKeys.length}`);
	console.log(`  Total shift keys: ${shiftKeys.length}`);

	// Test a few special characters
	console.log("\n🧪 Testing special character examples:");
	try {
		console.log(`  exclamation available: ${typeof remote.keyboard.key.exclamation === "function"}`);
		console.log(`  hash available: ${typeof remote.keyboard.key.hash === "function"}`);
		console.log(`  asterisk available: ${typeof remote.keyboard.key.asterisk === "function"}`);
		console.log(`  leftParen available: ${typeof remote.keyboard.key.leftParen === "function"}`);
		console.log(`  tilde available: ${typeof remote.keyboard.key.tilde === "function"}`);
	} catch (error) {
		console.error("Error testing special characters:", error.message);
	}
}

testKeyboardKeys().catch(console.error);
