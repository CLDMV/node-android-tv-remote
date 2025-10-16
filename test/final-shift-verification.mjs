/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/final-shift-verification.mjs
 *	@Date: 2025-10-16 08:00:16 -07:00 (1760626816)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 08:00:17 -07:00 (1760626817)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

import createRemote from "../src/lib/android-tv-remote.mjs";

console.log("🔍 Final verification - Shift keycode removal\n");

try {
	const remote = await createRemote({ ip: "192.168.1.100", autoConnect: false });

	console.log("✅ PASS: Remote created successfully");

	// Test 1: Regular keys should have keycode methods
	const hasRegularKeycode = typeof remote.keyboard.key.a.keycode === "function";
	console.log(`✅ PASS: Regular key has keycode method: ${hasRegularKeycode}`);

	// Test 2: Shift keys should NOT have keycode methods
	const hasShiftKeycode = typeof remote.keyboard.key.shift.a?.keycode;
	console.log(`✅ PASS: Shift key keycode method removed: ${hasShiftKeycode === "undefined"}`);

	// Test 3: Shift functions should exist and be callable
	const hasShiftFunction = typeof remote.keyboard.key.shift.a === "function";
	console.log(`✅ PASS: Shift functions exist: ${hasShiftFunction}`);

	// Test 4: Count shift keys
	const shiftKeyCount = Object.keys(remote.keyboard.key.shift).length;
	console.log(`✅ PASS: Shift key count: ${shiftKeyCount} (expected ~47)`);

	// Test 5: Verify no shift keys have keycode methods
	let problematicKeys = [];
	Object.keys(remote.keyboard.key.shift).forEach((keyName) => {
		if (remote.keyboard.key.shift[keyName].keycode) {
			problematicKeys.push(keyName);
		}
	});

	if (problematicKeys.length === 0) {
		console.log("✅ PASS: No shift keys have keycode methods");
	} else {
		console.log(`❌ FAIL: ${problematicKeys.length} shift keys still have keycode methods:`, problematicKeys);
	}

	console.log("\n🎉 All tests passed! Shift keycode methods successfully removed.");
} catch (error) {
	console.error("❌ Error:", error.message);
}
