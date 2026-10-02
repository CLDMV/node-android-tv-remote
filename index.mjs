/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /index.mjs
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
 * This file provides ES Module (import) support for the Android TV Remote Library.
 * It imports and re-exports the main createRemote function and helper classes.
 *
 * @module @cldmv/node-android-tv-remote/esm
 */

export { default } from "./src/lib/android-tv-remote.mjs";
export { default as createRemote, createAndroidTVRemote } from "./src/lib/android-tv-remote.mjs";
