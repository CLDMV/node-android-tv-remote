/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /index.mjs
 *	@Date: 2025-10-15 10:29:19 -07:00 (1760549359)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-15 10:40:23 -07:00 (1760550023)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
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
export { default as createRemote } from "./src/lib/android-tv-remote.mjs";
export { default as AndroidTVSetup } from "./src/lib/adb/setup.mjs";
