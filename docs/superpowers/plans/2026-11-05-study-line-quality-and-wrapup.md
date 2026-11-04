# 学棋谱质量 Skill + 收尾 Implementation Plan

> **For agentic workers:** 用户已 do → 本会话 inline 执行。

**Goal:** 落地 study-line-quality Skill、薄规则、文档收尾、学棋文案、审谱修复、验收清单与预览点验。

**Architecture:** Skill 管加谱质量门槛；alwaysApply 只留指针；文案只改 StudyPanel/学棋 status；审谱人工过三文件。

**Tech Stack:** Cursor Skill、TypeScript/React、Vitest、Vite preview

## Global Constraints

- 用户原话原文进 Skill；有疑义留并点名；不提交除非用户要求→注解标签；本轮 Skill：`study-line-quality`、`create-skill`（已读）。

### Task 1: Skill + 薄规则 + 文档
- [ ] `.cursor/skills/study-line-quality/SKILL.md`
- [ ] `.cursor/rules/study-line-quality.mdc` 一句指针
- [ ] cleanup design/plan → 已实现；本批 spec/plan

### Task 2: 学棋文案
- [ ] StudyPanel + App 学棋 status 对齐点即走说明

### Task 3: 审谱
- [ ] 扫 openings/middlegame/endgame/pingfengWeb；改明显问题；疑点列表

### Task 4: 验收
- [ ] `docs/.../acceptance.md`；dev 点验；`npm test`；tag
---
