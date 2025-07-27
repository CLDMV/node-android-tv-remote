/**
 * Test for getKeyboardKeys and getPressCommands methods of the android-tv-remote module.
 *
 * Usage: Run with `node test/api-surface.test.js`
 */

const assert = require("assert");
const createRemote = require("../src/lib/android-tv-remote");

// Minimal config for instantiation (no real device needed for API surface test)
const remote = createRemote({ ip: "127.0.0.1", autoConnect: false, maintainConnection: false, quiet: true });

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
