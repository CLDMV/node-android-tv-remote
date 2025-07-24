# Keyboard Keys

[Back to Main README](../README.md) | [Keycodes](./KEYCODES.md)

---

## Table of Contents

- [Overview](#overview)
- [Keyboard Key List](#keyboard-key-list)
- [Supported Devices](#supported-devices)

---

## Overview

The `keyboard.key` and `keyboard.key.shift` APIs provide programmatic access to all keyboard keys, including letters, numbers, and special characters. These keys can be sent as text (where supported) or as keycodes (fallback).

- `keyboard.key.<key>()` — Sends the key as text if possible, otherwise as a keycode.
- `keyboard.key.<key>.keycode()` — Always sends the key as a keycode.
- `keyboard.key.shift.<key>()` — Sends the shifted version (e.g., uppercase letter or symbol).
- `keyboard.key.shift.<key>.keycode()` — Shifted key as keycode only.

## Keyboard Key List

| Key Name | Description          | Example            | Shifted Example          | Notes |
| -------- | -------------------- | ------------------ | ------------------------ | ----- |
| a        | Lowercase letter 'a' | `keyboard.key.a()` | `keyboard.key.shift.a()` |       |
| b        | Lowercase letter 'b' | `keyboard.key.b()` | `keyboard.key.shift.b()` |       |
| c        | Lowercase letter 'c' | `keyboard.key.c()` | `keyboard.key.shift.c()` |       |
| d        | Lowercase letter 'd' | `keyboard.key.d()` | `keyboard.key.shift.d()` |       |
| e        | Lowercase letter 'e' | `keyboard.key.e()` | `keyboard.key.shift.e()` |       |
| f        | Lowercase letter 'f' | `keyboard.key.f()` | `keyboard.key.shift.f()` |       |
| g        | Lowercase letter 'g' | `keyboard.key.g()` | `keyboard.key.shift.g()` |       |
| h        | Lowercase letter 'h' | `keyboard.key.h()` | `keyboard.key.shift.h()` |       |
| i        | Lowercase letter 'i' | `keyboard.key.i()` | `keyboard.key.shift.i()` |       |
| j        | Lowercase letter 'j' | `keyboard.key.j()` | `keyboard.key.shift.j()` |       |
| k        | Lowercase letter 'k' | `keyboard.key.k()` | `keyboard.key.shift.k()` |       |
| l        | Lowercase letter 'l' | `keyboard.key.l()` | `keyboard.key.shift.l()` |       |
| m        | Lowercase letter 'm' | `keyboard.key.m()` | `keyboard.key.shift.m()` |       |
| n        | Lowercase letter 'n' | `keyboard.key.n()` | `keyboard.key.shift.n()` |       |
| o        | Lowercase letter 'o' | `keyboard.key.o()` | `keyboard.key.shift.o()` |       |
| p        | Lowercase letter 'p' | `keyboard.key.p()` | `keyboard.key.shift.p()` |       |
| q        | Lowercase letter 'q' | `keyboard.key.q()` | `keyboard.key.shift.q()` |       |
| r        | Lowercase letter 'r' | `keyboard.key.r()` | `keyboard.key.shift.r()` |       |
| s        | Lowercase letter 's' | `keyboard.key.s()` | `keyboard.key.shift.s()` |       |
| t        | Lowercase letter 't' | `keyboard.key.t()` | `keyboard.key.shift.t()` |       |
| u        | Lowercase letter 'u' | `keyboard.key.u()` | `keyboard.key.shift.u()` |       |
| v        | Lowercase letter 'v' | `keyboard.key.v()` | `keyboard.key.shift.v()` |       |
| w        | Lowercase letter 'w' | `keyboard.key.w()` | `keyboard.key.shift.w()` |       |
| x        | Lowercase letter 'x' | `keyboard.key.x()` | `keyboard.key.shift.x()` |       |
| y        | Lowercase letter 'y' | `keyboard.key.y()` | `keyboard.key.shift.y()` |       |
| z        | Lowercase letter 'z' | `keyboard.key.z()` | `keyboard.key.shift.z()` |       |
| 0        | Digit '0'            | `keyboard.key.0()` | `keyboard.key.shift.0()` |       |
| 1        | Digit '1'            | `keyboard.key.1()` | `keyboard.key.shift.1()` |       |
| 2        | Digit '2'            | `keyboard.key.2()` | `keyboard.key.shift.2()` |       |
| 3        | Digit '3'            | `keyboard.key.3()` | `keyboard.key.shift.3()` |       |
| 4        | Digit '4'            | `keyboard.key.4()` | `keyboard.key.shift.4()` |       |
| 5        | Digit '5'            | `keyboard.key.5()` | `keyboard.key.shift.5()` |       |
| 6        | Digit '6'            | `keyboard.key.6()` | `keyboard.key.shift.6()` |       |
| 7        | Digit '7'            | `keyboard.key.7()` | `keyboard.key.shift.7()` |       |
| 8        | Digit '8'            | `keyboard.key.8()` | `keyboard.key.shift.8()` |       |
| 9        | Digit '9'            | `keyboard.key.9()` | `keyboard.key.shift.9()` |       |

> All other keys are keycodes. See [Keycodes](./KEYCODES.md) for the full list.

> **Note:** Not all Android TV devices support all keyboard keys as text input. Keycode fallback is used where possible.

## Supported Devices

| Device                   | Keyboard Text Input | Keycode Fallback |
| ------------------------ | ------------------- | ---------------- |
| Fire TV Stick            | Yes                 | Yes              |
| Chromecast w/ Google TV  | Yes                 | Yes              |
| Nvidia Shield            | Yes                 | Yes              |
| Roku (Android TV)        | Partial             | Yes              |
| Xiaomi Mi Box            | Yes                 | Yes              |
| Sony Bravia (Android TV) | Yes                 | Yes              |

See [Keycodes](./KEYCODES.md) for the full set of keycodes available.
