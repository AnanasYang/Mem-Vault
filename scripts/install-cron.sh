#!/bin/bash
# 安装定时同步任务

echo "Installing cron job for auto-sync..."

CRON_JOB="*/30 * * * * /home/bruce/.openclaw/workspace/memory-core/scripts/auto-sync.sh >> /home/bruce/.openclaw/workspace/memory-core/.sync.log 2>&1"

# 检查是否已存在
if crontab -l 2>/dev/null | grep -q "memory-sync"; then
  echo "Cron job already exists"
else
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  echo "Cron job installed: sync every 30 minutes"
fi
