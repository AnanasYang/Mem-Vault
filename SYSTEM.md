# Memory System 2.0 - 系统文档

## 🎯 系统概述

Memory System 2.0 是一个基于 5 层记忆架构的 AI 记忆管理系统，支持从对话中自动提炼记忆、定期复盘、以及可视化状态监控。

## 📁 目录结构

```
ai-memory-system/
├── Memory/                    # 被动沉淀轨道
│   ├── L0-state/             # 状态层：当前会话
│   ├── L1-episodic/          # 情境层：近期对话
│   ├── L2-procedural/        # 行为层：习惯模式
│   ├── L3-semantic/          # 认知层：思维框架
│   └── L4-core/              # 核心层：价值观
├── Intent/                    # 主动输入轨道
│   ├── goals/                # 目标与规划
│   ├── preferences/          # 偏好与要求
│   └── boundaries/           # 约束与边界
├── Meta/                      # 系统元数据
│   ├── reviews/              # 复盘记录
│   ├── evolutions/           # 演变历史
│   └── candidates/           # 升级候选人
├── scripts/                   # 自动化脚本
│   ├── daily-dream-integrated.mjs
│   ├── weekly-dream-integrated.mjs
│   ├── dream-scheduler.mjs
│   ├── dream-dashboard.mjs
│   ├── auto-sync.sh
│   └── core/                 # 流转引擎
├── agent-os/                  # Web 管理界面
└── Makefile                   # 便捷命令
```

## 🚀 快速开始

### 1. 环境要求
- Node.js 16+
- Git
- Make (可选)

### 2. 安装
```bash
# 克隆仓库
git clone https://github.com/AnanasYang/ai-memory-system.git
cd ai-memory-system

# 安装依赖（Agent OS）
cd agent-os && npm install
```

### 3. 配置
```bash
# 设置环境变量
export MEMORY_ROOT=/path/to/ai-memory-system
export GITHUB_TOKEN=your_github_token
```

### 4. 启动
```bash
# 启动 Memory OS Web 界面
cd agent-os && npm run dev

# 或运行命令行工具
make status
make daily
make weekly
```

## 🔄 工作流程

### Daily Dream (每日自动)
```
每天 23:00
    ↓
收集 L0 Session 数据
    ↓
生成 L1 情境记忆
    ↓
检测 L1→L2 模式
    ↓
提交并同步到 GitHub
```

### Weekly Dream (每周自动)
```
每周日 10:00
    ↓
汇总本周 L1 记忆
    ↓
生成复盘报告
    ↓
识别 L2 升级候选人
    ↓
提交并同步到 GitHub
```

### Manual Review (人工 Review)
```
查看 agent-os 界面
    ↓
检查 pending reviews
    ↓
确认 L2→L3 升级
    ↓
（L3→L4 必须人工确认）
```

## 🎮 常用命令

```bash
# 查看系统状态
make status
make dreams-status

# 运行 Dreams
make daily
make weekly

# 手动同步
make sync

# 安装定时任务
node scripts/dream-scheduler.mjs install
```

## 📊 监控与告警

### 状态看板
访问 `http://localhost:3000`（Agent OS）查看：
- 记忆统计
- 同步状态
- Dreams 运行状态
- 待 review 项目

### 日志文件
- `.dreams.log` - Dreams 运行日志
- `.sync.log` - 同步日志
- `Meta/test-report-*.md` - 测试报告

## 🔧 故障排查

### 同步失败
```bash
# 检查远程仓库
git remote -v

# 手动同步
git pull origin master
git push origin master
```

### Dreams 未运行
```bash
# 检查 cron
crontab -l

# 手动运行
node scripts/dream-scheduler.mjs daily
```

## 📚 进阶配置

### 自定义同步频率
编辑 `scripts/auto-sync.sh` 或 systemd timer。

### 添加新的流转规则
修改 `scripts/core/` 中的引擎脚本。

### 扩展 Web 界面
在 `agent-os/` 中添加新的页面和组件。

## 🤝 贡献

1. Fork 仓库
2. 创建特性分支
3. 提交变更
4. 推送到 GitHub
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见 LICENSE 文件

---

*Memory System 2.0*
*Version: 2.0.0*
*Last Updated: 2026-04-03*
