# 陪练一着多谱直出 + 屏风网清洗 Implementation Plan

> **For agentic workers:** 用户已说 do → 本会话 inline 执行。Steps 用 checkbox 跟踪。

**Goal:** 棋盘直出按「本谱有续留本谱 / 无续取第一转入谱」；侧栏点即转谱并走一步；清掉屏风网无计划送吃与凑杀/凑和尾巴。

**Architecture:** 转谱判定收拢到 `transferIntent` 可测函数；`App.tsx` 去掉一着多谱点选门闩；`pingfengWeb.ts` 删三路尾巴、枢纽只留短实用分支。

**Tech Stack:** TypeScript、React、Vitest

## Global Constraints

- 不保三路终局；有疑义弃子先留；不改 `openingBook.ts`；不提交除非用户要求 → 用游离注解标签回退点。
- Spec: `docs/superpowers/specs/2026-11-05-coach-multilines-and-line-cleanup-design.md`

## Plan 勾选（仓库门槛）

```text
目标 | 改 App 转谱+侧栏；改 transferIntent；清洗 pingfengWeb；改测例；旧终局 spec 降级标注
不改什么 | openingBook、学棋主流程、造新审谱炉子
禁区 | 无
验收 | 单测绿；①②与侧栏点即走有测；无 pf-red/black/draw 尾巴与三路终局断言
风险 | 人工误判多删 → 有疑义留
回退 | 游离 tag
硬门槛 | plan-then-confirm-do(已do) | minimize-change | feature-then-test | change-conversation-tag
Skill | writing-plans(本文件) | brainstorming(已完)
```

### Task 1: transferIntent ①② 判定

**Files:** Modify `src/study/transferIntent.ts`, `src/study/transferIntent.test.ts`

- [ ] 增加 `shouldStayOnCurrentLine` / `resolveTransferLineId`（本谱有续→null；否则 transfer 或 firstCross）
- [ ] 单测覆盖 ①②
- [ ] `npm test -- src/study/transferIntent.test.ts`

### Task 2: App 接上新规则 + 侧栏点即走

**Files:** Modify `src/App.tsx`

- [ ] 转谱 effect 用新判定；删「ambiguous 未点选则 return」
- [ ] `selectCoachCrossEntry`：转谱 + `beginMove`
- [ ] 文案；一手贴谱不强制 preferredUci
- [ ] `npm test`

### Task 3: 清洗 pingfengWeb

**Files:** Modify `src/study/pingfengWeb.ts`, `src/study/pingfengWeb.test.ts`, 标注旧 spec

- [ ] 删 RED/BLACK/DRAW tails 与 continueTail 课
- [ ] 枢纽去掉无计划下卒主线，保留平炮/边炮短支
- [ ] 测例去终局三路；断言无 pf-*-尾巴 id
- [ ] 旧设计文档状态标注
- [ ] `npm test`；游离 tag
---
