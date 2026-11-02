/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /tests/entry.test.vitest.mjs
 *	@Date: 2026-11-01T12:07:55-08:00 (1793563675)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T16:31:26-08:00 (1793579486)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * Source-level entry tests: with the `node-android-tv-remote-dev` condition (set by
 * .configs/vitest.config.mjs), the package name resolves to src/, and src/index.cjs
 * exposes the same API as src/index.mjs in the historical CommonJS shape. The built
 * dist/ entries are checked by tests/cjs/entry.test.cjs (`npm run test:cjs`).
 */

import { describe, test, expect } from "vitest";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esm from "@cldmv/node-android-tv-remote";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

describe("package entry points (source)", () => {
	test("the -dev condition resolves the package name to src/", () => {
		expect(require.resolve("@cldmv/node-android-tv-remote")).toBe(path.join(root, "src", "index.cjs"));
	});

	test("src/index.mjs exports createRemote as default and named, plus createAndroidTVRemote", () => {
		expect(Object.keys(esm).sort()).toEqual(["createAndroidTVRemote", "createRemote", "default"]);
		expect(typeof esm.default).toBe("function");
		expect(esm.createRemote).toBe(esm.default);
		expect(typeof esm.createAndroidTVRemote).toBe("function");
	});

	test("src/index.cjs maps the ESM entry to the CommonJS shape", () => {
		const createRemote = require(path.join(root, "src", "index.cjs"));
		// require() loads its own copy of the ESM graph outside Vite's module runner, so
		// compare shape and names rather than object identity.
		expect(typeof createRemote).toBe("function");
		expect(createRemote.name).toBe(esm.default.name);
		expect(createRemote.createRemote).toBe(createRemote);
		expect(createRemote.default).toBe(createRemote);
		expect(typeof createRemote.createAndroidTVRemote).toBe("function");
		expect(createRemote.createAndroidTVRemote.name).toBe(esm.createAndroidTVRemote.name);
	});

	test("src/index.cjs fails with a clear message where Node.js has no require(esm)", () => {
		const entry = path.join(root, "src", "index.cjs");
		// Make the entry see a Node.js without require(esm) (before 20.19 / 22.12), then load a fresh copy.
		const descriptor = Object.getOwnPropertyDescriptor(process.features, "require_module");
		Object.defineProperty(process.features, "require_module", { get: () => false, configurable: true });
		delete require.cache[entry];
		try {
			expect(() => require(entry)).toThrow(
				expect.objectContaining({
					code: "ERR_REQUIRE_ESM",
					message: expect.stringMatching(/require\(\) needs Node\.js >=22\.13\.0 .*import\(\)/)
				})
			);
		} finally {
			Object.defineProperty(process.features, "require_module", descriptor);
			delete require.cache[entry];
		}
	});
});
