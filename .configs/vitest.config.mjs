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
