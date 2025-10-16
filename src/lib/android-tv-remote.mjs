/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /src/lib/android-tv-remote.mjs
 *	@Date: 2025-10-15 10:19:05 -07:00 (1760548745)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-15 21:09:09 -07:00 (1760587749)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */

/**
 * Android TV Remote module - Event-driven ADB remote control for Android TV devices.
 * 
 * @module android-tv-remote
 * 
 * @description
 * This module provides an event-driven interface for controlling Android TV devices via ADB.
 * All operations emit events instead of console logging, allowing for better integration
 * and programmatic handling of device communication.
 * 
 * @example
 * // ESM usage with event handling
 * import createRemote from "@cldmv/node-android-tv-remote";
 * 
 * const remote = createRemote({ ip: "192.168.1.100" });
 * 
 * // Listen for log events
 * remote.on('log', (data) => {
 *   console.log(`[${data.level}] ${data.message}`, data.source);
 * });
 * 
 * // Listen for errors
 * remote.on('error', (data) => {
 *   console.error(`Error from ${data.source}:`, data.error.message);
 * });
 * 
 * // Use the remote
 * await remote.press.home();
 * 
 * @example
 * // Static create method
 * import { createAndroidTVRemote } from "@cldmv/node-android-tv-remote";
 * 
 * const remote = await createAndroidTVRemote({ ip: "192.168.1.100" });
 * remote.on('log', console.log);
 * await remote.press.play();
 */

/**
 * Configuration object for Android TV Remote.
 * @typedef {Object} RemoteConfig
 * @property {string} ip - The IP address of the device.
 * @property {number} [port=5555] - The port for ADB connection.
 * @property {string} [inputDevice="/dev/input/event0"] - The input device path.
 * @property {boolean} [autoConnect=true] - Whether to auto-connect on command.
 * @property {boolean} [autoDisconnect=false] - Whether to auto-disconnect after inactivity.
 * @property {number} [disconnectTimeout=10] - Inactivity timeout in seconds before disconnecting.
 * @property {boolean} [maintainConnection=true] - Whether to maintain the ADB connection with a heartbeat.
 * @property {number} [heartbeatInterval=30000] - Heartbeat interval in ms (default 30s).
 * @property {number} [connectionCheckInterval=30000] - Interval in ms for periodic connection checks (default 30s).
 * @property {number} [connectTimeout=10000] - Timeout in ms for ADB connection attempts (default 10s).
 * @property {boolean} [quiet=true] - Suppress log events if true (errors are always emitted).
 */

/**
 * Log event data structure.
 * @typedef {Object} LogEventData
 * @property {string} level - Log level: 'info', 'warn', 'error', 'debug'.
 * @property {string} message - Log message.
 * @property {string} source - Source of the log message (e.g., 'connect', 'disconnect', 'setSettings').
 * @property {string} timestamp - ISO timestamp of when the log was created.
 * @property {any} [data] - Optional additional data related to the log.
 */

/**
 * Error event data structure.
 * @typedef {Object} ErrorEventData
 * @property {Error} error - The error object that was thrown.
 * @property {string} source - Source of the error (e.g., 'connect', 'disconnect', 'adb').
 * @property {string} message - Human-readable error message.
 * @property {string} timestamp - ISO timestamp of when the error occurred.
 */

/**
 * Android TV Remote instance with event emission capabilities.
 * @typedef {Object} Remote
 * @property {function(string=): Promise<void>} setSettings - Configure or retrieve Android TV settings for optimal remote operation.
 * @property {function(function(Error=, any=)=): Promise<void>|undefined} connect - Connect to the device. Supports both promise and callback styles.
 * @property {function(function(Error=, any=)=): Promise<void>|undefined} disconnect - Disconnect from the device. Supports both promise and callback styles.
 * @property {function(number, function(Error=, any=)=): Promise<void>|undefined} inputKeycode - Send a keycode to the device. Supports both promise and callback styles.
 * @property {function(): Promise<boolean>} reboot - Reboots the device using ADB's native reboot method.
 * @property {function(Object=): Promise<ReadableStream|void>} screencap - Takes a screenshot with optional resizing and file saving.
 * @property {function(number=): Promise<boolean>} waitBootComplete - Waits until device has finished booting (default 60s timeout).
 * @property {function(boolean=): Promise<"connected"|"disconnected"|"unknown">} getConnectionStatus - Returns the current connection status; optionally performs a live check.
 * @property {boolean} isConnected - True if the module believes it is connected (internal state, not a live check).
 * @property {Object} press - Remote control key functions for Android TV remotes.
 * @property {Object} keyboard - Keyboard interface for all keys, with text and keycode fallback.
 * @property {Object} keyboard.key - Contains all key functions.
 * @property {Object} keyboard.key.shift - Contains all shifted key functions.
 * 
 * @property {function(string, Function): Remote} on - Add event listener. Returns remote instance for chaining.
 * @property {function(string, Function): Remote} off - Remove event listener. Returns remote instance for chaining.
 * @property {function(string, Function): Remote} once - Add one-time event listener. Returns remote instance for chaining.
 * @property {function(string, ...any): boolean} emit - Emit an event. Returns true if event had listeners.
 * 
 * @fires Remote#log - Emitted for informational messages, warnings, and debug info.
 * @fires Remote#error - Emitted when errors occur during ADB operations.
 * @fires Remote#screencap-start - Emitted when screenshot capture begins.
 * @fires Remote#screencap-captured - Emitted when raw screenshot is captured.
 * @fires Remote#screencap-processing - Emitted when image processing begins.
 * @fires Remote#screencap-ready - Emitted when final processed stream is ready.
 * @fires Remote#screencap-saved - Emitted when screenshot is saved to file.
 * @fires Remote#screencap-complete - Emitted when entire screenshot operation is complete.
 * 
 * @example
 * // Event handling examples
 * remote.on('log', (data) => {
 *   if (data.level === 'error') {
 *     console.error(`ERROR [${data.source}]: ${data.message}`);
 *   } else if (data.level === 'warn') {
 *     console.warn(`WARN [${data.source}]: ${data.message}`);
 *   } else {
 *     console.log(`INFO [${data.source}]: ${data.message}`);
 *   }
 * });
 * 
 * remote.on('error', (data) => {
 *   console.error(`FATAL ERROR from ${data.source}:`);
 *   console.error(data.error.stack || data.error.message);
 *   
 *   // Handle specific error types
 *   if (data.error.message.includes('device unauthorized')) {
 *     console.log('Please authorize ADB on your Android TV device');
 *   }
 * });
 */

import adbkit from "@devicefarmer/adbkit";
import { EventEmitter } from "events";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import sharp from "sharp";
const Adb = adbkit.Adb;

/**
 * Wraps an async function to support both promise and callback styles.
 * @internal
 * @param {Function} fn - The async function to wrap.
 * @returns {Function} A function supporting both promise and callback usage.
 */
function wrapAsync(fn) {
	return function (...args) {
		const cb = typeof args[args.length - 1] === "function" ? args.pop() : null;
		const p = fn.apply(this, args);
		if (cb) {
			p.then((result) => cb(null, result)).catch((err) => cb(err));
		} else {
			return p;
		}
	};
}

// Create event emitter for this instance
const emitter = new EventEmitter();

/**
 * Emit a log event with structured data.
 * @private
 * @param {string} level - Log level (info, warn, error, debug).
 * @param {string} message - Log message.
 * @param {string} [source] - Source of the log message.
 * @param {any} [data] - Additional data to include.
 */
function emitLog(level, message, source = "android-tv-remote", data = null) {
	emitter.emit("log", {
		level,
		message,
		source,
		timestamp: new Date().toISOString(),
		...(data && { data })
	});
}
	
/**
 * Emit an error event with structured data.
 * @private
 * @param {Error} error - The error object.
 * @param {string} [source] - Source of the error.
 * @param {string} [message] - Additional error message.
 */
function emitError(error, source = "android-tv-remote", message = null) {
	// Filter out libspng/PNG processing errors that occur after disconnection
	// These are common when background operations try to process data after disconnect
	const errorMsg = error.message || "";
	if (errorMsg.includes('libspng') || 
		errorMsg.includes('pngload_buffer') || 
		errorMsg.includes('read error')) {
		// Log as debug instead of error to avoid noise
		emitLog("debug", `PNG processing error (likely post-disconnect): ${errorMsg}`, source);
		return;
	}
	
	emitter.emit("error", {
		error,
		source,
		message: message || error.message,
		timestamp: new Date().toISOString()
	});
}
	
/**
 * Handles disconnect and connection errors, emits helpful messages.
 * Also provides onboarding steps for common authentication and connection issues.
 * @private
 * @param {Error} err - The error object.
 * @example
 * try {
 *   // ...code that may throw
 * } catch (err) {
 *   handleDisconnectError(err);
 * }
 */

function handleDisconnectError(err) {
	emitError(err, "handleDisconnectError");

	if (err.message && (err.message.includes("device unauthorized") || err.message.includes("failed to authenticate"))) {
		emitError(err, "handleDisconnectError", "Device unauthorized - authentication required");
		emitLog("error", "Your device is unauthorized or failed to authenticate. Please check your TV and accept the authorization dialog to allow this system to connect via ADB.", "handleDisconnectError");
		emitLog("info", "If you do not see a prompt, try disconnecting and reconnecting the device, or reboot your TV.", "handleDisconnectError");
		emitLog("info", "If the problem persists, remove the device from the list of authorized ADB devices in Developer Options and try again.", "handleDisconnectError");
		emitLog("info", "Tip: In Developer Options on your TV, try toggling 'ADB Debugging' off and then back on. This often resolves authentication issues.", "handleDisconnectError");
	}
		
	if (err.message && (err.message.includes("actively refused") || err.message.includes("No connection could be made"))) {
		emitError(err, "handleDisconnectError", "Connection refused - ADB not enabled");
		emitLog("error", "The device refused the connection. To enable ADB, follow these steps on your Android TV or Fire TV:", "handleDisconnectError");
		emitLog("info", "1. Open Settings > Device Preferences > About (or My Fire TV > About)", "handleDisconnectError");
		emitLog("info", "2. Scroll to 'Build' and press OK 7 times to enable Developer Options", "handleDisconnectError");
		emitLog("info", "3. Go back to Settings > Device Preferences > Developer Options", "handleDisconnectError");
		emitLog("info", "4. Enable 'Developer Options' if needed, then enable 'ADB Debugging' and 'Apps from Unknown Sources'", "handleDisconnectError");
		emitLog("info", "5. Ensure your TV and computer are on the same network", "handleDisconnectError");
		emitLog("info", "6. On your computer, run: adb connect <device-ip>:5555", "handleDisconnectError");
		emitLog("info", "7. Accept the authorization prompt on your TV", "handleDisconnectError");
		emitLog("info", "If you do not see 'Developer Options', repeat step 2 until it appears.", "handleDisconnectError");
	}
	
	return err;
}

/**
 * Android keycodes mapping loaded from JSON file.
 * @internal
 * @type {Object.<string, number>}
 * @see https://developer.android.com/reference/android/view/KeyEvent
 */
import keycodes from "../data/keycodes.json" with { type: "json" };
import keyboardKeys from "../data/keyboard-keys.json" with { type: "json" };

/**
 * Gets the shifted character for a given key.
 * @private
 * @param {string} keyName - The key name
 * @param {string} char - The original character
 * @returns {string} The shifted character
 */
function getShiftedCharacter(keyName, char) {
	// Handle letters - convert to uppercase
	if (/^[a-z]$/.test(char)) {
		return char.toUpperCase();
	}
	
	// Handle shifted symbols
	const shiftMap = {
		'1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
		'6': '^', '7': '&', '8': '*', '9': '(', '0': ')',
		'-': '_', '=': '+', '[': '{', ']': '}', '\\': '|',
		';': ':', "'": '"', ',': '<', '.': '>', '/': '?',
		'`': '~'
	};
	
	return shiftMap[char] || char;
}

/**
 * Remote keys mapping loaded from JSON file.
 * @internal
 * @type {string[]}
 */
import remoteKeys from "../data/remote-keys.json" with { type: "json" };

/**
 * Factory function to create a ready-to-use Remote instance.
 * @function
 * @public
 * @param {RemoteConfig} config - Configuration for the remote.
 * @returns {Promise<Remote>} A promise that resolves to a ready-to-use remote instance
 */
export default async function createRemote(config) {
	// Ensure config is an object and has the required 'ip' property
	if (!config || typeof config !== "object" || !config.ip) {
		throw new Error("Missing required 'ip' property in RemoteConfig.");
	}
	const ip = config.ip;
	const port = config.port || 5555;
	const inputDevice = config.inputDevice || "/dev/input/event0";
	const host = ip + ":" + port;
	const connectTimeout = typeof config.connectTimeout === "number" ? config.connectTimeout : 10000;
	const client = Adb.createClient({
		timeout: connectTimeout
	});
	const device = client.getDevice(host);
	let connected = false;
	let backgroundOperations = new Set();
	
	/**
	 * Local emitError function that has access to connection state
	 * @private
	 * @param {Error} error - The error object
	 * @param {string} [source] - Source of the error
	 * @param {string} [message] - Additional error message
	 */
	function localEmitError(error, source = "android-tv-remote", message = null) {
		// Filter out libspng/PNG processing errors that occur after disconnection
		const errorMsg = error.message || "";
		if (!connected && (errorMsg.includes('libspng') || 
			errorMsg.includes('pngload_buffer') || 
			errorMsg.includes('read error'))) {
			// Log as debug instead of error to avoid noise
			emitLog("debug", `PNG processing error (post-disconnect): ${errorMsg}`, source);
			return;
		}
		
		// Use global emitError for other cases
		emitError(error, source, message);
	}
	
	const autoConnect = config.autoConnect !== false; // default true
	const autoDisconnect = config.autoDisconnect === true; // default false
	const disconnectTimeout = typeof config.disconnectTimeout === "number" ? config.disconnectTimeout : 10;
	const connectionCheckInterval = typeof config.connectionCheckInterval === "number" ? config.connectionCheckInterval : 10000;
	let connectionCheckTimer = null;
	let disconnectTimer = null;
	const quiet = config.quiet !== false; // default true
	const maintainConnection = config.maintainConnection !== false; // default true
	const heartbeatInterval = typeof config.heartbeatInterval === "number" ? config.heartbeatInterval : 20000;
	let heartbeatTimer = null;

	/**
	 * On initialization, check if already connected to the device and set internal state.
	 * This ensures the internal state is correct if the device is already connected.
	 * Expose a promise (initPromise) that resolves or rejects based on the result.
	 */
	const INIT_TIMEOUT_MS = 7000;

	/**
	 * Internal resolve/reject for initPromise, always defined as functions.
	 */
	let initPromiseResolve;
	let initPromiseReject;

	/**
	 * Promise that resolves if initial auto-connect succeeds, or rejects if it fails.
	 * Now includes a timeout to prevent hanging forever if ADB never responds.
	 * @type {Promise<void>}
	 * @example
	 * remote.initPromise.then(() => { ... }).catch((err) => { ... });
	 */
	const realInitPromise = new Promise((resolve, reject) => {
		initPromiseResolve = resolve;
		initPromiseReject = reject;
		if (!autoConnect) {
			// Skip initialization if autoConnect is disabled
			initPromiseResolve(undefined);
			return;
		}
		(async () => {
			try {
				const status = await getConnectionStatus(true);
				if (status === "connected") {
					connected = true;
					if (!quiet) emitLog("info", `Already connected to ${host} (on init)`, "initPromise");
					startHeartbeat();
					initPromiseResolve(undefined);
				} else {
					// Try to connect if not already connected
					await connect();
					if (connected) {
						initPromiseResolve(undefined);
					} else {
						const error = new Error("Failed to connect to device on initialization.");
						emitError(error, "initPromise", "Auto-connect failed during initialization");
						initPromiseReject(error);
					}
				}
			} catch (e) {
				emitError(e instanceof Error ? e : new Error(String(e)), "initPromise", "Exception during initialization");
				initPromiseReject(e);
			}
		})();
	});

	const initPromise = Promise.race([
		realInitPromise,
		new Promise((_, reject) => {
			setTimeout(() => {
				reject(new Error("ADB initPromise timed out"));
			}, INIT_TIMEOUT_MS);
		})
	]);

	/**
	 * Resets the disconnect timer if autoDisconnect is enabled.
	 * Disconnects after inactivity if enabled.
	 * @private
	 */
	function resetDisconnectTimer() {
		if (!autoDisconnect) return;
		if (disconnectTimer) clearTimeout(disconnectTimer);
		disconnectTimer = setTimeout(() => {
			if (connected) disconnect();
		}, disconnectTimeout * 1000);
	}

	/**
	 * Starts the heartbeat timer to maintain the ADB connection.
	 * Periodically sends a shell command to keep the connection alive.
	 * Also starts the periodic connection check for auto-reconnect.
	 * @private
	 */
	function startHeartbeat() {
		if (!maintainConnection) return;
		if (heartbeatTimer) clearInterval(heartbeatTimer);
		heartbeatTimer = setInterval(() => {
			if (!connected) return;
			// Send a no-op shell command to keep the connection alive
			device.shell("echo heartbeat").catch(() => {});
		}, heartbeatInterval);
		startConnectionCheck();
	}

	/**
	 * Starts the periodic connection check. If disconnected, attempts to reconnect.
	 * Ensures persistent, self-healing ADB connection.
	 * @private
	 */
	function startConnectionCheck() {
		if (connectionCheckTimer) clearInterval(connectionCheckTimer);
		connectionCheckTimer = setInterval(async () => {
			if (!connected) return;
			try {
				const devices = await client.listDevices();
				const deviceId = host;
				const found = devices.some((d) => d.id === deviceId);
				if (!found) {
					emitLog("warn", `Device ${deviceId} not found in adb devices list. Attempting reconnect...`, "connectionCheck");
					connected = false;
					await connect();
				}
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err));
				emitLog("warn", `Error checking device connection: ${error.message}`, "connectionCheck");
			}
		}, connectionCheckInterval);
	}

	/**
	 * Stops the heartbeat and connection check timers.
	 * @private
	 */
	function stopHeartbeat() {
		if (heartbeatTimer) {
			clearInterval(heartbeatTimer);
			heartbeatTimer = null;
		}
		if (connectionCheckTimer) {
			clearInterval(connectionCheckTimer);
			connectionCheckTimer = null;
		}
	}

	/**
	 * Ensures connection if autoConnect is enabled.
	 * Used internally before sending commands.
	 * @internal
	 * @returns {Promise<void>}
	 */
	function ensureConnected() {
		if (!autoConnect) return Promise.resolve();
		if (connected) return Promise.resolve();
		return connect();
	}

	/**
	 * Connects to the ADB device if not already connected.
	 * Checks the internal connection state before connecting.
	 * @returns {Promise<void>}
	 * @example
	 * await remote.connect(); // Only connects if not already connected
	 */
	function connect() {
		if (connected) {
			if (!quiet) emitLog("info", `Already connected to ${host}`, "connect");
			return Promise.resolve();
		}
		return client
			.connect(ip, port)
			.then(() => {
				connected = true;
				if (!quiet) emitLog("info", `Connected to ${host}`, "connect");
				startHeartbeat();
			})
			.catch((err) => {
				if (err.message && err.message.includes("already connected")) {
					if (!quiet) emitLog("warn", "Device already connected", "connect");
					connected = true;
					startHeartbeat();
					return true;
				}
				return handleDisconnectError(err);
			});
	}
	const connectWrapped = wrapAsync(connect);

	/**
	 * Disconnects from the ADB device and stops heartbeat/connection check.
	 * Handles already-disconnected state gracefully.
	 * @internal
	 * @returns {Promise<void>}
	 */
	async function disconnect() {
		if (disconnectTimer) {
			clearTimeout(disconnectTimer);
			disconnectTimer = null;
		}
		stopHeartbeat();
		
		// Wait for all background operations to complete before disconnecting
		if (backgroundOperations.size > 0) {
			if (!quiet) emitLog("info", `🔄 [DISCONNECT] Waiting for ${backgroundOperations.size} background operations to complete...`, "disconnect");
			const waitStartTime = performance.now();
			try {
				await Promise.allSettled([...backgroundOperations]);
				const waitEndTime = performance.now();
				if (!quiet) emitLog("info", `✅ [DISCONNECT] All background operations completed in ${(waitEndTime - waitStartTime).toFixed(2)}ms`, "disconnect");
			} catch (error) {
				const waitEndTime = performance.now();
				emitLog("warn", `⚠️ [DISCONNECT] Some background operations failed after ${(waitEndTime - waitStartTime).toFixed(2)}ms: ${error.message}`, "disconnect");
			}
		} else {
			if (!quiet) emitLog("info", `✅ [DISCONNECT] No background operations to wait for`, "disconnect");
		}
		
		try {
			await client.disconnect(ip, port);
			connected = false;
			if (!quiet) emitLog("info", `Disconnected from ${host}`, "disconnect");
			return true;
		} catch (err) {
			if (err.message && err.message.includes("disconnected")) {
				if (!quiet) emitLog("warn", "Device already disconnected before explicit disconnect call", "disconnect");
				connected = false;
				return true;
			}
			return handleDisconnectError(err);
		}
	}
	const disconnectWrapped = wrapAsync(disconnect);

	/**
	 * Sends a keycode to the device, auto-connects/disconnects as needed.
	 * @internal
	 * @param {number} code - The Android keycode to send.
	 * @returns {Promise<any>}
	 */
	function inputKeycode(code) {
		return ensureConnected().then(() => {
			resetDisconnectTimer();
			return device.shell("input keyevent " + code);
		});
	}
	const inputKeycodeWrapped = wrapAsync(inputKeycode);

	/**
	 * Sends a long press keycode to the device, auto-connects/disconnects as needed.
	 * @internal
	 * @param {number} code - The Android keycode to send as a long press.
	 * @returns {Promise<any>}
	 */
	function inputKeycodeLongPress(code) {
		const cmd = "sendevent " + inputDevice + " 1 " + code + " 1 && " + "sleep 1 && " + "sendevent " + inputDevice + " 1 " + code + " 0";
		return ensureConnected().then(() => {
			resetDisconnectTimer();
			return device.shell(cmd);
		});
	}
	const inputKeycodeLongPressWrapped = wrapAsync(inputKeycodeLongPress);

	/**
	 * Sends text input to the device, auto-connects/disconnects as needed.
	 * @internal
	 * @param {string} text - The text to input.
	 * @returns {Promise<any>}
	 */
	function inputText(text) {
		const escaped = text.replace(/ /g, "%s");
		return ensureConnected().then(() => {
			resetDisconnectTimer();
			return device.shell('input text "' + escaped + '"');
		});
	}
	const inputTextWrapped = wrapAsync(inputText);

	/**
	 * Returns the current connection status as tracked by the module.
	 * Optionally performs a live check against adb devices if requested.
	 * Also updates the internal connected state if a live check is performed.
	 * @public
	 * @param {boolean} [liveCheck=false] - If true, checks adb devices for actual connection.
	 * @returns {Promise<"connected"|"disconnected"|"unknown">}
	 * @example
	 * await remote.getConnectionStatus();
	 * await remote.getConnectionStatus(true); // live check
	 */
	async function getConnectionStatus(liveCheck = false) {
		if (!liveCheck) {
			return connected ? "connected" : "disconnected";
		}
		try {
			const devices = await client.listDevices();
			const deviceId = host;
			const found = devices.some((d) => d.id === deviceId);
			connected = found; // Keep internal state in sync with live check
			return found ? "connected" : "disconnected";
		} catch {
			connected = false;
			return "unknown";
		}
	}

	/**
	 * Returns true if the module believes it is connected to the device.
	 * This is a fast check of internal state, not a live ADB query.
	 * @public
	 * @returns {boolean}
	 * @example
	 * if (remote.isConnected) { ... }
	 */
	function isConnected() {
		return !!connected;
	}

	/**
	 * Returns a list of all available keyboard key function names on the live API (keyboard.key).
	 * This inspects the actual keyboard.key object, so it always matches the real API surface, including all aliases and dynamic keys.
	 * @returns {string[]}
	 * @example
	 * remote.getKeyboardKeys();
	 */
	function getKeyboardKeys() {
		// 'this' is not bound, so we must access the constructed keyboard.key object
		// Only return the top-level key names (not .keycode or .shift)
		if (!this || !this.keyboard || !this.keyboard.key) return [];
		return Object.keys(this.keyboard.key).filter((k) => typeof this.keyboard.key[k] === "function");
	}

	/**
	 * Returns a list of all available press command names on the live API (press object), including aliases and dynamic keys.
	 * This inspects the actual press object, so it always matches the real API surface.
	 * @returns {string[]}
	 * @example
	 * remote.getPressCommands();
	 */
	function getPressCommands() {
		if (!this || !this.press) return [];
		return Object.keys(this.press).filter((k) => k !== "long" && typeof this.press[k] === "function");
	}

	/**
	 * Variable to store the last screencap data (PNG buffer) after processing.
	 * Updated every time screencap or thumbnail is called, regardless of options.
	 * @type {Buffer|null}
	 */
	let lastScreencapData = null;

	const remoteApi = {
		/**
		 * Promise that resolves if initial auto-connect succeeds, or rejects if it fails.
		 * @type {Promise<void>}
		 * @example
		 * remote.initPromise.then(() => { ... }).catch((err) => { ... });
		 */
		initPromise,
		
		/**
		 * Add event listener.
		 * @public
		 * @param {string} event - Event name.
		 * @param {Function} listener - Event listener function.
		 * @returns {Object} This remote instance for chaining.
		 * @example
		 * remote.on('log', (data) => console.log(data));
		 * remote.on('error', (data) => console.error(data));
		 */
		on(event, listener) {
			emitter.on(event, listener);
			return remoteApi;
		},
		
		/**
		 * Remove event listener.
		 * @public
		 * @param {string} event - Event name.
		 * @param {Function} listener - Event listener function.
		 * @returns {Object} This remote instance for chaining.
		 * @example
		 * remote.off('log', logHandler);
		 */
		off(event, listener) {
			emitter.off(event, listener);
			return remoteApi;
		},
		
		/**
		 * Add one-time event listener.
		 * @public
		 * @param {string} event - Event name.
		 * @param {Function} listener - Event listener function.
		 * @returns {Object} This remote instance for chaining.
		 * @example
		 * remote.once('log', (data) => console.log('First log:', data));
		 */
		once(event, listener) {
			emitter.once(event, listener);
			return remoteApi;
		},
		
		/**
		 * Emit an event.
		 * @public
		 * @param {string} event - Event name.
		 * @param {...any} args - Event arguments.
		 * @returns {boolean} True if event had listeners.
		 * @example
		 * remote.emit('custom-event', { data: 'example' });
		 */
		emit(event, ...args) {
			return emitter.emit(event, ...args);
		},
		/**
		 * Returns the current connection status as tracked by the module, or does a live check if requested.
		 * @function
		 * @param {boolean} [liveCheck=false] - If true, checks adb devices for actual connection.
		 * @returns {Promise<"connected"|"disconnected"|"unknown">}
		 * @example
		 * await remote.getConnectionStatus();
		 * await remote.getConnectionStatus(true); // live check
		 */
		getConnectionStatus,
		/**
		 * Returns a list of all available keyboard key function names on the live API (keyboard.key).
		 * @returns {string[]}
		 * @example
		 * remote.getKeyboardKeys();
		 */
		getKeyboardKeys() {
			return getKeyboardKeys.call(remoteApi);
		},
		/**
		 * Returns a list of all available press command names on the live API (press object), including aliases and dynamic keys.
		 * @returns {string[]}
		 * @example
		 * remote.getPressCommands();
		 */
		getPressCommands() {
			return getPressCommands.call(remoteApi);
		},
		/**
		 * Returns true if the module believes it is connected to the device.
		 * @readonly
		 * @type {boolean}
		 * @example
		 * if (remote.isConnected) { ... }
		 */
		get isConnected() {
			return isConnected();
		},
		
		/**
		 * Returns the last screencap data (PNG stream) captured by screencap() or thumbnail().
		 * Updated every time a screenshot is taken, regardless of options used.
		 * @readonly
		 * @type {ReadableStream|null}
		 * @example
		 * await remote.screencap({ filepath: './screenshot.png' });
		 * console.log('Last screencap stream:', remote.lastScreencapData);
		 * 
		 * // Use the cached stream data
		 * if (remote.lastScreencapData) {
		 *   remote.lastScreencapData.pipe(someOtherStream);
		 * }
		 */
		get lastScreencapData() {
			return lastScreencapData;
		},
		/**
		 * Configure or retrieve Android TV settings for optimal remote operation.
		 * Handles power management, display settings, and system configuration.
		 * @public
		 * @param {string} [mode='set'] - 'get' to retrieve settings, 'set' to configure settings
		 * @fires Remote#log - Emitted with settings operation results
		 * @fires Remote#error - Emitted if settings operations fail
		 * @example
		 * await remote.setSettings(); // Set all optimal settings
		 * await remote.setSettings('get'); // Get current settings values
		 */
		async setSettings(mode = 'set') {
			try {
				emitLog("info", `=== ${mode === 'set' ? 'Configuring' : 'Retrieving'} Android TV settings ===`, "setSettings");
				
				await ensureConnected();
				
				// Core settings for power management and display
				const coreSettings = [
					{ ns: "system", key: "screen_off_timeout", value: 2147483647 },
					{ ns: "secure", key: "sleep_timeout", value: 0 },
					{ ns: "global", key: "stay_on_while_plugged_in", value: 3 }
				];
				
				// Process core settings
				for (const item of coreSettings) {
					const cmd = mode === "set" 
						? `settings put ${item.ns} ${item.key} ${item.value}`
						: `settings get ${item.ns} ${item.key}`;
					
					const result = await device.shell(cmd).then(Adb.util.readAll);
					
					if (!quiet) {
						if (mode === "set") {
							emitLog("info", `Set ${item.ns} ${item.key} to ${item.value}`, "setSettings");
						} else {
							emitLog("info", `${item.ns} ${item.key}: ${result.toString().trim()}`, "setSettings");
						}
					}
				}
				
				// Additional settings (only applied in set mode)
				if (mode === 'set') {
					emitLog("info", "Setting additional display and power settings", "setSettings");
					
					const additionalSettings = [
						"settings put system screen_brightness_mode 0",  // Manual brightness
						"settings put system screen_brightness 255",     // Max brightness
						"svc power stayon true"                          // Stay on while plugged
					];
					
					for (const cmd of additionalSettings) {
						if (!quiet) emitLog("info", `Running: ${cmd}`, "setSettings");
						await device.shell(cmd);
					}
				}
				
				emitLog("info", `✅ Android TV settings ${mode === 'set' ? 'configured' : 'retrieved'} successfully`, "setSettings");
				
			} catch (error) {
				localEmitError(error, "setSettings", `Failed to ${mode === 'set' ? 'configure' : 'retrieve'} Android TV settings`);
				throw error;
			}
		},

		/**
		 * Ensures the Android TV device is awake and responsive.
		 * Performs comprehensive power state checking and correction.
		 * @public
		 * @returns {Promise<boolean>} Returns true if device is awake and ready
		 * @fires Remote#log - Emitted with power state and wake-up process information
		 * @fires Remote#error - Emitted if wake-up process fails
		 * @example
		 * await remote.ensureAwake();
		 */
		async ensureAwake() {
			try {
				emitLog("info", "=== Starting ensureAwake sequence ===", "ensureAwake");

				await ensureConnected();

				// Helper function to parse power state from dumpsys output
				const parsePowerState = (output) => {
					const mIsPoweredMatch = output.match(/^\s*mIsPowered=([a-zA-Z0-9]+)/m);
					const mWakefulnessMatch = output.match(/^\s*mWakefulness=([a-zA-Z0-9]+)/m);
					const mDisplayReadyMatch = output.match(/^\s*mDisplayReady=([a-zA-Z0-9]+)/m);
					return {
						mIsPowered: mIsPoweredMatch ? mIsPoweredMatch[1] : "unknown",
						mWakefulness: mWakefulnessMatch ? mWakefulnessMatch[1] : "unknown",
						mDisplayReady: mDisplayReadyMatch ? mDisplayReadyMatch[1] : "unknown"
					};
				};

				// Helper function to get current power state
				const getCurrentPowerState = async () => {
					const output = await device
						.shell("dumpsys power")
						.then(Adb.util.readAll)
						.then((b) => b.toString());
					return parsePowerState(output);
				};

				// Helper function to emit power state
				const emitPowerState = (parsed, context = "") => {
					const prefix = context ? `${context} ` : "";
					emitLog("info", `${prefix}Power State:`, "ensureAwake");
					emitLog("info", `  mIsPowered: ${parsed.mIsPowered}`, "ensureAwake");
					emitLog("info", `  mWakefulness: ${parsed.mWakefulness}`, "ensureAwake");
					emitLog("info", `  mDisplayReady: ${parsed.mDisplayReady}`, "ensureAwake");
				};

				// Check initial power state
				const initialPowerState = await getCurrentPowerState();
				emitPowerState(initialPowerState, "Initial");

				// Determine what commands need to be sent
				const commandsToSend = [];
				
				if (initialPowerState.mIsPowered !== "true") {
					emitLog("info", `Device not powered (${initialPowerState.mIsPowered}), will send POWER keycode`, "ensureAwake");
					commandsToSend.push({ keycode: keycodes.power, reason: "power on device" });
				} else {
					emitLog("info", "✅ Device already powered", "ensureAwake");
				}

				if (initialPowerState.mWakefulness !== "Awake") {
					emitLog("info", `Device not awake (${initialPowerState.mWakefulness}), will send WAKEUP keycode`, "ensureAwake");
					commandsToSend.push({ keycode: keycodes.wakeUp, reason: "wake up device" });
				} else {
					emitLog("info", "✅ Device already awake", "ensureAwake");
				}

				if (initialPowerState.mDisplayReady !== "true") {
					emitLog("info", `Display not ready (${initialPowerState.mDisplayReady}), will send POWER keycode`, "ensureAwake");
					commandsToSend.push({ keycode: keycodes.power, reason: "ensure display ready" });
				} else {
					emitLog("info", "✅ Display already ready", "ensureAwake");
				}

				// Send required commands
				if (commandsToSend.length > 0) {
					emitLog("info", `Sending ${commandsToSend.length} keycode(s)...`, "ensureAwake");
					
					for (const cmd of commandsToSend) {
						emitLog("info", `Sending keycode ${cmd.keycode} to ${cmd.reason}`, "ensureAwake");
						await inputKeycode(cmd.keycode);
						
						// Brief delay between commands
						await new Promise(resolve => setTimeout(resolve, 500));
					}

					// Wait for commands to take effect
					emitLog("info", "Waiting for commands to take effect...", "ensureAwake");
					await new Promise(resolve => setTimeout(resolve, 3000));
				}

				// Verify final state
				const finalPowerState = await getCurrentPowerState();
				emitPowerState(finalPowerState, "Final");

				// Check for persistent issues
				const issues = [];
				if (finalPowerState.mIsPowered !== "true") {
					issues.push(`Device still not powered: ${finalPowerState.mIsPowered}`);
				}
				if (finalPowerState.mWakefulness !== "Awake") {
					issues.push(`Device still not awake: ${finalPowerState.mWakefulness}`);
				}
				if (finalPowerState.mDisplayReady !== "true") {
					issues.push(`Display still not ready: ${finalPowerState.mDisplayReady}`);
				}

				if (issues.length === 0) {
					emitLog("info", "🎉 ensureAwake completed successfully - device is fully ready", "ensureAwake");
					return true;
				} else {
					// Log warnings for persistent issues
					for (const issue of issues) {
						emitLog("warn", issue, "ensureAwake");
					}
					
					// Only throw error if critical issues persist
					emitError(
						new Error(`ensureAwake failed with ${issues.length} persistent issue(s): ${issues.join(', ')}`), 
						"ensureAwake", 
						"Device may not be fully responsive"
					);
					return false;
				}
				
			} catch (error) {
				emitError(error, "ensureAwake", "Failed to ensure device is awake");
				throw error;
			}
		},

		/**
		 * Connect to the device. Supports both promise and callback styles.
		 * @public
		 * @param {function(Error=, any=)=} [cb]
		 * @returns {Promise|undefined}
		 * @fires Remote#log - Emitted with connection status information
		 * @fires Remote#error - Emitted if connection fails or ADB errors occur
		 * @example
		 * await remote.connect();
		 * remote.connect((err) => { ... });
		 */
		connect: /**
		 * @type {(cb?: (err?: Error, result?: any) => any) => Promise<any> | undefined}
		 */ (connectWrapped),

		/**
		 * Disconnect from the device. Supports both promise and callback styles.
		 * @public
		 * @param {function(Error=, any=)=} [cb]
		 * @returns {Promise|undefined}
		 * @fires Remote#log - Emitted with disconnection status information
		 * @fires Remote#error - Emitted if disconnection fails
		 * @example
		 * await remote.disconnect();
		 * remote.disconnect((err) => { ... });
		 */
		disconnect: /**
		 * @type {(cb?: (err?: Error, result?: any) => any) => Promise<any> | undefined}
		 */ (disconnectWrapped),

		/**
		 * Send a keycode. Supports both promise and callback styles.
		 * @public
		 * @param {number} code
		 * @param {function(Error=, any=)=} [cb]
		 * @returns {Promise|undefined}
		 * @example
		 * await remote.inputKeycode(23);
		 * remote.inputKeycode(23, (err) => { ... });
		 */
		inputKeycode: /**
		 * @type {(code: number, cb?: (err?: Error, result?: any) => any) => Promise<any> | undefined}
		 */ (inputKeycodeWrapped),

		/**
		 * Reboots the Android TV device using ADB's native reboot method.
		 * @public
		 * @returns {Promise<boolean>} Returns true when reboot command was sent successfully
		 * @fires Remote#log - Emitted with reboot operation status and warnings
		 * @fires Remote#error - Emitted if reboot operation fails
		 * @example
		 * await remote.reboot(); // Reboots the device
		 */
		async reboot() {
			try {
				emitLog("info", "=== Starting device reboot ===", "reboot");
				
				// Ensure we're connected before sending reboot command
				await ensureConnected();
				
				emitLog("info", "Sending reboot command to device", "reboot");
				
				// Use the native device.reboot() method with timeout handling
				let result;
				try {
					result = await device.reboot();
					emitLog("info", `✅ Reboot command completed normally`, "reboot");
				} catch (timeoutError) {
					// Socket timeout is expected during reboot - device becomes unresponsive
					if (timeoutError.message && timeoutError.message.includes("timeout")) {
						emitLog("info", "✅ Reboot command sent (connection timeout is expected during reboot)", "reboot");
						result = true; // Treat timeout as success
					} else {
						// Re-throw non-timeout errors
						throw timeoutError;
					}
				}
				emitLog("warn", "Device will reboot shortly and connection will be lost", "reboot");
				
				// Wait a moment for command to take effect, then disconnect
				setTimeout(() => {
					emitLog("info", "Device should be rebooting now - connection will be terminated", "reboot");
					// Force disconnect after reboot
					connected = false;
					stopHeartbeat();
				}, 1000);

				emitLog("info", "=== Device reboot initiated ===", "reboot");
				return result;

			} catch (error) {
				emitError(error, "reboot", "Failed to reboot device");
				
				// Provide helpful error messages for common issues
				if (error.message && error.message.includes("unauthorized")) {
					emitLog("error", "Device unauthorized - ensure ADB debugging is enabled and device is authorized", "reboot");
				} else if (error.message && error.message.includes("device not found")) {
					emitLog("error", "Device not found - check IP address and ADB connection", "reboot");
				} else if (error.message && error.message.includes("permission")) {
					emitLog("error", "Permission denied - reboot may require root access on some devices", "reboot");
				} else if (error.message && error.message.includes("timeout")) {
					emitLog("warn", "Reboot command timed out - this may be normal behavior during reboot", "reboot");
				}
				
				throw error;
			}
		},

		/**
		 * Takes a screenshot of the Android TV device screen in PNG format with optional resizing and file saving.
		 * @public
		 * @param {Object} [options={}] - Screenshot options
		 * @param {number} [options.width] - Target width for resizing (optional)
		 * @param {number} [options.height] - Target height for resizing (optional) 
		 * @param {string} [options.filepath] - File path to save screenshot (optional)
		 * @returns {Promise<ReadableStream|void>} Returns PNG stream if no filepath, void if saved to file
		 * @fires Remote#screencap-start - Emitted when screenshot capture begins
		 * @fires Remote#screencap-captured - Emitted when raw screenshot is captured
		 * @fires Remote#screencap-processing - Emitted when image processing begins
		 * @fires Remote#screencap-ready - Emitted when final processed stream is ready
		 * @fires Remote#screencap-saved - Emitted when screenshot is saved to file
		 * @fires Remote#screencap-complete - Emitted when entire operation is complete
		 * @fires Remote#log - Emitted with screenshot operation status
		 * @fires Remote#error - Emitted if screenshot operation fails
		 * @example
		 * // Basic screenshot - returns stream
		 * const pngStream = await remote.screencap();
		 * 
		 * // Screenshot with resizing
		 * const resizedStream = await remote.screencap({ width: 1280, height: 720 });
		 * 
		 * // Screenshot saved to file
		 * await remote.screencap({ filepath: './screenshot.png' });
		 * 
		 * // Screenshot with resizing and file save
		 * await remote.screencap({ width: 640, height: 360, filepath: './thumb.png' });
		 * 
		 * // Event-driven usage (non-blocking)
		 * remote.screencap({ width: 1280, filepath: './shot.png' });
		 * remote.on('screencap-complete', (data) => {
		 *   console.log('Screenshot ready:', data.filepath);
		 * });
		 */
		async screencap(options = {}) {
			const startTime = performance.now();
			const { width, height, filepath } = options;
			
			try {
				emitLog("info", "=== Taking device screenshot ===", "screencap");
				
				// Emit start event
				emitter.emit("screencap-start", {
					timestamp: new Date().toISOString(),
					options: { width, height, filepath }
				});
				
				// Ensure we're connected before taking screenshot
				await ensureConnected();
				
				emitLog("info", "Capturing screenshot using native screencap utility", "screencap");
				
				// Use the native device.screencap() method which should return PNG
				const screencapStream = await device.screencap();
				const captureTime = performance.now();
				
				emitLog("info", `✅ Screenshot captured successfully (${(captureTime - startTime).toFixed(2)}ms)`, "screencap");
				
				// Emit captured event
				emitter.emit("screencap-captured", {
					timestamp: new Date().toISOString(),
					captureTime: captureTime - startTime
				});

				// Determine if we need Sharp processing (only for resizing)
				const needsSharpProcessing = width || height;
				
				// Handle file save without processing (direct PNG stream to file)
				if (filepath && !needsSharpProcessing) {
					const backgroundOperation = (async () => {
						try {
							const fileOpStartTime = performance.now();
							
							emitLog("info", `💾 [BACKGROUND] Starting direct save to: ${filepath}`, "screencap");
							
							// Direct pipe: ADB PNG stream -> File (no Sharp processing)
							const directPipeStartTime = performance.now();
							const writeStream = createWriteStream(filepath);
							
							// Store the raw PNG stream for user access
							lastScreencapData = screencapStream;
							
							emitLog("info", `🔄 [BACKGROUND] Piping stream to file...`, "screencap");
							screencapStream.pipe(writeStream);
							
							emitLog("info", `⏳ [BACKGROUND] Waiting for write stream to finish...`, "screencap");
							await new Promise((resolve, reject) => {
								writeStream.on('finish', () => {
									emitLog("info", `✅ [BACKGROUND] Write stream finished for ${filepath}`, "screencap");
									resolve();
								});
								writeStream.on('error', (err) => {
									emitLog("error", `❌ [BACKGROUND] Write stream error for ${filepath}: ${err.message}`, "screencap");
									reject(err);
								});
							});
							
							const directPipeTime = performance.now() - directPipeStartTime;
							const totalFileOpTime = performance.now() - fileOpStartTime;
							const totalTime = performance.now() - startTime;
							
							emitLog("info", `✅ Screenshot saved directly to ${filepath}`, "screencap");
							emitLog("info", `⚡ Direct pipe timing: ${directPipeTime.toFixed(2)}ms (no Sharp processing!)`, "screencap");
							
							// Emit saved event with timing
							emitter.emit("screencap-saved", {
								timestamp: new Date().toISOString(),
								filepath,
								timing: {
									adbStream: captureTime - startTime,
									directPipe: directPipeTime,
									fileOperation: totalFileOpTime,
									total: totalTime
								}
							});
							
							// Emit complete event
							emitter.emit("screencap-complete", {
								timestamp: new Date().toISOString(),
								filepath,
								processed: false,
								timing: {
									adbStream: captureTime - startTime,
									directPipe: directPipeTime,
									fileOperation: totalFileOpTime,
									total: totalTime
								}
							});
							
						} catch (saveError) {
							emitLog("error", `💥 [BACKGROUND] Direct pipe error: ${saveError.message}`, "screencap");
							localEmitError(saveError, "screencap", `Failed to save screenshot directly to ${filepath}: ${saveError.message}`);
						} finally {
							emitLog("info", `🧹 [BACKGROUND] Cleaning up background operation for ${filepath}`, "screencap");
							backgroundOperations.delete(backgroundOperation);
						}
					})();
					
					backgroundOperations.add(backgroundOperation);
					emitLog("info", "Direct PNG pipe started in background", "screencap");
					return; // Don't return a stream when saving to file
				}
				
				if (!needsSharpProcessing && !filepath) {
					// Store the raw PNG stream for user access
					lastScreencapData = screencapStream;
					
					// Return raw stream if no processing or file save needed
					emitLog("info", "Raw PNG stream ready (no processing needed)", "screencap");
					emitter.emit("screencap-ready", {
						timestamp: new Date().toISOString(),
						processed: false,
						totalTime: captureTime - startTime
					});
					emitter.emit("screencap-complete", {
						timestamp: new Date().toISOString(),
						totalTime: captureTime - startTime,
						processed: false
					});
					return screencapStream;
				}
				
				// Process the image
				emitLog("info", "Processing screenshot image...", "screencap");
				emitter.emit("screencap-processing", {
					timestamp: new Date().toISOString(),
					width,
					height,
					filepath
				});
				
				const processStartTime = performance.now();
				
				// Create Sharp transform pipeline
				let sharpTransform = sharp();
				
				// Apply resizing if width or height specified
				if (width || height) {
					const resizeOptions = {
						fit: 'inside', // Maintain aspect ratio
						withoutEnlargement: true // Don't upscale
					};
					if (width) resizeOptions.width = width;
					if (height) resizeOptions.height = height;
					
					sharpTransform = sharpTransform.resize(resizeOptions);
					emitLog("info", `Resizing to ${width || 'auto'}x${height || 'auto'}`, "screencap");
				}
				
				// Ensure PNG format with fastest compression settings
				sharpTransform = sharpTransform.png({ 
					compressionLevel: 1, // Fastest compression (0-9, lower = faster)
					progressive: false   // Disable progressive encoding
				});
				
				if (filepath) {
					// Background process handles saving and updates lastScreencapData when done
					const backgroundOperation = (async () => {
						try {
							const fileOpStartTime = performance.now();
							const writeStreamStartTime = performance.now();
							const writeStream = createWriteStream(filepath);
							const writeStreamTime = performance.now() - writeStreamStartTime;
							
							// Process and save data, collecting it for lastScreencapData
							const chunks = [];
							const processedStream = screencapStream.pipe(sharpTransform);
							
							await new Promise((resolve, reject) => {
								processedStream.on('data', (chunk) => {
									chunks.push(chunk);
									writeStream.write(chunk);
								});
								
								processedStream.on('end', () => {
									writeStream.end();
									// Save processed data to lastScreencapData when done
									lastScreencapData = Buffer.concat(chunks);
									
									const totalFileOpTime = performance.now() - fileOpStartTime;
									const totalTime = performance.now() - startTime;
									
									emitLog("info", `✅ Screenshot saved to ${filepath}`, "screencap");
									emitLog("info", `⏱️ File save timing: ${totalFileOpTime.toFixed(2)}ms, Total: ${totalTime.toFixed(2)}ms`, "screencap");
									
									emitter.emit("screencap-saved", {
										timestamp: new Date().toISOString(),
										filepath,
										timing: { fileOperation: totalFileOpTime, total: totalTime }
									});
									
									emitter.emit("screencap-complete", {
										timestamp: new Date().toISOString(),
										filepath,
										processed: true,
										width,
										height,
										timing: { fileOperation: totalFileOpTime, total: totalTime }
									});
									
									resolve();
								});
								
								processedStream.on('error', (error) => {
									reject(error);
								});
							});
							
						} catch (saveError) {
							// Show full error details for debugging
							emitLog("error", `💥 [BACKGROUND SHARP] File save error: ${saveError.message}`, "screencap");
							emitLog("error", `💥 [BACKGROUND SHARP] Error stack: ${saveError.stack}`, "screencap");
							
							// Only suppress specific libspng/PNG processing errors that occur after disconnection
							if (!connected && saveError.message && (
								saveError.message.includes('libspng') || 
								saveError.message.includes('pngload_buffer') ||
								saveError.message.includes('read error')
							)) {
								emitLog("debug", `PNG processing error after disconnection (suppressed): ${filepath}`, "screencap");
							} else {
								// Emit all other errors with full details
								localEmitError(saveError, "screencap", `Failed to save screenshot to ${filepath}: ${saveError.message}`);
							}
						} finally {
							// Remove from background operations when complete
							emitLog("info", `🧹 [BACKGROUND SHARP] Cleaning up background operation for ${filepath}`, "screencap");
							backgroundOperations.delete(backgroundOperation);
						}
					})();
					
					// Track the background operation
					backgroundOperations.add(backgroundOperation);					
					emitLog("info", "Screenshot processing started in background", "screencap");
					return; // Don't return a stream when saving to file
					
				} else {
					// Return processed stream
					const processedStream = screencapStream.pipe(sharpTransform);
					const processEndTime = performance.now();
					
					const streamCaptureTime = captureTime - startTime;
					const sharpProcessTime = processEndTime - processStartTime;
					const totalTime = processEndTime - startTime;
					
					// Debug timing variables
					emitLog("debug", `🔍 Timing variables: captureTime=${captureTime}, startTime=${startTime}, processEndTime=${processEndTime}, processStartTime=${processStartTime}`, "screencap");
					
					emitLog("info", `PNG stream processed and ready`, "screencap");
					try {
						emitLog("info", `⏱️  Timing breakdown: Capture=${streamCaptureTime.toFixed(2)}ms, Sharp=${sharpProcessTime.toFixed(2)}ms, Total=${totalTime.toFixed(2)}ms`, "screencap");
					} catch (timingError) {
						emitLog("error", `⚠️  Timing log error in stream processing: ${timingError.message}. Variables: streamCaptureTime=${streamCaptureTime}, sharpProcessTime=${sharpProcessTime}, totalTime=${totalTime}`, "screencap");
					}
					
					// Emit ready event
					emitter.emit("screencap-ready", {
						timestamp: new Date().toISOString(),
						processed: true,
						width,
						height,
						timing: {
							capture: streamCaptureTime,
							sharpProcess: sharpProcessTime,
							total: totalTime
						}
					});
					
					// Emit complete event
					emitter.emit("screencap-complete", {
						timestamp: new Date().toISOString(),
						processed: true,
						width,
						height,
						timing: {
							capture: streamCaptureTime,
							sharpProcess: sharpProcessTime,
							total: totalTime
						}
					});
					
					// Store the processed stream for user access
					lastScreencapData = processedStream;
					
					return processedStream;
				}

			} catch (error) {
				localEmitError(error, "screencap", "Failed to capture screenshot");
				
				// Provide helpful error messages for common issues
				if (error.message && error.message.includes("unauthorized")) {
					emitLog("error", "Device unauthorized - ensure ADB debugging is enabled and device is authorized", "screencap");
				} else if (error.message && error.message.includes("device not found")) {
					emitLog("error", "Device not found - check IP address and ADB connection", "screencap");
				} else if (error.message && error.message.includes("screencap")) {
					emitLog("warn", "Screencap utility may not be available - automatic fallback to framebuffer attempted", "screencap");
				} else if (error.message && error.message.includes("ENOENT")) {
					emitLog("error", `File path error: ${error.message}`, "screencap");
				}
				
				throw error;
			}
		},

		/**
		 * Takes a thumbnail screenshot with default width of 240px.
		 * @public
		 * @param {Object} [options={}] - Thumbnail options
		 * @param {number} [options.width=240] - Target width for thumbnail (default: 240)
		 * @param {number} [options.height] - Target height for thumbnail (optional)
		 * @param {string} [options.filepath] - File path to save thumbnail (optional)
		 * @returns {Promise<ReadableStream|void>} Returns PNG stream if no filepath, void if saved to file
		 * @fires Remote#screencap-start - Emitted when thumbnail capture begins
		 * @fires Remote#screencap-captured - Emitted when raw screenshot is captured
		 * @fires Remote#screencap-processing - Emitted when image processing begins
		 * @fires Remote#screencap-ready - Emitted when final processed stream is ready
		 * @fires Remote#screencap-saved - Emitted when thumbnail is saved to file
		 * @fires Remote#screencap-complete - Emitted when entire thumbnail operation is complete
		 * @fires Remote#log - Emitted with thumbnail operation status
		 * @fires Remote#error - Emitted if thumbnail operation fails
		 * @example
		 * // Basic thumbnail with default 240px width
		 * const thumbnailStream = await remote.thumbnail();
		 * 
		 * // Thumbnail with custom dimensions
		 * const customThumb = await remote.thumbnail({ width: 320, height: 180 });
		 * 
		 * // Thumbnail saved to file
		 * await remote.thumbnail({ filepath: './thumb.png' });
		 * 
		 * // Thumbnail with custom size and file save
		 * await remote.thumbnail({ width: 160, height: 90, filepath: './small-thumb.png' });
		 */
		async thumbnail(options = {}) {
			// Set default width to 240 if not specified
			const thumbnailOptions = {
				width: 240,
				...options
			};
			
			emitLog("info", `📸 Taking thumbnail screenshot (${thumbnailOptions.width}x${thumbnailOptions.height || 'auto'})`, "thumbnail");
			
			// Call screencap with thumbnail options
			return await this.screencap(thumbnailOptions);
		},

		/**
		 * Waits until the Android TV device has finished booting.
		 * @public
		 * @param {number} [timeout=60000] - Maximum time to wait in milliseconds (default: 60 seconds)
		 * @returns {Promise<boolean>} Returns true when device has completed booting
		 * @fires Remote#log - Emitted with boot monitoring status
		 * @fires Remote#error - Emitted if boot monitoring fails
		 * @example
		 * await remote.waitBootComplete(); // Wait with default 60 second timeout
		 * await remote.waitBootComplete(120000); // Wait up to 2 minutes
		 */
		async waitBootComplete(timeout = 60000) {
			try {
				emitLog("info", "=== Waiting for device boot completion ===", "waitBootComplete");
				
				// Ensure we're connected before monitoring boot status
				await ensureConnected();
				
				emitLog("info", `Monitoring boot status (timeout: ${timeout}ms)`, "waitBootComplete");
				
				// Use the native device.waitBootComplete() method
				const result = await device.waitBootComplete();
				
				emitLog("info", "✅ Device boot completed successfully", "waitBootComplete");
				emitLog("info", "Device is now ready for operations", "waitBootComplete");

				return result;

			} catch (error) {
				emitError(error, "waitBootComplete", "Failed while waiting for boot completion");
				
				// Provide helpful error messages for common issues
				if (error.message && error.message.includes("unauthorized")) {
					emitLog("error", "Device unauthorized - ensure ADB debugging is enabled and device is authorized", "waitBootComplete");
				} else if (error.message && error.message.includes("device not found")) {
					emitLog("error", "Device not found - check IP address and ADB connection", "waitBootComplete");
				} else if (error.message && error.message.includes("timeout")) {
					emitLog("error", `Boot completion timeout after ${timeout}ms - device may still be starting`, "waitBootComplete");
				} else if (error.message && error.message.includes("connection")) {
					emitLog("error", "Connection lost while waiting for boot completion", "waitBootComplete");
				}
				
				throw error;
			}
		},

		/**
		 * All remote key functions support both promise and callback styles.
		 * @public
		 */
		press: (() => {
			/**
			 * Dynamically generated remote control key functions for Android TV remotes.
			 * Keys are loaded from remote-keys.json. Color buttons are excluded.
			 * @namespace press
			 */
			const obj = {};
			const longObj = {};
			remoteKeys.forEach((key) => {
				/**
				 * Sends the corresponding keycode for this remote key.
				 * @returns {Promise<any>}
				 * @example
				 * press.home();
				 */
				obj[key] = wrapAsync(function () {
					// Special handling for ok/select
					if (key === "ok" || key === "select") {
						return inputKeycode(keycodes.dpadCenter || keycodes.ok);
					}
					// Map up/down/left/right to dpad keycodes
					if (key === "up") {
						return inputKeycode(keycodes.dpadUp);
					}
					if (key === "down") {
						return inputKeycode(keycodes.dpadDown);
					}
					if (key === "left") {
						return inputKeycode(keycodes.dpadLeft);
					}
					if (key === "right") {
						return inputKeycode(keycodes.dpadRight);
					}
					// Special handling for play/pause
					if (key === "play") {
						return inputKeycode(keycodes.mediaPlay || keycodes.playPause);
					}
					if (key === "pause") {
						return inputKeycode(keycodes.mediaPause || keycodes.playPause);
					}
					if (key === "volumeMute" || key === "mute") {
						return inputKeycode(keycodes.volumeMute || keycodes.mute);
					}
					if (key === "input") {
						return inputKeycode(keycodes.tvInput);
					}
					if (key.startsWith("number")) {
						// e.g. number0
						const num = key.replace("number", "");
						return inputKeycode(keycodes[num]);
					}
					return inputKeycode(keycodes[key]);
				});

				/**
				 * Sends the corresponding keycode for this remote key as a long press.
				 * @returns {Promise<any>}
				 * @example
				 * press.long.home();
				 */
				longObj[key] = wrapAsync(function () {
					if (key === "ok" || key === "select") {
						return inputKeycodeLongPressWrapped(keycodes.dpadCenter || keycodes.ok);
					}
					if (key === "up") {
						return inputKeycodeLongPressWrapped(keycodes.dpadUp);
					}
					if (key === "down") {
						return inputKeycodeLongPressWrapped(keycodes.dpadDown);
					}
					if (key === "left") {
						return inputKeycodeLongPressWrapped(keycodes.dpadLeft);
					}
					if (key === "right") {
						return inputKeycodeLongPressWrapped(keycodes.dpadRight);
					}
					if (key === "play") {
						return inputKeycodeLongPressWrapped(keycodes.mediaPlay || keycodes.playPause);
					}
					if (key === "pause") {
						return inputKeycodeLongPressWrapped(keycodes.mediaPause || keycodes.playPause);
					}
					if (key === "volumeMute" || key === "mute") {
						return inputKeycodeLongPressWrapped(keycodes.volumeMute || keycodes.mute);
					}
					if (key === "input") {
						return inputKeycodeLongPressWrapped(keycodes.tvInput);
					}
					if (key.startsWith("number")) {
						const num = key.replace("number", "");
						return inputKeycodeLongPressWrapped(keycodes[num]);
					}
					return inputKeycodeLongPressWrapped(keycodes[key]);
				});
			});
			// Robust aliasing: always add if dpad keys exist in keycodes
			// if (typeof obj.dpadUp === "function" || keycodes.dpadUp) obj.up = obj.dpadUp;
			// if (typeof obj.dpadDown === "function" || keycodes.dpadDown) obj.down = obj.dpadDown;
			// if (typeof obj.dpadLeft === "function" || keycodes.dpadLeft) obj.left = obj.dpadLeft;
			// if (typeof obj.dpadRight === "function" || keycodes.dpadRight) obj.right = obj.dpadRight;
			// if (typeof obj.dpadCenter === "function" || keycodes.dpadCenter) obj.ok = obj.dpadCenter;
			// if (typeof longObj.dpadUp === "function") longObj.up = longObj.dpadUp;
			// if (typeof longObj.dpadDown === "function") longObj.down = longObj.dpadDown;
			// if (typeof longObj.dpadLeft === "function") longObj.left = longObj.dpadLeft;
			// if (typeof longObj.dpadRight === "function") longObj.right = longObj.dpadRight;
			// if (typeof longObj.dpadCenter === "function") longObj.ok = longObj.dpadCenter;
			obj.long = longObj;
			return obj;
		})(),

		/**
		 * Keyboard interface for all keys, with text and keycode fallback.
		 * @public
		 */
		keyboard: {
			/**
			 * Sends text input to the device.
			 * @public
			 * @param {string} text - The text to input.
			 * @returns {Promise<any>}
			 * @example
			 * keyboard.text('hello');
			 */
			text: inputTextWrapped,

			/**
			 * Key subobject: callable and contains all key functions.
			 */
			key: Object.assign(
				wrapAsync(function (keyName, options) {
					options = options || {};
					if (!keyboardKeys[keyName]) {
						const error = new Error("Unknown keyboard key: " + keyName);
						emitError(error, "keyboard.key", `Unknown keyboard key: ${keyName}`);
						return Promise.reject(error);
					}
					if (!options.forceKeycode) {
						// Send as text character
						return inputText(keyboardKeys[keyName]);
					}
					// Fallback to keycode if exists
					if (keycodes[keyName]) {
						return inputKeycode(keycodes[keyName]);
					}
					const error = new Error("No keycode available for key: " + keyName);
					emitError(error, "keyboard.key", `No keycode available for key: ${keyName}`);
					return Promise.reject(error);
				}),
				{
					// Dynamically add all keyboard key functions and .keycode subobject
					...(() => {
						const keyFns = {};
						Object.keys(keyboardKeys).forEach((keyName) => {
							/**
							 * Sends this key using inputText or keycode fallback.
							 * @returns {Promise<any>}
							 * @example
							 * keyboard.key.a();
							 */
							keyFns[keyName] = wrapAsync(function (options) {
								options = options || {};
								if (!options.forceKeycode) {
									return inputText(keyboardKeys[keyName]);
								}
								if (keycodes[keyName]) {
									return inputKeycode(keycodes[keyName]);
								}
								const error = new Error("No keycode available for key: " + keyName);
								emitError(error, "keyboard.key", `No keycode available for key: ${keyName}`);
								return Promise.reject(error);
							});
							/**
							 * Sends this key using keycode only.
							 * @returns {Promise<any>}
							 * @example
							 * keyboard.key.a.keycode();
							 */
							if (keycodes[keyName]) {
								keyFns[keyName].keycode = wrapAsync(function () {
									return inputKeycode(keycodes[keyName]);
								});
							}
						});
						return keyFns;
					})(),

					/**
					 * Shift subobject for shifted keys.
					 */
					shift: (() => {
						const shiftFns = {};
						Object.keys(keyboardKeys).forEach((keyName) => {
							const char = keyboardKeys[keyName];
							const shiftedChar = getShiftedCharacter(keyName, char);
							
							// Only create shift function if the character actually changes when shifted
							if (shiftedChar !== char) {
								/**
								 * Sends this key with shift using inputText (shifted character).
								 * Note: No keycode method available for shift variants since Android
								 * ADB doesn't support sending multiple keycodes simultaneously.
								 * @returns {Promise<any>}
								 * @example
								 * keyboard.key.shift.a(); // Sends "A"
								 */
								shiftFns[keyName] = wrapAsync(function () {
									// Send shifted character as text
									return inputText(shiftedChar);
								});
							}
						});
						return shiftFns;
					})()
				}
			)
		}
	};

	// Handle initialization if autoConnect is enabled
	if (autoConnect) {
		try {
			// Wait for initialization to complete
			await realInitPromise;
		} catch (error) {
			// If initialization fails, still return the remote but emit error
			emitError(error, "createRemote", "Auto-connect failed during initialization");
		}
	}

	return remoteApi;
}

/**
 * Create and return a ready-to-use Android TV Remote instance.
 * @public
 * @param {RemoteConfig} config - Configuration for the remote.
 * @returns {Promise<Remote>} Resolves with a ready remote instance.
 * 
 * @description
 * Alias for createRemote() - both functions now return ready-to-use remote instances.
 * 
 * @example
 * // ESM with event handling
 * const remote = await createAndroidTVRemote({ ip: "192.168.1.100" });
 * remote.on('log', (data) => console.log(data));
 * remote.on('error', (data) => console.error(data));
 */
export async function createAndroidTVRemote(config) {
	// Now createRemote is async and handles initialization internally
	return await createRemote(config);
}

// Add static create method to the default export
createRemote.create = createAndroidTVRemote;
