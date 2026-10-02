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

const { createRequire } = require("module");
const requireESM = createRequire(__filename);

const { default: createRemote } = requireESM("./index.mjs");

module.exports = createRemote;
module.exports.createRemote = createRemote;
module.exports.default = createRemote;
