#!/usr/bin/env node
/**
 * Weekly Dream - AI Memory System 集成版
 * 
 * 功能：
 * 1. 读取本周所有L1记忆
 * 2. 检测L2行为模式（3次+重复）
 * 3. 聚合L3认知框架
 * 4. 生成Weekly Review并标记候选
 * 5. 触发Heartbeat提醒人工确认
 * 
 * 执行：每周日 22:00
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AI_MEMORY_ROOT = join(__dirname, '..');
const L1_DIR = join(AI_MEMORY_ROOT, 'Memory', 'L1-episodic');
const L2_DIR = join(AI_MEMORY_ROOT, 'Memory', 'L2-procedural');
const L3_DIR = join(AI_MEMORY_ROOT, 'Memory', 'L3-semantic');
const META_WEEKLY = join(AI_MEMORY_ROOT, 'Meta', 'reviews', 'weekly');
const L2_CANDIDATES = join(AI_MEMORY_ROOT, 'Memory', 'L2-procedural', 'candidates');

// 确保目录存在
[L2_DIR, L3_DIR, META_WEEKLY, L2_CANDIDATES].forEach(dir => mkdirSync(dir, { recursive: true }));

const TODAY = new Date();
const WEEK_START = new Date(TODAY);
WEEK_START.setDate(TODAY.getDate() - TODAY.getDay()); // 本周日
WEEK_START.setHours(0, 0, 0, 0);

const DATE_STR = TODAY.toISOString().split('T')[0];
const WEEK_KEY = `W${getWeekNumber(TODAY)}`;

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ============ 1. 收集本周L1记忆 ============

function collectWeekL1Memories() {
  console.log('📥 Phase 1: Collecting L1 Memories');
  const memories = [];
  
  if (!existsSync(L1_DIR)) {
    console.log('  ⚠️  No L1 directory found');
    return memories;
  }
  
  const files = readdirSync(L1_DIR).filter(f => f.endsWith('.md'));
  
  for (const file of files) {
    try {
      // 从文件名提取日期
      const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
      if (!dateMatch) continue;
      
      const fileDate = new Date(dateMatch[1]);
      if (fileDate >= WEEK_START && fileDate <= TODAY) {
        const content = readFileSync(join(L1_DIR, file), 'utf-8');
        
        // 解析Frontmatter
        const frontmatter = parseFrontmatter(content);
        
        memories.push({
          date: dateMatch[1],
          file,
          content,
          frontmatter,
          // 提取关键字段
          summary: extractSummary(content),
          topics: frontmatter.topics || [],
          l2Candidates: frontmatter['l2-candidates'] || 0
        });
      }
    } catch (e) {
      console.warn(`  ⚠️  Failed to read: ${file}`);
    }
  }
  
  console.log(`  ✅ Collected ${memories.length} L1 memories`);
  return memories.sort((a, b) => a.date.localeCompare(b.date));
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  
  const fm = {};
  match[1].split('\n').forEach(line => {
    const [key, ...value] = line.split(':');
    if (key && value.length > 0) {
      fm[key.trim()] = value.join(':').trim();
    }
  });
  return fm;
}

function extractSummary(content) {
  const match = content.match(/## 一句话总结\n\n(.+)/);
  return match ? match[1] : '';
}

// ============ 2. 检测L2行为模式 ============

function detectL2Patterns(l1Memories) {
  console.log('\n🔍 Phase 2: Detecting L2 Patterns');
  
  const patterns = [];
  const allTopics = l1Memories.flatMap(m => m.topics || []);
  
  // 统计主题频率
  const topicFreq = {};
  allTopics.forEach(t => {
    topicFreq[t] = (topicFreq[t] || 0) + 1;
  });
  
  // 检测高频主题（3次+）
  for (const [topic, count] of Object.entries(topicFreq)) {
    if (count >= 3) {
      patterns.push({
        type: 'topic-recurrence',
        name: `关注${topic}`,
        description: `本周${count}天讨论${topic}相关内容`,
        occurrences: count,
        confidence: Math.min(count / 5, 0.95), // 最高0.95
        sources: l1Memories
          .filter(m => m.topics?.includes(topic))
          .map(m => m.date),
        l2Candidate: true
      });
    }
  }
  
  // 检测连续使用
  if (l1Memories.length >= 5) {
    patterns.push({
      type: 'engagement',
      name: '高频使用',
      description: `本周${l1Memories.length}/7天使用记忆系统`,
      occurrences: l1Memories.length,
      confidence: 0.85,
      sources: l1Memories.map(m => m.date),
      l2Candidate: true
    });
  }
  
  // 检测工作时段
  const hours = l1Memories.map(m => {
    const hour = parseInt(m.frontmatter['peak-hour'] || '0');
    return hour;
  }).filter(h => h > 0);
  
  if (hours.length >= 3) {
    const avgHour = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length);
    patterns.push({
      type: 'time-preference',
      name: '活跃时段偏好',
      description: `通常在${avgHour}:00左右进行深度对话`,
      occurrences: hours.length,
      confidence: 0.7,
      sources: l1Memories.map(m => m.date),
      l2Candidate: true
    });
  }
  
  console.log(`  ✅ Detected ${patterns.length} patterns (${patterns.filter(p => p.l2Candidate).length} L2 candidates)`);
  return patterns;
}

// ============ 3. 生成L2候选文件 ============

function generateL2Candidates(patterns) {
  console.log('\n💾 Phase 3: Generating L2 Candidates');
  
  const candidates = patterns.filter(p => p.l2Candidate);
  
  if (candidates.length === 0) {
    console.log('  ℹ️  No L2 candidates this week');
    return [];
  }
  
  // 生成候选文件
  const candidateFile = join(L2_CANDIDATES, `${DATE_STR}-week-${WEEK_KEY}.json`);
  
  const candidateData = candidates.map((c, i) => ({
    id: `l2-candidate-${WEEK_KEY}-${i + 1}`,
    week: WEEK_KEY,
    date: DATE_STR,
    type: c.type,
    name: c.name,
    description: c.description,
    confidence: c.confidence,
    occurrences: c.occurrences,
    sources: c.sources,
    status: 'pending-confirmation', // pending-confirmation | confirmed | rejected
    confirmationDate: null,
    confirmedBy: null
  }));
  
  writeFileSync(candidateFile, JSON.stringify(candidateData, null, 2));
  console.log(`  ✅ Saved ${candidateData.length} candidates to: ${candidateFile}`);
  
  return candidateData;
}

// ============ 4. 生成Weekly Review ============

function generateWeeklyReview(l1Memories, patterns, l2Candidates) {
  console.log('\n📝 Phase 4: Generating Weekly Review');
  
  const reviewFile = join(META_WEEKLY, `${DATE_STR}-week-${WEEK_KEY}-review.md`);
  
  const totalL2Candidates = l1Memories.reduce((sum, m) => sum + (m.l2Candidates || 0), 0);
  
  const content = `---
level: Meta
category: weekly-review
week: ${WEEK_KEY}
date: ${DATE_STR}
weekStart: ${WEEK_START.toISOString().split('T')[0]}
weekEnd: ${DATE_STR}
---

# ${WEEK_KEY} 周回顾

生成时间: ${new Date().toLocaleString('zh-CN')}

## 📊 本周统计

| 指标 | 数值 |
|------|------|
| L1记忆数 | ${l1Memories.length} |
| 检测到的模式 | ${patterns.length} |
| L2候选 | ${l2Candidates.length} |
| 累计L2候选 | ${totalL2Candidates} |

## 🧬 检测到的行为模式

${patterns.map(p => `
### ${p.name} (${p.type})
- **描述**: ${p.description}
- **置信度**: ${(p.confidence * 100).toFixed(0)}%
- **出现次数**: ${p.occurrences}
- **来源**: ${p.sources.join(', ')}
- **L2候选**: ${p.l2Candidate ? '✅' : '❌'}
`).join('\n')}

## 🎯 L2沉淀候选 (待人工确认)

${l2Candidates.map((c, i) => `${i + 1}. **${c.name}** - ${c.description} (置信度: ${(c.confidence * 100).toFixed(0)}%)`).join('\n') || '*暂无候选*'}

## 📝 行动项

- [ ] Review L2候选，确认是否沉淀到L2-procedural/
- [ ] 检查是否有模式达到3次+可升级
- [ ] 更新 work-habits.md（如有新确认的行为）
- [ ] 检查L3聚合条件（多个L2指向同一框架）

## 🔗 相关文件

- L1记忆: \`Memory/L1-episodic/\`
- L2候选: \`Memory/L2-procedural/candidates/${DATE}-week-${WEEK_KEY}.json\`
- L2沉淀: \`Memory/L2-procedural/\`

---

*由 Weekly Dream 自动生成*
*下一步: 人工Review确认后，自动/手动更新L2*
`;
  
  writeFileSync(reviewFile, content);
  console.log(`  ✅ Weekly review saved: ${reviewFile}`);
  
  return reviewFile;
}

// ============ 5. 主流程 ============

function main() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║     🌙 WEEKLY DREAM - AI MEMORY SYSTEM    ║');
  console.log('║     L2/L3 Pattern Detection & Review      ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log(`\nWeek: ${WEEK_KEY}`);
  console.log(`Period: ${WEEK_START.toLocaleDateString('zh-CN')} ~ ${TODAY.toLocaleDateString('zh-CN')}`);
  console.log('');
  
  // 1. 收集L1
  const l1Memories = collectWeekL1Memories();
  
  if (l1Memories.length === 0) {
    console.log('\n⚠️  No L1 memories found for this week');
    return;
  }
  
  // 2. 检测模式
  const patterns = detectL2Patterns(l1Memories);
  
  // 3. 生成L2候选
  const l2Candidates = generateL2Candidates(patterns);
  
  // 4. 生成周回顾
  const reviewFile = generateWeeklyReview(l1Memories, patterns, l2Candidates);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('           ✅ WEEKLY DREAM COMPLETE       ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 L1 Memories: ${l1Memories.length}`);
  console.log(`🔍 Patterns: ${patterns.length}`);
  console.log(`🎯 L2 Candidates: ${l2Candidates.length}`);
  console.log(`📝 Review: ${reviewFile}`);
  console.log('');
  console.log('⏰ 提醒: 请Review L2候选并确认是否沉淀');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main();
