/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /.configs/vitest.config.mjs
 *	@Date: 2026-08-02T23:41:58-07:00 (1785739318)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T12:16:04-07:00 (1790968564)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Anchor the project root to the package directory so include/exclude work no
// matter what cwd vitest is invoked from.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export default defineConfig({
	root,
	test: {
		include: ["tests/**/*.test.vitest.mjs"],
		// `test/` (singular) is the pre-existing hardware-interactive/manual
		// debug-script directory (ADB/device demos, screencap tools, etc.) —
		// it requires a live Android TV / Fire TV device and must never be
		// picked up by the automated suite.
		exclude: ["node_modules", "test/**"],
		environment: "node",
		testTimeout: 30000,
		// @devicefarmer/adbkit is CJS with a nested default-export shape; letting
		// Vite externalize it (the default for node_modules deps) breaks the
		// `Adb.createClient` interop under vitest even though it resolves fine
		// under plain Node ESM. Inlining routes it through Vite's own transform,
		// which normalizes the interop correctly.
		server: { deps: { inline: [/@devicefarmer\/adbkit/] } },
		reporters: ["dot"],
		coverage: {
			provider: "v8",
			include: ["src/**"],
			exclude: ["**/*.json", "tests/**"],
			reporter: ["text", "html", "json-summary", "json"]
		}
	}
});
