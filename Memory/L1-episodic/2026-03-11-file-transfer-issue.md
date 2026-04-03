---
level: L1
category: episodic
source: observation
confidence: high
review_date: 2026-03-16
created: 2026-03-11
resolved: true
---

# 事件：飞书文件传输不稳定 → 已解决 ✅

## 时间线
- **11:35**：`kimi_upload_file` → **失败** (`invalid params`)
- **11:40**：`kimi_upload_file` → 工具成功，用户**未收到**
- **11:56**：`kimi_upload_file` → 工具成功，用户**未收到**
- **12:02**：`message` 工具 + `filePath` → **成功送达** ✅

## 解决方案
```javascript
// ✅ 正确方式：使用 message 工具
message {
  action: "send",
  filePath: "/path/to/file.md",
  filename: "ai-daily-report-YYYY-MM-DD.md"
}

// ❌ 避免：kimi_upload_file 工具（不稳定）
```

## 经验总结
- `kimi_upload_file` 工具存在"假成功"问题（工具返回成功但实际未送达）
- `message` 工具的 `filePath` 参数更可靠
- 文件发送后应主动询问用户是否收到

## 关联
- `L2-procedural/daily-report-workflow.md` - 已更新正确发送方式
- `Intent/preferences/daily-report.md` - 已更新交付要求
