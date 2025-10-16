# Keyboard Keys

[Back to Main README](../README.md) | [Keycodes](./KEYCODES.md)

---

## Table of Contents

- [Overview](#overview)
- [Keyboard Key List](#keyboard-key-list)
- [Supported Devices](#supported-devices)

---

## Overview

The `keyboard.key` and `keyboard.key.shift` APIs provide programmatic access to **actual keyboard characters only** - letters, numbers, and typeable symbols. These keys are sent as text input to the device, with keycode fallback available.

**Remote control buttons** like `wakeup`, `power`, `home`, `back`, `menu` are available through the `press` API, not the keyboard API.

- `keyboard.key.<key>()` — Sends the character as text input.
- `keyboard.key.<key>.keycode()` — Sends the character as a keycode.
- `keyboard.key.shift.<key>()` — Sends the shifted version (e.g., uppercase letter or symbol).

**Note:** Shift keys do **not** have `.keycode()` methods because Android ADB doesn't support sending multiple keycodes simultaneously (shift + key combinations).

## Keyboard Key List

| Key Name     | Character | Description          | Example                       | Shifted Example                     | Shifted Character | Notes |
| ------------ | --------- | -------------------- | ----------------------------- | ----------------------------------- | ----------------- | ----- |
| a            | a         | Lowercase letter 'a' | `keyboard.key.a()`            | `keyboard.key.shift.a()`            | A                 |       |
| b            | b         | Lowercase letter 'b' | `keyboard.key.b()`            | `keyboard.key.shift.b()`            | B                 |       |
| c            | c         | Lowercase letter 'c' | `keyboard.key.c()`            | `keyboard.key.shift.c()`            | C                 |       |
| d            | d         | Lowercase letter 'd' | `keyboard.key.d()`            | `keyboard.key.shift.d()`            | D                 |       |
| e            | e         | Lowercase letter 'e' | `keyboard.key.e()`            | `keyboard.key.shift.e()`            | E                 |       |
| f            | f         | Lowercase letter 'f' | `keyboard.key.f()`            | `keyboard.key.shift.f()`            | F                 |       |
| g            | g         | Lowercase letter 'g' | `keyboard.key.g()`            | `keyboard.key.shift.g()`            | G                 |       |
| h            | h         | Lowercase letter 'h' | `keyboard.key.h()`            | `keyboard.key.shift.h()`            | H                 |       |
| i            | i         | Lowercase letter 'i' | `keyboard.key.i()`            | `keyboard.key.shift.i()`            | I                 |       |
| j            | j         | Lowercase letter 'j' | `keyboard.key.j()`            | `keyboard.key.shift.j()`            | J                 |       |
| k            | k         | Lowercase letter 'k' | `keyboard.key.k()`            | `keyboard.key.shift.k()`            | K                 |       |
| l            | l         | Lowercase letter 'l' | `keyboard.key.l()`            | `keyboard.key.shift.l()`            | L                 |       |
| m            | m         | Lowercase letter 'm' | `keyboard.key.m()`            | `keyboard.key.shift.m()`            | M                 |       |
| n            | n         | Lowercase letter 'n' | `keyboard.key.n()`            | `keyboard.key.shift.n()`            | N                 |       |
| o            | o         | Lowercase letter 'o' | `keyboard.key.o()`            | `keyboard.key.shift.o()`            | O                 |       |
| p            | p         | Lowercase letter 'p' | `keyboard.key.p()`            | `keyboard.key.shift.p()`            | P                 |       |
| q            | q         | Lowercase letter 'q' | `keyboard.key.q()`            | `keyboard.key.shift.q()`            | Q                 |       |
| r            | r         | Lowercase letter 'r' | `keyboard.key.r()`            | `keyboard.key.shift.r()`            | R                 |       |
| s            | s         | Lowercase letter 's' | `keyboard.key.s()`            | `keyboard.key.shift.s()`            | S                 |       |
| t            | t         | Lowercase letter 't' | `keyboard.key.t()`            | `keyboard.key.shift.t()`            | T                 |       |
| u            | u         | Lowercase letter 'u' | `keyboard.key.u()`            | `keyboard.key.shift.u()`            | U                 |       |
| v            | v         | Lowercase letter 'v' | `keyboard.key.v()`            | `keyboard.key.shift.v()`            | V                 |       |
| w            | w         | Lowercase letter 'w' | `keyboard.key.w()`            | `keyboard.key.shift.w()`            | W                 |       |
| x            | x         | Lowercase letter 'x' | `keyboard.key.x()`            | `keyboard.key.shift.x()`            | X                 |       |
| y            | y         | Lowercase letter 'y' | `keyboard.key.y()`            | `keyboard.key.shift.y()`            | Y                 |       |
| z            | z         | Lowercase letter 'z' | `keyboard.key.z()`            | `keyboard.key.shift.z()`            | Z                 |       |
| 0            | 0         | Digit '0'            | `keyboard.key.0()`            | `keyboard.key.shift.0()`            | )                 |       |
| 1            | 1         | Digit '1'            | `keyboard.key.1()`            | `keyboard.key.shift.1()`            | !                 |       |
| 2            | 2         | Digit '2'            | `keyboard.key.2()`            | `keyboard.key.shift.2()`            | @                 |       |
| 3            | 3         | Digit '3'            | `keyboard.key.3()`            | `keyboard.key.shift.3()`            | #                 |       |
| 4            | 4         | Digit '4'            | `keyboard.key.4()`            | `keyboard.key.shift.4()`            | $                 |       |
| 5            | 5         | Digit '5'            | `keyboard.key.5()`            | `keyboard.key.shift.5()`            | %                 |       |
| 6            | 6         | Digit '6'            | `keyboard.key.6()`            | `keyboard.key.shift.6()`            | ^                 |       |
| 7            | 7         | Digit '7'            | `keyboard.key.7()`            | `keyboard.key.shift.7()`            | &                 |       |
| 8            | 8         | Digit '8'            | `keyboard.key.8()`            | `keyboard.key.shift.8()`            | \*                |       |
| 9            | 9         | Digit '9'            | `keyboard.key.9()`            | `keyboard.key.shift.9()`            | (                 |       |
| comma        | ,         | Comma                | `keyboard.key.comma()`        | `keyboard.key.shift.comma()`        | <                 |       |
| period       | .         | Period               | `keyboard.key.period()`       | `keyboard.key.shift.period()`       | >                 |       |
| semicolon    | ;         | Semicolon            | `keyboard.key.semicolon()`    | `keyboard.key.shift.semicolon()`    | :                 |       |
| apostrophe   | '         | Apostrophe           | `keyboard.key.apostrophe()`   | `keyboard.key.shift.apostrophe()`   | "                 |       |
| slash        | /         | Forward slash        | `keyboard.key.slash()`        | `keyboard.key.shift.slash()`        | ?                 |       |
| backslash    | \         | Backslash            | `keyboard.key.backslash()`    | `keyboard.key.shift.backslash()`    | \|                |       |
| leftBracket  | [         | Left bracket         | `keyboard.key.leftBracket()`  | `keyboard.key.shift.leftBracket()`  | {                 |       |
| rightBracket | ]         | Right bracket        | `keyboard.key.rightBracket()` | `keyboard.key.shift.rightBracket()` | }                 |       |
| minus        | -         | Hyphen/minus         | `keyboard.key.minus()`        | `keyboard.key.shift.minus()`        | \_                |       |
| equals       | =         | Equals sign          | `keyboard.key.equals()`       | `keyboard.key.shift.equals()`       | +                 |       |
| grave        | `         | Grave/backtick       | `keyboard.key.grave()`        | `keyboard.key.shift.grave()`        | ~                 |       |

### Special Characters (No Shift Variants)

**Note:** These characters are already the "shifted" versions of other keys, so they don't have shift variants.

| Key Name    | Character | Description       | Example                      | Notes              |
| ----------- | --------- | ----------------- | ---------------------------- | ------------------ |
| exclamation | !         | Exclamation mark  | `keyboard.key.exclamation()` | Shift+1 equivalent |
| at          | @         | At symbol         | `keyboard.key.at()`          | Shift+2 equivalent |
| hash        | #         | Hash/pound        | `keyboard.key.hash()`        | Shift+3 equivalent |
| dollar      | $         | Dollar sign       | `keyboard.key.dollar()`      | Shift+4 equivalent |
| percent     | %         | Percent sign      | `keyboard.key.percent()`     | Shift+5 equivalent |
| caret       | ^         | Caret             | `keyboard.key.caret()`       | Shift+6 equivalent |
| ampersand   | &         | Ampersand         | `keyboard.key.ampersand()`   | Shift+7 equivalent |
| asterisk    | \*        | Asterisk          | `keyboard.key.asterisk()`    | Shift+8 equivalent |
| leftParen   | (         | Left parenthesis  | `keyboard.key.leftParen()`   | Shift+9 equivalent |
| rightParen  | )         | Right parenthesis | `keyboard.key.rightParen()`  | Shift+0 equivalent |
| underscore  | \_        | Underscore        | `keyboard.key.underscore()`  | Shift+- equivalent |
| plus        | +         | Plus symbol       | `keyboard.key.plus()`        | Shift+= equivalent |
| leftBrace   | {         | Left brace        | `keyboard.key.leftBrace()`   | Shift+[ equivalent |
| rightBrace  | }         | Right brace       | `keyboard.key.rightBrace()`  | Shift+] equivalent |
| pipe        | \|        | Pipe/vertical bar | `keyboard.key.pipe()`        | Shift+\ equivalent |
| colon       | :         | Colon             | `keyboard.key.colon()`       | Shift+; equivalent |
| quote       | "         | Double quote      | `keyboard.key.quote()`       | Shift+' equivalent |
| lessThan    | <         | Less than         | `keyboard.key.lessThan()`    | Shift+, equivalent |
| greaterThan | >         | Greater than      | `keyboard.key.greaterThan()` | Shift+. equivalent |
| question    | ?         | Question mark     | `keyboard.key.question()`    | Shift+/ equivalent |
| tilde       | ~         | Tilde             | `keyboard.key.tilde()`       | Shift+` equivalent |

### Control Keys

| Key Name | Character | Description     | Example                | Shifted Example | Notes            |
| -------- | --------- | --------------- | ---------------------- | --------------- | ---------------- |
| space    | (space)   | Space character | `keyboard.key.space()` | N/A             | No shift variant |
| tab      | (tab)     | Tab character   | `keyboard.key.tab()`   | N/A             | No shift variant |
| enter    | (enter)   | Enter/return    | `keyboard.key.enter()` | N/A             | No shift variant |

> **Note:** For remote control functions like navigation (up/down/left/right), media controls (play/pause), or power functions, use the `press` API instead: `remote.press.home()`, `remote.press.power()`, `remote.press.wakeup()`, etc.

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
