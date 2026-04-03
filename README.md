# AI Memory System

基于 5 层记忆架构 + Intent 轨道 + Meta 元数据的用户画像系统。

## 目录结构

```
ai-memory-system/
├── README.md                 # 本文件
├── Memory/                   # 被动沉淀轨道（从对话自动提炼）
│   ├── L0-state/            # 状态层：当前会话上下文
│   ├── L1-episodic/         # 情境层：近期对话摘要（每周review）
│   ├── L2-procedural/       # 行为层：习惯与偏好（每月review）
│   ├── L3-semantic/         # 认知层：思维模式（每季度review）
│   └── L4-core/             # 核心层：价值观与身份（每年/人工）
├── Intent/                   # 主动输入轨道（用户主动设定）
│   ├── goals/               # 目标与规划
│   │   ├── short-term/      # 短期目标（< 3个月）
│   │   ├── mid-term/        # 中期目标（3-12个月）
│   │   └── long-term/       # 长期目标（> 1年）
│   ├── preferences/         # 偏好与要求
│   │   ├── communication/   # 沟通偏好
│   │   ├── workflow/        # 工作流偏好
│   │   └── tools/           # 工具偏好
│   ├── boundaries/          # 约束与边界
│   │   ├── hard-limits/     # 硬性红线
│   │   ├── soft-limits/     # 软性约束
│   │   └── decision-rules/  # 决策边界
│   └── active/              # 当前活跃的意图清单
├── Meta/                     # 系统元数据
│   ├── reviews/             # 复盘记录
│   │   ├── weekly/          # 每周复盘（L1）
│   │   ├── monthly/         # 每月复盘（L2）
│   │   ├── quarterly/       # 每季度复盘（L3）
│   │   └── annual/          # 年度复盘（L4）
│   ├── evolutions/          # 演变历史
│   │   ├── L1-changes/
│   │   ├── L2-changes/
│   │   ├── L3-changes/
│   └── insights/            # AI 检测到的模式
└── archive/                  # 归档存储
    └── L1/                  # L1 超过 30 天归档至此
```

## 文件格式规范

所有文件使用 Markdown + YAML Frontmatter：

```markdown
---
level: L1                      # L0-L4 / Intent / Meta
category: episodic            # 细分分类
created: 2026-03-05           # 创建日期
updated: 2026-03-05           # 更新日期
source: 对话观察               # 来源：对话观察/用户声明/推断
confidence: high              # 置信度：high/medium/low
reviewed: 2026-03-05          # 最后 review 日期
---

# 标题

内容...
```

## 沉淀规则

| 层级 | 沉淀条件 | Review 频率 |
|------|---------|------------|
| L1 情境 | 会话结束 / 10轮对话 / 重要事件 | **每周** |
| L2 行为 | 同一模式出现 3 次 | **每月** |
| L3 认知 | 稳定思维模式 / 多习惯指向同一框架 | **每季度** |
| L4 核心 | 价值驱动 / 信念浮现 / **仅人工修改** | **每年/触发** |

## 归档策略

- L1：30 天后移入 `archive/L1/YYYY-MM/`，保留不删除
- L2-L4：长期保留

## 触发方式

1. **定时触发**：Cron 每周/月/季度提醒
2. **条件触发**：Heartbeat 检测模式满足时
3. **主动触发**：用户说"帮我 review"

---

*系统初始化日期：2026-03-05*
