#!/usr/bin/env node
/**
 * L0 → L1 流转引擎
 * 自动从 session 数据生成 L1 记忆
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const MEMORY_ROOT = process.env.MEMORY_ROOT || '/home/bruce/.openclaw/workspace/ai-memory-system';
const L0_DIR = join(MEMORY_ROOT, 'Memory', 'L0-state');
const L1_DIR = join(MEMORY_ROOT, 'Memory', 'L1-episodic');

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getNextSequence(date) {
  try {
    const files = readdirSync(L1_DIR).filter(f => f.startsWith(`L1-${date}`));
    return files.length + 1;
  } catch {
    return 1;
  }
}

function generateL1FromL0(l0Data) {
  const date = getTodayDate();
  const seq = getNextSequence(date);
  const memoryId = `L1-${date}-${String(seq).padStart(3, '0')}`;
  
  // 提取关键信息
  const topics = extractTopics(l0Data);
  const summary = generateSummary(l0Data);
  
  return {
    id: memoryId,
    date,
    topics,
    summary,
    source: l0Data.sessionId,
    rawSnapshot: l0Data
  };
}

function extractTopics(data) {
  // 简单的关键词提取
  const keywords = [];
  if (data.messages) {
    const text = data.messages.map(m => m.content).join(' ');
    // 这里可以接入更复杂的 NLP
    const commonTopics = ['代码', '设计', '问题', '讨论', '计划', '回顾'];
    for (const topic of commonTopics) {
      if (text.includes(topic)) keywords.push(topic);
    }
  }
  return keywords;
}

function generateSummary(data) {
  return `Session with ${data.messages?.length || 0} messages`;
}

function saveL1Memory(memory) {
  const filename = `${memory.id}.md`;
  const filepath = join(L1_DIR, filename);
  
  const content = `---
level: L1
category: episodic
created: ${memory.date}
updated: ${memory.date}
source: ${memory.source || 'auto-generated'}
confidence: medium
memory_id: ${memory.id}
---

# ${memory.date} - ${memory.topics.join(', ') || 'General'}

## 摘要

${memory.summary}

## 主题

${memory.topics.map(t => `- ${t}`).join('\n') || '- 未分类'}

## 来源

- L0 Session: ${memory.source || 'N/A'}
- 生成时间: ${new Date().toISOString()}

## 原始数据快照

\`\`\`json
${JSON.stringify(memory.rawSnapshot, null, 2)}
\`\`\`
`;
  
  writeFileSync(filepath, content, 'utf-8');
  console.log(`✅ Generated L1 memory: ${filename}`);
  return filepath;
}

// 主流程
async function main() {
  console.log('🔄 L0→L1 Transfer Engine');
  
  // 确保目录存在
  mkdirSync(L1_DIR, { recursive: true });
  
  // 读取 L0 数据（简化版，实际从 sessions 读取）
  // 这里使用现有的 daily-dream-integrated.mjs 逻辑
  
  console.log('✅ L0→L1 engine ready');
}

main().catch(console.error);
