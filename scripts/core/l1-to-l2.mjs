#!/usr/bin/env node
/**
 * L1 → L2 模式检测引擎
 * 检测重复模式并升级到 L2
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const MEMORY_ROOT = process.env.MEMORY_ROOT || '/home/bruce/.openclaw/workspace/ai-memory-system';
const L1_DIR = join(MEMORY_ROOT, 'Memory', 'L1-episodic');
const L2_DIR = join(MEMORY_ROOT, 'Memory', 'L2-procedural');
const PATTERN_THRESHOLD = 3; // 模式出现阈值

function loadL1Memories() {
  if (!existsSync(L1_DIR)) return [];
  
  const files = readdirSync(L1_DIR).filter(f => f.endsWith('.md'));
  return files.map(f => {
    const content = readFileSync(join(L1_DIR, f), 'utf-8');
    return { filename: f, content };
  });
}

function detectPatterns(memories) {
  const patterns = {};
  
  for (const memory of memories) {
    // 提取关键词/主题
    const topics = extractTopics(memory.content);
    
    for (const topic of topics) {
      patterns[topic] = (patterns[topic] || 0) + 1;
    }
  }
  
  // 找出超过阈值的模式
  const candidates = Object.entries(patterns)
    .filter(([_, count]) => count >= PATTERN_THRESHOLD)
    .map(([pattern, count]) => ({ pattern, count }));
  
  return candidates;
}

function extractTopics(content) {
  const topics = [];
  // 从 frontmatter 提取主题
  const match = content.match(/topics:\s*\n((?:\s*-\s*.+\n?)+)/);
  if (match) {
    const topicLines = match[1].split('\n');
    for (const line of topicLines) {
      const topicMatch = line.match(/-\s*(.+)/);
      if (topicMatch) topics.push(topicMatch[1].trim());
    }
  }
  return topics;
}

function generateL2FromPattern(pattern, count) {
  const date = new Date().toISOString().split('T')[0];
  const id = `L2-${date}-${pattern.replace(/\s+/g, '-')}`;
  
  return {
    id,
    pattern: pattern.pattern || pattern,
    frequency: count,
    confidence: count >= 5 ? 'high' : 'medium',
    firstSeen: date,
    lastSeen: date
  };
}

function saveL2Memory(l2Memory) {
  mkdirSync(L2_DIR, { recursive: true });
  
  const filename = `${l2Memory.id}.md`;
  const filepath = join(L2_DIR, filename);
  
  // 检查是否已存在
  if (existsSync(filepath)) {
    console.log(`⏭️ L2 memory exists: ${filename}`);
    return;
  }
  
  const content = `---
level: L2
category: procedural
created: ${l2Memory.firstSeen}
updated: ${l2Memory.lastSeen}
confidence: ${l2Memory.confidence}
pattern: ${l2Memory.pattern}
frequency: ${l2Memory.frequency}
review_status: pending
---

# 行为模式: ${l2Memory.pattern}

## 模式描述

检测到重复出现的主题/行为模式。

## 统计数据

- 出现频率: ${l2Memory.frequency} 次
- 置信度: ${l2Memory.confidence}
- 首次发现: ${l2Memory.firstSeen}

## 相关 L1 记忆

<!-- 将在此列出相关的 L1 记忆 -->

## 待办

- [ ] 人工 review 确认
- [ ] 提取更深层的行为模式
- [ ] 关联到 L3 认知框架（如适用）
`;
  
  writeFileSync(filepath, content, 'utf-8');
  console.log(`✅ Generated L2 memory: ${filename}`);
}

async function main() {
  console.log('🔍 L1→L2 Pattern Detection');
  
  const memories = loadL1Memories();
  console.log(`📊 Loaded ${memories.length} L1 memories`);
  
  const patterns = detectPatterns(memories);
  console.log(`🎯 Found ${patterns.length} patterns above threshold`);
  
  for (const pattern of patterns) {
    const l2 = generateL2FromPattern(pattern.pattern, pattern.count);
    saveL2Memory(l2);
  }
  
  console.log('✅ Pattern detection complete');
}

main().catch(console.error);
