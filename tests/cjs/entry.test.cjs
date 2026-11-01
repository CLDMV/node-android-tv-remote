/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /tests/cjs/entry.test.cjs
 *	@Date: 2026-10-03T00:00:00-07:00 (1791010800)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T13:14:24-08:00 (1793567664)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * CommonJS entry tests for the built package. These run under Node's own test runner
 * (`node --test`), not Vitest: Vitest loads files through its own module runner, so it
 * cannot show whether a plain `require()` of the package works the way it does for a
 * CommonJS consumer. Run after `npm run build` (see `test:cjs`); they check that
 * dist/index.cjs re-exports dist/index.mjs.
 */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const repoRoot = path.resolve(__dirname, "../..");
const dist = path.join(repoRoot, "dist");

test("require() returns the same createRemote object as import", async () => {
	const createRemote = require(path.join(dist, "index.cjs"));
	const esm = await import(pathToFileURL(path.join(dist, "index.mjs")).href);

	// createRemote opens an ADB connection when called, so only identity/type is
	// checked here - no sockets are opened in this test.
	assert.equal(typeof createRemote, "function");
	assert.equal(createRemote, esm.default);
	assert.equal(createRemote.createRemote, esm.default);
	assert.equal(createRemote.default, esm.default);
	assert.equal(typeof createRemote.createAndroidTVRemote, "function");
	assert.equal(createRemote.createAndroidTVRemote, esm.createAndroidTVRemote);
});

test("require() fails with a clear message where Node.js has no require(esm)", () => {
	// --no-experimental-require-module turns require(esm) off, which is what Node.js
	// versions before 20.19 / 22.12 look like to the entry.
	const res = spawnSync(process.execPath, ["--no-experimental-require-module", "-e", "require('./dist/index.cjs')"], {
		cwd: repoRoot,
		encoding: "utf8"
	});

	assert.notEqual(res.status, 0);
	assert.match(res.stderr, /ERR_REQUIRE_ESM/);
	assert.match(res.stderr, /require\(\) needs Node\.js >=22\.22\.0/);
	assert.match(res.stderr, /import\(\)/);
});
