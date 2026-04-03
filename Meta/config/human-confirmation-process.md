---
title: AI记忆系统 - 人工确认流程
type: process-document
version: 1.0
created: 2026-04-02
applies_to:
  - L2-procedural (行为层)
  - L3-semantic (认知层)
---

# 人工确认流程设计

## 1. 流程概览

```
┌─────────────────────────────────────────────────────────────────┐
│                      模式检测完成                                │
│              (L2: 3次+重复 / L3: 多L2聚合)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: 生成候选报告                                            │
│  ───────────────────                                             │
│  创建 Meta/insights/l2-candidates-YYYY-MM-DD.md                 │
│  包含：检测到的模式、证据来源、置信度、建议文件位置               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: 人工确认触发                                            │
│  ───────────────────                                             │
│  方式A: Heartbeat提醒 (每天检查一次待确认候选)                    │
│  方式B: 用户主动触发 "帮我review记忆候选"                         │
│  方式C: 定时汇总 (每周日发送确认提醒)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: 确认交互                                                │
│  ───────────                                                     │
│  AI展示候选模式 → 用户确认/修正/拒绝 → 记录反馈                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
              ┌────────┐ ┌────────┐ ┌────────┐
              │  确认   │ │  修正   │ │  拒绝   │
              │ ✓     │ │ ✏️     │ │ ✗     │
              └────┬───┘ └───┬────┘ └───┬────┘
                   │         │          │
                   ▼         ▼          ▼
              ┌─────────────────────────────────┐
              │  Step 4: 执行沉淀                │
              │  ───────────────                 │
              │  根据确认结果更新记忆文件         │
              │  记录确认历史到 Meta/reviews/    │
              └─────────────────────────────────┘
```

---

## 2. 确认触发机制

### 2.1 Heartbeat检测 (自动化)

```yaml
# HEARTBEAT.md 添加检查项
heartbeat_tasks:
  - name: check_pending_confirmations
    description: "检查待确认的记忆候选"
    frequency: "daily"
    action: |
      1. 扫描 Meta/insights/*-candidates-*.md
      2. 统计未确认候选数量
      3. 如有未确认项，生成提醒消息
```

**触发条件:**
- 检测到新的 L2/L3 候选
- 候选等待确认超过 3 天
- 累积超过 5 个待确认候选

### 2.2 用户主动触发

```
用户输入:
- "帮我review记忆候选"
- "确认一下检测到的模式"
- "看看有什么待确认的记忆"
```

### 2.3 定时汇总 (Cron)

```cron
# 每周日 10:00 发送确认提醒
0 10 * * 0 cd ~/.openclaw/workspace/ai-memory-system && node scripts/send-confirmation-reminder.mjs
```

---

## 3. 确认交互流程

### 3.1 候选展示格式

---

**📋 记忆候选确认 ({{current}}/{{total}})**

**候选类型**: L2行为模式 / L3认知框架
**检测时间**: {{detection_date}}
**置信度**: {{confidence_level}} ({{confidence_score}})

---

**🔍 模式名称**: {{pattern_name}}

**描述**: {{description}}

**证据来源** ({{observation_count}}次观察):
| 日期 | 场景 | 具体表现 |
|------|------|---------|
{{#evidence}}
| {{date}} | {{scenario}} | {{manifestation}} |
{{/evidence}}

---

**建议存储位置**: `{{suggested_file}}`

---

**请确认**:
1. ✅ **确认** — 描述准确，可沉淀到记忆系统
2. ✏️ **修正** — 基本正确，但需要调整 (请说明)
3. ✗ **拒绝** — 这不是我的模式 / 观察有误
4. ⏸️ **跳过** — 暂时不确定，下次再说

---

### 3.2 用户响应处理

#### 场景A: 确认 (Confirm)

```
用户输入: "确认" / "1" / "是的"

AI动作:
1. 使用模板创建/更新记忆文件
2. 在 Meta/reviews/ 记录确认历史
3. 更新候选状态为 confirmed
4. 汇报: "已沉淀到 {{file_path}}"
```

#### 场景B: 修正 (Revise)

```
用户输入: "修正: 不是'系统化思维'，是'结构化偏好'"

AI动作:
1. 根据修正内容更新模式定义
2. 记录修正原因到 confirmation history
3. 使用修正后的内容创建记忆文件
4. 汇报: "已根据您的反馈修正并沉淀"
```

#### 场景C: 拒绝 (Reject)

```
用户输入: "拒绝" / "这不是我" / "观察错了"

AI动作:
1. 询问拒绝原因 (可选):
   - "偶尔行为，不是常态"
   - "特殊情况，不具代表性"
   - "观察有误，理解偏差"
   - "其他 (请说明)"
2. 记录拒绝到 Meta/reviews/rejections.md
3. 将相关观察标记为 rejected
4. 更新检测算法避免类似误判 (长期优化)
5. 汇报: "已记录拒绝，相关观察将被重新评估"
```

#### 场景D: 跳过 (Skip)

```
用户输入: "跳过" / "不确定" / "下次再说"

AI动作:
1. 保持候选状态为 pending
2. 下次提醒时再次展示
3. 如果跳过超过3次，降低置信度并询问是否拒绝
```

---

## 4. 确认记录存储

### 4.1 确认历史文件

**文件位置**: `Meta/reviews/confirmations-YYYY-MM.md`

```markdown
---
month: 2026-04
total_candidates: 12
confirmed: 8
revised: 2
rejected: 1
skipped: 1
---

# 记忆确认记录 - 2026年4月

## 2026-04-02

### 10:30 - L2 确认: 系统化思维 ✅
**置信度**: high (0.85)
**来源**: 4次L1观察
**用户反馈**: 确认
**沉淀文件**: Memory/L2-procedural/thinking-patterns.md
**备注**: 无

### 10:35 - L2 修正: 晨间工作习惯 ✏️
**置信度**: medium (0.72)
**来源**: 3次L1观察
**用户反馈**: "不是'晨间'，是'每天开始工作前'，不限定时间"
**修正内容**: 
  - 模式名: "工作启动习惯"
  - 描述: 每天开始工作前有固定的准备流程
**沉淀文件**: Memory/L2-procedural/work-habits.md
**备注**: 时间边界放宽

### 10:40 - L3 拒绝: 风险偏好框架 ✗
**置信度**: medium (0.68)
**来源**: 2个L2模式聚合
**用户反馈**: 拒绝 — "我目前没有明确的风险偏好框架，观察不够"
**拒绝原因**: 证据不足，不足以支撑认知层结论
**后续动作**: 等待更多L2观察后再评估
**备注**: 建议30天后重新评估
```

### 4.2 候选追踪文件

**文件位置**: `Meta/insights/pending-confirmations.json`

```json
{
  "lastUpdated": "2026-04-02T10:40:00Z",
  "pending": [
    {
      "id": "L2-20260402-001",
      "type": "L2",
      "name": "系统化思维",
      "confidence": 0.85,
      "detectedAt": "2026-04-02T08:00:00Z",
      "status": "confirmed",
      "confirmedAt": "2026-04-02T10:30:00Z"
    },
    {
      "id": "L2-20260402-002",
      "type": "L2",
      "name": "晨间工作习惯",
      "confidence": 0.72,
      "detectedAt": "2026-04-02T08:00:00Z",
      "status": "confirmed_with_revision",
      "confirmedAt": "2026-04-02T10:35:00Z",
      "revisionNotes": "时间边界放宽"
    },
    {
      "id": "L3-20260402-001",
      "type": "L3",
      "name": "风险偏好框架",
      "confidence": 0.68,
      "detectedAt": "2026-04-02T08:00:00Z",
      "status": "rejected",
      "rejectedAt": "2026-04-02T10:40:00Z",
      "rejectionReason": "证据不足"
    }
  ],
  "stats": {
    "totalPending": 0,
    "confirmedThisMonth": 8,
    "rejectedThisMonth": 1
  }
}
```

---

## 5. 批量确认流程

### 5.1 每周汇总提醒

当待确认候选较多时，使用批量确认界面：

---

**📬 本周记忆候选汇总 ({{count}}个待确认)**

你有 {{count}} 个由AI检测到的行为/认知模式候选等待确认。

### 高置信度候选 (建议确认)

{{#high_confidence}}
**{{index}}. {{name}}** ({{confidence}})
- {{brief_description}}
- 证据: {{evidence_count}}次观察
- [确认] [修正] [查看详情]
{{/high_confidence}}

### 中等置信度候选 (请仔细核对)

{{#medium_confidence}}
**{{index}}. {{name}}** ({{confidence}})
- {{brief_description}}
- 证据: {{evidence_count}}次观察
- [确认] [修正] [拒绝] [查看详情]
{{/medium_confidence}}

### 快速操作
- [全部确认高置信度候选]
- [逐个确认]
- [稍后处理]

---

### 5.2 批量确认命令

```
用户输入:
- "全部确认" — 确认所有高置信度候选
- "确认1,2,5" — 确认指定序号
- "拒绝3,4" — 拒绝指定序号
```

---

## 6. 拒绝处理与反馈

### 6.1 拒绝分类

| 拒绝原因 | 处理方式 | 后续动作 |
|---------|---------|---------|
| **偶尔行为** | 标记为non-recurring | 加入观察黑名单30天 |
| **特殊情况** | 标记为context-specific | 添加例外条件到模式定义 |
| **观察有误** | 标记为false-positive | 分析误判原因，优化检测算法 |
| **主观不认同** | 标记为user-rejected | 尊重用户判断，不再提示 |

### 6.2 误判反馈循环

```
拒绝记录 → 分析模式 → 调整阈值 → 验证改进
    ↑                                      │
    └──────────────────────────────────────┘
```

**文件**: `Meta/evolutions/detection-improvements.md`

```markdown
## 2026-04-02 - 检测算法调整

**触发**: 用户拒绝 "风险偏好框架" L3候选

**分析**:
- 原始依据: 2个L2模式 + 1个目标声明
- 问题: L2模式稳定性不足（均只有3次观察）
- 误判原因: L3聚合阈值过低

**调整**:
- L3 min_l2_patterns: 2 → 3
- L3 stability_window: 60天 → 90天
- 新增: L2模式必须各自稳定30天以上

**验证**: 下次检测时观察是否减少类似误判
```

---

## 7. 特殊情况处理

### 7.1 冲突模式

当检测到与用户已有记忆冲突的新模式：

```
⚠️ 检测到潜在冲突

已有模式: "晨型人" (L2)
  └─ 描述: 倾向于在早晨处理重要任务

新候选: "夜猫子工作模式" (L2候选)
  └─ 描述: 晚上工作效率更高

可能情况:
1. 行为发生了变化 (旧模式已不适用)
2. 场景差异 (工作日vs周末 / 项目类型差异)
3. 观察错误 (需要拒绝)

请确认:
[行为已变化，更新旧模式] [添加场景条件] [拒绝新模式]
```

### 7.2 敏感模式

对于涉及隐私、价值观等敏感内容的模式：

```
🔒 敏感内容确认

检测到可能涉及个人隐私/价值观的模式:
"{{pattern_name}}"

该模式涉及: {{sensitive_category}}

[确认沉淀] [仅本次会话使用，不存储] [拒绝]
```

---

## 8. 自动化脚本

### 8.1 确认提醒脚本

```javascript
// scripts/send-confirmation-reminder.mjs
// 功能: 扫描待确认候选，生成提醒消息

import { loadPendingConfirmations } from './lib/memory-utils.mjs';
import { formatConfirmationReminder } from './lib/formatters.mjs';

async function sendReminder() {
  const pending = await loadPendingConfirmations();
  
  if (pending.length === 0) return;
  
  // 分类统计
  const highConfidence = pending.filter(p => p.confidence >= 0.8);
  const mediumConfidence = pending.filter(p => p.confidence >= 0.6 && p.confidence < 0.8);
  const waitingLong = pending.filter(p => daysSince(p.detectedAt) > 3);
  
  // 生成提醒
  if (waitingLong.length > 0 || pending.length >= 5) {
    const message = formatConfirmationReminder({
      total: pending.length,
      high: highConfidence,
      medium: mediumConfidence,
      urgent: waitingLong
    });
    
    console.log(message);
    // 或发送到消息通道
  }
}

sendReminder();
```

### 8.2 确认执行脚本

```javascript
// scripts/execute-confirmation.mjs
// 功能: 根据用户确认结果，执行记忆沉淀

import { loadTemplate } from './lib/templates.mjs';
import { writeMemoryFile } from './lib/memory-utils.mjs';
import { recordConfirmation } from './lib/review-utils.mjs';

async function executeConfirmation(candidateId, action, revisionNotes = null) {
  const candidate = await loadCandidate(candidateId);
  
  switch(action) {
    case 'confirm':
      await createMemoryFile(candidate);
      await recordConfirmation({ ...candidate, status: 'confirmed' });
      break;
      
    case 'revise':
      const revised = applyRevision(candidate, revisionNotes);
      await createMemoryFile(revised);
      await recordConfirmation({ ...revised, status: 'confirmed_with_revision', revisionNotes });
      break;
      
    case 'reject':
      await recordRejection(candidate, revisionNotes);
      await updateCandidateStatus(candidateId, 'rejected');
      break;
      
    case 'skip':
      await updateCandidateStatus(candidateId, 'skipped');
      break;
  }
}
```

---

## 9. 流程总结

```
┌─────────────────────────────────────────────────────────────┐
│                     人工确认流程图                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  检测完成 ──→ 生成候选报告 ──→ 触发确认提醒                   │
│     │                              │                        │
│     │                              ▼                        │
│     │                        用户确认交互                    │
│     │                              │                        │
│     │              ┌───────────────┼───────────────┐        │
│     │              ▼               ▼               ▼        │
│     │           确认 ✅          修正 ✏️          拒绝 ✗      │
│     │              │               │               │        │
│     │              ▼               ▼               ▼        │
│     │         沉淀到记忆       修正后沉淀      记录拒绝原因    │
│     │         更新review       更新review      优化检测算法    │
│     │              │               │                        │
│     └──────────────┴───────────────┘                        │
│                    │                                        │
│                    ▼                                        │
│              流程完成，等待下次检测                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**设计完成时间**: 2026-04-02  
**适用版本**: AI Memory System v1.0
