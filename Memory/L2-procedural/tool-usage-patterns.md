---
level: L2
category: procedural
source: observation
confidence: high
review_cycle: monthly
created: 2026-03-11
---

# 工具使用模式（Tool Usage Patterns）

从实际使用中观察到的有效行为模式。

---

## 搜索工具选择流程

### 场景：需要搜索信息时

#### 标准流程
1. **读取偏好**
   - 检查 `Intent/preferences/tools.md`
   - 确认默认搜索工具配置

2. **选择工具**
   - ✅ 使用 Tavily: `skills/tavily-search/scripts/search.mjs`
   - ❌ 不使用 `web_search` (Brave)

3. **执行搜索**
   ```bash
   export TAVILY_API_KEY=<from Intent/preferences>
   node skills/tavily-search/scripts/search.mjs "query" --topic news -n 10
   ```

#### 常见参数
| 参数 | 用途 |
|------|------|
| `--topic news` | 搜索新闻 |
| `--days 1` | 最近1天 |
| `-n 10` | 返回10条结果 |
| `--deep` | 深度搜索（慢但全面） |

---

## 错误预防模式

### 问题：重复忘记工具偏好

**触发条件**：
- 新会话启动
- 距离上次使用某工具已超过1天

**应对策略**：
1. **不依赖记忆**：每次主动读取 `Intent/preferences/`
2. **纠正信号识别**：当用户说"我都说了"、"怎么没记住"时，立即沉淀到L2
3. **使用 reflect skill**：在纠正后主动分析并提取教训

---

## 相关文件

- `Intent/preferences/tools.md` - 工具偏好（用户设定）
- `Meta/reflections/2026-03-11-tool-usage.md` - 本次反思记录
