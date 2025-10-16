/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/api-surface.test.mjs
 *	@Date: 2025-10-15 10:19:05 -07:00 (1760548745)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-15 10:56:52 -07:00 (1760551012)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Test for getKeyboardKeys and getPressCommands methods of the android-tv-remote module.
 *
 * Usage: Run with `node test/api-surface.test.mjs`
 */

import assert from "assert";
import createRemote from "../src/lib/android-tv-remote.mjs";

// Minimal config for instantiation (no real device needed for API surface test)
const remote = await createRemote({ ip: "127.0.0.1", autoConnect: false, maintainConnection: false, quiet: true });

/**
 * Test getKeyboardKeys returns all top-level function keys from keyboard.key
 */
function testGetKeyboardKeys() {
	const keys = remote.getKeyboardKeys();
	console.log("getKeyboardKeys:", keys);
	assert(Array.isArray(keys), "getKeyboardKeys should return an array");
	assert(keys.length > 0, "getKeyboardKeys should return at least one key");
	// Spot check for some expected keys
	["a", "enter", "space"].forEach((k) => {
		assert(keys.includes(k), `getKeyboardKeys should include '${k}'`);
	});
	// Should not include 'shift' or 'keycode' (sub-objects)
	assert(!keys.includes("shift"), "getKeyboardKeys should not include shift");
	assert(!keys.includes("keycode"), "getKeyboardKeys should not include keycode");
}

/**
 * Test getPressCommands returns all top-level function keys from press
 */
function testGetPressCommands() {
	const keys = remote.getPressCommands();
	console.log("getPressCommands:", keys);
	assert(Array.isArray(keys), "getPressCommands should return an array");
	assert(keys.length > 0, "getPressCommands should return at least one key");
	// Spot check for some expected keys (may vary by remote-keys.json)
	["home", "back", "ok", "up", "down", "left", "right"].forEach((k) => {
		assert(keys.includes(k), `getPressCommands should include '${k}'`);
	});
	// Should not include 'long' (sub-object)
	assert(!keys.includes("long"), "getPressCommands should not include long");
}

console.log("Testing getKeyboardKeys...");
testGetKeyboardKeys();
console.log("Testing getPressCommands...");
testGetPressCommands();
console.log("All API surface tests passed.");
