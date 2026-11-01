/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /src/index.cjs
 *	@Date: 2025-10-15T10:29:19-07:00 (1760549359)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T13:14:23-08:00 (1793567663)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * CommonJS entry point for @cldmv/node-android-tv-remote
 *
 * A thin, synchronous wrapper around the ESM entry: it loads the sibling index.mjs through
 * Node's require(esm) and maps it to the historical CommonJS shape (`module.exports` is
 * createRemote, with createRemote / createAndroidTVRemote / default on it).
 *
 * tsup.config.mjs copies this file verbatim to dist/index.cjs, so it is never bundled.
 * Its `require("./index.mjs")` resolves to src/index.mjs in a checkout and to the bundle
 * in dist/.
 *
 * @module @cldmv/node-android-tv-remote
 */
"use strict";

// Node.js versions without require(esm) (before 20.19 / 22.12) would fail with a bare ERR_REQUIRE_ESM, so fail
// early with a message that says what to do instead.
if (!process.features?.require_module) {
	const error = new Error(
		`@cldmv/node-android-tv-remote: require() needs Node.js >=22.22.0 (this is ${process.version}). On older Node.js, load the package with import() instead.`
	);
	error.code = "ERR_REQUIRE_ESM";
	throw error;
}

const { default: createRemote, createAndroidTVRemote } = require("./index.mjs");

module.exports = createRemote;
module.exports.createRemote = createRemote;
module.exports.createAndroidTVRemote = createAndroidTVRemote;
module.exports.default = createRemote;
