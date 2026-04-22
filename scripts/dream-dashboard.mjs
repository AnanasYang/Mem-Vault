#!/usr/bin/env node
/**
 * Dreams 状态看板
 * 显示 Dreams 系统的运行状态和统计
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const MEMORY_ROOT = process.env.MEMORY_ROOT || '/home/bruce/.openclaw/workspace/memory-core';

function countFiles(dir) {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter(f => f.endsWith('.md')).length;
}

function getLastRun(type) {
  const logFile = join(MEMORY_ROOT, '.dreams.log');
  if (!existsSync(logFile)) return 'Never';
  
  const lines = readFileSync(logFile, 'utf-8').split('\n').filter(l => l.includes(type));
  if (lines.length === 0) return 'Never';
  
  const lastLine = lines[lines.length - 1];
  const match = lastLine.match(/\[(.*?)\]/);
  return match ? match[1] : 'Unknown';
}

function getGitStatus() {
  try {
    const { execSync } = require('child_process');
    const status = execSync('git status --short', { cwd: MEMORY_ROOT, encoding: 'utf-8' });
    return status.trim().split('\n').filter(l => l);
  } catch {
    return [];
  }
}

function printDashboard() {
  console.clear();
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           🤖 AI Memory System - Dreams Dashboard         ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║                                                          ║');
  
  // 记忆统计
  console.log('║  📊 Memory Statistics                                    ║');
  console.log('║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║');
  console.log(`║  L1 Episodic:    ${String(countFiles(join(MEMORY_ROOT, 'Memory/L1-episodic'))).padEnd(6)} files                          ║`);
  console.log(`║  L2 Procedural:  ${String(countFiles(join(MEMORY_ROOT, 'Memory/L2-procedural'))).padEnd(6)} files                          ║`);
  console.log(`║  L3 Semantic:    ${String(countFiles(join(MEMORY_ROOT, 'Memory/L3-semantic'))).padEnd(6)} files                          ║`);
  console.log(`║  Weekly Reviews: ${String(countFiles(join(MEMORY_ROOT, 'Meta/reviews/weekly'))).padEnd(6)} files                          ║`);
  console.log('║                                                          ║');
  
  // Dreams 运行状态
  console.log('║  🌙 Dreams Status                                        ║');
  console.log('║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║');
  console.log(`║  Last Daily:   ${getLastRun('daily').padEnd(40)}  ║`);
  console.log(`║  Last Weekly:  ${getLastRun('weekly').padEnd(40)}  ║`);
  console.log('║                                                          ║');
  
  // Git 状态
  const gitStatus = getGitStatus();
  console.log('║  🔄 Git Status                                           ║');
  console.log('║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║');
  if (gitStatus.length === 0) {
    console.log('║  ✅ All changes synced                                   ║');
  } else {
    console.log(`║  ⚠️  ${String(gitStatus.length).padEnd(3)} files pending sync                           ║`);
  }
  console.log('║                                                          ║');
  
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Commands:');
  console.log('  make daily    - Run daily dream');
  console.log('  make weekly   - Run weekly review');
  console.log('  make sync     - Sync to GitHub');
  console.log('');
}

printDashboard();
