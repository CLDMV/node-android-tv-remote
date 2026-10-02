/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /tests/api-surface.test.vitest.mjs
 *	@Date: 2026-08-02T23:41:58-07:00 (1785739318)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T12:16:16-07:00 (1790968576)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * API surface test for the android-tv-remote module: getKeyboardKeys() and
 * getPressCommands(). Fully offline — instantiates with autoConnect: false so
 * no ADB binary or live device is required. Converted from the original
 * test/api-surface.test.mjs (assert-based) to vitest describe/test/expect.
 */

import { describe, test, expect } from "vitest";
import createRemote from "../src/lib/android-tv-remote.mjs";

describe("android-tv-remote api surface", () => {
	test("getKeyboardKeys returns all top-level function keys from keyboard.key", async () => {
		const remote = await createRemote({ ip: "127.0.0.1", autoConnect: false, maintainConnection: false, quiet: true });
		const keys = remote.getKeyboardKeys();

		expect(Array.isArray(keys)).toBe(true);
		expect(keys.length).toBeGreaterThan(0);
		for (const k of ["a", "enter", "space"]) {
			expect(keys).toContain(k);
		}
		// Should not include 'shift' or 'keycode' (sub-objects)
		expect(keys).not.toContain("shift");
		expect(keys).not.toContain("keycode");
	});

	test("getPressCommands returns all top-level function keys from press", async () => {
		const remote = await createRemote({ ip: "127.0.0.1", autoConnect: false, maintainConnection: false, quiet: true });
		const keys = remote.getPressCommands();

		expect(Array.isArray(keys)).toBe(true);
		expect(keys.length).toBeGreaterThan(0);
		for (const k of ["home", "back", "ok", "up", "down", "left", "right"]) {
			expect(keys).toContain(k);
		}
		// Should not include 'long' (sub-object)
		expect(keys).not.toContain("long");
	});
});
