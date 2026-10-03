/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /index.cjs
 *	@Date: 2025-10-15T10:29:19-07:00 (1760549359)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T12:16:13-07:00 (1790968573)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * CommonJS entry point for @cldmv/node-android-tv-remote
 *
 * This file provides CommonJS (require) support for the Android TV Remote Library.
 * It imports and re-exports the main createRemote function from the ESM module.
 *
 * @module @cldmv/node-android-tv-remote/cjs
 */
"use strict";

// index.cjs is a thin wrapper: it loads index.mjs through Node's synchronous require(esm).
// Node.js versions without require(esm) would fail with a bare ERR_REQUIRE_ESM, so fail
// early with a message that says what to do instead.
if (!process.features?.require_module) {
	const error = new Error(
		`@cldmv/node-android-tv-remote: require() needs Node.js ^20.19.0 or >=22.12.0 (this is ${process.version}). On older Node.js, load the package with import() instead.`
	);
	error.code = "ERR_REQUIRE_ESM";
	throw error;
}

const { default: createRemote, createAndroidTVRemote } = require("./index.mjs");

module.exports = createRemote;
module.exports.createRemote = createRemote;
module.exports.createAndroidTVRemote = createAndroidTVRemote;
module.exports.default = createRemote;
