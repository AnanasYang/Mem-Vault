---
level: intent
category: preferences
source: user_explicit
confidence: high
created: 2026-03-11
---

# 日报生成偏好（Daily Report Preferences）

用户（Bruce）对AI日报生成的明确要求。

---

## 数据源覆盖要求

### 必须覆盖的信息源

| 层级 | 中文源 | 国际源 |
|------|--------|--------|
| **AI/科技-技术动态** | 机器之心 (jiqizhixin.com) | TechCrunch |
| | 量子位 (qbitai.com) | The Information |
| | AI科技评论 (aitechtalk.com) | arXiv |
| | InfoQ中文 (infoq.cn) | Twitter/X研究者 |
| **AI/科技-深度观点** | 腾讯研究院 (tisi.org) | - |
| **自动驾驶/汽车** | 高工智能汽车 (gg-auto.com) | Automotive News |
| | 盖世汽车 (gasgoo.com) | Reuters Auto |
| | 42号车库 (42how.com) | - |
| **商业/产业观察** | 36氪 (36kr.com) | - |
| | 虎嗅 (huxiu.com) | - |

### 搜索策略
- ✅ 中英文搜索都要执行
- ✅ 中文关键词："机器之心 量子位 自动驾驶"、"高工智能汽车 智驾"
- ✅ 英文关键词："autonomous driving AI"、"physical AI robotics"
- ❌ 不能只搜索英文源

---

## 交付格式要求

### 文件交付（正确方式）
- **使用 feishu `message` 工具的 `filePath` 参数发送 `.md` 文件**
  ```javascript
  message {
    action: "send",
    filePath: "/path/to/ai-daily-report-YYYY-MM-DD.md",
    filename: "ai-daily-report-YYYY-MM-DD.md"
  }
  ```
- **不能只发送文字/链接**
- **不能发送到飞书文档**
- **发送后主动询问用户是否收到**

### ❌ 避免使用
- ~~`kimi_upload_file` 工具~~（存在假成功问题，工具返回成功但实际未送达）

### 日报结构（四层分类法）
```
🔴 核心层（自动驾驶+企业AI）
🟡 近层（AI核心+行业前沿）
🟢 外延层（上下游拓展）
⚪ 支撑层（政策+投研）
```

### 每条信息格式
```
### 标题
1. 关键信息：...
2. 💡 对你：一句话影响分析
3. 来源：[链接]
```

---

## 定时任务

- **日报**：每日上午 10:00
- **周报**：每周日上午 10:00（覆盖周一至周日）

---

## 规则

- ✅ **总是**同时搜索中英文数据源
- ✅ **总是**通过飞书对话框发送md文件
- ❌ **从不**只发文字版
- ❌ **从不**遗漏中文数据源
