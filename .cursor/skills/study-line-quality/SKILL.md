---
name: study-line-quality
description: >-
  Filters Chinese-chess study lines so every ply prepares later play and is not a
  mere blunder or useless waiting move. Use when generating, adding, editing, or
  cleaning study/coach lines under src/study (openings, middlegame, endgame,
  pingfengWeb, lineFromPath), or when the user asks to 加谱/写棋谱/清洗谱/审谱.
  Do not use for engine search, AI openingBook, or pure UI copy with no line data.
---

# 学棋谱质量过滤

## 硬门槛（用户原话，勿改写）

我在这里给指令生成并添加的棋谱必须要去筛选过滤一次确保不是单纯的错着昏招，每一步棋都需要对后续的行为做铺垫或者开路，否则这步棋即便没有损失子力也应当是一步无用的不应收录在棋谱的棋

## 何时必读

- 用户要求生成 / 添加 / 改写 / 清洗 `src/study/**` 棋谱数据
- Plan 点名本 Skill，或 alwaysApply 规则指向本 Skill

## 收录判定

| 收录 | 不收录 |
|---|---|
| 为后续手段铺垫或开路（争先、出子、占线、诱敌后的计划着） | 单纯错着、昏招 |
| 弃子抢先、诱敌、有战术/战略目标的弃子 | 无补偿送吃 |
| 合理兑子 | **无后续铺垫的废着**（即便不丢子） |
| 指向其它专谱的短转指（benefit 写清「另见××谱」） | 为凑杀/凑和硬编的循环或无意义着 |

有疑义 → **先留**，在回复里点名 `课id` + `uci` + 理由，等人裁定。禁止「大概能走」就入库。

## 落地前 checklist（加谱/改谱必过）

```text
□ 已按上表逐手过滤（含变着）
□ 每手能一句话说清：铺垫了什么 / 开了哪条路
□ 无「只为演示终局」的送吃、凑杀、凑和
□ benefit/comment 讲计划，不剧透胜负词硬编
□ 非法着法已用对局/单测验证
□ 疑点已列出或已获人确认删除
```

## 与屏风清洗约定一致

- 不硬保红/黑/和三路终局；谱够多再自然衔接。
- 详见 `docs/superpowers/specs/2026-11-05-coach-multilines-and-line-cleanup-design.md`。
