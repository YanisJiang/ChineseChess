# 中炮对屏风马短谱网 Implementation Plan

> **For agentic workers:** 本会话按用户 `do` 内联执行；步骤用 checkbox 跟踪。

**Goal:** 用多段短谱拼出中炮对屏风马可走完的红胜/黑胜/和棋三路示范，谱名不剧透。

**Architecture:** 开局早分叉 + 中/残 `startFen` 接力；线性主路径按阶段切片成课，关键点挂旁支接到另两路；终局课最后一手使引擎出现将死/困毙/三次重复和。

**Tech Stack:** TypeScript、现有 `StudyLine` / `fenIndex` / `Game`、Vitest、`scripts` 校验。

## Global Constraints

- 标题/文案不写胜负结果词
- 不改转谱/一手进谱/人机/`openingBook.ts`（除非硬 bug）
- 本轮仅屏风网；精确 FEN 衔接
- 复用 `validate`/`gen-study-fens` 思路，不新造验收炉子
- 用户未要求则不 `git commit` 到分支；用游离注解标签作回退点

## 文件职责

| 文件 | 职责 |
|---|---|
| `src/study/pingfengWeb.ts` | 屏风示范网课数据（短谱列表） |
| `src/study/catalog.ts` | 挂入 STUDY_LINES |
| `src/study/openings.ts` | `zhongpao-pingfeng` 终着接到网 |
| `src/study/middlegame.ts` / `endgame.ts` | 改造/替换与网冲突的旧屏风短课，或改为 re-export 网课 |
| `src/study/pingfengWeb.test.ts` | 衔接命中 + 三路终局 |
| `scripts/play-uci.mts`（可选） | 推演 FEN/合法着辅助 |

---

### Task 1: 红向完整合法路径 + 切片短谱

**Files:**
- Create: `src/study/pingfengWeb.ts`
- Create: `scripts/play-uci.mts`（推演用）
- Test: `src/study/pingfengWeb.test.ts`

- [ ] **Step 1:** 用引擎从标准开局走出一条红胜合法 UCI 序列（教学编排），确认最后一手后 `Game.getResult()` 为红胜将死/困毙。
- [ ] **Step 2:** 按阶段切成短谱（开/中前/中后/残），每课 `startFen` = 上一段终点；课内主线 + ≥1 旁支位（旁支可先 `end` 占位）。
- [ ] **Step 3:** 单测：相邻课 FEN 衔接；红路径走完有结果。

### Task 2: 黑向 / 和向分叉短谱

- [ ] **Step 1:** 在红路径某中局关键点分出黑向完整合法序列至黑胜。
- [ ] **Step 2:** 另分出和向：谱着走成三次相同 FEN（含行棋方）触发重复和。
- [ ] **Step 3:** 标题不剧透；单测覆盖三路结果。

### Task 3: 接入开局与目录、改造旧课

- [ ] **Step 1:** `zhongpao-pingfeng` 主线终点可一手/局面挂上第一段中局网课。
- [ ] **Step 2:** 旧 `mid-paoda-zhongbing` / `end-duima-tingbing` 并入网或改为网节点（保持 id 或测里引用更新）。
- [ ] **Step 3:** `catalog` 导出；`navigate.test` 数量断言仍绿。

### Task 4: 全量校验与回退点

- [ ] **Step 1:** `npm test` 全绿；全谱合法着巡检。
- [ ] **Step 2:** 游离注解标签 `conv/2026-11-05-pingfeng-web`。

## Spec 覆盖自检

| 规格项 | 任务 |
|---|---|
| 短谱拼完整局 | T1 |
| 红/黑/和三路 | T2 |
| 不剧透 | T2 文案 |
| 一手多方向 | T1/T2 旁支 |
| 阶段切课 | T1 切片 |
| 不改转谱算法 | 全局约束 |
| 旧课改造 | T3 |
