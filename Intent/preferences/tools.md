---
level: intent
category: preferences
source: user_explicit
confidence: high
created: 2026-03-11
updated: 2026-03-11
---

# 工具偏好（Tools Preferences）

用户（Bruce）主动设定的工具使用偏好。

---

## 搜索工具

### 默认工具
- **首选**: Tavily Search (`skills/tavily-search/`)
- **禁用**: Brave Search (`web_search` 工具)

### 原因
- Tavily 针对AI场景优化，返回更干净、相关的结果
- Bruce 明确要求使用 Tavily 作为默认搜索工具

### 配置信息
```yaml
api_key: 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
path: /home/bruce/.openclaw/workspace/skills/tavily-search/
```

### 使用示例
```bash
node skills/tavily-search/scripts/search.mjs "query" --topic news -n 10
```

---

## 规则

- ✅ 搜索时**总是**使用 Tavily
- ❌ **永远不要**使用 `web_search` (Brave Search)
- ✅ 新闻搜索时加 `--topic news --days 1`
