# AI Memory System - 同步与更新策略

**创建时间**: 2026-04-05  
**适用范围**: 所有 Memory 相关仓库和系统

---

## 📦 仓库清单与同步策略

### 1. ai-memory-system（核心数据仓库）

**定位**: 5层记忆架构原始数据  
**仓库**: https://github.com/AnanasYang/ai-memory-system

| 层级 | 内容 | 更新频率 | 同步方式 |
|------|------|---------|---------|
| L0-State | 当前会话上下文 | 实时 | 会话结束时自动捕获 |
| L1-Episodic | 每日对话摘要 | 每日 23:00 | Daily Dream 自动生成 |
| L2-Procedural | 行为模式 | 每月 1日 | Monthly Review 确认 |
| L3-Semantic | 认知框架 | 每季度首月 | Quarterly Review 确认 |
| L4-Core | 核心价值观 | 每年/触发 | **仅人工修改** |
| Intent | 主动目标/偏好 | 变更时 | 人工更新 + Git 提交 |
| Meta | 系统元数据 | 自动 | Review 时更新 |

**自动同步配置**:
```bash
# Daily Dream - 每天 23:00
0 23 * * * cd ~/.openclaw/workspace/ai-memory-system && node scripts/daily-dream-integrated.mjs

# Weekly Review - 每周日 23:00
0 23 * * 0 cd ~/.openclaw/workspace/ai-memory-system && node scripts/weekly-dream-integrated.mjs

# Git 自动推送 - 每 6 小时
0 */6 * * * cd ~/.openclaw/workspace/ai-memory-system && git add -A && git commit -m "auto: daily sync $(date +%Y-%m-%d-%H:%M)" && git push origin main
```

---

### 2. Agent-Memory-OS（Web 可视化）

**定位**: 记忆系统 Web 界面  
**仓库**: https://github.com/AnanasYang/Agent-Memory-OS  
**部署**: https://ai-memory-os.netlify.app

| 数据源 | 同步频率 | 方式 |
|--------|---------|------|
| ai-memory-system/L1-L4 | 每 30 分钟 | `sync-memory-data.js` |
| Daily Dreams | 每日 | 生成后同步 |
| Weekly Reviews | 每周 | 生成后同步 |

**自动同步配置**:
```bash
# 记忆数据同步 - 每30分钟
*/30 * * * * cd ~/.openclaw/workspace/agent-memory-os && node scripts/sync-memory-data.js >> /tmp/memory-sync.log 2>&1

# Git 自动推送（代码变更）- 每 12 小时
0 */12 * * * cd ~/.openclaw/workspace/agent-memory-os && git add -A && git commit -m "auto: sync data $(date +%Y-%m-%d-%H:%M)" && git push origin main
```

---

### 3. Workspace（整体配置）

**定位**: OpenClaw 工作区配置  
**仓库**: https://github.com/AnanasYang/ai-memory-os

**更新触发条件**:
- AGENTS.md 修改（/mao 规则等）
- TOOLS.md 修改（环境配置）
- HEARTBEAT.md 修改
- 新 Skill 安装

**同步方式**:
```bash
# 手动触发或重大变更时
# 自动同步频率: 每日一次（如没有敏感信息变更）
0 2 * * * cd ~/.openclaw/workspace && git add -A && git diff --cached --quiet || (git commit -m "auto: daily sync $(date +%Y-%m-%d)" && git push origin main)
```

---

### 4. multi-agent-orchestrator（/mao Skill）

**定位**: 多代理协调命令  
**仓库**: https://github.com/AnanasYang/multi-agent-orchestrator

**更新触发条件**:
- SKILL.md 修改
- Manager 模板更新
- launch-workers.js 更新

**同步方式**:
```bash
# 手动推送（变更不频繁）
# 自动同步频率: 仅在文件变更时
```

---

### 5. ai-news-digest-pro（AI 简报）

**定位**: 每日/每周 AI 简报生成  
**位置**: `~/.openclaw/workspace/skills/ai-news-digest-pro/`

**更新频率**:
```bash
# 日报 - 每天 10:00
0 10 * * * cd ~/.openclaw/workspace/skills/ai-news-digest-pro && ./scripts/run-digest.sh daily

# 周报 - 每周日 10:00
0 10 * * 0 cd ~/.openclaw/workspace/skills/ai-news-digest-pro && ./scripts/run-digest.sh weekly
```

**输出**:
- 飞书文档（自动推送）
- 本地 Markdown 文件

---

## 🔄 同步依赖关系图

```
┌─────────────────────────────────────────────────────────────┐
│                      用户交互层                              │
│         对话 / 任务 / 目标设定 / 偏好更新                      │
└─────────────────────────┬───────────────────────────────────┘
                          │ 实时捕获
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   ai-memory-system                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  L0     │→│  L1     │→│  L2     │→│  L3/L4  │           │
│  │ (状态)   │ │ (每日)   │ │ (每月)   │ │ (每季/年)│           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                           │                                 │
│                           │ 每 6h Git 推送                   │
└───────────────────────────┼─────────────────────────────────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
           ▼                ▼                ▼
┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐
│ Agent-Memory-OS │ │    Workspace  │ │  multi-agent    │
│   (Web 可视化)   │ │   (配置中心)   │ │ (orchestrator)  │
│                 │ │               │ │                 │
│ 每30min 同步数据 │ │ 每日同步配置   │ │ 手动/变更触发   │
└─────────────────┘ └───────────────┘ └─────────────────┘
           │
           │ 自动部署
           ▼
┌─────────────────┐
│    Netlify      │
│ ai-memory-os    │
│ .netlify.app    │
└─────────────────┘
```

---

## ⏰ Cron 任务总览

### 用户级 Crontab (`crontab -e`)

```bash
# ============================================
# AI Memory System - 自动同步配置
# ============================================

# --- ai-memory-system ---
# Daily Dream: 每天 23:00
0 23 * * * cd ~/.openclaw/workspace/ai-memory-system && node scripts/daily-dream-integrated.mjs >> /tmp/daily-dream.log 2>&1

# Weekly Dream: 每周日 23:00
0 23 * * 0 cd ~/.openclaw/workspace/ai-memory-system && node scripts/weekly-dream-integrated.mjs >> /tmp/weekly-dream.log 2>&1

# Git 自动推送: 每 6 小时
0 */6 * * * cd ~/.openclaw/workspace/ai-memory-system && git add -A && git diff --cached --quiet || (git commit -m "auto: daily sync $(date +%Y-%m-%d-%H:%M)" && git push origin main) >> /tmp/ai-memory-sync.log 2>&1

# --- Agent-Memory-OS ---
# 数据同步: 每 30 分钟
*/30 * * * * cd ~/.openclaw/workspace/agent-memory-os && node scripts/sync-memory-data.js >> /tmp/memory-sync.log 2>&1

# Git 推送: 每 12 小时
0 */12 * * * cd ~/.openclaw/workspace/agent-memory-os && git add -A && git diff --cached --quiet || (git commit -m "auto: sync data $(date +%Y-%m-%d-%H:%M)" && git push origin main) >> /tmp/agent-os-sync.log 2>&1

# --- Workspace ---
# Git 推送: 每天 02:00（低优先级）
0 2 * * * cd ~/.openclaw/workspace && git add -A && git diff --cached --quiet || (git commit -m "auto: daily sync $(date +%Y-%m-%d)" && git push origin main) >> /tmp/workspace-sync.log 2>&1

# --- AI News Digest ---
# 日报: 每天 10:00
0 10 * * * cd ~/.openclaw/workspace/skills/ai-news-digest-pro && ./scripts/run-digest.sh daily >> /tmp/ai-digest.log 2>&1

# 周报: 每周日 10:00
0 10 * * 0 cd ~/.openclaw/workspace/skills/ai-news-digest-pro && ./scripts/run-digest.sh weekly >> /tmp/ai-digest.log 2>&1
```

---

## 🛠️ 安装 Cron 任务

执行以下命令安装所有定时任务：

```bash
# 1. 保存当前 crontab
crontab -l > ~/.crontab.backup.$(date +%Y%m%d)

# 2. 添加新任务
cat >> /tmp/ai-memory-cron.txt << 'EOF'
# ============================================
# AI Memory System - 自动同步配置
# ============================================

# --- ai-memory-system ---
0 23 * * * cd ~/.openclaw/workspace/ai-memory-system && node scripts/daily-dream-integrated.mjs >> /tmp/daily-dream.log 2>&1
0 23 * * 0 cd ~/.openclaw/workspace/ai-memory-system && node scripts/weekly-dream-integrated.mjs >> /tmp/weekly-dream.log 2>&1
0 */6 * * * cd ~/.openclaw/workspace/ai-memory-system && git add -A && git diff --cached --quiet || (git commit -m "auto: daily sync $(date +%Y-%m-%d-%H:%M)" && git push origin main) >> /tmp/ai-memory-sync.log 2>&1

# --- Agent-Memory-OS ---
*/30 * * * * cd ~/.openclaw/workspace/agent-memory-os && node scripts/sync-memory-data.js >> /tmp/memory-sync.log 2>&1
0 */12 * * * cd ~/.openclaw/workspace/agent-memory-os && git add -A && git diff --cached --quiet || (git commit -m "auto: sync data $(date +%Y-%m-%d-%H:%M)" && git push origin main) >> /tmp/agent-os-sync.log 2>&1

# --- Workspace ---
0 2 * * * cd ~/.openclaw/workspace && git add -A && git diff --cached --quiet || (git commit -m "auto: daily sync $(date +%Y-%m-%d)" && git push origin main) >> /tmp/workspace-sync.log 2>&1

# --- AI News Digest ---
0 10 * * * cd ~/.openclaw/workspace/skills/ai-news-digest-pro && ./scripts/run-digest.sh daily >> /tmp/ai-digest.log 2>&1
0 10 * * 0 cd ~/.openclaw/workspace/skills/ai-news-digest-pro && ./scripts/run-digest.sh weekly >> /tmp/ai-digest.log 2>&1
EOF

# 3. 安装
crontab /tmp/ai-memory-cron.txt

# 4. 验证
crontab -l
```

---

## 📊 同步监控

### 检查同步状态

```bash
# 查看最近同步日志
tail -20 /tmp/ai-memory-sync.log
tail -20 /tmp/memory-sync.log
tail -20 /tmp/agent-os-sync.log

# 查看 GitHub 最新提交
curl -s "https://api.github.com/repos/AnanasYang/ai-memory-system/commits?per_page=1" | grep '"date":'
curl -s "https://api.github.com/repos/AnanasYang/Agent-Memory-OS/commits?per_page=1" | grep '"date":'

# 查看本地仓库状态
cd ~/.openclaw/workspace/ai-memory-system && git status
cd ~/.openclaw/workspace/agent-memory-os && git status
```

### 异常处理

| 异常 | 检查 | 处理 |
|------|------|------|
| Git 推送失败 | `/tmp/*-sync.log` | 手动执行 `git push` |
| Daily Dream 失败 | `/tmp/daily-dream.log` | 检查脚本权限和依赖 |
| 数据同步失败 | `/tmp/memory-sync.log` | 检查 `sync-memory-data.js` |
| Netlify 部署失败 | GitHub Actions | 检查构建日志 |

---

## 📝 手动触发同步

如需立即同步所有仓库：

```bash
#!/bin/bash
# sync-all.sh - 手动触发全量同步

echo "=== Syncing ai-memory-system ==="
cd ~/.openclaw/workspace/ai-memory-system
git add -A
git commit -m "manual: full sync $(date +%Y-%m-%d-%H:%M)"
git push origin main

echo "=== Syncing agent-memory-os ==="
cd ~/.openclaw/workspace/agent-memory-os
node scripts/sync-memory-data.js
git add -A
git commit -m "manual: sync data $(date +%Y-%m-%d-%H:%M)"
git push origin main

echo "=== Syncing workspace ==="
cd ~/.openclaw/workspace
git add -A
git commit -m "manual: sync workspace $(date +%Y-%m-%d-%H:%M)"
git push origin main

echo "=== Done ==="
```

---

## 🔄 版本控制策略

### 提交信息规范

| 前缀 | 用途 | 示例 |
|------|------|------|
| `auto:` | 自动同步 | `auto: daily sync 2026-04-05-10:00` |
| `feat:` | 新功能 | `feat: add /mao command` |
| `fix:` | 修复 | `fix: sync script error` |
| `docs:` | 文档 | `docs: update README` |
| `manual:` | 手动触发 | `manual: full sync 2026-04-05` |

### 分支策略

- **main**: 主分支，始终可部署
- **auto-sync**: 自动同步专用（可选）
- 功能分支: `feature/xxx`，合并后删除

---

## 📅 Review 日历

| 任务 | 频率 | 时间 | 责任人 |
|------|------|------|--------|
| Daily Dream | 每日 | 23:00 | 自动 |
| Weekly Review | 每周日 | 23:00 | 自动 |
| Monthly Review | 每月 1日 | 10:00 | 自动检测，人工确认 |
| Quarterly Review | 季度首月 1日 | 10:00 | 自动检测，人工确认 |
| Git 同步检查 | 每周 | 周一 | 人工抽查 |
| Netlify 部署检查 | 每周 | 周一 | 人工抽查 |

---

*最后更新: 2026-04-05  
下次 Review: 2026-04-06 (Weekly)*
