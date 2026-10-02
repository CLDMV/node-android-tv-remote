/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /scripts/wake-tv.mjs
 *	@Date: 2025-10-15T20:44:49-07:00 (1760586289)
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
 * Wake up Android TV/Fire TV script
 * Usage: node wake-tv.mjs <ip_address>
 */

import createRemote from "../src/lib/android-tv-remote.mjs";

// Get IP address from command line arguments
const ip = process.argv[2];

if (!ip) {
	console.error("❌ Usage: node wake-tv.mjs <ip_address>");
	console.error("   Example: node wake-tv.mjs 10.6.0.133");
	process.exit(1);
}

console.log(`🔌 Waking up TV at ${ip}...`);

try {
	const remote = await createRemote({
		ip: ip,
		autoConnect: true,
		quiet: false
	});

	console.log("✅ Connected to device");

	// Wake up the device
	await remote.ensureAwake();
	console.log("🎉 TV should now be awake and ready!");

	// Disconnect
	await remote.disconnect();
	console.log("✅ Disconnected from device");
} catch (error) {
	console.error("❌ Failed to wake up TV:", error.message);
	process.exit(1);
}
