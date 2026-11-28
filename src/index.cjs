/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /src/index.cjs
 *	@Date: 2025-10-15T10:29:19-07:00 (1760549359)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-07T09:43:30-08:00 (1794073410)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * CommonJS entry point for @cldmv/node-android-tv-remote
 *
 * The generic CLDMV shim: a thin, synchronous wrapper around the ESM entry that loads the sibling index.mjs through
 * Node's require(esm). The ESM entry exports two distinct values (createRemote, also the default, and createAndroidTVRemote),
 * so require() returns the module object: `{ __esModule, default: createRemote, createRemote, createAndroidTVRemote }`.
 *
 * tsup.config.mjs copies this file verbatim to dist/index.cjs, so it is never bundled.
 * Its `require("./index.mjs")` resolves to src/index.mjs in a checkout and to the bundle in dist/.
 *
 * @module @cldmv/node-android-tv-remote
 */
"use strict";

if (!process.features?.require_module) {
	const error = new Error(
		`@cldmv/node-android-tv-remote: require() needs Node.js >=22.15.0 (this is ${process.version}). On older Node.js, load the package with import() instead.`
	);
	error.code = "ERR_REQUIRE_ESM";
	throw error;
}

// Same exports as `import`. One distinct exported value (aliases of it count once) comes back as that value,
// so require(x)(...) works; anything else comes back as the module object ({ default, ...named }).
const esm = require("./index.mjs");
const values = new Set(
	Object.keys(esm)
		.filter((key) => key !== "__esModule")
		.map((key) => esm[key])
);
module.exports = values.size === 1 ? values.values().next().value : esm;
