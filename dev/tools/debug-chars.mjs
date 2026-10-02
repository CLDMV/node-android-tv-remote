/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /dev/tools/debug-chars.mjs
 *	@Date: 2025-10-16T07:32:01-07:00 (1760625121)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T12:16:10-07:00 (1790968570)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

import keyboardKeys from "../../src/data/keyboard-keys.json" with { type: "json" };

console.log("🔍 Debug: Checking for problematic characters");

// Test which keys might cause JavaScript issues
Object.keys(keyboardKeys).forEach((keyName) => {
	try {
		// Test if the key name can be used as a JavaScript property
		const testObj = {};
		testObj[keyName] = "test";

		// Test if the character value might cause issues
		const char = keyboardKeys[keyName];
		console.log(`✅ ${keyName}: "${char}" (${char.charCodeAt(0)})`);
	} catch (error) {
		console.log(`❌ ${keyName}: ERROR - ${error.message}`);
	}
});

console.log("\n🔍 Characters with escape sequences:");
Object.keys(keyboardKeys).forEach((keyName) => {
	const char = keyboardKeys[keyName];
	if (char.includes("\\") || char.charCodeAt(0) < 32) {
		console.log(`  ${keyName}: "${char}" (charCode: ${char.charCodeAt(0)})`);
	}
});
