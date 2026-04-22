#!/usr/bin/env node
/**
 * L0 Auto-Capture Daemon
 * 监听 OpenClaw 会话目录，自动捕获新消息到 L0
 * 
 * Usage: node l0-daemon.js [check-interval-ms]
 */

const fs = require('fs');
const path = require('path');

const SESSIONS_DIR = process.env.OPENCLAW_SESSIONS_DIR || `${process.env.HOME}/.openclaw/agents/main/sessions`;
const L0_DIR = `${process.env.HOME}/.openclaw/workspace/memory-core/Memory/L0-state`;
const CHECK_INTERVAL = parseInt(process.argv[2]) || 30000; // 默认30秒

// 记录已处理的文件和位置
const stateFile = path.join(L0_DIR, '.capture-state.json');

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    return {};
  }
}

function saveState(state) {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

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

function captureNewMessages() {
  const state = loadState();
  const today = new Date().toISOString().split('T')[0];
  const outputFile = path.join(L0_DIR, `daily-${today}.jsonl`);
  
  if (!fs.existsSync(L0_DIR)) {
    fs.mkdirSync(L0_DIR, { recursive: true });
  }

  const files = fs.readdirSync(SESSIONS_DIR)
    .filter(f => f.endsWith('.jsonl') && !f.includes('.deleted.') && !f.includes('.reset.'));

  let newCount = 0;

  for (const file of files) {
    const sessionId = path.basename(file, '.jsonl');
    const filePath = path.join(SESSIONS_DIR, file);
    const stat = fs.statSync(filePath);
    const lastPos = state[sessionId]?.position || 0;
    
    // 文件未变化
    if (stat.size <= lastPos) continue;

    // 读取新内容
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(stat.size - lastPos);
    fs.readSync(fd, buffer, 0, buffer.length, lastPos);
    fs.closeSync(fd);

    const newContent = buffer.toString('utf8');
    const lines = newContent.trim().split('\n').filter(l => l);

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type !== 'message' || !entry.message) continue;
        if (!entry.timestamp?.startsWith(today)) continue;

        const msg = entry.message;
        const content = extractContent(msg.content);
        if (!content?.trim()) continue;

        const l0Entry = {
          ts: entry.timestamp,
          role: msg.role,
          content: content,
          sessionId: sessionId
        };

        fs.appendFileSync(outputFile, JSON.stringify(l0Entry) + '\n');
        newCount++;
      } catch (e) {
        // Skip invalid lines
      }
    }

    state[sessionId] = { position: stat.size, mtime: stat.mtime.toISOString() };
  }

  saveState(state);
  
  if (newCount > 0) {
    console.log(`[${new Date().toISOString()}] Captured ${newCount} new messages`);
  }
}

// 主循环
console.log(`🔄 L0 Daemon started (interval: ${CHECK_INTERVAL}ms)`);
console.log(`   Watching: ${SESSIONS_DIR}`);
console.log(`   Output: ${L0_DIR}`);

// 立即执行一次
captureNewMessages();

// 定时执行
setInterval(captureNewMessages, CHECK_INTERVAL);

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n👋 L0 Daemon stopped');
  process.exit(0);
});
