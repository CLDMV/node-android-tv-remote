/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /eslint.config.mjs
 *	@Date: 2025-07-24T08:04:12-07:00 (1753369452)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-10-02T12:16:13-07:00 (1790968573)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";

export default defineConfig([
	{
		ignores: ["node_modules/**", ".git/**", ".vscode/**", "coverage/**", "**/package-lock.json"]
	},
	{
		files: ["**/*.{js,mjs,cjs}"],
		plugins: { js },
		extends: ["js/recommended"],
		rules: {
			"no-unused-vars": [
				"error",
				{
					"argsIgnorePattern": "^_$",
					"caughtErrorsIgnorePattern": "^_$",
					"destructuredArrayIgnorePattern": "^_$",
					"varsIgnorePattern": "^_$"
				}
			]
		}
	},
	{ files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
	{ files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.node } },
	{
		files: ["tests/**/*.test.vitest.mjs"],
		languageOptions: {
			globals: {
				beforeAll: true,
				afterAll: true,
				describe: true,
				it: true,
				expect: true,
				test: true
			}
		}
	},
	{ files: ["**/*.json"], plugins: { json }, language: "json/json", extends: ["json/recommended"] },
	{ files: ["**/*.jsonc"], plugins: { json }, language: "json/jsonc", extends: ["json/recommended"] },
	{ files: ["**/*.json5"], plugins: { json }, language: "json/json5", extends: ["json/recommended"] },
	{ files: ["**/*.md"], plugins: { markdown }, language: "markdown/gfm", extends: ["markdown/recommended"] },
	{ files: ["**/*.css"], plugins: { css }, language: "css/css", extends: ["css/recommended"] }
]);
