#!/usr/bin/env node
/**
 * L0 Real-time Capture - Continuously capture messages from active session
 * Usage: node capture-l0-realtime.js [session-id]
 */

const fs = require('fs');
const path = require('path');

// Config
const SESSIONS_DIR = process.env.OPENCLAW_SESSIONS_DIR || `${process.env.HOME}/.openclaw/agents/main/sessions`;
const OUTPUT_DIR = `${process.env.HOME}/.openclaw/workspace/ai-memory-system/Memory/L0-state`;

// Get today's date string
function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

// Get output file path for a date
function getOutputFile(date) {
    return path.join(OUTPUT_DIR, `daily-${date}.jsonl`);
}

// Ensure directory exists
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Extract text content from message content array or string
function extractContent(content) {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content
            .filter(c => c && c.type === 'text' && c.text)
            .map(c => c.text)
            .join('\n');
    }
    return JSON.stringify(content);
}

// Convert session entry to L0 format
function toL0Format(entry, sessionId) {
    if (!entry || entry.type !== 'message' || !entry.message) return null;
    
    const msg = entry.message;
    const content = extractContent(msg.content);
    
    if (!content || content.trim() === '') return null;
    
    return {
        ts: entry.timestamp,
        role: msg.role,
        content: content,
        sessionId: sessionId
    };
}

// Append entry to L0 file
function appendToL0(entry, date) {
    ensureDir(OUTPUT_DIR);
    const outputFile = getOutputFile(date);
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(outputFile, line);
    return outputFile;
}

// Process a session file and extract today's messages
function processSessionFile(sessionPath, targetDate) {
    const sessionId = path.basename(sessionPath, '.jsonl');
    const content = fs.readFileSync(sessionPath, 'utf8');
    const lines = content.trim().split('\n');
    
    const targetPrefix = targetDate + 'T';
    const entries = [];
    
    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const entry = JSON.parse(line);
            // Check if message is from target date
            if (entry.timestamp && entry.timestamp.startsWith(targetPrefix)) {
                const l0Entry = toL0Format(entry, sessionId);
                if (l0Entry) entries.push(l0Entry);
            }
        } catch (e) {
            // Skip invalid lines
        }
    }
    
    return entries;
}

// Capture all today's messages from all sessions
function captureToday() {
    const today = getTodayStr();
    ensureDir(OUTPUT_DIR);
    
    console.log(`📥 Capturing L0 for ${today}...`);
    
    // Find all non-deleted session files
    const files = fs.readdirSync(SESSIONS_DIR)
        .filter(f => f.endsWith('.jsonl') && !f.includes('.deleted.') && !f.includes('.reset.'))
        .map(f => path.join(SESSIONS_DIR, f));
    
    let totalCount = 0;
    const outputFile = getOutputFile(today);
    
    // Clear existing file for today (will rewrite)
    if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
    }
    
    // Process each session file
    const allEntries = [];
    for (const file of files) {
        const entries = processSessionFile(file, today);
        allEntries.push(...entries);
    }
    
    // Sort by timestamp and write
    allEntries.sort((a, b) => a.ts.localeCompare(b.ts));
    
    for (const entry of allEntries) {
        fs.appendFileSync(outputFile, JSON.stringify(entry) + '\n');
        totalCount++;
    }
    
    console.log(`✅ Captured ${totalCount} messages to ${outputFile}`);
    return { file: outputFile, count: totalCount };
}

// Capture a specific session (for real-time use)
function captureSession(sessionId) {
    const today = getTodayStr();
    const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.jsonl`);
    
    if (!fs.existsSync(sessionFile)) {
        console.error(`Session not found: ${sessionFile}`);
        return null;
    }
    
    ensureDir(OUTPUT_DIR);
    const entries = processSessionFile(sessionFile, today);
    
    const outputFile = getOutputFile(today);
    for (const entry of entries) {
        fs.appendFileSync(outputFile, JSON.stringify(entry) + '\n');
    }
    
    console.log(`✅ Captured ${entries.length} messages from session ${sessionId}`);
    return { file: outputFile, count: entries.length };
}

// Main
if (require.main === module) {
    const sessionId = process.argv[2];
    
    if (sessionId) {
        captureSession(sessionId);
    } else {
        captureToday();
    }
}

module.exports = { captureToday, captureSession, toL0Format, appendToL0 };
