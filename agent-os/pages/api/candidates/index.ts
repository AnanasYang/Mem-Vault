/**
 * Candidates List API
 * /api/candidates - 获取所有候选
 * /api/candidates?since=timestamp - 获取新候选
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
  // 确保目录存在
  if (!fs.existsSync(META_PATH)) {
    fs.mkdirSync(META_PATH, { recursive: true });
  }
  
  fs.writeFileSync(CANDIDATES_PATH, JSON.stringify(candidates, null, 2), 'utf8');
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { since } = req.query;
    let candidates = readCandidates();
    
    // 如果指定了时间戳，只返回新候选
    if (since) {
      const sinceTime = parseInt(since);
      candidates = candidates.filter(c => new Date(c.createdAt).getTime() > sinceTime);
    }
    
    res.status(200).json({
      candidates,
      total: candidates.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

// 导出供其他模块使用
export { readCandidates, saveCandidates };
