---
level: L3
category: {{category}}  # thinking-pattern / decision-framework / mental-model / knowledge-structure
created: {{created_date}}
updated: {{updated_date}}
source: {{source}}
confidence: {{confidence}}
reviewed: {{reviewed_date}}
next_review: {{next_review_date}}
related_l2: {{related_l2_files}}
related_l3: {{related_l3_files}}
status: {{status}}  # active / deprecated / evolving
---

# {{framework_name}}

{{brief_description}}

---

## 框架定义

### 核心命题
{{core_proposition}}

### 底层假设
{{underlying_assumptions}}

### 适用范围
{{applicable_scope}}

---

## 构成要素

### 关键概念
{{#key_concepts}}
- **{{name}}**: {{definition}}
{{/key_concepts}}

### 原则/规则
{{#principles}}
- **{{name}}**: {{description}}
  - 优先级: {{priority}}
  - 适用条件: {{conditions}}
{{/principles}}

### 决策流程
{{decision_process}}

---

## 证据支撑

### 来自L2行为模式的支撑 ({{supporting_l2_count}}个)

{{#supporting_l2}}
#### {{index}}. [{{pattern_name}}](../L2-procedural/{{file}})
- **关系**: {{relationship}}
- **观察次数**: {{observation_count}}
- **稳定性**: {{stability}} (持续{{duration}})
- **典型表现**:
{{#manifestations}}
  - {{date}}: {{description}}
{{/manifestations}}
{{/supporting_l2}}

### 来自Intent的支撑
{{#supporting_intent}}
- **目标**: [{{goal_name}}](../Intent/goals/{{file}})
  - 关系: {{relationship}}
{{/supporting_intent}}

{{^supporting_intent}}
*无直接Intent支撑*
{{/supporting_intent}}

### 稳定性证据
{{stability_evidence}}

---

## 应用实例

### 场景1: {{scenario_1_name}}
**背景**: {{scenario_1_context}}
**决策过程**: {{scenario_1_process}}
**结果**: {{scenario_1_outcome}}

### 场景2: {{scenario_2_name}}
**背景**: {{scenario_2_context}}
**决策过程**: {{scenario_2_process}}
**结果**: {{scenario_2_outcome}}

### 反事实分析
{{#counterfactuals}}
- **如果不遵循此框架**: {{alternative_outcome}}
- **对比**: {{comparison}}
{{/counterfactuals}}

---

## 边界与限制

### 适用边界
{{applicable_boundaries}}

### 不适用场景
{{non_applicable_scenarios}}

### 潜在盲点
{{potential_blindspots}}

### 与其他框架的冲突
{{#framework_conflicts}}
- **[{{framework_name}}]({{file}})**: {{conflict_description}}
  - 协调方式: {{resolution}}
{{/framework_conflicts}}

{{^framework_conflicts}}
*暂无已知冲突*
{{/framework_conflicts}}

---

## 框架变体

### 强形式
{{strong_form}}

### 弱形式
{{weak_form}}

### 上下文变体
{{#context_variants}}
- **{{context}}**: {{variant_description}}
{{/context_variants}}

---

## 演变历史

{{#evolution_history}}
### {{date}} - {{event_type}}
{{description}}

**触发因素**: {{trigger}}
**证据变化**: {{evidence_change}}
{{/evolution_history}}

{{^evolution_history}}
*初始建立*
{{/evolution_history}}

---

## AI应用指南

### 何时引用此框架
{{when_to_apply}}

### 如何应用
{{how_to_apply}}

### 与其他框架的协同
{{framework_integration}}

### 需要谨慎的情况
{{caution_notes}}

---

## 待探索问题

{{#open_questions}}
- [ ] {{question}} (提出日期: {{date}})
{{/open_questions}}

{{^open_questions}}
*暂无待探索问题*
{{/open_questions}}

---

## 人工确认记录

{{#confirmations}}
### {{date}} - {{type}}
**确认人**: {{confirmer}}
**内容**: {{content}}
**反馈**: {{feedback}}
**调整**: {{adjustments}}
{{/confirmations}}

{{^confirmations}}
*待首次人工确认*
{{/confirmations}}

---

*上次Review: {{last_review_date}} | 下次Review: {{next_review_date}}*

---

## 使用说明

此模板用于创建/更新L3认知层记忆文件。填充指南：

1. **框架定义**: 清晰阐述该认知框架的核心命题和假设
2. **构成要素**: 列出框架包含的关键概念、原则和决策流程
3. **证据支撑**: 必须有3+ L2行为模式的支撑，展示稳定性证据
4. **应用实例**: 提供具体场景下的应用案例
5. **边界与限制**: 诚实声明框架的适用范围和潜在盲点
6. **AI应用指南**: 指导AI何时、如何正确引用此框架
7. **人工确认**: 用户确认框架准确性，可提出修正和补充

**注意**: L3框架必须经过人工确认才能正式生效，不可仅由AI推断确定。
