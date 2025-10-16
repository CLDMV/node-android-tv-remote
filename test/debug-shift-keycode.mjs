/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/debug-shift-keycode.mjs
 *	@Date: 2025-10-16 07:56:27 -07:00 (1760626587)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 08:00:10 -07:00 (1760626810)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

import createRemote from "../src/lib/android-tv-remote.mjs";

console.log("🔍 Testing shift keycode removal\n");

try {
	const remote = await createRemote({ ip: "192.168.1.100", autoConnect: false });

	console.log("📋 Checking shift function structure:");
	console.log("  shift object exists:", typeof remote.keyboard.key.shift === "object");
	console.log("  shift.a exists:", typeof remote.keyboard.key.shift.a === "function");
	console.log("  shift.a.keycode exists:", typeof remote.keyboard.key.shift.a?.keycode);
	console.log("  shift.one exists:", typeof remote.keyboard.key.shift.one === "function");
	console.log("  shift.one.keycode exists:", typeof remote.keyboard.key.shift.one?.keycode);

	// Test that regular keys still have keycode methods
	console.log("\n📋 Checking regular key keycode methods:");
	console.log("  a.keycode exists:", typeof remote.keyboard.key.a.keycode === "function");
	console.log("  one.keycode exists:", typeof remote.keyboard.key.one.keycode === "function");

	// List all shift functions
	const shiftKeys = Object.keys(remote.keyboard.key.shift);
	console.log(`\n📋 Available shift keys (${shiftKeys.length}):`);
	console.log("  ", shiftKeys.slice(0, 10).join(", "), shiftKeys.length > 10 ? "..." : "");

	// Check if any shift functions accidentally have keycode methods
	let shiftWithKeycode = [];
	shiftKeys.forEach((key) => {
		if (remote.keyboard.key.shift[key].keycode) {
			shiftWithKeycode.push(key);
		}
	});

	console.log("\n📋 Shift keys with keycode methods (should be 0):", shiftWithKeycode.length);
	if (shiftWithKeycode.length > 0) {
		console.log("  Problem keys:", shiftWithKeycode);
	} else {
		console.log("  ✅ Good! No shift keys have keycode methods");
	}
} catch (error) {
	console.error("❌ Error:", error.message);
}
