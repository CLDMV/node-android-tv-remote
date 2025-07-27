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
const createRemote = require("../android-tv-remote");

class AndroidTVSetup {
	/**
	 * @param {Object} options
	 * @param {string} options.ip - The IP address of the ADB device.
	 * @param {number} [options.port=5555] - The port number for the ADB connection.
	 * @param {boolean} [options.quiet=true] - Suppress log output except for results.
	 */
	constructor({ ip, port = 5555, quiet = true }) {
		this.ip = ip;
		this.port = port;
		this.quiet = quiet;
		this.remote = createRemote({ ip, port, quiet });
		this.host = `${ip}:${port}`;
	}

	logWithTime(...args) {
		if (!this.quiet) {
			const now = new Date().toISOString();
			console.log(`[${now}]`, ...args);
		}
	}
	warnWithTime(...args) {
		if (!this.quiet) {
			const now = new Date().toISOString();
			console.warn(`[${now}]`, ...args);
		}
	}
	errorWithTime(...args) {
		const now = new Date().toISOString();
		console.error(`[${now}]`, ...args);
	}

	async connect() {
		await this.remote.connect();
		this.logWithTime(`Connected to ${this.host}`);
	}

	async disconnect() {
		try {
			await this.remote.disconnect();
			this.logWithTime("Disconnected cleanly");
		} catch (err) {
			if (err.message && err.message.includes("disconnected")) {
				this.warnWithTime("Warning: Device already disconnected before explicit disconnect call.");
			} else {
				this.errorWithTime("Error:", err.message || err);
				if (err.message && err.message.includes("device unauthorized")) {
					this.errorWithTime(
						"Your device is unauthorized. Please check your TV and accept the authorization dialog to allow this computer to connect via ADB."
					);
				}
				process.exit(1);
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
			this.logWithTime(`Ran: ${cmd}`);
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
			// fallback: use adbkit directly if needed
			const adb = require("adbkit");
			const client = adb.createClient();
			await client.shell(this.host, cmd).then(adb.util.readAll);
		} else if (this.remote && this.remote.client) {
			await this.remote.client.shell(this.host, cmd).then(require("adbkit").util.readAll);
		}
	}

	/**
	 * Ensures the device is awake and on the home screen.
	 */
	async ensureAwake() {
		// Use the remote's ADB client for dumpsys power
		const adb = require("adbkit");
		const client = adb.createClient();
		const output = await client
			.shell(this.host, "dumpsys power")
			.then(adb.util.readAll)
			.then((b) => b.toString());
		const parsed = this.parsePowerState(output);
		this.logWithTime("\n--- Power State ---");
		this.logWithTime(`mIsPowered: ${parsed.mIsPowered}`);
		this.logWithTime(`mWakefulness: ${parsed.mWakefulness}`);
		this.logWithTime(`mDisplayReady: ${parsed.mDisplayReady}`);
		this.logWithTime("-------------------\n");
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

module.exports = AndroidTVSetup;
