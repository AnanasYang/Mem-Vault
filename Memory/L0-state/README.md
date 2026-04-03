# L0 State - Real-time Conversation Capture

L0 层是原始对话数据的实时捕获层，从 OpenClaw 会话中自动提取消息并存储为标准格式的 JSONL 文件。

## 目录结构

```
L0-state/
├── README.md                          # 本文件
├── daily-YYYY-MM-DD.jsonl             # 按日期存储的对话记录
└── .last-capture                      # 上次捕获时间戳（用于增量）
```

## 数据格式

每条记录为 JSON 行，包含以下字段：

```json
{
  "ts": "2026-04-02T08:16:00.000Z",    // ISO 8601 时间戳
  "role": "user|assistant|toolResult", // 消息角色
  "content": "消息内容...",              // 文本内容
  "sessionId": "uuid-string"           // OpenClaw 会话 ID
}
```

## 使用方式

### 1. 批量捕获（全量）

```bash
# 捕获今日所有会话
node ../scripts/capture-l0-realtime.js

# 捕获指定日期
DATE=2026-04-01 node ../scripts/capture-l0-realtime.js
```

### 2. 会话结束时捕获（实时）

```bash
# 在会话结束时调用
node ../scripts/l0-session-hook.js <session-id>
```

### 3. Shell 版本（依赖 jq）

```bash
# 捕获今日
../scripts/capture-l0.sh

# 捕获指定日期
../scripts/capture-l0.sh 2026-04-01
```

## 自动化集成

### 方案 A: 会话结束时自动触发

在 OpenClaw 会话结束时调用：
```bash
node ~/.openclaw/workspace/ai-memory-system/scripts/l0-session-hook.js $SESSION_ID
```

### 方案 B: 定时任务（Cron）

```cron
# 每小时捕获一次
0 * * * * cd ~/.openclaw/workspace/ai-memory-system && node scripts/capture-l0-realtime.js >> logs/l0-capture.log 2>&1
```

### 方案 C: 文件系统监听（inotify）

```bash
# 监听会话目录变化
inotifywait -m ~/.openclaw/agents/main/sessions -e modify -e create |
  while read path action file; do
    if [[ "$file" == *.jsonl ]]; then
      node ~/.openclaw/workspace/ai-memory-system/scripts/capture-l0-realtime.js
    fi
  done
```

## 回溯导入历史对话

```bash
# 导入过去 7 天
cd ~/.openclaw/workspace/ai-memory-system
for i in {0..6}; do
  DATE=$(date -d "$i days ago" +%Y-%m-%d)
  node scripts/capture-l0-realtime.js "$DATE"
done
```

## 状态

- ✅ 基础捕获机制完成
- ✅ 实时会话钩子完成
- ✅ JSONL 格式验证通过
- 🔄 待集成：自动触发（需要 OpenClaw 侧配置）
