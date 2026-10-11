/**
 *
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /tests/droidsock-socket.test.vitest.mjs
 *	@Date: 2026-11-07T09:39:25-08:00 (1794073165)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-07T09:43:32-08:00 (1794073412)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * The remote against the real @cldmv/droidsock over a real TCP socket. The other
 * test files mock droidsock, so they can't see a break in how it drives sockets.
 * A small fake ADB device on localhost answers the handshake and shell commands.
 */

import { describe, test, expect, beforeAll, afterAll, afterEach } from "vitest";
import net from "node:net";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const A_CNXN = 0x4e584e43;
const A_AUTH = 0x48545541;
const A_OPEN = 0x4e45504f;
const A_OKAY = 0x59414b4f;
const A_CLSE = 0x45534c43;
const A_WRTE = 0x45545257;

/**
 * Frames an ADB packet.
 * @param {number} command - Message command.
 * @param {number} arg0 - First argument.
 * @param {number} arg1 - Second argument.
 * @param {Buffer} [data] - Payload.
 * @returns {Buffer} The packet.
 */
function packet(command, arg0, arg1, data = Buffer.alloc(0)) {
	const header = Buffer.alloc(24);
	header.writeUInt32LE(command, 0);
	header.writeUInt32LE(arg0, 4);
	header.writeUInt32LE(arg1, 8);
	header.writeUInt32LE(data.length, 12);
	let checksum = 0;
	for (const byte of data) checksum += byte;
	header.writeUInt32LE(checksum >>> 0, 16);
	header.writeUInt32LE((command ^ 0xffffffff) >>> 0, 20);
	return Buffer.concat([header, data]);
}

/** Shell commands the fake device has run. */
let commands = [];
let server;
let port;
const sockets = new Set();
const scratch = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "tmp", "tests-droidsock-socket");
const savedHome = { HOME: process.env.HOME, USERPROFILE: process.env.USERPROFILE };

beforeAll(async () => {
	// droidsock keeps its RSA key in ~/.adb, which a test must not touch.
	mkdirSync(scratch, { recursive: true });
	const home = mkdtempSync(path.join(scratch, "home-"));
	process.env.HOME = home;
	process.env.USERPROFILE = home;

	server = net.createServer((socket) => {
		sockets.add(socket);
		socket.on("close", () => sockets.delete(socket));
		socket.on("error", () => {});
		let buffer = Buffer.alloc(0);
		let authorized = false;
		socket.on("data", (chunk) => {
			buffer = Buffer.concat([buffer, chunk]);
			while (buffer.length >= 24) {
				const length = buffer.readUInt32LE(12);
				if (buffer.length < 24 + length) break;
				const command = buffer.readUInt32LE(0);
				const localId = buffer.readUInt32LE(4);
				const data = buffer.subarray(24, 24 + length);
				buffer = buffer.subarray(24 + length);
				if (command === A_CNXN) {
					socket.write(packet(A_AUTH, 1, 0, Buffer.alloc(20, 1)));
				} else if (command === A_AUTH && !authorized) {
					authorized = true;
					socket.write(packet(A_CNXN, 0x01000001, 256 * 1024, Buffer.from("device::")));
				} else if (command === A_OPEN) {
					const service = data.toString().replace(/\0$/, "");
					commands.push(service.replace(/^shell:/, ""));
					socket.write(packet(A_OKAY, 1, localId));
					socket.write(packet(A_WRTE, 1, localId, Buffer.from(service.includes("sys.boot_completed") ? "1\n" : "ok\n")));
					socket.write(packet(A_CLSE, 1, localId));
				}
			}
		});
	});
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	port = server.address().port;
});

afterEach(() => {
	commands = [];
});

afterAll(async () => {
	for (const socket of sockets) socket.destroy();
	await new Promise((resolve) => server.close(resolve));
	process.env.HOME = savedHome.HOME;
	if (savedHome.USERPROFILE === undefined) delete process.env.USERPROFILE;
	else process.env.USERPROFILE = savedHome.USERPROFILE;
	rmSync(scratch, { recursive: true, force: true });
});

const { default: createRemote } = await import("../src/lib/android-tv-remote.mjs");

describe("a real socket through droidsock", () => {
	test("connects, runs shell commands, disconnects and reconnects", async () => {
		const remote = await createRemote({ ip: "127.0.0.1", port, autoConnect: false, maintainConnection: false });
		const errors = [];
		remote.on("error", (e) => errors.push(e));

		await remote.connect();
		expect(errors).toEqual([]);
		expect(remote.isConnected).toBe(true);
		expect(await remote.getConnectionStatus(true)).toBe("connected");

		await remote.inputKeycode(26);
		await expect(remote.waitBootComplete(2000)).resolves.toBe(true);
		expect(commands).toEqual(["input keyevent 26", "getprop sys.boot_completed"]);

		await remote.disconnect();
		expect(remote.isConnected).toBe(false);

		await remote.connect();
		expect(errors).toEqual([]);
		expect(await remote.getConnectionStatus(true)).toBe("connected");
		await remote.inputKeycode(3);
		expect(commands).toContain("input keyevent 3");
		await remote.disconnect();
	});

	test("a reconnect in place doesn't wire the lifecycle events twice", async () => {
		const remote = await createRemote({ ip: "127.0.0.1", port, autoConnect: false, maintainConnection: false, quiet: false });
		const logs = [];
		remote.on("log", (e) => logs.push(e));

		await remote.connect();
		await remote.disconnect();
		await remote.connect();
		for (const socket of sockets) socket.destroy();
		await expect.poll(() => logs.filter((l) => l.message.includes("dropped")).length).toBeGreaterThan(0);

		expect(logs.filter((l) => l.message.includes("dropped"))).toHaveLength(1);
	});
});
