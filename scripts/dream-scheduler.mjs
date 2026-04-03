#!/usr/bin/env node
/**
 * Dreams 统一调度器
 * 协调 Daily Dream 和 Weekly Dream 的执行
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const MEMORY_ROOT = process.env.MEMORY_ROOT || '/home/bruce/.openclaw/workspace/ai-memory-system';

const SCHEDULE = {
  daily: {
    script: 'daily-dream-integrated.mjs',
    cron: '0 23 * * *', // 每天 23:00
    description: 'Generate daily episodic memories'
  },
  weekly: {
    script: 'weekly-dream-integrated.mjs',
    cron: '0 10 * * 0', // 每周日 10:00
    description: 'Generate weekly review'
  }
};

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

async function runDream(type) {
  const config = SCHEDULE[type];
  if (!config) {
    log(`❌ Unknown dream type: ${type}`);
    return;
  }
  
  const scriptPath = `${MEMORY_ROOT}/scripts/${config.script}`;
  if (!existsSync(scriptPath)) {
    log(`❌ Script not found: ${scriptPath}`);
    return;
  }
  
  log(`🌙 Starting ${type} dream...`);
  log(`   Script: ${config.script}`);
  
  try {
    execSync(`node "${scriptPath}"`, {
      stdio: 'inherit',
      cwd: MEMORY_ROOT
    });
    log(`✅ ${type} dream completed`);
    
    // 触发同步
    log('🔄 Triggering sync...');
    execSync('make sync', { cwd: MEMORY_ROOT });
    
  } catch (error) {
    log(`❌ ${type} dream failed: ${error.message}`);
    process.exit(1);
  }
}

function showSchedule() {
  console.log('🗓️ Dreams Schedule:\n');
  for (const [type, config] of Object.entries(SCHEDULE)) {
    console.log(`${type.toUpperCase()}:`);
    console.log(`  Cron: ${config.cron}`);
    console.log(`  Script: ${config.script}`);
    console.log(`  Description: ${config.description}`);
    console.log('');
  }
}

function installCron() {
  const cronLines = [
    '# AI Memory System - Dreams Scheduler',
    `${SCHEDULE.daily.cron} cd ${MEMORY_ROOT} && node scripts/dream-scheduler.mjs daily >> .dreams.log 2>&1`,
    `${SCHEDULE.weekly.cron} cd ${MEMORY_ROOT} && node scripts/dream-scheduler.mjs weekly >> .dreams.log 2>&1`
  ];
  
  console.log('Add these lines to your crontab:\n');
  console.log(cronLines.join('\n'));
  console.log('\nRun: crontab -e');
}

// 主流程
const command = process.argv[2];

switch (command) {
  case 'daily':
    runDream('daily');
    break;
  case 'weekly':
    runDream('weekly');
    break;
  case 'schedule':
    showSchedule();
    break;
  case 'install':
    installCron();
    break;
  default:
    console.log('Usage: dream-scheduler.mjs [daily|weekly|schedule|install]');
    showSchedule();
}
