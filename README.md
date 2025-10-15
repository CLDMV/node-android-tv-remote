# Android TV Remote Node Module

[Keyboard Keys](./docs/KEYBOARD_KEYS.md) | [Keycodes](./docs/KEYCODES.md)

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [Supported Devices](#supported-devices)
- [Keyboard Keys](./docs/KEYBOARD_KEYS.md)
- [Keycodes](./docs/KEYCODES.md)

---

## Overview

A modern, **event-driven** Node.js module for controlling Android TV devices via ADB. Supports sending keycodes, keyboard input, and remote control commands. Designed for compatibility with a wide range of Android TV devices, including Fire TV, Chromecast with Google TV, and more.

### Key Features

- 🎯 **Event-driven architecture** - No console pollution, structured event data
- 🔄 **ESM & CommonJS support** - Works with both `import` and `require`
- 🛡️ **Error resilience** - Errors emit events instead of crashing your app
- 🔗 **Method chaining** - Fluent API for event listener management
- 📊 **Structured logging** - Timestamped, categorized log events with source tracking
- 🚀 **Promise-based** - Modern async/await support with callback compatibility

## Installation

This module requires the Android Debug Bridge (ADB) binary to be installed and available in your system PATH.

### Install ADB

#### Windows

1. Download the [SDK Platform Tools for Windows](https://developer.android.com/studio/releases/platform-tools).
2. Extract the ZIP file.
3. Add the extracted folder to your system PATH (so you can run `adb` from any terminal).
4. Test by running `adb version` in Command Prompt.

#### macOS

1. Download the [SDK Platform Tools for Mac](https://developer.android.com/studio/releases/platform-tools).
2. Extract the ZIP file.
3. Move the extracted folder to a location like `/usr/local/bin` or add it to your PATH.
4. Test by running `adb version` in Terminal.

#### Linux

1. Download the [SDK Platform Tools for Linux](https://developer.android.com/studio/releases/platform-tools).
2. Extract the ZIP file.
3. Move the extracted folder to `/usr/local/bin` or add it to your PATH.
4. You may also install via your package manager:
   - Ubuntu/Debian: `sudo apt-get install android-tools-adb`
   - Fedora/Red Hat: `sudo dnf install android-tools`
   - CentOS/yum: `sudo yum install android-tools`
5. Test by running `adb version` in your shell.

> **Note:** You must accept the ADB authorization prompt on your Android TV device the first time you connect.

### Install the Node Module

```sh
npm install android-tv-remote
```

## Usage

### Basic Usage

```js
// ESM
import createRemote from "android-tv-remote";

// CJS
const createRemote = require("android-tv-remote");

const remote = createRemote({ ip: "192.168.1.100" });

// Connect
await remote.connect();

// Press Home
await remote.press.home();

// Type text
await remote.keyboard.text("hello world");

// Disconnect
await remote.disconnect();
```

### Event-Driven Usage (Recommended)

This module uses an **event-driven architecture** instead of console logging. All operations emit structured events that you can listen to:

```js
import createRemote from "android-tv-remote";

const remote = createRemote({ ip: "192.168.1.100" });

// Listen for log events (info, warn, error, debug)
remote.on("log", (data) => {
	console.log(`[${data.level}] ${data.source}: ${data.message}`);
});

// Listen for error events
remote.on("error", (data) => {
	console.error(`ERROR from ${data.source}:`, data.error.message);

	// Handle specific error types
	if (data.error.message.includes("device unauthorized")) {
		console.log("Please authorize ADB on your Android TV device");
	}
});

// Use the remote
await remote.press.home();
```

### Static Create Method

For cleaner async initialization:

```js
import { createAndroidTVRemote } from "android-tv-remote";

const remote = await createAndroidTVRemote({ ip: "192.168.1.100" });
remote.on("log", console.log);
await remote.press.play();
```

### Event Data Structure

**Log Events:**

```js
{
  level: 'info' | 'warn' | 'error' | 'debug',
  message: 'Human readable message',
  source: 'connect' | 'disconnect' | 'handleSettings' | etc,
  timestamp: '2025-10-15T18:37:44.854Z',
  data?: any // Optional additional data
}
```

**Error Events:**

```js
{
  error: Error, // The actual error object
  source: 'connect' | 'adb' | 'keyboard.key' | etc,
  message: 'Human readable error message',
  timestamp: '2025-10-15T18:37:44.854Z'
}
```

## API

### Main Methods

- `connect()` / `disconnect()` - Device connection management
- `press.<key>()` / `press.long.<key>()` - Remote control buttons
- `keyboard.text(text)` - Text input
- `keyboard.key.<key>()` / `keyboard.key.<key>.keycode()` - Individual keys
- `keyboard.key.shift.<key>()` / `keyboard.key.shift.<key>.keycode()` - Shifted keys
- `inputKeycode(code)` - Raw Android keycodes
- `handleSettings(mode, [overrideQuiet])` - Android settings management

### Event Methods

- `on(event, listener)` - Add event listener (returns remote for chaining)
- `off(event, listener)` - Remove event listener (returns remote for chaining)
- `once(event, listener)` - Add one-time event listener (returns remote for chaining)
- `emit(event, ...args)` - Emit custom events

### Events

- `log` - Emitted for all operations (info, warn, error, debug levels)
- `error` - Emitted when errors occur (structured error data)

### Properties

- `isConnected` - Boolean indicating connection status
- `initPromise` - Promise that resolves when initialization completes

See JSDoc comments in source code for full API documentation.

## Supported Devices

| Device                   | Supported | Native Remote Buttons                       |
| ------------------------ | --------- | ------------------------------------------- |
| Fire TV Stick            | Yes       | Home, Back, Menu, D-Pad, Play/Pause, Volume |
| Chromecast w/ Google TV  | Yes       | Home, Back, Assistant, D-Pad, Volume, Input |
| Nvidia Shield            | Yes       | Home, Back, D-Pad, Play/Pause, Volume       |
| Roku (Android TV)        | Partial   | Home, Back, D-Pad, Play/Pause               |
| Xiaomi Mi Box            | Yes       | Home, Back, D-Pad, Volume                   |
| Sony Bravia (Android TV) | Yes       | Home, Back, D-Pad, Volume, Input            |

See [Keyboard Keys](./docs/KEYBOARD_KEYS.md) and [Keycodes](./docs/KEYCODES.md) for full lists.

---

## License

MIT
