/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/api-structure-explorer.mjs
 *	@Date: 2025-10-16 06:59:16 -07:00 (1760623156)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 07:17:58 -07:00 (1760624278)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * API Structure Explorer
 * Outputs the complete structure of the remote object to verify all API paths
 */

import createRemote from "../src/lib/android-tv-remote.mjs";

/**
 * Recursively explores an object structure to a specified depth
 * @param {*} obj - Object to explore
 * @param {number} maxDepth - Maximum depth to explore
 * @param {number} currentDepth - Current depth level
 * @param {string} path - Current path string
 * @param {Set} visited - Set of visited objects to prevent circular references
 * @returns {Array} Array of path strings
 */
function exploreStructure(obj, maxDepth = 5, currentDepth = 0, path = "", visited = new Set()) {
	const results = [];

	// Prevent infinite recursion and circular references
	if (currentDepth >= maxDepth || obj === null || obj === undefined) return results;
	if (typeof obj === "object" && visited.has(obj)) return results;

	// Add current object to visited set
	if (typeof obj === "object") visited.add(obj);

	// Get the type of the current object
	const objType = typeof obj;
	const isFunction = objType === "function";
	const isObject = objType === "object" && obj !== null;
	const isArray = Array.isArray(obj);

	// Add current path with type information
	if (path) {
		let typeInfo = objType;
		if (isFunction) {
			// Try to determine if it's an async function
			const funcStr = obj.toString();
			if (funcStr.includes("async ") || funcStr.includes("Promise")) {
				typeInfo = "async function";
			} else {
				typeInfo = "function";
			}
		} else if (isArray) {
			typeInfo = `array[${obj.length}]`;
		} else if (isObject) {
			typeInfo = "object";
		}

		results.push(`${path} (${typeInfo})`);
	}

	// Only explore further if it's an object or function
	if (isObject || isFunction) {
		try {
			// Get all property names including non-enumerable ones
			const props = new Set([...Object.getOwnPropertyNames(obj), ...Object.getOwnPropertySymbols(obj).map((s) => s.toString())]);

			// Filter out common internal properties to reduce noise
			const skipProps = new Set([
				"constructor",
				"prototype",
				"__proto__",
				"length",
				"name",
				"caller",
				"arguments",
				"toString",
				"valueOf",
				"hasOwnProperty",
				"isPrototypeOf",
				"propertyIsEnumerable",
				"toLocaleString",
				Symbol.toStringTag,
				Symbol.iterator
			]);

			// Sort properties for consistent output
			const sortedProps = Array.from(props)
				.filter((prop) => !skipProps.has(prop))
				.sort();

			for (const prop of sortedProps) {
				try {
					const value = obj[prop];
					const newPath = path ? `${path}.${prop}` : prop;

					// Recursively explore this property
					const subResults = exploreStructure(value, maxDepth, currentDepth + 1, newPath, visited);
					results.push(...subResults);
				} catch (error) {
					// Some properties might not be accessible
					const newPath = path ? `${path}.${prop}` : prop;
					results.push(`${newPath} (inaccessible: ${error.message})`);
				}
			}
		} catch (error) {
			results.push(`${path} (exploration error: ${error.message})`);
		}
	}

	return results;
}

/**
 * Main function to explore the remote API structure
 */
async function exploreRemoteAPI() {
	console.log("🔍 Android TV Remote API Structure Explorer");
	console.log("=".repeat(50));

	try {
		// Create remote instance (don't connect to avoid needing a real device)
		console.log("📱 Creating remote instance...");
		const remote = await createRemote({
			ip: "192.168.1.100",
			autoConnect: false // Don't auto-connect
		});

		console.log("✅ Remote created successfully\n");

		// Explore the structure
		console.log("🔍 Exploring API structure (depth: 5)...\n");
		const structure = exploreStructure(remote, 5, 0, "remote");

		// Group results by category for better readability
		const categories = {
			properties: [],
			methods: [],
			objects: [],
			other: []
		};

		structure.forEach((item) => {
			if (item.includes("(function)") || item.includes("(async function)")) {
				categories.methods.push(item);
			} else if (item.includes("(object)")) {
				categories.objects.push(item);
			} else if (item.includes("(boolean)") || item.includes("(string)") || item.includes("(number)")) {
				categories.properties.push(item);
			} else {
				categories.other.push(item);
			}
		});

		// Output results by category
		console.log("📋 PROPERTIES:");
		console.log("-".repeat(30));
		categories.properties.forEach((item) => console.log(`  ${item}`));

		console.log("\n🔧 METHODS:");
		console.log("-".repeat(30));
		categories.methods.forEach((item) => console.log(`  ${item}`));

		console.log("\n📦 OBJECTS:");
		console.log("-".repeat(30));
		categories.objects.forEach((item) => console.log(`  ${item}`));

		if (categories.other.length > 0) {
			console.log("\n❓ OTHER:");
			console.log("-".repeat(30));
			categories.other.forEach((item) => console.log(`  ${item}`));
		}

		// Summary statistics
		console.log("\n📊 SUMMARY:");
		console.log("-".repeat(30));
		console.log(`  Total API paths: ${structure.length}`);
		console.log(`  Properties: ${categories.properties.length}`);
		console.log(`  Methods: ${categories.methods.length}`);
		console.log(`  Objects: ${categories.objects.length}`);
		console.log(`  Other: ${categories.other.length}`);

		// Highlight key API paths
		console.log("\n⭐ KEY API PATHS:");
		console.log("-".repeat(30));
		const keyPaths = structure.filter(
			(item) =>
				item.includes("remote.press.") ||
				item.includes("remote.keyboard.") ||
				item.includes("remote.screencap") ||
				item.includes("remote.thumbnail") ||
				item.includes("remote.reboot") ||
				item.includes("remote.ensureAwake") ||
				item.includes("remote.setSettings") ||
				item.includes("remote.lastScreencapData")
		);

		keyPaths.forEach((item) => console.log(`  ${item}`));
	} catch (error) {
		console.error("❌ Error exploring API structure:", error.message);
		console.error(error.stack);
	}
}

// Run the explorer
exploreRemoteAPI();
