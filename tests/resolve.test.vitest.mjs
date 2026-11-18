/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /tests/resolve.test.vitest.mjs
 *	@Date: 2026-11-07T21:14:56-08:00 (1794114896)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-07T21:15:50-08:00 (1794114950)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * The tests import "@cldmv/node-android-tv-remote" by name, so the node-android-tv-remote-dev condition decides what they run
 * against: src/ for `npm test`, the build in dist/ for `npm run test:dist` (`--mode=dist`). This checks the name resolved
 * to that tree.
 */
import { describe, it, expect } from "vitest";
import * as pkg from "@cldmv/node-android-tv-remote";

describe("the @cldmv/node-android-tv-remote import", () => {
	it(`resolves to ${import.meta.env.MODE === "dist" ? "dist/" : "src/"}`, async () => {
		const expected = import.meta.env.MODE === "dist" ? await import("../dist/index.mjs") : await import("../src/index.mjs");
		expect(pkg.default).toBe(expected.default);
		expect(pkg.createRemote).toBe(expected.createRemote);
		expect(pkg.createAndroidTVRemote).toBe(expected.createAndroidTVRemote);
	});
});
