import { describe, expect, it } from 'vitest'
import { applyMoveOnBoard, createInitialBoard, sq } from '../engine/board'
import { generateLegalMoves } from '../engine/moves'
import { getOpening, OPENINGS } from './openings'
import {
  bookMoveSquares,
  parseUci,
  pickHintMove,
  resolveOpening,
} from './navigate'
import type { BookNode } from './types'
import type { Move, Side } from '../engine/types'

function assertLineLegal(node: BookNode, board = createInitialBoard(), side: Side = 'red') {
  for (const edge of node.moves) {
    const m = parseUci(edge.uci)
    expect(m, `bad uci ${edge.uci}`).not.toBeNull()
    const legal = generateLegalMoves(board, side).some(
      (x) => x.from === m!.from && x.to === m!.to,
    )
    expect(legal, `illegal ${edge.uci} for ${side}`).toBe(true)
    const nextBoard = applyMoveOnBoard(board, m!.from, m!.to)
    const nextSide: Side = side === 'red' ? 'black' : 'red'
    assertLineLegal(edge.next, nextBoard, nextSide)
  }
}

describe('学棋谱合法性', () => {
  it('全部样例开局着法合法', () => {
    for (const o of OPENINGS) {
      assertLineLegal(o.root)
    }
  })
})

describe('resolveOpening', () => {
  it('空历史在根节点且在谱上', () => {
    const o = getOpening('zhongpao-pingfeng')!
    const r = resolveOpening(o, [])
    expect(r.onBook).toBe(true)
    expect(r.matchedPly).toBe(0)
    expect(r.node.moves.some((m) => m.uci === 'h2-e2')).toBe(true)
  })

  it('沿主线前进', () => {
    const o = getOpening('zhongpao-pingfeng')!
    const h2e2 = parseUci('h2-e2')!
    const r = resolveOpening(o, [h2e2])
    expect(r.onBook).toBe(true)
    expect(r.matchedPly).toBe(1)
    expect(r.node.moves.some((m) => m.uci === 'h9-g7')).toBe(true)
  })

  it('偏离谱后 onBook=false 且停在分叉点', () => {
    const o = getOpening('zhongpao-pingfeng')!
    const history: Move[] = [
      parseUci('h2-e2')!,
      { from: sq(0, 6), to: sq(0, 5) }, // 黑边兵离谱
    ]
    const r = resolveOpening(o, history)
    expect(r.onBook).toBe(false)
    expect(r.matchedPly).toBe(1)
  })
})

describe('pickHintMove / bookMoveSquares', () => {
  it('优先 main，其次 preferred', () => {
    const o = getOpening('zhongpao-pingfeng')!
    const after = resolveOpening(o, [parseUci('h2-e2')!]).node
    expect(pickHintMove(after)?.uci).toBe('h9-g7')
    expect(pickHintMove(after, 'h7-e7')?.uci).toBe('h7-e7')
  })

  it('收集谱着起终点', () => {
    const o = getOpening('zhongpao-pingfeng')!
    const { origins, targets } = bookMoveSquares(o.root)
    expect(origins.has(sq(7, 2))).toBe(true) // h2
    expect(targets.has(sq(4, 2))).toBe(true) // e2
  })
})
