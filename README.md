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

A Node.js module for controlling Android TV devices via ADB. Supports sending keycodes, keyboard input, and remote control commands. Designed for compatibility with a wide range of Android TV devices, including Fire TV, Chromecast with Google TV, and more.

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

```js
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

## API

See [API documentation](#) for full details. Main methods:

- `connect()` / `disconnect()`
- `press.<key>()` / `press.long.<key>()`
- `keyboard.text(text)`
- `keyboard.key.<key>()` / `keyboard.key.<key>.keycode()`
- `keyboard.key.shift.<key>()` / `keyboard.key.shift.<key>.keycode()`
- `inputKeycode(code)`
- `handleSettings(mode, [overrideQuiet])`

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
