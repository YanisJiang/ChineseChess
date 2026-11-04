import { describe, expect, it } from 'vitest'
import {
  applyMoveOnBoard,
  coordToSquare,
  createInitialBoard,
  sq,
} from '../engine/board'
import type { Piece } from '../engine/types'
import { formatChineseMove } from './chineseMove'

function move(uci: string) {
  const [a, b] = uci.split('-')
  return { from: coordToSquare(a!)!, to: coordToSquare(b!)! }
}

function play(board: (Piece | null)[], uci: string) {
  const m = move(uci)
  return applyMoveOnBoard(board, m.from, m.to)
}

describe('formatChineseMove', () => {
  it('开局炮二平五 / 马8进7 / 马八进七', () => {
    let board = createInitialBoard()
    expect(formatChineseMove(board, move('h2-e2'))).toBe('炮二平五')
    board = play(board, 'h2-e2')
    expect(formatChineseMove(board, move('h9-g7'))).toBe('马8进7')
    board = play(board, 'h9-g7')
    expect(formatChineseMove(board, move('b0-c2'))).toBe('马八进七')
  })

  it('车一进一（右车抬头）', () => {
    let board = createInitialBoard()
    board = play(board, 'h2-e2')
    board = play(board, 'h7-e7')
    board = play(board, 'b0-c2')
    board = play(board, 'h9-g7')
    expect(formatChineseMove(board, move('i0-i1'))).toBe('车一进一')
  })

  it('同线双炮：前/后', () => {
    const board: (Piece | null)[] = Array(90).fill(null)
    board[sq(4, 2)] = 'C'
    board[sq(4, 5)] = 'C'
    board[sq(4, 0)] = 'K'
    board[sq(4, 9)] = 'k'
    expect(
      formatChineseMove(board, { from: sq(4, 5), to: sq(3, 5) }),
    ).toBe('前炮平六')
    expect(
      formatChineseMove(board, { from: sq(4, 2), to: sq(3, 2) }),
    ).toBe('后炮平六')
  })

  it('兵三进一', () => {
    const board = createInitialBoard()
    expect(formatChineseMove(board, move('g3-g4'))).toBe('兵三进一')
  })
})
