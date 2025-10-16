/**
 *	@Project: @cldmv/node-android-tv-remote
 *	@Filename: /test/debug-keyboard-creation.mjs
 *	@Date: 2025-10-16 07:28:49 -07:00 (1760624929)
 *	@Author: Nate Hyson <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Hyson <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2025-10-16 07:49:07 -07:00 (1760626147)
 *	-----
 *	@Copyright: Copyright (c) 2013-2025 Catalyzed Motivation Inc. All rights reserved.
 */


import createRemote from '../src/lib/android-tv-remote.mjs';
import keyboardKeys from '../src/data/keyboard-keys.json' with { type: 'json' };

async function debugKeyboardCreation() {
    console.log('🔍 Debug: Keyboard Key Generation');
    
    console.log('\n📋 Raw keyboardKeys from JSON:');
    console.log('Keys count:', Object.keys(keyboardKeys).length);
    console.log('Sample keys:', Object.keys(keyboardKeys).slice(0, 15));
    console.log('Special characters:', Object.keys(keyboardKeys).filter(key => !key.match(/^[a-z0-9]$/)));
    
    console.log('\n📋 Creating remote and checking keyboard object:');
    const remote = await createRemote({
        ip: "192.168.1.100",
        autoConnect: false
    });
    
    console.log('remote.keyboard exists:', !!remote.keyboard);
    console.log('remote.keyboard.key exists:', !!remote.keyboard.key);
    
    const allKeyboardKeys = Object.keys(remote.keyboard.key);
    console.log('All keyboard.key properties:', allKeyboardKeys.length);
    console.log('Properties that are functions:', allKeyboardKeys.filter(key => typeof remote.keyboard.key[key] === 'function').length);
    console.log('Properties that are objects:', allKeyboardKeys.filter(key => typeof remote.keyboard.key[key] === 'object').length);
    console.log('Properties that are other:', allKeyboardKeys.filter(key => typeof remote.keyboard.key[key] !== 'function' && typeof remote.keyboard.key[key] !== 'object').length);
    
    console.log('\n📋 Function vs non-function properties:');
    allKeyboardKeys.forEach(key => {
        const type = typeof remote.keyboard.key[key];
        if (type !== 'function') {
            console.log(`  ${key}: ${type}`);
        }
    });
    
    console.log('\n📋 Testing specific special character keys:');
    const testKeys = ['exclamation', 'hash', 'asterisk', 'leftParen', 'tilde', 'at', 'plus'];
    testKeys.forEach(key => {
        const exists = key in remote.keyboard.key;
        const type = typeof remote.keyboard.key[key];
        console.log(`  ${key}: exists=${exists}, type=${type}`);
    });
}

debugKeyboardCreation().catch(console.error);