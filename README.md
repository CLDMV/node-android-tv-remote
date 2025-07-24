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
