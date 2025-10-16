/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/debug-chars.mjs
 *	@Date: 2025-10-16 07:32:01 -07:00 (1760625121)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 07:49:12 -07:00 (1760626152)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */


import keyboardKeys from '../src/data/keyboard-keys.json' with { type: 'json' };

console.log('🔍 Debug: Checking for problematic characters');

// Test which keys might cause JavaScript issues
Object.keys(keyboardKeys).forEach(keyName => {
    try {
        // Test if the key name can be used as a JavaScript property
        const testObj = {};
        testObj[keyName] = 'test';
        
        // Test if the character value might cause issues
        const char = keyboardKeys[keyName];
        console.log(`✅ ${keyName}: "${char}" (${char.charCodeAt(0)})`);
        
    } catch (error) {
        console.log(`❌ ${keyName}: ERROR - ${error.message}`);
    }
});

console.log('\n🔍 Characters with escape sequences:');
Object.keys(keyboardKeys).forEach(keyName => {
    const char = keyboardKeys[keyName];
    if (char.includes('\\') || char.charCodeAt(0) < 32) {
        console.log(`  ${keyName}: "${char}" (charCode: ${char.charCodeAt(0)})`);
    }
});