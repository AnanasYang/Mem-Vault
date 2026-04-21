# MemVault 🧠

Bruce 的专属记忆系统 —— 基于 5 层神经记忆架构 + Intent 轨道 + Meta 元数据的 AI 记忆引擎。

> **全自动运行**：所有记忆沉淀、review、归档无需人工干预，后台静默完成。

---

## 架构概览

```
Mem-Vault/
├── Memory/              # 5层被动沉淀轨道
│   ├── L0-state/        # 原始数据层（实时消息流）
│   ├── L1-episodic/     # 情境记忆层（每日回顾）
│   ├── L2-procedural/   # 行为模式层（习惯沉淀）
│   ├── L3-semantic/     # 认知框架层（思维模型）
│   └── L4-core/         # 核心身份层（价值观）
├── Intent/              # 主动意图轨道
│   ├── goals/           # 目标体系
│   ├── preferences/     # 偏好设定
│   └── boundaries/      # 约束边界
├── Meta/                # 系统元数据
│   ├── config/          # 触发规则配置
│   ├── reviews/         # 自动复盘记录
│   └── trace-mappings/  # 记忆溯源映射
├── scripts/             # 自动化脚本
│   ├── capture-l0.js           # L0 数据捕获
│   ├── daily-dream-integrated.mjs   # 每日记忆生成
│   ├── weekly-dream.mjs       # 每周记忆生成
│   └── sync-github.sh         # GitHub 同步
└── cron/                # 定时任务配置
```

---

## 记忆层级

| 层级 | 名称 | 内容 | 更新频率 | Review |
|------|------|------|----------|--------|
| **L0** | 原始数据 | 会话消息、操作日志 | 实时 | — |
| **L1** | 情境记忆 | 每日对话回顾、事件记录 | 每天 23:00 | 每周 |
| **L2** | 行为模式 | 重复习惯、工作偏好 | 自动检测 | 每月 |
| **L3** | 认知框架 | 思维模式、决策原则 | 自动检测 | 每季度 |
| **L4** | 核心身份 | 价值观、人生信念 | 观察沉淀 | 每年 |

---

## 自动运行机制

### 每日任务
- **23:00** — `daily-dream`：生成当日 L1 回顾
- **01:00** — `sync-github`：推送数据到 GitHub

### 每周任务
- **周一 9:00** — `L1-weekly-review`：周度记忆复盘
- **周日 22:00** — `weekly-dream`：周度记忆沉淀

### 每月任务
- **每月 1 日 9:00** — `L2-monthly-review`：行为模式 review

### 每季度任务
- **季度首日 9:00** — `L3-quarterly-review`：认知框架 review

---

## 文件规范

所有记忆文件使用 Markdown + YAML Frontmatter：

```yaml
---
level: L1
memory_id: L1-2026-04-21-001
created: 2026-04-21
updated: 2026-04-21
source: 对话观察
confidence: high
reviewed: 2026-04-21
---
```

---

## 关联项目

- [**Mem-Canvas**](https://github.com/AnanasYang/Mem-Canvas) — 记忆可视化界面，从本系统读取数据展示

---

*系统初始化：2026-03-05 | 全自动模式启用：2026-04-21*