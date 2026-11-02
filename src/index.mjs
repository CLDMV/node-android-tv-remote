/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /src/index.mjs
 *	@Date: 2025-10-15T10:29:19-07:00 (1760549359)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T12:16:14-07:00 (1790968574)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * ES Module entry point for @cldmv/node-android-tv-remote
 *
 * Re-exports the main createRemote function and createAndroidTVRemote. tsup bundles
 * this file into dist/index.mjs; src/index.cjs loads it for require().
 *
 * @module @cldmv/node-android-tv-remote
 */

export { default } from "./lib/android-tv-remote.mjs";
export { default as createRemote, createAndroidTVRemote } from "./lib/android-tv-remote.mjs";
