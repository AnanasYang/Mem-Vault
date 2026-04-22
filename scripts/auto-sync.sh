#!/bin/bash
# Auto Sync Script for AI Memory System
# 自动检测变更并推送到 GitHub

set -e

MEMORY_DIR="/home/bruce/.openclaw/workspace/memory-core"
LOG_FILE="$MEMORY_DIR/.sync.log"
LOCK_FILE="/tmp/memory-sync.lock"

# 防止重复运行
if [ -f "$LOCK_FILE" ]; then
  PID=$(cat "$LOCK_FILE")
  if ps -p "$PID" > /dev/null 2>&1; then
    echo "$(date): Sync already running, skipping" >> "$LOG_FILE"
    exit 0
  fi
fi
echo $$ > "$LOCK_FILE"

cd "$MEMORY_DIR"

# 检查是否有变更
if [ -z "$(git status --porcelain)" ]; then
  rm -f "$LOCK_FILE"
  exit 0
fi

# 添加所有变更
git add -A

# 生成提交信息
CHANGES=$(git status --short | head -5 | sed 's/^/- /')
COMMIT_MSG="Auto-sync: $(date '+%Y-%m-%d %H:%M')

Changes:
$CHANGES"

# 提交
git commit -m "$COMMIT_MSG" >> "$LOG_FILE" 2>&1 || true

# 推送
git push origin main >> "$LOG_FILE" 2>&1

echo "$(date): Sync completed" >> "$LOG_FILE"
rm -f "$LOCK_FILE"
