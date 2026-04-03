---
level: L2
category: procedural
source: observation
confidence: high
review_cycle: monthly
created: 2026-03-11
updated: 2026-03-11
---

# 日报生成流程（Daily Report Workflow）

从实际操作中总结的有效流程。

---

## 标准流程

### Step 1: 数据源覆盖检查

**搜索执行清单**：
- [ ] 中文AI媒体：`机器之心 量子位 自动驾驶 AI 最新`
- [ ] 中文汽车媒体：`高工智能汽车 盖世汽车 智驾 端到端`
- [ ] 英文科技媒体：`autonomous driving AI agent latest news`
- [ ] 英文汽车媒体：`Tesla FSD Waymo robotaxi news`

**工具**：
- Tavily Search: `node skills/tavily-search/scripts/search.mjs`

### Step 2: 内容整理

**分类整理**：
1. 🔴 核心层：自动驾驶+企业AI（直接影响工作）
2. 🟡 近层：AI核心+行业前沿（技术趋势）
3. 🟢 外延层：上下游拓展（间接相关）
4. ⚪ 支撑层：政策+投研（背景参考）

### Step 3: 分析与建议

**必须包含**：
- 对你当前工作的直接影响
- 资源约束下的跟进策略
- 具体可操作的建议

### Step 4: 文件交付

**交付方式**：
1. 生成 `.md` 文件：`ai-daily-report-YYYY-MM-DD.md`
2. **使用 feishu message 工具发送**（正确方式）
   ```javascript
   message {
     action: "send",
     filePath: "/path/to/ai-daily-report-YYYY-MM-DD.md",
     filename: "ai-daily-report-YYYY-MM-DD.md"
   }
   ```
3. ❌ **避免使用** `kimi_upload_file` 工具（存在假成功问题）
4. 发送后询问用户是否收到

---

## 工具可靠性总结

| 工具 | 用途 | 可靠性 |
|------|------|--------|
| `message` + `filePath` | 发送文件 | ✅ 可靠 |
| `kimi_upload_file` | 发送文件 | ❌ 不稳定（假成功） |

---

## 常见错误预防

### 错误1：遗漏中文数据源
**触发信号**：用户说"为什么今天都把他们遗漏了"
**应对**：每次搜索必须同时执行中英文查询

### 错误2：未发送md文件
**触发信号**：用户说"通过飞书对话框发我一份md文件"
**应对**：不能只发文字，必须使用文件传输

### 错误3：文件发送后用户未收到
**触发信号**：用户说"没收到"
**应对**：
- 使用 `message` 工具而非 `kimi_upload_file`
- 发送后主动询问是否收到

---

## 相关文件

- `Intent/preferences/daily-report.md` - 日报偏好（用户设定）
- `Intent/preferences/tools.md` - 搜索工具配置
- `L1-episodic/2026-03-11-file-transfer-issue.md` - 本次问题记录
