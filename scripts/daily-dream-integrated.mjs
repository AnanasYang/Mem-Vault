#!/usr/bin/env node
/**
 * Daily Dream - AI Memory System 集成版 (Phase 2: 追溯系统)
 * 
 * 输出到：memory-core/Memory/L1-episodic/
 * 同时更新：Meta/reviews/weekly/
 * 
 * 更新内容：
 * - 添加 sources 字段记录 L0 来源
 * - 统一 memory_id 格式：L1-{date}-{sequence}
 * - 支持溯源功能
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// FIX: 正确计算 AI Memory System 根目录
const AI_MEMORY_ROOT = join(__dirname, '..');
const L1_DIR = join(AI_MEMORY_ROOT, 'Memory', 'L1-episodic');
const L0_DIR = join(AI_MEMORY_ROOT, 'Memory', 'L0-state');
const META_WEEKLY = join(AI_MEMORY_ROOT, 'Meta', 'reviews', 'weekly');

// 确保目录存在
[L1_DIR, L0_DIR, META_WEEKLY].forEach(dir => mkdirSync(dir, { recursive: true }));

const TODAY = new Date();
const DATE_STR = TODAY.toISOString().split('T')[0];
const WEEK_KEY = `W${getWeekNumber(TODAY)}`;

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// 生成统一格式的 memory_id
function generateMemoryId(level, date, sequence) {
  return `${level}-${date}-${String(sequence).padStart(3, '0')}`;
}

// 获取下一个 sequence 编号
function getNextSequence(level, date) {
  try {
    const dir = join(AI_MEMORY_ROOT, 'Memory', `L${level}-episodic`);
    if (!existsSync(dir)) return 1;
    
    const files = readdirSync(dir).filter(f => f.endsWith('.md'));
    const pattern = new RegExp(`^L${level}-${date}-(\\d{3})`);
    
    let maxSeq = 0;
    for (const file of files) {
      const match = file.match(pattern);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    }
    return maxSeq + 1;
  } catch (e) {
    return 1;
  }
}

// 从 L0 文件读取今日对话（替代直接从 sessions 读取）
function collectTodayConversations() {
  const conversations = [];
  const sessionIds = new Set();
  let minTimestamp = null;
  let maxTimestamp = null;
  
  // 读取 L0 文件
  const l0File = join(L0_DIR, `daily-${DATE_STR}.jsonl`);
  
  if (existsSync(l0File)) {
    const content = readFileSync(l0File, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      try {
        const record = JSON.parse(line);
        if (record.ts && record.role && record.content) {
          conversations.push({
            ts: record.ts,
            role: record.role,
            content: record.content,
            sessionId: record.sessionId || 'unknown'
          });
          sessionIds.add(record.sessionId || 'unknown');
          
          // 记录时间范围
          if (!minTimestamp || record.ts < minTimestamp) {
            minTimestamp = record.ts;
          }
          if (!maxTimestamp || record.ts > maxTimestamp) {
            maxTimestamp = record.ts;
          }
        }
      } catch (e) {
        // 跳过无效行
      }
    }
  }
  
  // 如果 L0 不存在，回退到直接从 sessions 读取（兼容旧数据）
  if (conversations.length === 0) {
    console.log('  ⚠️ L0 文件不存在，回退到 sessions...');
    return collectTodayConversationsFromSessions();
  }
  
  return {
    conversations: conversations.sort((a, b) => new Date(a.ts) - new Date(b.ts)),
    sources: {
      level: 'L0',
      l0File: l0File,
      sessionIds: Array.from(sessionIds),
      timestampRange: {
        start: minTimestamp,
        end: maxTimestamp
      },
      messageCount: conversations.length
    }
  };
}

// 回退方案：直接从 sessions 读取（用于兼容旧数据）
function collectTodayConversationsFromSessions() {
  const conversations = [];
  const sessionIds = new Set();
  let minTimestamp = null;
  let maxTimestamp = null;
  
  const sessionsDir = join(process.env.HOME, '.openclaw', 'agents', 'main', 'sessions');
  if (existsSync(sessionsDir)) {
    const files = readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
    
    for (const file of files) {
      try {
        const content = readFileSync(join(sessionsDir, file), 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());
        
        for (const line of lines) {
          const record = JSON.parse(line);
          if (record.type === 'message' && record.message) {
            const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
            if (recordDate === DATE_STR) {
              conversations.push({
                ts: record.timestamp,
                role: record.message.role,
                content: record.message.content?.[0]?.text || '',
                sessionId: record.id
              });
              sessionIds.add(record.id);
              
              if (!minTimestamp || record.timestamp < minTimestamp) {
                minTimestamp = record.timestamp;
              }
              if (!maxTimestamp || record.timestamp > maxTimestamp) {
                maxTimestamp = record.timestamp;
              }
            }
          }
        }
      } catch (e) {}
    }
  }
  
  return {
    conversations: conversations.sort((a, b) => a.ts - b.ts),
    sources: {
      level: 'L0',
      sessionIds: Array.from(sessionIds),
      timestampRange: {
        start: minTimestamp ? new Date(minTimestamp).toISOString() : null,
        end: maxTimestamp ? new Date(maxTimestamp).toISOString() : null
      },
      messageCount: conversations.length
    }
  };
}

// 生成 L1 记忆文件（符合 AI Memory System 格式规范 + 追溯系统）
function generateL1Memory(conversations, sources, memoryId) {
  const userMsgs = conversations.filter(c => c.role === 'user');
  const assistantMsgs = conversations.filter(c => c.role === 'assistant');
  
  // 提取关键主题
  const allContent = conversations.map(c => c.content).join(' ');
  const topics = extractTopics(allContent);
  
  // 生成摘要
  const summary = generateSummary(conversations, userMsgs, assistantMsgs);
  
  // 检测 L2 沉淀候选
  const l2Candidates = detectL2Candidates(conversations);
  
  // 生成 source 溯源信息
  const sourceTraceInfo = generateSourceTraceInfo(sources);

  const memoryContent = `---
level: L1
category: episodic
memory_id: ${memoryId}
created: ${DATE_STR}
updated: ${DATE_STR}
source: 对话观察
event: ${DATE_STR} Daily Dream 自动会话回顾
participants: Bruce, 小爪
session_type: 日常对话
confidence: medium
reviewed: ${DATE_STR}
dream-generated: true
l2-candidates: ${l2Candidates.length}
sources:
  level: L0
  session_ids: ${JSON.stringify(sources.sessionIds)}
  timestamp_range:
    start: ${sources.timestampRange.start || DATE_STR + 'T00:00:00.000Z'}
    end: ${sources.timestampRange.end || DATE_STR + 'T23:59:59.999Z'}
  message_count: ${sources.messageCount}
---

# ${DATE_STR} 会话回顾

## 统计
- 用户消息: ${userMsgs.length}
- AI 回复: ${assistantMsgs.length}
- 总会话数: ${conversations.length}

## 溯源信息
- **Memory ID**: ${memoryId}
- **L0 来源**: ${sources.sessionIds.length} 个会话
- **时间范围**: ${sources.timestampRange.start ? new Date(sources.timestampRange.start).toLocaleString('zh-CN') : 'N/A'} - ${sources.timestampRange.end ? new Date(sources.timestampRange.end).toLocaleString('zh-CN') : 'N/A'}
- **消息总数**: ${sources.messageCount}

## 一句话总结
${summary}

## 关键主题
${topics.map(t => `- ${t}`).join('\n') || '- 暂无提取到关键主题'}

## 重要对话片段
${extractHighlights(conversations).map(h => `### ${h.time}
**${h.role}**: ${h.content.substring(0, 200)}${h.content.length > 200 ? '...' : ''}`).join('\n\n') || '- 暂无重要片段'}

## 行为观察
- 对话时段分布: ${analyzeTimeDistribution(conversations)}
- 平均响应长度: ${Math.round(assistantMsgs.reduce((sum, m) => sum + m.content.length, 0) / assistantMsgs.length || 0)} 字符

## L2 沉淀候选（待 Review）
${l2Candidates.length > 0 ? l2Candidates.map(c => `- [ ] **${c.type}**: ${c.description} (出现 ${c.count} 次) ${c.confidence >= 3 ? '⭐ 高频模式' : ''}`).join('\n') : '- 暂无 L2 沉淀候选'}

### 沉淀规则说明
- 出现 2 次：标记为候选
- 出现 3 次以上：⭐ 高频模式，建议沉淀到 L2
- 需人工 Review 确认后才可写入 L2-procedural

---

*由 Daily Dream 自动生成*  
*Memory ID: ${memoryId}*  
*文件: ${DATE_STR}-daily-dream.md*  
*下次 Review: 建议每周一检查 L2 候选*
`;
  
  return memoryContent;
}

// 生成溯源信息
function generateSourceTraceInfo(sources) {
  if (!sources || !sources.sessionIds || sources.sessionIds.length === 0) {
    return {
      level: 'L0',
      session_ids: [],
      timestamp_range: { start: null, end: null },
      message_count: 0
    };
  }
  
  return {
    level: 'L0',
    session_ids: sources.sessionIds,
    timestamp_range: sources.timestampRange,
    message_count: sources.messageCount
  };
}

function extractTopics(content) {
  // 简单的关键词提取 - 可根据需要扩展
  const keywords = [
    { key: 'memory', label: '记忆系统' },
    { key: 'AI', label: 'AI 技术' },
    { key: 'task', label: '任务管理' },
    { key: 'project', label: '项目' },
    { key: 'code', label: '编程' },
    { key: 'meeting', label: '会议' },
    { key: 'design', label: '设计' },
    { key: 'autonomous', label: '自动Agent' },
    { key: 'schedule', label: '日程' },
    { key: 'goal', label: '目标' }
  ];
  return keywords
    .filter(k => content.toLowerCase().includes(k.key.toLowerCase()))
    .map(k => k.label);
}

function generateSummary(conversations, userMsgs, assistantMsgs) {
  if (conversations.length === 0) return '今日无对话记录';
  
  const firstMsg = new Date(conversations[0].ts);
  const lastMsg = new Date(conversations[conversations.length - 1].ts);
  const duration = Math.round((lastMsg - firstMsg) / 60000);
  
  const topics = extractTopics(conversations.map(c => c.content).join(' '));
  
  return `今日进行了 ${userMsgs.length} 轮对话，持续约 ${duration} 分钟，主要围绕 ${topics.join('、') || '多个主题'} 展开。`;
}

function extractHighlights(conversations) {
  // 提取较长的对话作为亮点
  return conversations
    .filter(c => c.content.length > 100)
    .slice(-5)
    .map(c => ({
      time: new Date(c.ts).toLocaleTimeString('zh-CN'),
      role: c.role === 'user' ? '用户' : 'AI',
      content: c.content
    }));
}

function analyzeTimeDistribution(conversations) {
  if (conversations.length === 0) return '无数据';
  const hours = conversations.map(c => new Date(c.ts).getHours());
  const uniqueHours = [...new Set(hours)];
  return uniqueHours.length > 1 
    ? `分布在 ${Math.min(...hours)}:00 - ${Math.max(...hours)}:00`
    : `集中在 ${hours[0]}:00 左右`;
}

function detectL2Candidates(conversations) {
  // 检测重复模式作为 L2 候选
  const candidates = [];
  
  // 检查是否频繁讨论特定主题
  const topicPatterns = [
    { pattern: 'memory', label: '记忆系统相关' },
    { pattern: 'AI', label: 'AI 技术应用' },
    { pattern: 'task', label: '任务管理' },
    { pattern: 'schedule', label: '日程规划' },
    { pattern: 'goal', label: '目标设定' },
    { pattern: 'autonomous', label: '自动Agent' },
    { pattern: 'agent', label: 'Agent 设计' },
    { pattern: 'cron', label: '定时任务' },
    { pattern: 'heartbeat', label: '心跳检查' }
  ];
  
  for (const { pattern, label } of topicPatterns) {
    const count = conversations.filter(c => 
      c.content.toLowerCase().includes(pattern.toLowerCase())
    ).length;
    if (count >= 2) {
      candidates.push({ 
        type: '主题关注', 
        description: label, 
        count,
        confidence: count
      });
    }
  }
  
  // 检查用户行为模式
  const userConversations = conversations.filter(c => c.role === 'user');
  
  // 检查是否频繁询问/指令
  const questionCount = userConversations.filter(c => 
    c.content.includes('?') || c.content.includes('？')
  ).length;
  if (questionCount >= 3) {
    candidates.push({ 
      type: '行为模式', 
      description: '频繁提问/确认', 
      count: questionCount,
      confidence: Math.floor(questionCount / 2)
    });
  }
  
  // 检查代码相关
  const codeCount = userConversations.filter(c => 
    c.content.includes('```') || c.content.includes('function') || c.content.includes('code')
  ).length;
  if (codeCount >= 2) {
    candidates.push({ 
      type: '工作模式', 
      description: '编程/代码讨论', 
      count: codeCount,
      confidence: codeCount
    });
  }
  
  return candidates.sort((a, b) => b.count - a.count);
}

// 更新周回顾
function updateWeeklyReview(hasNewData, memoryId) {
  const weekFile = join(META_WEEKLY, `${DATE_STR}-weekly-review.md`);
  
  const content = `---
level: Meta
category: weekly-review
memory_id: ${memoryId.replace('L1', 'Meta')}
date: ${DATE_STR}
week: ${WEEK_KEY}
dream-generated: true
---

# ${WEEK_KEY} 周回顾 - ${DATE_STR}

## 本周 L1 记忆统计
- 新增记忆: ${countNewL1ThisWeek()}
- 待 Review: ${countPendingReview()}
- L2 候选数: ${countL2Candidates()}

## 今日生成
- Memory ID: ${memoryId}
- 状态: ${hasNewData ? '✅ 有数据' : '⚠️ 无数据'}

## 行动项
- [ ] 检查 L1 记忆，确认 L2 候选
- [ ] 更新 L2-procedural/work-habits.md（如需要）
- [ ] 检查是否有模式达到 3 次，可沉淀到 L2

---

*由 Daily Dream 自动生成*
`;
  
  writeFileSync(weekFile, content);
}

function countNewL1ThisWeek() {
  try {
    const files = readdirSync(L1_DIR).filter(f => f.endsWith('.md'));
    return files.length;
  } catch {
    return 0;
  }
}

function countPendingReview() {
  // 简化实现：返回本周生成的未 review 文件数
  try {
    const files = readdirSync(L1_DIR).filter(f => f.endsWith('.md'));
    // 实际应检查 frontmatter 中的 reviewed 字段
    return files.length;
  } catch {
    return 0;
  }
}

function countL2Candidates() {
  // 统计所有 L1 文件中的 L2 候选数量
  let count = 0;
  try {
    const files = readdirSync(L1_DIR).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = readFileSync(join(L1_DIR, file), 'utf-8');
      const match = content.match(/l2-candidates:\s*(\d+)/);
      if (match) {
        count += parseInt(match[1], 10);
      }
    }
  } catch {}
  return count;
}

// 保存 L0 溯源映射（用于快速查询）
function saveTraceMapping(memoryId, sources) {
  const traceDir = join(AI_MEMORY_ROOT, 'Meta', 'trace-mappings');
  mkdirSync(traceDir, { recursive: true });
  
  const traceFile = join(traceDir, `${memoryId}.json`);
  const traceData = {
    memory_id: memoryId,
    level: 'L1',
    created: DATE_STR,
    sources: sources
  };
  
  writeFileSync(traceFile, JSON.stringify(traceData, null, 2));
  console.log(`  └─ 溯源映射已保存: ${traceFile}`);
}

// 主流程
function main() {
  console.log(`🌙 Daily Dream - AI Memory System 集成版 (Phase 2: 追溯系统)`);
  console.log(`日期: ${DATE_STR}`);
  console.log(`工作目录: ${AI_MEMORY_ROOT}`);
  console.log(`输出目录: ${L1_DIR}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  // 生成 Memory ID
  const sequence = getNextSequence('1', DATE_STR);
  const memoryId = generateMemoryId('L1', DATE_STR, sequence);
  console.log(`\n🆔 Memory ID: ${memoryId}`);
  
  // 1. 收集今日对话
  console.log('\n📥 正在收集今日对话...');
  const { conversations, sources } = collectTodayConversations();
  console.log(`  └─ 找到 ${conversations.length} 条消息`);
  console.log(`  └─ 来自 ${sources.sessionIds.length} 个会话`);
  if (sources.timestampRange.start && sources.timestampRange.end) {
    console.log(`  └─ 时间范围: ${new Date(sources.timestampRange.start).toLocaleTimeString('zh-CN')} - ${new Date(sources.timestampRange.end).toLocaleTimeString('zh-CN')}`);
  }
  
  // 2. 生成 L1 记忆（即使无对话也生成空记录，用于追踪）
  console.log('\n💭 生成 L1 记忆...');
  const l1Content = generateL1Memory(conversations, sources, memoryId);
  const l1File = join(L1_DIR, `${DATE_STR}-daily-dream.md`);
  writeFileSync(l1File, l1Content);
  console.log(`  └─ 已保存: ${l1File}`);
  
  // 3. 保存溯源映射
  console.log('\n🔗 保存溯源映射...');
  saveTraceMapping(memoryId, sources);
  
  if (conversations.length === 0) {
    console.log('\n⚠️  提示: 今日无对话记录，生成空记录用于追踪');
  }
  
  // 4. 更新周回顾
  console.log('\n📊 更新周回顾...');
  updateWeeklyReview(conversations.length > 0, memoryId);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Daily Dream 完成');
  console.log(`💾 L1 记忆已保存: ${memoryId}`);
  console.log(`📁 文件: ${l1File}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main();
