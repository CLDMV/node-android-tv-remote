/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/debug-imports.mjs
 *	@Date: 2025-10-16 07:28:14 -07:00 (1760624894)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 07:48:55 -07:00 (1760626135)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */


import keyboardKeys from '../src/data/keyboard-keys.json' with { type: 'json' };
import keycodes from '../src/data/keycodes.json' with { type: 'json' };

console.log('🔍 Debug: Testing keyboard-keys.json import');
console.log('keyboardKeys loaded:', Object.keys(keyboardKeys).length, 'keys');
console.log('First few keys:', Object.keys(keyboardKeys).slice(0, 10));
console.log('Special characters present:');
console.log('  exclamation:', keyboardKeys.exclamation);
console.log('  hash:', keyboardKeys.hash);
console.log('  asterisk:', keyboardKeys.asterisk);
console.log('  tilde:', keyboardKeys.tilde);

console.log('\n🔍 Debug: Testing keycodes.json import');
console.log('keycodes loaded:', Object.keys(keycodes).length, 'keys');
console.log('Keycodes for special chars:');
console.log('  asterisk keycode:', keycodes.asterisk);
console.log('  at keycode:', keycodes.at);
console.log('  hash keycode:', keycodes.hash);