import { describe, expect, it } from 'vitest'
import { createInitialBoard, moveToCoord, sq } from '../engine/board'
import { applyMoveOnBoard } from '../engine/board'
import {
  bookMovesUci,
  bookPositionCount,
  chooseBookMove,
  pickWeighted,
} from './openingBook'
import { chooseAiMove, nearBestPool } from './search'

describe('开局库', () => {
  it('至少收录若干局面', () => {
    expect(bookPositionCount()).toBeGreaterThanOrEqual(5)
  })

  it('标准开局红方有多条变招', () => {
    const board = createInitialBoard()
    const ucis = bookMovesUci(board, 'red')
    expect(ucis.length).toBeGreaterThanOrEqual(4)
    expect(ucis).toEqual(expect.arrayContaining(['h2-e2', 'b2-e2', 'b0-c2']))
  })

  it('不同随机种子开局库着不完全相同', () => {
    const board = createInitialBoard()
    const seen = new Set<string>()
    for (let i = 0; i < 40; i++) {
      const r = i / 40
      const m = chooseBookMove(board, 'red', () => r)
      expect(m).not.toBeNull()
      seen.add(moveToCoord(m!.from, m!.to))
    }
    expect(seen.size).toBeGreaterThanOrEqual(3)
  })

  it('红中炮后黑方库内有变招', () => {
    let board = createInitialBoard()
    board = applyMoveOnBoard(board, sq(7, 2), sq(4, 2)) // h2-e2
    const ucis = bookMovesUci(board, 'black')
    expect(ucis.length).toBeGreaterThanOrEqual(3)
    expect(ucis).toEqual(expect.arrayContaining(['h9-g7', 'h7-e7']))
  })
})

describe('近分池与加权', () => {
  it('只保留 best−margin 内的着', () => {
    const pool = nearBestPool(
      [
        { move: { from: 0, to: 1 }, score: 100 },
        { move: { from: 0, to: 2 }, score: 80 },
        { move: { from: 0, to: 3 }, score: 40 },
      ],
      25,
    )
    expect(pool.map((p) => p.move.to).sort()).toEqual([1, 2])
  })

  it('pickWeighted 可按区间命中不同项', () => {
    const items = [
      { id: 'a', weight: 1 },
      { id: 'b', weight: 1 },
    ]
    expect(pickWeighted(items, () => 0).id).toBe('a')
    expect(pickWeighted(items, () => 0.6).id).toBe('b')
  })
})

describe('chooseAiMove 开局走库', () => {
  it('开局优先用库而非纯搜索复读', () => {
    const board = createInitialBoard()
    const seen = new Set<string>()
    for (let i = 0; i < 30; i++) {
      const m = chooseAiMove(board, 'red', 'strong', () => i / 30)
      expect(m).not.toBeNull()
      seen.add(moveToCoord(m!.from, m!.to))
    }
    expect(seen.size).toBeGreaterThanOrEqual(3)
  })
})
