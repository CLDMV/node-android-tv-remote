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

A modern, **event-driven** Node.js module for controlling Android TV devices via ADB. Supports sending keycodes, comprehensive keyboard input (71 characters with smart shift detection), and remote control commands. Designed for compatibility with a wide range of Android TV devices, including Fire TV, Chromecast with Google TV, and more.

### Key Features

- 🎯 **Event-driven architecture** - Comprehensive event system with structured data
- ⌨️ **Comprehensive keyboard input** - 71 characters with smart shift detection and special symbols
- 🔄 **ESM & CommonJS support** - Works with both `import` and `require`
- 🛡️ **Error resilience** - Errors emit events instead of crashing your app
- 🔗 **Method chaining** - Fluent API for event listener management
- 📊 **Structured logging** - Timestamped, categorized log events with source tracking
- 🚀 **Promise-based** - Modern async/await support with callback compatibility
- 📸 **Advanced screencap** - High-performance PNG screenshots with resizing and thumbnails
- ⚡ **Performance optimized** - Direct PNG streaming with 20x speed improvements
- 🔄 **Device management** - Reboot, wake, settings configuration with event tracking
- 📱 **Universal compatibility** - Works with Fire TV, Chromecast, Shield, and more

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
```js
// ESM (Node.js with type: "module" in package.json)
import createRemote from "android-tv-remote";

// CommonJS
const createRemote = require("android-tv-remote");

// Create remote (async function)
const remote = await createRemote({ ip: "192.168.1.100" });

// Use with async/await (recommended)
await remote.press.home();
await remote.press.up();
await remote.press.ok();

// Or chain promises
createRemote({ ip: "192.168.1.100" })
  .then(remote => remote.press.home())
  .then(() => remote.press.up())
  .then(() => remote.press.ok());
```
```

### Event-Driven Usage (Recommended)

This module uses an **event-driven architecture** instead of console logging. All operations emit structured events that you can listen to:

```js
import createRemote from "android-tv-remote";

const remote = await createRemote({ ip: "192.168.1.100" });

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

// Listen for screenshot events
remote.on("screencap-complete", (data) => {
	console.log(`Screenshot completed in ${data.timing.total}ms`);
});

// Use the remote
await remote.press.home();
await remote.screencap({ filepath: './screenshot.png' });
```

### Async Initialization

The createRemote function is async and returns a Promise:

```js
import createRemote from "android-tv-remote";

// Async initialization with await
const remote = await createRemote({ ip: "192.168.1.100" });
remote.on("log", console.log);
await remote.press.play();

// Or use .then()
createRemote({ ip: "192.168.1.100" })
  .then(remote => {
    remote.on("log", console.log);
    return remote.press.play();
  });
```

### Screenshot Functionality

Advanced screencap with resizing, thumbnails, and file saving:

```js
import createRemote from "android-tv-remote";

const remote = await createRemote({ ip: "192.168.1.100" });

// Basic screenshot (returns PNG stream)
const stream = await remote.screencap();

// Screenshot with resizing
const resizedStream = await remote.screencap({ width: 1280, height: 720 });

// Save screenshot to file (non-blocking)
await remote.screencap({ filepath: './screenshot.png' });

// Resized screenshot saved to file
await remote.screencap({ 
  width: 640, 
  height: 360, 
  filepath: './thumbnail.png' 
});

// Quick thumbnail (default 240px width)
const thumbStream = await remote.thumbnail();

// Custom thumbnail dimensions
const customThumb = await remote.thumbnail({ 
  width: 320, 
  height: 180, 
  filepath: './thumb.png' 
});

// Access last screenshot data
console.log('Last screenshot available:', !!remote.lastScreencapData);

// Listen for screenshot events
remote.on('screencap-complete', (data) => {
  console.log(`Screenshot completed in ${data.timing.total}ms`);
});
```

### Device Management

Comprehensive device control with event tracking:

```js
import createRemote from "android-tv-remote";

const remote = await createRemote({ ip: "192.168.1.100" });

// Reboot the device
await remote.reboot();

// Ensure device is awake and responsive
const isAwake = await remote.ensureAwake();

// Configure optimal settings for remote control
await remote.setSettings(); // Set optimal settings
await remote.setSettings('get'); // Get current settings

// Wait for device to finish booting (after reboot)
await remote.waitBootComplete(60000); // 60 second timeout

// Connection management
await remote.connect();
console.log('Connected:', remote.isConnected);
await remote.disconnect();

// Listen for device management events
remote.on('log', (data) => {
  if (data.source === 'reboot') {
    console.log(`Reboot: ${data.message}`);
  }
  if (data.source === 'ensureAwake') {
    console.log(`Wake: ${data.message}`);
  }
});
```

### Keyboard Input

Comprehensive text input with individual key support and smart shift detection:

```js
import createRemote from "android-tv-remote";

const remote = await createRemote({ ip: "192.168.1.100" });

// Text input (recommended for typing sentences)
await remote.keyboard.text("Hello World!");
await remote.keyboard.text("user@example.com");

// Individual character input
await remote.keyboard.key.h();           // Types "h"
await remote.keyboard.key.e();           // Types "e" 
await remote.keyboard.key.l();           // Types "l"
await remote.keyboard.key.l();           // Types "l"
await remote.keyboard.key.o();           // Types "o"

// Shifted characters (only available for keys that change when shifted)
await remote.keyboard.key.shift.h();     // Types "H"
await remote.keyboard.key.shift.one();   // Types "!"
await remote.keyboard.key.shift.semicolon(); // Types ":"

// Special characters and symbols
await remote.keyboard.key.space();       // Types " "
await remote.keyboard.key.exclamation(); // Types "!"
await remote.keyboard.key.at();          // Types "@"
await remote.keyboard.key.hash();        // Types "#"
await remote.keyboard.key.dollar();      // Types "$"

// Control keys
await remote.keyboard.key.tab();         // Tab character
await remote.keyboard.key.enter();       // Enter/Return
await remote.keyboard.key.backspace();   // Backspace

// Using keycode fallback (when available for regular keys)
await remote.keyboard.key.a.keycode();   // Sends keycode instead of character

// Note: Shift variants are only available for keys that actually change
// when shifted (letters, numbers, and some symbols). Special characters 
// like @, #, !, etc. don't have shift variants since they're already 
// the shifted form. Shift keys only support text input, not keycodes,
// since Android ADB doesn't support sending multiple keycodes simultaneously.
```

### Event Data Structure

**Log Events:**

```js
{
  level: 'info' | 'warn' | 'error' | 'debug',
  message: 'Human readable message',
  source: 'connect' | 'disconnect' | 'screencap' | 'reboot' | 'ensureAwake' | etc,
  timestamp: '2025-10-15T18:37:44.854Z',
  data?: any // Optional additional data
}
```

**Error Events:**

```js
{
  error: Error, // The actual error object
  source: 'connect' | 'adb' | 'screencap' | 'reboot' | etc,
  message: 'Human readable error message',
  timestamp: '2025-10-15T18:37:44.854Z'
}
```

**Screenshot Events:**

```js
// screencap-complete event
{
  timestamp: '2025-10-15T18:37:44.854Z',
  filepath?: './screenshot.png', // If saved to file
  processed: true, // Whether Sharp processing was used
  width?: 1280,
  height?: 720,
  timing: {
    capture: 25.4, // ADB capture time in ms
    sharpProcess?: 1.2, // Sharp processing time in ms
    total: 26.6 // Total operation time in ms
  }
}
```

## API

### Main Methods

- `connect()` / `disconnect()` - Device connection management
- `press.<key>()` / `press.long.<key>()` - Remote control buttons
- `keyboard.text(text)` - Text input
- `keyboard.key.<key>()` / `keyboard.key.<key>.keycode()` - Individual keys (71 available)
- `keyboard.key.shift.<key>()` - Shifted keys (47 available, text input only)
- `inputKeycode(code)` - Raw Android keycodes
- `reboot()` - Reboot the Android TV device
- `ensureAwake()` - Ensure device is awake and responsive
- `setSettings(mode)` - Configure optimal Android TV settings
- `waitBootComplete(timeout)` - Wait for device boot completion
- `screencap(options)` - Take PNG screenshots with optional resizing and file saving
- `thumbnail(options)` - Take thumbnail screenshots (default 240px width)

### Event Methods

- `on(event, listener)` - Add event listener (returns remote for chaining)
- `off(event, listener)` - Remove event listener (returns remote for chaining)
- `once(event, listener)` - Add one-time event listener (returns remote for chaining)
- `emit(event, ...args)` - Emit custom events

### Events

- `log` - Emitted for all operations (info, warn, error, debug levels)
- `error` - Emitted when errors occur (structured error data)
- `screencap-start` - Emitted when screenshot capture begins
- `screencap-captured` - Emitted when raw screenshot is captured
- `screencap-processing` - Emitted when image processing begins
- `screencap-ready` - Emitted when processed stream is ready
- `screencap-saved` - Emitted when screenshot is saved to file
- `screencap-complete` - Emitted when entire screenshot operation completes

### Properties

- `isConnected` - Boolean indicating connection status
- `initPromise` - Promise that resolves when initialization completes
- `lastScreencapData` - Buffer/Stream containing the last captured screenshot data

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
