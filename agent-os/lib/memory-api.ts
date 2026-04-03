/**
 * Memory System API
 * 提供记忆系统的状态查询接口
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const MEMORY_ROOT = process.env.MEMORY_ROOT || '/home/bruce/.openclaw/workspace/ai-memory-system';

export interface MemoryStats {
  l1Count: number;
  l2Count: number;
  l3Count: number;
  l4Count: number;
  weeklyReviews: number;
  lastSync: string;
  syncStatus: 'synced' | 'pending' | 'error';
}

export interface DreamStatus {
  lastDaily: string;
  lastWeekly: string;
  pendingReviews: string[];
}

export function getMemoryStats(): MemoryStats {
  const l1Dir = join(MEMORY_ROOT, 'Memory', 'L1-episodic');
  const l2Dir = join(MEMORY_ROOT, 'Memory', 'L2-procedural');
  const l3Dir = join(MEMORY_ROOT, 'Memory', 'L3-semantic');
  const l4Dir = join(MEMORY_ROOT, 'Memory', 'L4-core');
  const weeklyDir = join(MEMORY_ROOT, 'Meta', 'reviews', 'weekly');
  
  const countFiles = (dir: string) => {
    if (!existsSync(dir)) return 0;
    return readdirSync(dir).filter(f => f.endsWith('.md')).length;
  };
  
  // 读取最后同步时间
  let lastSync = 'Never';
  let syncStatus: MemoryStats['syncStatus'] = 'synced';
  
  try {
    const syncLog = join(MEMORY_ROOT, '.sync.log');
    if (existsSync(syncLog)) {
      const lines = readFileSync(syncLog, 'utf-8').split('\n').filter(l => l);
      const lastLine = lines[lines.length - 1];
      if (lastLine) {
        lastSync = lastLine.split(':')[0] || 'Unknown';
      }
    }
    
    // 检查是否有未提交的变更
    const { execSync } = require('child_process');
    const status = execSync('git status --short', { cwd: MEMORY_ROOT, encoding: 'utf-8' });
    if (status.trim()) {
      syncStatus = 'pending';
    }
  } catch {
    syncStatus = 'error';
  }
  
  return {
    l1Count: countFiles(l1Dir),
    l2Count: countFiles(l2Dir),
    l3Count: countFiles(l3Dir),
    l4Count: countFiles(l4Dir),
    weeklyReviews: countFiles(weeklyDir),
    lastSync,
    syncStatus
  };
}

export function getDreamStatus(): DreamStatus {
  const dreamsLog = join(MEMORY_ROOT, '.dreams.log');
  let lastDaily = 'Never';
  let lastWeekly = 'Never';
  
  if (existsSync(dreamsLog)) {
    const content = readFileSync(dreamsLog, 'utf-8');
    const lines = content.split('\n').filter(l => l);
    
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('daily') && lastDaily === 'Never') {
        const match = lines[i].match(/\[(.*?)\]/);
        if (match) lastDaily = match[1];
      }
      if (lines[i].includes('weekly') && lastWeekly === 'Never') {
        const match = lines[i].match(/\[(.*?)\]/);
        if (match) lastWeekly = match[1];
      }
    }
  }
  
  // 获取待 review 的 L2
  const l2Dir = join(MEMORY_ROOT, 'Memory', 'L2-procedural');
  const pendingReviews: string[] = [];
  
  if (existsSync(l2Dir)) {
    const files = readdirSync(l2Dir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = readFileSync(join(l2Dir, file), 'utf-8');
      if (content.includes('review_status: pending')) {
        pendingReviews.push(file.replace('.md', ''));
      }
    }
  }
  
  return { lastDaily, lastWeekly, pendingReviews };
}
