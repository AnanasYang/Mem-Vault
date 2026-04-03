#!/usr/bin/env node
/**
 * L0 Session Hook - Capture current session to L0 on conversation end
 * This script is designed to be called at the end of a conversation
 * Usage: node l0-session-hook.js <session-id>
 */

const fs = require('fs');
const path = require('path');
const { captureSession } = require('./capture-l0-realtime');

const SESSION_ID = process.argv[2];

if (!SESSION_ID) {
    console.error('Usage: node l0-session-hook.js <session-id>');
    process.exit(1);
}

console.log(`🔄 L0 Hook: Capturing session ${SESSION_ID}...`);
const result = captureSession(SESSION_ID);

if (result) {
    console.log(`✅ L0 Hook: ${result.count} messages written to ${result.file}`);
} else {
    console.error('❌ L0 Hook: Failed to capture session');
    process.exit(1);
}
