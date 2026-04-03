/**
 * Trace API - 记忆层级追溯系统
 * 
 * 端点: /api/trace?from={memory_id}&to={target_level}
 * 示例: /api/trace?from=L1-2026-04-02-001&to=L0
 *       /api/trace?from=L2-work-habits&to=L1
 * 
 * 返回: 溯源链信息，包含层级间的关联关系
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const BASE_PATH = process.env.AI_MEMORY_PATH || '/home/bruce/.openclaw/workspace/ai-memory-system';

// 溯源结果类型
interface TraceResult {
  from: {
    memory_id: string;
    level: string;
    found: boolean;
    path?: string;
    frontmatter?: any;
  };
  to: {
    level: string;
  };
  trace_chain: TraceNode[];
  metadata: {
    timestamp: string;
    query_time_ms: number;
  };
}

interface TraceNode {
  level: string;
  memory_id: string;
  title?: string;
  timestamp?: string;
  sources?: any;
  relation: 'source' | 'derived' | 'reference';
  confidence?: string;
}

// 解析 memory_id
function parseMemoryId(memoryId: string): { level: string; date?: string; sequence?: string; name?: string } {
  // 标准格式: L1-2026-04-02-001
  const standardMatch = memoryId.match(/^(L\d+)-(\d{4}-\d{2}-\d{2})-(\d{3})$/);
  if (standardMatch) {
    return {
      level: standardMatch[1],
      date: standardMatch[2],
      sequence: standardMatch[3]
    };
  }
  
  // 旧格式或自定义名称: L2-work-habits
  const legacyMatch = memoryId.match(/^(L\d+)-(.+)$/);
  if (legacyMatch) {
    return {
      level: legacyMatch[1],
      name: legacyMatch[2]
    };
  }
  
  // 纯名称
  return { level: 'unknown', name: memoryId };
}

// 查找记忆文件
function findMemoryFile(memoryId: string, level?: string): string | null {
  const parsed = parseMemoryId(memoryId);
  const targetLevel = level || parsed.level;
  
  // 确定目录
  let dir: string;
  switch (targetLevel) {
    case 'L0':
      dir = path.join(BASE_PATH, 'Memory', 'L0-state');
      // L0 文件格式: daily-YYYY-MM-DD.jsonl
      if (parsed.date) {
        const filePath = path.join(dir, `daily-${parsed.date}.jsonl`);
        return fs.existsSync(filePath) ? filePath : null;
      }
      break;
    case 'L1':
      dir = path.join(BASE_PATH, 'Memory', 'L1-episodic');
      break;
    case 'L2':
      dir = path.join(BASE_PATH, 'Memory', 'L2-procedural');
      break;
    case 'L3':
      dir = path.join(BASE_PATH, 'Memory', 'L3-semantic');
      break;
    case 'L4':
      dir = path.join(BASE_PATH, 'Memory', 'L4-core');
      break;
    default:
      return null;
  }
  
  if (!fs.existsSync(dir)) return null;
  
  // 尝试多种文件名格式
  const possibleNames = [
    `${memoryId}.md`,
    parsed.date ? `${parsed.date}-daily-dream.md` : null,
    parsed.name ? `${parsed.name}.md` : null,
    `${parsed.name || memoryId}.md`
  ].filter(Boolean);
  
  for (const name of possibleNames) {
    const filePath = path.join(dir, name as string);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  
  // 如果在 L1 层且没找到，尝试搜索包含 memory_id 的文件
  if (targetLevel === 'L1') {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes(`memory_id: ${memoryId}`)) {
        return filePath;
      }
    }
  }
  
  return null;
}

// 解析 frontmatter
function parseFrontmatter(content: string): any {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return {};
  
  const fm: any = {};
  const lines = match[1].split('\n');
  
  // 简单解析，处理基本类型
  let currentKey: string | null = null;
  let currentValue: string = '';
  
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && !line.startsWith(' ') && !line.startsWith('-')) {
      // 保存之前的键值
      if (currentKey) {
        fm[currentKey] = parseValue(currentValue.trim());
      }
      currentKey = line.substring(0, colonIdx).trim();
      currentValue = line.substring(colonIdx + 1).trim();
    } else if (currentKey && (line.startsWith('  ') || line.startsWith('-'))) {
      // 继续累积多行值
      currentValue += '\n' + line;
    } else if (currentKey) {
      // 保存之前的键值
      fm[currentKey] = parseValue(currentValue.trim());
      currentKey = null;
      currentValue = '';
    }
  }
  
  if (currentKey) {
    fm[currentKey] = parseValue(currentValue.trim());
  }
  
  return fm;
}

function parseValue(value: string): any {
  // 尝试解析 JSON 数组
  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      return JSON.parse(value);
    } catch {}
  }
  
  // 尝试解析数字
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  
  // 布尔值
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // 去掉引号
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  
  return value;
}

// 从 L1 追溯到 L0
function traceL1ToL0(memoryId: string): TraceNode[] {
  const chain: TraceNode[] = [];
  
  // 查找 L1 文件
  const l1File = findMemoryFile(memoryId, 'L1');
  if (!l1File) return chain;
  
  const content = fs.readFileSync(l1File, 'utf-8');
  const fm = parseFrontmatter(content);
  
  // 添加 L1 节点
  chain.push({
    level: 'L1',
    memory_id: memoryId,
    title: fm.event || path.basename(l1File, '.md'),
    timestamp: fm.created,
    sources: fm.sources,
    relation: 'source',
    confidence: fm.confidence
  });
  
  // 如果有 sources 信息，追溯到 L0
  if (fm.sources && fm.sources.level === 'L0') {
    const parsed = parseMemoryId(memoryId);
    
    // L0 节点
    chain.push({
      level: 'L0',
      memory_id: `L0-${parsed.date || fm.created}`,
      title: `原始对话数据 (${fm.sources.message_count || 0} 条消息)`,
      timestamp: fm.sources.timestamp_range?.start,
      sources: {
        session_ids: fm.sources.session_ids || [],
        message_count: fm.sources.message_count
      },
      relation: 'derived',
      confidence: 'high'
    });
  }
  
  return chain;
}

// 从 L2 追溯到 L1
function traceL2ToL1(memoryId: string): TraceNode[] {
  const chain: TraceNode[] = [];
  
  // 查找 L2 文件
  const l2File = findMemoryFile(memoryId, 'L2');
  if (!l2File) return chain;
  
  const content = fs.readFileSync(l2File, 'utf-8');
  const fm = parseFrontmatter(content);
  
  // 添加 L2 节点
  chain.push({
    level: 'L2',
    memory_id: memoryId,
    title: fm.title || path.basename(l2File, '.md'),
    timestamp: fm.updated || fm.created,
    relation: 'source',
    confidence: fm.confidence
  });
  
  // 查找源 L1 记忆
  // 1. 检查 frontmatter 中的 source_memories 字段
  if (fm.source_memories && Array.isArray(fm.source_memories)) {
    for (const sourceId of fm.source_memories) {
      const l1File = findMemoryFile(sourceId, 'L1');
      if (l1File) {
        const l1Content = fs.readFileSync(l1File, 'utf-8');
        const l1Fm = parseFrontmatter(l1Content);
        chain.push({
          level: 'L1',
          memory_id: sourceId,
          title: l1Fm.event || path.basename(l1File, '.md'),
          timestamp: l1Fm.created,
          sources: l1Fm.sources,
          relation: 'reference',
          confidence: l1Fm.confidence
        });
      }
    }
  }
  
  // 2. 如果没有明确的 source_memories，尝试从 trace-mappings 查找
  if (chain.length === 1) {
    const traceDir = path.join(BASE_PATH, 'Meta', 'trace-mappings');
    if (fs.existsSync(traceDir)) {
      const traceFiles = fs.readdirSync(traceDir).filter(f => f.endsWith('.json'));
      
      for (const traceFile of traceFiles) {
        const tracePath = path.join(traceDir, traceFile);
        const traceData = JSON.parse(fs.readFileSync(tracePath, 'utf-8'));
        
        // 检查这个 L1 是否关联到当前 L2
        // 简化逻辑：查找时间上接近的 L1
        if (traceData.level === 'L1' && traceData.created) {
          const l1Date = new Date(traceData.created);
          const l2Date = new Date(fm.updated || fm.created);
          const diffDays = Math.abs((l1Date.getTime() - l2Date.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 7) {
            chain.push({
              level: 'L1',
              memory_id: traceData.memory_id,
              title: `关联情景记忆 (${traceData.created})`,
              timestamp: traceData.created,
              sources: traceData.sources,
              relation: 'reference',
              confidence: 'medium'
            });
          }
        }
      }
    }
  }
  
  return chain;
}

// 从 L3 追溯到 L2/L1
function traceL3ToLower(memoryId: string, targetLevel: string): TraceNode[] {
  const chain: TraceNode[] = [];
  
  // 查找 L3 文件
  const l3File = findMemoryFile(memoryId, 'L3');
  if (!l3File) return chain;
  
  const content = fs.readFileSync(l3File, 'utf-8');
  const fm = parseFrontmatter(content);
  
  // 添加 L3 节点
  chain.push({
    level: 'L3',
    memory_id: memoryId,
    title: fm.title || path.basename(l3File, '.md'),
    timestamp: fm.updated || fm.created,
    relation: 'source',
    confidence: fm.confidence
  });
  
  // 检查 source_memories
  if (fm.source_memories && Array.isArray(fm.source_memories)) {
    for (const sourceId of fm.source_memories) {
      const parsed = parseMemoryId(sourceId);
      
      if (parsed.level === 'L2' && (targetLevel === 'L2' || targetLevel === 'L1')) {
        // 追溯到 L2
        const l2File = findMemoryFile(sourceId, 'L2');
        if (l2File) {
          const l2Content = fs.readFileSync(l2File, 'utf-8');
          const l2Fm = parseFrontmatter(l2Content);
          chain.push({
            level: 'L2',
            memory_id: sourceId,
            title: l2Fm.title || path.basename(l2File, '.md'),
            timestamp: l2Fm.updated || l2Fm.created,
            relation: 'reference',
            confidence: l2Fm.confidence
          });
          
          // 如果目标是 L1，继续追溯
          if (targetLevel === 'L1') {
            const l2Chain = traceL2ToL1(sourceId);
            chain.push(...l2Chain.slice(1));
          }
        }
      } else if (parsed.level === 'L1' && targetLevel === 'L1') {
        // 直接追溯到 L1
        const l1File = findMemoryFile(sourceId, 'L1');
        if (l1File) {
          const l1Content = fs.readFileSync(l1File, 'utf-8');
          const l1Fm = parseFrontmatter(l1Content);
          chain.push({
            level: 'L1',
            memory_id: sourceId,
            title: l1Fm.event || path.basename(l1File, '.md'),
            timestamp: l1Fm.created,
            sources: l1Fm.sources,
            relation: 'reference',
            confidence: l1Fm.confidence
          });
        }
      }
    }
  }
  
  return chain;
}

// 主追溯函数
function traceMemory(fromId: string, toLevel: string): TraceResult {
  const startTime = Date.now();
  const parsed = parseMemoryId(fromId);
  const fromLevel = parsed.level;
  
  // 确定追溯路径
  let chain: TraceNode[] = [];
  
  switch (fromLevel) {
    case 'L1':
      if (toLevel === 'L0') {
        chain = traceL1ToL0(fromId);
      } else {
        chain = [{ level: 'L1', memory_id: fromId, relation: 'source' }];
      }
      break;
    case 'L2':
      if (toLevel === 'L1' || toLevel === 'L0') {
        chain = traceL2ToL1(fromId);
        if (toLevel === 'L0' && chain.length > 1) {
          // 从最后一个 L1 继续追溯到 L0
          const lastL1 = chain[chain.length - 1];
          if (lastL1.level === 'L1') {
            const l0Chain = traceL1ToL0(lastL1.memory_id);
            chain.push(...l0Chain.slice(1));
          }
        }
      } else {
        chain = [{ level: 'L2', memory_id: fromId, relation: 'source' }];
      }
      break;
    case 'L3':
      chain = traceL3ToLower(fromId, toLevel);
      if (toLevel === 'L0' && chain.length > 1) {
        // 从最后一个 L1 继续追溯到 L0
        const lastL1 = chain.find(n => n.level === 'L1');
        if (lastL1) {
          const l0Chain = traceL1ToL0(lastL1.memory_id);
          chain.push(...l0Chain.filter(n => n.level === 'L0'));
        }
      }
      break;
    default:
      chain = [{ level: fromLevel, memory_id: fromId, relation: 'source' }];
  }
  
  const fromFile = findMemoryFile(fromId);
  let frontmatter = null;
  if (fromFile) {
    const content = fs.readFileSync(fromFile, 'utf-8');
    frontmatter = parseFrontmatter(content);
  }
  
  return {
    from: {
      memory_id: fromId,
      level: fromLevel,
      found: !!fromFile,
      path: fromFile || undefined,
      frontmatter: frontmatter || undefined
    },
    to: {
      level: toLevel
    },
    trace_chain: chain,
    metadata: {
      timestamp: new Date().toISOString(),
      query_time_ms: Date.now() - startTime
    }
  };
}

// API Handler
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { from, to } = req.query;
  
  if (!from || typeof from !== 'string') {
    return res.status(400).json({ 
      error: 'Missing required parameter: from (memory_id)' 
    });
  }
  
  const targetLevel = (to as string) || 'L0';
  
  // 验证 target level
  if (!['L0', 'L1', 'L2', 'L3'].includes(targetLevel)) {
    return res.status(400).json({ 
      error: 'Invalid target level. Must be one of: L0, L1, L2, L3' 
    });
  }
  
  try {
    const result = traceMemory(from, targetLevel);
    
    if (!result.from.found) {
      return res.status(404).json({
        error: `Memory not found: ${from}`,
        result
      });
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Trace API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
