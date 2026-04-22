#!/usr/bin/env node
/**
 * L0 Capture - Daily snapshot
 * 兼容版：用 Node.js 替代 jq
 */

const fs = require('fs');
const path = require('path');

const SESSIONS_DIR = process.env.HOME + '/.openclaw/agents/main/sessions';
const OUTPUT_DIR = process.env.HOME + '/.openclaw/workspace/memory-core/Memory/L0-state';
const DATE = process.argv[2] || new Date().toISOString().split('T')[0];
const OUTPUT_FILE = path.join(OUTPUT_DIR, `daily-${DATE}.jsonl`);

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log(`📥 Capturing L0 for ${DATE}...`);
console.log(`   Output: ${OUTPUT_FILE}`);

const entries = [];

// 读取所有 session 文件
if (fs.existsSync(SESSIONS_DIR)) {
  const files = fs.readdirSync(SESSIONS_DIR)
    .filter(f => f.endsWith('.jsonl') && !f.includes('.deleted.') && !f.includes('.reset.'));

  for (const file of files) {
    const sessionId = file.replace('.jsonl', '');
    const content = fs.readFileSync(path.join(SESSIONS_DIR, file), 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    for (const line of lines) {
      try {
        const record = JSON.parse(line);
        if (record.type === 'message' && record.message) {
          const recordDate = record.timestamp ? record.timestamp.split('T')[0] : '';
          if (recordDate === DATE) {
            const msg = record.message;
            let text = '';
            if (typeof msg.content === 'string') {
              text = msg.content;
            } else if (Array.isArray(msg.content)) {
              text = msg.content
                .filter(c => c && c.type === 'text' && c.text)
                .map(c => c.text)
                .join('\n');
            }

            if (text && text.trim()) {
              entries.push({
                ts: record.timestamp,
                role: msg.role,
                content: text,
                sessionId: sessionId
              });
            }
          }
        }
      } catch (e) {
        // 跳过无效行
      }
    }
  }
}

// 排序并写入
entries.sort((a, b) => a.ts.localeCompare(b.ts));

if (entries.length > 0) {
  const output = entries.map(e => JSON.stringify(e)).join('\n') + '\n';
  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`✅ Captured ${entries.length} messages to ${OUTPUT_FILE}`);
} else {
  console.log(`⚠️ No messages found for ${DATE}`);
  fs.writeFileSync(OUTPUT_FILE, '');
}

console.log(`   Size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)}KB`);
