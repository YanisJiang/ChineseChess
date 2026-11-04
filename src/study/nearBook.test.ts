import { describe, expect, it } from 'vitest'
import {
  applyMoveOnBoard,
  coordToSquare,
  createInitialBoard,
} from '../engine/board'
import { parseFen } from '../engine/fen'
import { STUDY_LINES } from './catalog'
import { buildStudyFenIndex } from './fenIndex'
import { findOneMoveEntries } from './nearBook'

describe('nearBook', () => {
  const index = buildStudyFenIndex(STUDY_LINES)

  it('开局差一手中炮：提示含炮二平五可进谱', () => {
    const board = createInitialBoard()
    const entries = findOneMoveEntries(board, 'red', index)
    expect(entries.length).toBeGreaterThan(0)
    expect(entries.length).toBeLessThanOrEqual(6)
    const zhongpao = entries.find((e) => e.uci === 'h2-e2')
    expect(zhongpao).toBeTruthy()
    expect(zhongpao!.label).toContain('炮')
    expect(zhongpao!.remaining).toBeGreaterThan(0)
    expect(zhongpao!.line.phase).toBe('opening')
  })

  it('完全无关局面：无一手进谱提示', () => {
    const { board, sideToMove } = parseFen('3a5/9/9/9/9/9/9/9/9/5K3 w')
    expect(findOneMoveEntries(board, sideToMove, index)).toEqual([])
  })

  it('同局面多课时结果有上限且按剩余着法排序', () => {
    const board = createInitialBoard()
    const entries = findOneMoveEntries(board, 'red', index, { limit: 3 })
    expect(entries.length).toBeLessThanOrEqual(3)
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i - 1]!.remaining).toBeGreaterThanOrEqual(
        entries[i]!.remaining,
      )
    }
  })

  it('屏风途中：一手可跨入三步虎等其它课', () => {
    let board = createInitialBoard()
    for (const step of ['h2-e2', 'h9-g7']) {
      const [a, b] = step.split('-')
      board = applyMoveOnBoard(board, coordToSquare(a!)!, coordToSquare(b!)!)
    }
    // 扩谱后同局面一手进谱候选增多，抬高 limit 仍应能跨到三步虎
    const entries = findOneMoveEntries(board, 'red', index, { limit: 16 })
    const cross = entries.filter((e) => e.line.id !== 'zhongpao-pingfeng')
    expect(cross.some((e) => e.line.id === 'sanbuhu' && e.uci === 'h0-g2')).toBe(
      true,
    )
  })
})
