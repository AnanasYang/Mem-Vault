#!/usr/bin/env node
/**
 * L2 → L3 语义抽象引擎
 * 将行为模式提升为认知框架
 * 
 * 注意: 此脚本生成候选人，需要人工确认
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const MEMORY_ROOT = process.env.MEMORY_ROOT || '/home/bruce/.openclaw/workspace/ai-memory-system';
const L2_DIR = join(MEMORY_ROOT, 'Memory', 'L2-procedural');
const CANDIDATE_DIR = join(MEMORY_ROOT, 'Meta', 'candidates', 'L3');

function loadL2Memories() {
  if (!existsSync(L2_DIR)) return [];
  
  const files = readdirSync(L2_DIR).filter(f => f.endsWith('.md'));
  return files.map(f => {
    const content = readFileSync(join(L2_DIR, f), 'utf-8');
    const frontmatter = extractFrontmatter(content);
    return { filename: f, content, ...frontmatter };
  });
}

function extractFrontmatter(content) {
  const match = content.match(/---\n([\s\S]*?)\n---/);
  if (!match) return {};
  
  const fm = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      fm[key.trim()] = valueParts.join(':').trim();
    }
  }
  return fm;
}

function findL3Candidates(l2Memories) {
  // 寻找高置信度且相关的行为模式
  return l2Memories.filter(m => 
    m.confidence === 'high' && 
    parseInt(m.frequency || 0) >= 5
  );
}

function generateL3Candidate(l2Memory) {
  const date = new Date().toISOString().split('T')[0];
  
  return {
    id: `L3-CANDIDATE-${date}-${l2Memory.pattern?.replace(/\s+/g, '-') || 'unknown'}`,
    source_l2: l2Memory.filename,
    pattern: l2Memory.pattern,
    proposed_framework: `认知框架: ${l2Memory.pattern}`,
    status: 'pending_review',
    confidence: l2Memory.confidence
  };
}

async function main() {
  console.log('🧠 L2→L3 Semantic Abstraction');
  console.log('⚠️  This generates candidates for human review only');
  
  const l2Memories = loadL2Memories();
  console.log(`📊 Loaded ${l2Memories.length} L2 memories`);
  
  const candidates = findL3Candidates(l2Memories);
  console.log(`🎯 Found ${candidates.length} L3 candidates`);
  
  for (const candidate of candidates) {
    console.log(`\n💡 Candidate: ${candidate.pattern}`);
    console.log(`   Source: ${candidate.filename}`);
    console.log(`   Confidence: ${candidate.confidence}`);
    console.log(`   Action: Add to L3-CANDIDATES list`);
  }
  
  console.log('\n✅ Candidates identified. Manual review required to promote to L3.');
}

main().catch(console.error);
