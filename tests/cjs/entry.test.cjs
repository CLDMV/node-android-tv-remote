/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /tests/cjs/entry.test.cjs
 *	@Date: 2026-10-03T00:00:00-07:00 (1791010800)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-03T10:37:08-07:00 (1791049028)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * CommonJS entry tests. These run under Node's own test runner (`node --test`), not Vitest:
 * Vitest loads files through its own module runner, so it cannot show whether a plain
 * `require()` of the package works the way it does for a CommonJS consumer.
 */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "../..");

test("require() returns the same createRemote object as import", async () => {
	const createRemote = require("../../index.cjs");
	const esm = await import("../../index.mjs");

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
	const res = spawnSync(process.execPath, ["--no-experimental-require-module", "-e", "require('./index.cjs')"], {
		cwd: repoRoot,
		encoding: "utf8"
	});

	assert.notEqual(res.status, 0);
	assert.match(res.stderr, /ERR_REQUIRE_ESM/);
	assert.match(res.stderr, /require\(\) needs Node\.js \^20\.19\.0 or >=22\.12\.0/);
	assert.match(res.stderr, /import\(\)/);
});
