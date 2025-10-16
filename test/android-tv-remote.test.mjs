/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/android-tv-remote.test.mjs
 *	@Date: 2025-10-15 10:19:05 -07:00 (1760548745)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-15 10:57:20 -07:00 (1760551040)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

import Remote from "../src/lib/android-tv-remote.mjs";

// Usage: Set ANDROID_TV_IP and ANDROID_TV_PORT env vars before running Jest
const TEST_IP = process.env.ANDROID_TV_IP || "192.168.1.100";
const TEST_PORT = process.env.ANDROID_TV_PORT ? parseInt(process.env.ANDROID_TV_PORT, 10) : 5555;

/** @type {import('../src/lib/android-tv-remote').RemoteConfig} */
const config = {
	ip: TEST_IP,
	port: TEST_PORT,
	quiet: true,
	autoConnect: true,
	autoDisconnect: true,
	disconnectTimeout: 5
};

const remote = Remote(config);

describe("android-tv-remote", () => {
	jest.setTimeout(20000); // ADB/network can be slow

	test("should connect and disconnect without error (promise)", async () => {
		await remote.connect();
		await remote.disconnect();
	});

	test("should connect and disconnect without error (callback)", (done) => {
		remote.connect((err) => {
			expect(err).toBeFalsy();
			remote.disconnect((err2) => {
				expect(err2).toBeFalsy();
				done();
			});
		});
	});

	test("should send a keycode (HOME)", async () => {
		await remote.connect();
		await remote.inputKeycode(3); // 3 = KEYCODE_HOME
		await remote.disconnect();
	});

	test("should send text input", async () => {
		await remote.connect();
		await remote.keyboard.text("test");
		await remote.disconnect();
	});

	test("should call press.home()", async () => {
		await remote.connect();
		await remote.press.home();
		await remote.disconnect();
	});

	test("should call keyboard.key.a()", async () => {
		await remote.connect();
		await remote.keyboard.key.a();
		await remote.disconnect();
	});

	test("should call keyboard.key.shift.a()", async () => {
		await remote.connect();
		await remote.keyboard.key.shift.a();
		await remote.disconnect();
	});

	test("should handle settings get", async () => {
		await remote.setSettings("get");
	});

	test("should handle settings set", async () => {
		await remote.setSettings("set");
	});
});
