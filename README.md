# @cldmv/node-android-tv-remote

**@cldmv/node-android-tv-remote** is a modern, **event-driven** Node.js module for controlling Android TV devices via ADB. It supports sending keycodes, comprehensive keyboard input (71 characters with smart shift detection), remote control commands, screenshots and device management. It is designed for compatibility with a wide range of Android TV devices, including Fire TV, Chromecast with Google TV, Nvidia Shield and more.

Every remote is an event source: operations report through structured `log` events and failures through structured `error` events instead of writing to the console, so the library slots into an application's own logging and error handling.

> _Drive any Android TV from Node.js — keys, text, screenshots and power — over ADB._

[![npm version]][npm_version_url] [![npm downloads]][npm_downloads_url] [![GitHub downloads]][github_downloads_url] [![Last commit]][last_commit_url] [![npm last update]][npm_last_update_url] [![coverage]][coverage_url]

[![Contributors]][contributors_url] [![Sponsor shinrai]][sponsor_url]

---

## ✨ What's New

### Latest: v2.1.7 (October 2026)

- **CommonJS entry fixed** — `require("@cldmv/node-android-tv-remote")` now loads the ESM build directly through Node's synchronous `require(esm)` and exports `createAndroidTVRemote` alongside `createRemote`, so `require()` and `import` expose the same factories. On Node.js without `require(esm)` (older than ^20.19.0 / >=22.12.0) it throws a clear `ERR_REQUIRE_ESM` that points to `import()`, instead of a bare loader error (#39).
- [View full v2.1.7 Changelog](https://github.com/CLDMV/node-android-tv-remote/blob/master/docs/changelog/v2/v2.1.7.md)

### Recent Releases

- **v2.1.6** (October 2026) — CI only: the in-repo PR mirror job runs instead of being skipped; `sharp` lockfile and `@cldmv/vitest-runner` bumps ([Changelog](https://github.com/CLDMV/node-android-tv-remote/blob/master/docs/changelog/v2/v2.1.6.md))
- **v2.1.5** (October 2026) — maintenance: v4.29.2 workflow sync with bundle-size measurement, required-check mirror fix, uniform file headers; no runtime change ([Changelog](https://github.com/CLDMV/node-android-tv-remote/blob/master/docs/changelog/v2/v2.1.5.md))
- **v2.1.4** (September 2026) — `@devicefarmer/adbkit` 3.3.9 in the lockfile, dead code removed from the screencap path, bot signing secrets wired into the release workflows ([Changelog](https://github.com/CLDMV/node-android-tv-remote/blob/master/docs/changelog/v2/v2.1.4.md))
- **v2.1.3** (September 2026) — Vitest 5 toolchain and a Prettier pass over the source; no behavior change ([Changelog](https://github.com/CLDMV/node-android-tv-remote/blob/master/docs/changelog/v2/v2.1.3.md))

> **Note:** v2.1.1 through v2.1.7 have been released on GitHub but not yet published to npm, where the latest version is v2.1.0. See the changelogs for what changed in between, including the Node.js 20.9.0 floor introduced in v2.1.1.

📚 **For complete version history and detailed release notes, see the [docs/changelog/](https://github.com/CLDMV/node-android-tv-remote/tree/master/docs/changelog/) folder.**

---

## 🚀 Key Features

- 🎯 **Event-driven architecture** - Comprehensive event system with structured data
- ⌨️ **Comprehensive keyboard input** - 71 characters with smart shift detection and special symbols
- 🔄 **ESM & CommonJS support** - Works with both `import` and `require`
- 🛡️ **Error resilience** - Errors are reported as events instead of crashing your app; an `error` listener is optional (see [Event-Driven Usage](#event-driven-usage-recommended))
- 🔗 **Method chaining** - Fluent API for event listener management
- 📊 **Structured logging** - Timestamped, categorized log events with source tracking
- 🚀 **Promise-based** - Modern async/await support with callback compatibility
- 📸 **Advanced screencap** - High-performance PNG screenshots with resizing and thumbnails
- ⚡ **Performance optimized** - Direct PNG streaming with 20x speed improvements
- 🔄 **Device management** - Reboot, wake, settings configuration with event tracking
- 📱 **Universal compatibility** - Works with Fire TV, Chromecast, Shield, and more

---

## 📦 Installation

### Requirements

- **Node.js 20.9.0 or higher** for ESM `import` (the package's `engines` floor, set by the `sharp` dependency).
- **`require()`** loads the ESM build through Node's `require(esm)`, so it needs **Node.js ^20.19.0 or >=22.12.0**. On older Node.js, load the package with `import()` instead.
- The **Android Debug Bridge (ADB)** binary installed and available in your system PATH (see below). A `postinstall` check prints install instructions when `adb` is missing.
- `sharp` installs a platform-specific prebuilt binary; the install environment must be able to fetch it.

### Install

```sh
npm install @cldmv/node-android-tv-remote
```

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

---

## 🚀 Quick Start

```js
// ESM (Node.js with type: "module" in package.json)
import createRemote from "@cldmv/node-android-tv-remote";

// CommonJS
const createRemote = require("@cldmv/node-android-tv-remote");

// Create remote (async function)
const remote = await createRemote({ ip: "192.168.1.100" });

// Use with async/await (recommended)
await remote.press.home();
await remote.press.up();
await remote.press.ok();

// Or chain promises
createRemote({ ip: "192.168.1.100" }).then(async (remote) => {
	await remote.press.home();
	await remote.press.up();
	await remote.press.ok();
});
```

`createAndroidTVRemote(config)` is an alias of `createRemote(config)`, exported by name from both entries:

```js
import { createAndroidTVRemote } from "@cldmv/node-android-tv-remote";
// or: const { createAndroidTVRemote } = require("@cldmv/node-android-tv-remote");

const remote = await createAndroidTVRemote({ ip: "192.168.1.100" });
```

---

## 🎯 Usage

### Event-Driven Usage (Recommended)

This module uses an **event-driven architecture** instead of console logging. All operations emit structured events that you can listen to. The remote is a Node.js event emitter, but an `error` event is only emitted when a listener is attached, so an `error` listener is optional. Without one, the error is emitted as a `log` event with `level: 'error'` and written to `NODE_DEBUG=android-tv-remote`. Register an `error` listener to handle failures yourself:

```js
import createRemote from "@cldmv/node-android-tv-remote";

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
await remote.screencap({ filepath: "./screenshot.png" });
```

### Async Initialization

The createRemote function is async and returns a Promise:

```js
import createRemote from "@cldmv/node-android-tv-remote";

// Async initialization with await
const remote = await createRemote({ ip: "192.168.1.100" });
remote.on("log", console.log);
await remote.press.play();

// Or use .then()
createRemote({ ip: "192.168.1.100" }).then((remote) => {
	remote.on("log", console.log);
	return remote.press.play();
});
```

### Screenshot Functionality

Advanced screencap with resizing, thumbnails, and file saving:

```js
import createRemote from "@cldmv/node-android-tv-remote";

const remote = await createRemote({ ip: "192.168.1.100" });

// Basic screenshot (returns PNG stream)
const stream = await remote.screencap();

// Screenshot with resizing
const resizedStream = await remote.screencap({ width: 1280, height: 720 });

// Save screenshot to file (non-blocking)
await remote.screencap({ filepath: "./screenshot.png" });

// Resized screenshot saved to file
await remote.screencap({
	width: 640,
	height: 360,
	filepath: "./thumbnail.png"
});

// Quick thumbnail (default 240px width)
const thumbStream = await remote.thumbnail();

// Custom thumbnail dimensions
const customThumb = await remote.thumbnail({
	width: 320,
	height: 180,
	filepath: "./thumb.png"
});

// Access last screenshot data
console.log("Last screenshot available:", !!remote.lastScreencapData);

// Listen for screenshot events
remote.on("screencap-complete", (data) => {
	console.log(`Screenshot completed in ${data.timing.total}ms`);
});
```

### Device Management

Comprehensive device control with event tracking:

```js
import createRemote from "@cldmv/node-android-tv-remote";

const remote = await createRemote({ ip: "192.168.1.100" });

// Reboot the device
await remote.reboot();

// Ensure device is awake and responsive
const isAwake = await remote.ensureAwake();

// Configure optimal settings for remote control
await remote.setSettings(); // Set optimal settings
await remote.setSettings("get"); // Get current settings

// Wait for device to finish booting (after reboot)
await remote.waitBootComplete(60000); // 60 second timeout

// Connection management
await remote.connect();
console.log("Connected:", remote.isConnected);
await remote.disconnect();

// Listen for device management events
remote.on("log", (data) => {
	if (data.source === "reboot") {
		console.log(`Reboot: ${data.message}`);
	}
	if (data.source === "ensureAwake") {
		console.log(`Wake: ${data.message}`);
	}
});
```

### Keyboard Input

Comprehensive text input with individual key support and smart shift detection:

```js
import createRemote from "@cldmv/node-android-tv-remote";

const remote = await createRemote({ ip: "192.168.1.100" });

// Text input (recommended for typing sentences)
await remote.keyboard.text("Hello World!");
await remote.keyboard.text("user@example.com");

// Individual character input
await remote.keyboard.key.h(); // Types "h"
await remote.keyboard.key.e(); // Types "e"
await remote.keyboard.key.l(); // Types "l"
await remote.keyboard.key.l(); // Types "l"
await remote.keyboard.key.o(); // Types "o"

// Shifted characters (only available for keys that change when shifted)
await remote.keyboard.key.shift.h(); // Types "H"
await remote.keyboard.key.shift.one(); // Types "!"
await remote.keyboard.key.shift.semicolon(); // Types ":"

// Special characters and symbols
await remote.keyboard.key.space(); // Types " "
await remote.keyboard.key.exclamation(); // Types "!"
await remote.keyboard.key.at(); // Types "@"
await remote.keyboard.key.hash(); // Types "#"
await remote.keyboard.key.dollar(); // Types "$"

// Control keys
await remote.keyboard.key.tab(); // Tab character
await remote.keyboard.key.enter(); // Enter/Return
await remote.keyboard.key.backspace(); // Backspace

// Using keycode fallback (when available for regular keys)
await remote.keyboard.key.a.keycode(); // Sends keycode instead of character

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

---

## 🔧 API

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
- `error` - Emitted when errors occur (structured error data). Each remote has its own listeners. With no `error` listener attached, the error is emitted as a `log` event with `level: 'error'` (the `Error` is in `data.error`) instead of throwing. The failing call still reports it: commands reject, and `connect()` / `disconnect()` resolve with the `Error` as before
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

---

## 📺 Supported Devices

| Device                   | Supported | Native Remote Buttons                       |
| ------------------------ | --------- | ------------------------------------------- |
| Fire TV Stick            | Yes       | Home, Back, Menu, D-Pad, Play/Pause, Volume |
| Chromecast w/ Google TV  | Yes       | Home, Back, Assistant, D-Pad, Volume, Input |
| Nvidia Shield            | Yes       | Home, Back, D-Pad, Play/Pause, Volume       |
| Roku (Android TV)        | Partial   | Home, Back, D-Pad, Play/Pause               |
| Xiaomi Mi Box            | Yes       | Home, Back, D-Pad, Volume                   |
| Sony Bravia (Android TV) | Yes       | Home, Back, D-Pad, Volume, Input            |

See [Keyboard Keys](https://github.com/CLDMV/node-android-tv-remote/blob/master/docs/KEYBOARD_KEYS.md) and [Keycodes](https://github.com/CLDMV/node-android-tv-remote/blob/master/docs/KEYCODES.md) for full lists.

---

## 📚 Documentation

- **[Keyboard Keys](https://github.com/CLDMV/node-android-tv-remote/blob/master/docs/KEYBOARD_KEYS.md)** — every `keyboard.key` character and its shifted variant
- **[Keycodes](https://github.com/CLDMV/node-android-tv-remote/blob/master/docs/KEYCODES.md)** — the Android keycodes behind `press.<key>()` and `inputKeycode()`
- **[Changelog](https://github.com/CLDMV/node-android-tv-remote/tree/master/docs/changelog/)** — release notes for every version

[![CodeFactor]][codefactor_url] [![OpenSSF Scorecard]][ossf_scorecard_url] [![npms.io score]][npms_url] [![npm unpacked size]][npm_size_url] [![Repo size]][repo_size_url]

---

## 🤝 Contributing

Contributions are welcome — open an issue or a pull request on [GitHub](https://github.com/CLDMV/node-android-tv-remote).

```bash
npm test          # Vitest, then the CommonJS entry tests
npm run lint      # ESLint
npm run format    # Prettier
```

[![Contributors]][contributors_url] [![Sponsor shinrai]][sponsor_url]

---

## 🔗 Links

- **npm**: [@cldmv/node-android-tv-remote](https://www.npmjs.com/package/@cldmv/node-android-tv-remote)
- **GitHub**: [CLDMV/node-android-tv-remote](https://github.com/CLDMV/node-android-tv-remote)
- **Issues**: [GitHub Issues](https://github.com/CLDMV/node-android-tv-remote/issues)
- **Changelog**: [docs/changelog/](https://github.com/CLDMV/node-android-tv-remote/tree/master/docs/changelog/)

---

## 📄 License

[![npm license]][npm_license_url]

Apache-2.0 © Shinrai / CLDMV. See [LICENSE](https://github.com/CLDMV/node-android-tv-remote/blob/master/LICENSE) for the full text.

[npm version]: https://img.shields.io/npm/v/%40cldmv%2Fnode-android-tv-remote.svg?style=for-the-badge&logo=npm&logoColor=white&labelColor=CB3837
[npm_version_url]: https://www.npmjs.com/package/@cldmv/node-android-tv-remote
[last commit]: https://img.shields.io/github/last-commit/CLDMV/node-android-tv-remote?style=for-the-badge&logo=github&logoColor=white&labelColor=181717
[last_commit_url]: https://github.com/CLDMV/node-android-tv-remote/commits
[npm last update]: https://img.shields.io/npm/last-update/%40cldmv%2Fnode-android-tv-remote?style=for-the-badge&logo=npm&logoColor=white&labelColor=CB3837
[npm_last_update_url]: https://www.npmjs.com/package/@cldmv/node-android-tv-remote
[codefactor]: https://img.shields.io/codefactor/grade/github/CLDMV/node-android-tv-remote?style=for-the-badge&logo=codefactor&logoColor=white&labelColor=F44A6A
[codefactor_url]: https://www.codefactor.io/repository/github/cldmv/node-android-tv-remote
[openssf scorecard]: https://img.shields.io/ossf-scorecard/github.com/CLDMV/node-android-tv-remote?style=for-the-badge&label=OpenSSF%20Scorecard
[ossf_scorecard_url]: https://scorecard.dev/viewer/?uri=github.com/CLDMV/node-android-tv-remote
[npms.io score]: https://img.shields.io/npms-io/final-score/%40cldmv%2Fnode-android-tv-remote?style=for-the-badge&logo=npms&logoColor=white&labelColor=0B5D57
[npms_url]: https://npms.io/search?q=%40cldmv%2Fnode-android-tv-remote
[npm downloads]: https://img.shields.io/npm/dm/%40cldmv%2Fnode-android-tv-remote.svg?style=for-the-badge&logo=npm&logoColor=white&labelColor=CB3837
[npm_downloads_url]: https://www.npmjs.com/package/@cldmv/node-android-tv-remote
[github downloads]: https://img.shields.io/github/downloads/CLDMV/node-android-tv-remote/total?style=for-the-badge&logo=github&logoColor=white&labelColor=181717
[github_downloads_url]: https://github.com/CLDMV/node-android-tv-remote/releases
[npm unpacked size]: https://img.shields.io/npm/unpacked-size/%40cldmv%2Fnode-android-tv-remote.svg?style=for-the-badge&logo=npm&logoColor=white&labelColor=CB3837
[npm_size_url]: https://www.npmjs.com/package/@cldmv/node-android-tv-remote
[repo size]: https://img.shields.io/github/repo-size/CLDMV/node-android-tv-remote?style=for-the-badge&logo=github&logoColor=white&labelColor=181717
[repo_size_url]: https://github.com/CLDMV/node-android-tv-remote
[npm license]: https://img.shields.io/npm/l/%40cldmv%2Fnode-android-tv-remote.svg?style=for-the-badge&logo=npm&logoColor=white&labelColor=CB3837
[npm_license_url]: https://www.npmjs.com/package/@cldmv/node-android-tv-remote
[coverage]: https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2FCLDMV%2Fnode-android-tv-remote%2Fbadges%2Fcoverage.json&style=for-the-badge&logo=vitest&logoColor=white
[coverage_url]: https://github.com/CLDMV/node-android-tv-remote/blob/badges/coverage.json
[contributors]: https://img.shields.io/github/contributors/CLDMV/node-android-tv-remote.svg?style=for-the-badge&logo=github&logoColor=white&labelColor=181717
[contributors_url]: https://github.com/CLDMV/node-android-tv-remote/graphs/contributors
[sponsor shinrai]: https://img.shields.io/github/sponsors/shinrai?style=for-the-badge&logo=githubsponsors&logoColor=white&labelColor=EA4AAA&label=Sponsor
[sponsor_url]: https://github.com/sponsors/shinrai
