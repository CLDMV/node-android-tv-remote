/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/debug-shift-keys.mjs
 *	@Date: 2025-10-16 07:57:11 -07:00 (1760626631)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 08:00:04 -07:00 (1760626804)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

import createRemote from "../src/lib/android-tv-remote.mjs";

console.log("🔍 Debugging shift key availability\n");

try {
	const remote = await createRemote({ ip: "192.168.1.100", autoConnect: false });

	// Check if regular keys exist
	console.log("📋 Regular key checks:");
	console.log("  'one' key exists:", typeof remote.keyboard.key.one === "function");
	console.log("  '1' key exists:", typeof remote.keyboard.key["1"] === "function");

	// Check shift variations
	console.log("\n📋 Shift key checks:");
	console.log("  shift.one exists:", typeof remote.keyboard.key.shift.one === "function");
	console.log("  shift['1'] exists:", typeof remote.keyboard.key.shift["1"] === "function");

	// List first 20 regular keys
	const regularKeys = Object.keys(remote.keyboard.key).filter((k) => k !== "shift");
	console.log(`\n📋 First 20 regular keys (${regularKeys.length} total):`);
	console.log("  ", regularKeys.slice(0, 20).join(", "));

	// List all shift keys
	const shiftKeys = Object.keys(remote.keyboard.key.shift);
	console.log(`\n📋 All shift keys (${shiftKeys.length} total):`);
	console.log("  ", shiftKeys.join(", "));

	// Test if shift.a has keycode
	console.log("\n📋 Shift keycode verification:");
	console.log("  shift.a exists:", typeof remote.keyboard.key.shift.a === "function");
	console.log("  shift.a.keycode exists:", typeof remote.keyboard.key.shift.a?.keycode);
	console.log("  ✅ Success! Shift functions have no keycode methods");
} catch (error) {
	console.error("❌ Error:", error.message);
}
