/**
 * Candidates Confirm API
 * /api/candidates/confirm - 确认/拒绝/推迟候选
 * 
 * POST 请求体:
 * {
 *   candidateId: string,
 *   action: 'confirm' | 'reject' | 'defer',
 *   targetLevel?: 'L2' | 'L3',  // confirm 时需要
 *   reason?: string              // reject 时需要
 * }
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = process.env.AI_MEMORY_PATH || '/home/bruce/.openclaw/workspace/ai-memory-system';
const META_PATH = path.join(BASE_PATH, 'Meta');
const CANDIDATES_PATH = path.join(META_PATH, 'candidates.json');

/**
 * 读取候选数据
 */
function readCandidates() {
  if (!fs.existsSync(CANDIDATES_PATH)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(CANDIDATES_PATH, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to read candidates:', e);
    return [];
  }
}

/**
 * 保存候选数据
 */
function saveCandidates(candidates) {
  if (!fs.existsSync(META_PATH)) {
    fs.mkdirSync(META_PATH, { recursive: true });
  }
  
  fs.writeFileSync(CANDIDATES_PATH, JSON.stringify(candidates, null, 2), 'utf8');
}

/**
 * 生成 Markdown 内容
 */
function generateMarkdown(candidate, targetLevel) {
  const now = new Date().toISOString();
  const frontmatter = `---
level: ${targetLevel}
category: ${candidate.type || 'procedural'}
source: candidate
confidence: ${candidate.confidence}
occurrences: ${candidate.occurrences || 1}
created: ${now.split('T')[0]}
candidateId: ${candidate.id}
confirmedAt: ${now}
confirmedBy: user
---

`;

  const content = `# ${candidate.name}

## 描述

${candidate.description}

## 来源

- **原始来源**: ${candidate.source}
- **置信度**: ${(candidate.confidence * 100).toFixed(1)}%
- **出现次数**: ${candidate.occurrences || 1}

`;

  const details = candidate.details ? `
## 详细信息

${candidate.details}

` : '';

  const evidence = candidate.evidence && candidate.evidence.length > 0 ? `
## 证据

${candidate.evidence.map(e => `- ${e}`).join('\n')}

` : '';

  return frontmatter + content + details + evidence;
}

/**
 * 写入记忆文件
 */
function writeMemoryFile(candidate, targetLevel) {
  const dirName = targetLevel === 'L2' ? 'L2-procedural' : 'L3-semantic';
  const targetDir = path.join(BASE_PATH, 'Memory', dirName);
  
  // 确保目录存在
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // 生成文件名 (清理特殊字符)
  const safeName = candidate.name
    .replace(/[^\w\u4e00-\u9fa5]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
  
  const filename = `${safeName}.md`;
  const filePath = path.join(targetDir, filename);
  
  // 生成内容
  const content = generateMarkdown(candidate, targetLevel);
  
  // 写入文件
  fs.writeFileSync(filePath, content, 'utf8');
  
  return { filename, filePath };
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { candidateId, action, targetLevel, reason } = req.body;
    
    if (!candidateId || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // 读取当前候选
    let candidates = readCandidates();
    const candidateIndex = candidates.findIndex(c => c.id === candidateId);
    
    if (candidateIndex === -1) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    const candidate = candidates[candidateIndex];
    const now = new Date().toISOString();
    
    switch (action) {
      case 'confirm': {
        // 确认操作
        if (!targetLevel || (targetLevel !== 'L2' && targetLevel !== 'L3')) {
          return res.status(400).json({ error: 'Invalid targetLevel. Must be L2 or L3' });
        }
        
        // 写入记忆文件
        const { filename, filePath } = writeMemoryFile(candidate, targetLevel);
        
        // 更新候选状态
        candidates[candidateIndex] = {
          ...candidate,
          status: 'confirmed',
          confirmedAt: now,
          confirmedBy: 'user',
          targetLevel,
          targetFile: filename,
          targetPath: filePath,
        };
        
        saveCandidates(candidates);
        
        return res.status(200).json({
          success: true,
          action: 'confirm',
          candidateId,
          targetLevel,
          filename,
          filePath,
          confirmedAt: now,
        });
      }
      
      case 'reject': {
        // 拒绝操作
        if (!reason || reason.trim() === '') {
          return res.status(400).json({ error: 'Rejection reason is required' });
        }
        
        candidates[candidateIndex] = {
          ...candidate,
          status: 'rejected',
          rejectionReason: reason.trim(),
          rejectedAt: now,
        };
        
        saveCandidates(candidates);
        
        return res.status(200).json({
          success: true,
          action: 'reject',
          candidateId,
          rejectionReason: reason.trim(),
          rejectedAt: now,
        });
      }
      
      case 'defer': {
        // 推迟操作
        candidates[candidateIndex] = {
          ...candidate,
          status: 'deferred',
          deferredAt: now,
        };
        
        saveCandidates(candidates);
        
        return res.status(200).json({
          success: true,
          action: 'defer',
          candidateId,
          deferredAt: now,
        });
      }
      
      default:
        return res.status(400).json({ error: 'Invalid action. Must be confirm, reject, or defer' });
    }
    
  } catch (error) {
    console.error('Confirm API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
