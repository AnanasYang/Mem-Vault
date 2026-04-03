/**
 * Agent OS Data API
 * 读取 ai-memory-system 真实数据的 API 层
 * 
 * 用途: 消除数据孤岛，为 Agent OS UI 提供统一数据访问接口
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = process.env.AI_MEMORY_PATH || '/home/bruce/.openclaw/workspace/ai-memory-system';

// ==================== L0 层 API ====================

/**
 * 获取 L0 层某日的原始对话数据
 * @param {string} date - 日期格式 YYYY-MM-DD，默认为今天
 * @returns {Array} L0 消息列表
 */
function getL0ByDate(date) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const filePath = path.join(BASE_PATH, 'Memory', 'L0-state', `daily-${targetDate}.jsonl`);
    
    if (!fs.existsSync(filePath)) {
        return [];
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return content
        .trim()
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
            try {
                return JSON.parse(line);
            } catch (e) {
                return null;
            }
        })
        .filter(Boolean);
}

/**
 * 获取 L0 层日期列表
 * @returns {Array} 可用的日期列表
 */
function getL0Dates() {
    const l0Dir = path.join(BASE_PATH, 'Memory', 'L0-state');
    if (!fs.existsSync(l0Dir)) {
        return [];
    }
    
    return fs.readdirSync(l0Dir)
        .filter(f => f.startsWith('daily-') && f.endsWith('.jsonl'))
        .map(f => f.replace('daily-', '').replace('.jsonl', ''))
        .sort()
        .reverse();
}

/**
 * 获取 L0 统计信息
 */
function getL0Stats() {
    const dates = getL0Dates();
    const today = new Date().toISOString().split('T')[0];
    const todayData = getL0ByDate(today);
    
    return {
        totalDays: dates.length,
        todayMessages: todayData.length,
        todayUserMessages: todayData.filter(m => m.role === 'user').length,
        todayAiMessages: todayData.filter(m => m.role === 'assistant').length,
        lastUpdated: todayData.length > 0 
            ? todayData[todayData.length - 1].ts 
            : null
    };
}

// ==================== L1 层 API ====================

/**
 * 获取所有 L1 情景记忆
 */
function getL1Memories() {
    const l1Dir = path.join(BASE_PATH, 'Memory', 'L1-episodic');
    if (!fs.existsSync(l1Dir)) {
        return [];
    }
    
    return fs.readdirSync(l1Dir)
        .filter(f => f.endsWith('.md'))
        .map(f => {
            const filePath = path.join(l1Dir, f);
            const content = fs.readFileSync(filePath, 'utf8');
            const stats = fs.statSync(filePath);
            
            // 解析 frontmatter
            const frontmatter = parseFrontmatter(content);
            
            return {
                id: f.replace('.md', ''),
                filename: f,
                path: filePath,
                created: frontmatter.created || stats.birthtime.toISOString().split('T')[0],
                level: 'L1',
                category: frontmatter.category || 'episodic',
                confidence: frontmatter.confidence || 'medium',
                l2Candidates: frontmatter['l2-candidates'] || 0,
                content: content,
                frontmatter: frontmatter
            };
        })
        .sort((a, b) => b.created.localeCompare(a.created));
}

/**
 * 获取单个 L1 记忆详情
 */
function getL1ById(id) {
    const l1Dir = path.join(BASE_PATH, 'Memory', 'L1-episodic');
    const filePath = path.join(l1Dir, `${id}.md`);
    
    if (!fs.existsSync(filePath)) {
        return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(content);
    
    return {
        id: id,
        path: filePath,
        content: content,
        frontmatter: frontmatter,
        level: 'L1'
    };
}

// ==================== L2 层 API ====================

/**
 * 获取所有 L2 程序记忆
 */
function getL2Memories() {
    const l2Dir = path.join(BASE_PATH, 'Memory', 'L2-procedural');
    if (!fs.existsSync(l2Dir)) {
        return [];
    }
    
    return fs.readdirSync(l2Dir)
        .filter(f => f.endsWith('.md'))
        .map(f => {
            const filePath = path.join(l2Dir, f);
            const content = fs.readFileSync(filePath, 'utf8');
            const frontmatter = parseFrontmatter(content);
            
            return {
                id: f.replace('.md', ''),
                filename: f,
                path: filePath,
                created: frontmatter.created,
                updated: frontmatter.updated,
                level: 'L2',
                category: frontmatter.category,
                confidence: frontmatter.confidence,
                content: content,
                frontmatter: frontmatter
            };
        })
        .sort((a, b) => (b.updated || b.created).localeCompare(a.updated || a.created));
}

// ==================== L3 层 API ====================

function getL3Memories() {
    const l3Dir = path.join(BASE_PATH, 'Memory', 'L3-semantic');
    if (!fs.existsSync(l3Dir)) {
        return [];
    }
    
    return fs.readdirSync(l3Dir)
        .filter(f => f.endsWith('.md'))
        .map(f => {
            const filePath = path.join(l3Dir, f);
            const content = fs.readFileSync(filePath, 'utf8');
            const frontmatter = parseFrontmatter(content);
            
            return {
                id: f.replace('.md', ''),
                filename: f,
                path: filePath,
                created: frontmatter.created,
                updated: frontmatter.updated,
                level: 'L3',
                category: frontmatter.category,
                confidence: frontmatter.confidence,
                content: content,
                frontmatter: frontmatter
            };
        })
        .sort((a, b) => (b.updated || b.created).localeCompare(a.updated || a.created));
}

// ==================== L4 层 API ====================

function getL4Core() {
    const l4Path = path.join(BASE_PATH, 'Memory', 'L4-core', 'identity.md');
    if (!fs.existsSync(l4Path)) {
        return null;
    }
    
    const content = fs.readFileSync(l4Path, 'utf8');
    const frontmatter = parseFrontmatter(content);
    
    return {
        id: 'identity',
        path: l4Path,
        level: 'L4',
        content: content,
        frontmatter: frontmatter
    };
}

// ==================== 通用工具 ====================

/**
 * 解析 Markdown frontmatter
 */
function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (!match) return {};
    
    const fm = {};
    match[1].split('\n').forEach(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
            const key = line.substring(0, colonIdx).trim();
            const value = line.substring(colonIdx + 1).trim();
            // 尝试解析数字
            if (/^\d+$/.test(value)) {
                fm[key] = parseInt(value);
            } else {
                fm[key] = value;
            }
        }
    });
    return fm;
}

/**
 * 获取完整的记忆系统概览
 */
function getMemoryOverview() {
    const l0Stats = getL0Stats();
    const l1Memories = getL1Memories();
    const l2Memories = getL2Memories();
    const l3Memories = getL3Memories();
    const l4Core = getL4Core();
    
    return {
        timestamp: new Date().toISOString(),
        levels: {
            L0: {
                status: 'active',
                stats: l0Stats,
                description: '实时对话捕获层'
            },
            L1: {
                status: l1Memories.length > 0 ? 'active' : 'empty',
                count: l1Memories.length,
                recent: l1Memories.slice(0, 5).map(m => ({
                    id: m.id,
                    created: m.created,
                    l2Candidates: m.l2Candidates
                })),
                description: '情景记忆层'
            },
            L2: {
                status: l2Memories.length > 0 ? 'active' : 'empty',
                count: l2Memories.length,
                recent: l2Memories.slice(0, 5).map(m => ({
                    id: m.id,
                    updated: m.updated || m.created
                })),
                description: '程序记忆层'
            },
            L3: {
                status: l3Memories.length > 0 ? 'active' : 'empty',
                count: l3Memories.length,
                recent: l3Memories.slice(0, 5).map(m => ({
                    id: m.id,
                    updated: m.updated || m.created
                })),
                description: '语义记忆层'
            },
            L4: {
                status: l4Core ? 'active' : 'empty',
                description: '核心身份层'
            }
        }
    };
}

// ==================== 导出 ====================

module.exports = {
    // L0
    getL0ByDate,
    getL0Dates,
    getL0Stats,
    
    // L1
    getL1Memories,
    getL1ById,
    
    // L2
    getL2Memories,
    
    // L3
    getL3Memories,
    
    // L4
    getL4Core,
    
    // 通用
    getMemoryOverview,
    parseFrontmatter
};

// CLI 支持
if (require.main === module) {
    const command = process.argv[2];
    
    switch (command) {
        case 'overview':
            console.log(JSON.stringify(getMemoryOverview(), null, 2));
            break;
        case 'l0-dates':
            console.log(JSON.stringify(getL0Dates(), null, 2));
            break;
        case 'l0-today':
            console.log(JSON.stringify(getL0ByDate(), null, 2));
            break;
        case 'l1-list':
            console.log(JSON.stringify(getL1Memories().map(m => ({
                id: m.id,
                created: m.created,
                l2Candidates: m.l2Candidates
            })), null, 2));
            break;
        case 'l2-list':
            console.log(JSON.stringify(getL2Memories().map(m => ({
                id: m.id,
                created: m.created
            })), null, 2));
            break;
        case 'l3-list':
            console.log(JSON.stringify(getL3Memories().map(m => ({
                id: m.id,
                created: m.created
            })), null, 2));
            break;
        default:
            console.log('Usage: node data-api.js [overview|l0-dates|l0-today|l1-list|l2-list|l3-list]');
    }
}
