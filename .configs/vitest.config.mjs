/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /.configs/vitest.config.mjs
 *	@Date: 2026-08-02T23:41:58-07:00 (1785739318)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-07T21:15:36-08:00 (1794114936)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

import { defineConfig, mergeConfig } from "vitest/config";
import { devCondition } from "@cldmv/configs/vitest.config.mjs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Anchor the project root to the package directory so include/exclude work no
// matter what cwd vitest is invoked from.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// devCondition() reads the package's "-dev" export condition and sets resolve/ssr conditions plus test.execArgv, so
// Vite and the Node workers both load src/. `--mode=dist` (npm run test:dist) leaves it out, so tests that import the
// package by name run against the build in dist/ instead.
export default defineConfig(({ mode }) => {
	const config = defineConfig({
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
	return mode === "dist" ? config : mergeConfig(devCondition({ root }), config);
});
