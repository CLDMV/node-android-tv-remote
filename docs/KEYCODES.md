# Keycodes

[Back to Main README](../README.md) | [Keyboard Keys](./KEYBOARD_KEYS.md)

---

## Table of Contents

- [Overview](#overview)
- [Keycode List](#keycode-list)
- [Supported Devices](#supported-devices)

---

## Overview

The `press` API and `inputKeycode` method use Android keycodes to control the device. These keycodes map to physical or virtual buttons on Android TV remotes.

- `press.<key>()` — Sends the corresponding keycode for the remote key.
- `press.long.<key>()` — Sends a long-press for the remote key.
- `inputKeycode(code)` — Sends a raw Android keycode.

## Keycode List

| Key Name   | Keycode | Description            | On Native Remote? | Notes                  |
| ---------- | ------- | ---------------------- | ----------------- | ---------------------- |
| home       | 3       | Home button            | Yes (most)        |                        |
| back       | 4       | Back button            | Yes (most)        |                        |
| dpadUp     | 19      | D-Pad Up               | Yes               |                        |
| dpadDown   | 20      | D-Pad Down             | Yes               |                        |
| dpadLeft   | 21      | D-Pad Left             | Yes               |                        |
| dpadRight  | 22      | D-Pad Right            | Yes               |                        |
| dpadCenter | 23      | D-Pad Center/OK/Select | Yes               |                        |
| menu       | 82      | Menu/Options           | Some              |                        |
| playPause  | 85      | Play/Pause             | Yes (some)        |                        |
| volumeUp   | 24      | Volume Up              | Yes (some)        |                        |
| volumeDown | 25      | Volume Down            | Yes (some)        |                        |
| volumeMute | 164     | Mute                   | Some              |                        |
| input      | 178     | Input/Source           | Some              |                        |
| ...        | ...     | ...                    | ...               | See full keycodes.json |

> **Note:** The full list of keycodes is available in [keycodes.json](../src/data/keycodes.json).

## Supported Devices

| Device                   | Remote Key Support | Notes                                       |
| ------------------------ | ------------------ | ------------------------------------------- |
| Fire TV Stick            | Most keys          | Home, Back, D-Pad, Play/Pause, Volume       |
| Chromecast w/ Google TV  | Most keys          | Home, Back, Assistant, D-Pad, Volume, Input |
| Nvidia Shield            | Most keys          | Home, Back, D-Pad, Play/Pause, Volume       |
| Roku (Android TV)        | Partial            | Home, Back, D-Pad, Play/Pause               |
| Xiaomi Mi Box            | Most keys          | Home, Back, D-Pad, Volume                   |
| Sony Bravia (Android TV) | Most keys          | Home, Back, D-Pad, Volume, Input            |

See [Keyboard Keys](./KEYBOARD_KEYS.md) for keyboard input support.
