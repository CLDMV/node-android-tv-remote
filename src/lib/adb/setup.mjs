/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /src/lib/adb/setup.mjs
 *	@Date: 2025-10-15 10:19:05 -07:00 (1760548745)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-15 10:34:44 -07:00 (1760549684)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * AndroidTVSetup class for configuring and managing Android TV devices via ADB.
 *
 * Usage:
 *   const setup = new AndroidTVSetup({ ip, port, quiet });
 *   await setup.connect();
 *   await setup.setSettings();
 *   await setup.ensureAwake();
 *   await setup.disconnect();
 */
import createRemote from "../android-tv-remote.mjs";
import adbkit from "@devicefarmer/adbkit";
import { EventEmitter } from "events";
const Adb = adbkit.Adb;

class AndroidTVSetup extends EventEmitter {
	/**
	 * Create an AndroidTVSetup instance.
	 * @param {Object} options - Configuration options.
	 * @param {string} options.ip - Device IP address.
	 * @param {number} [options.port=5555] - Device port.
	 * @param {boolean} [options.quiet=false] - Suppress log output.
	 */
	constructor(options = {}) {
		super();
		this.ip = ip;
		this.port = port;
		this.quiet = quiet;
		this.remote = createRemote({ ip, port, quiet });
		this.host = `${ip}:${port}`;
	}

	/**
	 * Emit a log event with structured data.
	 * @private
	 * @param {string} level - Log level (info, warn, error, debug).
	 * @param {string} message - Log message.
	 * @param {string} [source] - Source of the log message.
	 * @param {any} [data] - Additional data to include.
	 */
	emitLog(level, message, source = "android-tv-setup", data = null) {
		if (!this.quiet || level === "error") {
			this.emit("log", {
				level,
				message,
				source,
				timestamp: new Date().toISOString(),
				...(data && { data })
			});
		}
	}
	
	/**
	 * Emit an error event with structured data.
	 * @private
	 * @param {Error} error - The error object.
	 * @param {string} [source] - Source of the error.
	 * @param {string} [message] - Additional error message.
	 */
	emitError(error, source = "android-tv-setup", message = null) {
		this.emit("error", {
			error,
			source,
			message: message || error.message,
			timestamp: new Date().toISOString()
		});
	}

	async connect() {
		await this.remote.connect();
		this.emitLog("info", `Connected to ${this.host}`, "connect");
	}

	async disconnect() {
		try {
			await this.remote.disconnect();
			this.emitLog("info", "Disconnected cleanly", "disconnect");
		} catch (err) {
			if (err.message && err.message.includes("disconnected")) {
				this.emitLog("warn", "Device already disconnected before explicit disconnect call", "disconnect");
			} else {
				this.emitError(err, "disconnect");
				if (err.message && err.message.includes("device unauthorized")) {
					this.emitLog("error", "Your device is unauthorized. Please check your TV and accept the authorization dialog to allow this computer to connect via ADB.", "disconnect");
				}
				// Don't exit the process, just emit the error
				throw err;
			}
		}
	}

	/**
	 * Set all recommended settings for always-on display and max brightness.
	 */
	async setSettings() {
		// Use the remote's handleSettings for all settings
		await this.remote.handleSettings("set", this.quiet);
		// svc power stayon true and brightness are not in handleSettings, so do them here
		await this.remote.connect();
		const cmds = ["settings put system screen_brightness_mode 0", "settings put system screen_brightness 255", "svc power stayon true"];
		for (const cmd of cmds) {
			(await this.remote.inputKeycode) ? Promise.resolve() : Promise.resolve(); // placeholder for future
			await this.remotePressShell(cmd);
			this.emitLog("info", `Ran: ${cmd}`, "setSettings");
		}
		await this.remote.disconnect();
	}

	/**
	 * Helper to run a shell command using the remote's ADB client.
	 * @param {string} cmd
	 * @returns {Promise<void>}
	 */
	async remotePressShell(cmd) {
		// Use the internal client for shell commands
		if (this.remote && this.remote.inputKeycode) {
			// fallback: use @devicefarmer/adbkit directly if needed
			const client = Adb.createClient();
			const device = client.getDevice(this.host);
			await device.shell(cmd).then(Adb.util.readAll);
		} else if (this.remote && this.remote.client) {
			const device = this.remote.client.getDevice(this.host);
			await device.shell(cmd).then(Adb.util.readAll);
		}
	}

	/**
	 * Ensures the device is awake and on the home screen.
	 */
	async ensureAwake() {
		// Use the remote's ADB client for dumpsys power
		const client = Adb.createClient();
		const device = client.getDevice(this.host);
		const output = await device
			.shell("dumpsys power")
			.then(Adb.util.readAll)
			.then((b) => b.toString());
		const parsed = this.parsePowerState(output);
		this.emitLog("info", "\n--- Power State ---", "ensureAwake");
		this.emitLog("info", `mIsPowered: ${parsed.mIsPowered}`, "ensureAwake");
		this.emitLog("info", `mWakefulness: ${parsed.mWakefulness}`, "ensureAwake");
		this.emitLog("info", `mDisplayReady: ${parsed.mDisplayReady}`, "ensureAwake");
		this.emitLog("info", "-------------------\n", "ensureAwake");
		// Use remote.inputKeycode for keyevents
		if (parsed.mIsPowered !== "true") await this.remote.inputKeycode(26);
		if (parsed.mWakefulness !== "Awake") await this.remote.inputKeycode(224);
		if (parsed.mDisplayReady !== "true") await this.remote.inputKeycode(26);
		await this.remote.inputKeycode(3); // HOME
	}

	/**
	 * Parses the output of 'dumpsys power' to extract power, wake, and display state.
	 * @param {string} output - The full output string from 'dumpsys power'.
	 * @returns {{ mIsPowered: string, mWakefulness: string, mDisplayReady: string }}
	 */
	parsePowerState(output) {
		const mIsPoweredMatch = output.match(/^\s*mIsPowered=([a-zA-Z0-9]+)/m);
		const mWakefulnessMatch = output.match(/^\s*mWakefulness=([a-zA-Z0-9]+)/m);
		const mDisplayReadyMatch = output.match(/^\s*mDisplayReady=([a-zA-Z0-9]+)/m);
		return {
			mIsPowered: mIsPoweredMatch ? mIsPoweredMatch[1] : "unknown",
			mWakefulness: mWakefulnessMatch ? mWakefulnessMatch[1] : "unknown",
			mDisplayReady: mDisplayReadyMatch ? mDisplayReadyMatch[1] : "unknown"
		};
	}
}

export default AndroidTVSetup;
