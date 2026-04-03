---
level: L2
category: {{category}}
source: {{source}}
confidence: {{confidence}}
created: {{created_date}}
updated: {{updated_date}}
review_cycle: monthly
next_review: {{next_review_date}}
related_l1: {{related_l1_sources}}
status: {{status}}  # active / deprecated / merged
---

# {{pattern_name}}

{{brief_description}}

---

## 模式定义

### 核心特征
{{core_characteristics}}

### 触发场景
{{trigger_scenarios}}

### 典型表现
{{typical_manifestations}}

---

## 观察记录

### 实例汇总 ({{total_observations}}次观察)

| 序号 | 日期 | 来源 | 场景 | 具体表现 | 置信度 |
|-----|------|------|------|---------|--------|
{{#observations}}
| {{index}} | {{date}} | [{{source}}](../L1-episodic/{{source}}) | {{scenario}} | {{manifestation}} | {{confidence}} |
{{/observations}}

### 时间分布
- **首次观察**: {{first_observed_date}}
- **最近观察**: {{last_observed_date}}
- **观察周期**: {{observation_span_days}}天
- **频率**: 平均每{{avg_interval_days}}天出现一次

---

## 边界与例外

### 适用条件
{{applicable_conditions}}

### 不适用场景
{{non_applicable_conditions}}

### 反例记录
{{#counter_examples}}
- **日期**: {{date}}
  **场景**: {{scenario}}
  **说明**: {{description}}
{{/counter_examples}}

{{^counter_examples}}
*暂无反例记录*
{{/counter_examples}}

---

## 相关模式

### 强相关 (指向同一认知框架)
{{#strong_related}}
- [{{name}}]({{file}}) — {{relationship}}
{{/strong_related}}

{{^strong_related}}
*暂无强相关模式*
{{/strong_related}}

### 弱相关 (可能同时出现)
{{#weak_related}}
- [{{name}}]({{file}}) — {{relationship}}
{{/weak_related}}

{{^weak_related}}
*暂无弱相关模式*
{{/weak_related}}

### 互斥模式 (不会同时出现)
{{#mutual_exclusive}}
- [{{name}}]({{file}}) — {{relationship}}
{{/mutual_exclusive}}

{{^mutual_exclusive}}
*暂无互斥模式*
{{/mutual_exclusive}}

---

## AI应用指南

### 当检测到该模式时
{{detection_guidance}}

### 建议的响应方式
{{response_recommendations}}

### 需要避免的行为
{{avoid_behaviors}}

---

## 演变历史

{{#evolution_history}}
### {{date}} - {{event}}
{{description}}
{{/evolution_history}}

{{^evolution_history}}
*初始创建*
{{/evolution_history}}

---

## 人工确认记录

{{#confirmations}}
### {{date}} - {{type}}
**确认人**: {{confirmer}}
**内容**: {{content}}
**反馈**: {{feedback}}
{{/confirmations}}

{{^confirmations}}
*待首次人工确认*
{{/confirmations}}

---

*上次Review: {{last_review_date}} | 下次Review: {{next_review_date}}*

---

## 使用说明

此模板用于创建/更新L2行为层记忆文件。填充指南：

1. **模式定义**: 准确描述该行为模式的本质特征
2. **观察记录**: 列出所有支持该模式的L1来源，至少3次
3. **边界与例外**: 明确模式的适用范围和不适用场景
4. **相关模式**: 帮助构建模式网络，指向潜在的L3框架
5. **AI应用指南**: 告诉AI如何识别和响应该模式
6. **人工确认**: 用户确认该模式是否准确，可添加修正意见
