/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /src/lib/android-tv-remote.mjs
 *	@Date: 2025-10-15 10:19:05 -07:00 (1760548745)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-15 11:13:38 -07:00 (1760552018)
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
 * @property {string} source - Source of the log message (e.g., 'connect', 'disconnect', 'handleSettings').
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
 * @property {function(string, boolean=): Promise<void>} handleSettings - Get or set Android settings via ADB.
 * @property {function(function(Error=, any=)=): Promise<void>|undefined} connect - Connect to the device. Supports both promise and callback styles.
 * @property {function(function(Error=, any=)=): Promise<void>|undefined} disconnect - Disconnect from the device. Supports both promise and callback styles.
 * @property {function(number, function(Error=, any=)=): Promise<void>|undefined} inputKeycode - Send a keycode to the device. Supports both promise and callback styles.
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

/**
 * Remote keys mapping loaded from JSON file.
 * @internal
 * @type {string[]}
 */
import remoteKeys from "../data/remote-keys.json" with { type: "json" };

/**
 * Factory function to create a Remote instance.
 * @function
 * @public
 * @param {RemoteConfig} config - Configuration for the remote.
 * @returns {Remote}
 */
export default function createRemote(config) {
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
	function disconnect() {
		if (disconnectTimer) {
			clearTimeout(disconnectTimer);
			disconnectTimer = null;
		}
		stopHeartbeat();
		return client
			.disconnect(ip, port)
			.then(() => {
				connected = false;
				if (!quiet) emitLog("info", `Disconnected from ${host}`, "disconnect");
				return true;
			})
			.catch((err) => {
				if (err.message && err.message.includes("disconnected")) {
					if (!quiet) emitLog("warn", "Device already disconnected before explicit disconnect call", "disconnect");
					connected = false;
					return true;
				}
				return handleDisconnectError(err);
			});
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

	const keyboardKeys = {};
	const keyboardShiftKeys = {};

	for (let i = 0; i < 26; i++) {
		const letter = String.fromCharCode(97 + i);
		const code = 29 + i;
		keyboardKeys[letter] = ((code) => () => inputKeycode(code))(code);
		keyboardShiftKeys[letter] = ((code) => () => {
			return inputKeycode(keycodes.shiftLeft).then(() => inputKeycode(code));
		})(code);
	}

	keyboardKeys.enter = () => inputKeycode(keycodes.enter);
	keyboardKeys.space = () => inputKeycode(keycodes.space);
	keyboardKeys.del = () => inputKeycode(keycodes.del);

	keyboardShiftKeys.enter = () => {
		return inputKeycode(keycodes.shiftLeft).then(() => inputKeycode(keycodes.enter));
	};

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
		 * Get or set Android settings via ADB.
		 * @public
		 * @param {string} mode - 'get' or 'set'.
		 * @param {boolean} [overrideQuiet] - Optionally override the quiet flag for this call.
		 * @returns {Promise<void>}
		 * @fires Remote#log - Emitted with settings operation status and results
		 * @fires Remote#error - Emitted if settings operations fail
		 * @example
		 * remote.handleSettings('get', false);
		 */
		handleSettings(mode, overrideQuiet) {
			const keys = [
				{ ns: "system", key: "screen_off_timeout", value: 2147483647 },
				{ ns: "secure", key: "sleep_timeout", value: 0 },
				{ ns: "global", key: "stay_on_while_plugged_in", value: 3 }
			];
			const useQuiet = typeof overrideQuiet === "boolean" ? overrideQuiet : quiet;
			return client
				.connect(ip, port)
				.then(() => {
					if (!useQuiet) emitLog("info", `Connected to ${host}`, "handleSettings");
					let chain = Promise.resolve();
					keys.forEach((item) => {
						chain = chain.then(() => {
							let cmd;
							if (mode === "set") {
								cmd = `settings put ${item.ns} ${item.key} ${item.value}`;
							} else {
								cmd = `settings get ${item.ns} ${item.key}`;
							}
							return device
								.shell(cmd)
								.then(Adb.util.readAll)
								.then((result) => {
									if (!useQuiet) {
										if (mode === "set") {
											emitLog("info", `Set ${item.ns} ${item.key} to ${item.value}`, "handleSettings");
										} else {
											emitLog("info", `${item.ns} ${item.key}: ${result.toString().trim()}`, "handleSettings");
										}
									}
								});
						});
					});
					return chain;
				})
				.then(() => client.disconnect(ip, port))
				.then(() => {
					if (!useQuiet) emitLog("info", "Disconnected cleanly", "handleSettings");
				})
				.catch((err) => {
					if (err.message && err.message.includes("disconnected")) {
						if (!useQuiet) emitLog("warn", "Device already disconnected before explicit disconnect call", "handleSettings");
					} else {
						return handleDisconnectError(err);
					}
				});
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
					if (!keycodes[keyName]) {
						const error = new Error("Unknown key: " + keyName);
						emitError(error, "keyboard.key", `Unknown key: ${keyName}`);
						return Promise.reject(error);
					}
					if (!options.forceKeycode) {
						// Try inputText for single character keys
						if (keyName.length === 1) {
							return inputText(keyName);
						}
					}
					// Fallback to keycode
					return inputKeycode(keycodes[keyName]);
				}),
				{
					// Dynamically add all key functions and .keycode subobject
					...(() => {
						const keyFns = {};
						Object.keys(keycodes).forEach((keyName) => {
							/**
							 * Sends this key using inputText (if possible) or keycode fallback.
							 * @returns {Promise<any>}
							 * @example
							 * keyboard.key.a();
							 */
							keyFns[keyName] = wrapAsync(function (options) {
								options = options || {};
								if (!options.forceKeycode && keyName.length === 1) {
									return inputText(keyName);
								}
								return inputKeycode(keycodes[keyName]);
							});
							/**
							 * Sends this key using keycode only.
							 * @returns {Promise<any>}
							 * @example
							 * keyboard.key.a.keycode();
							 */
							keyFns[keyName].keycode = wrapAsync(function () {
								return inputKeycode(keycodes[keyName]);
							});
						});
						return keyFns;
					})(),

					/**
					 * Shift subobject for shifted keys.
					 */
					shift: (() => {
						const shiftFns = {};
						Object.keys(keycodes).forEach((keyName) => {
							/**
							 * Sends this key with shift using inputText (if possible) or keycode fallback.
							 * @returns {Promise<any>}
							 * @example
							 * keyboard.key.shift.a();
							 */
							shiftFns[keyName] = wrapAsync(function (options) {
								options = options || {};
								if (!options.forceKeycode && keyName.length === 1) {
									return inputText(keyName.toUpperCase());
								}
								return inputKeycodeWrapped(keycodes.shiftLeft).then(() => {
									return inputKeycodeLongPressWrapped(keycodes[keyName]);
								});
							});

							/**
							 * Sends this key with shift using keycode only.
							 * @returns {Promise<any>}
							 * @example
							 * keyboard.key.shift.a.keycode();
							 */
							shiftFns[keyName].keycode = wrapAsync(function () {
								return inputKeycodeWrapped(keycodes.shiftLeft).then(() => {
									return inputKeycodeLongPressWrapped(keycodes[keyName]);
								});
							});
						});
						return shiftFns;
					})()
				}
			)
		}
	};
	return remoteApi;
}

/**
 * Create and return a ready-to-use Android TV Remote instance.
 * @public
 * @param {RemoteConfig} config - Configuration for the remote.
 * @returns {Promise<Remote>} Resolves with a ready remote instance.
 * 
 * @description
 * Creates a remote instance and waits for initialization to complete if autoConnect is enabled.
 * 
 * @example
 * // ESM with event handling
 * const remote = await createAndroidTVRemote({ ip: "192.168.1.100" });
 * remote.on('log', (data) => console.log(data));
 * remote.on('error', (data) => console.error(data));
 */
export async function createAndroidTVRemote(config) {
	const remote = createRemote(config);
	
	// Only wait for initialization if autoConnect is enabled
	if (config.autoConnect !== false) {
		await remote.initPromise;
	}
	
	return remote;
}

// Add static create method to the default export
createRemote.create = createAndroidTVRemote;
