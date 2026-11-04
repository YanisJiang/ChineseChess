import { describe, expect, it } from 'vitest'
import { applyMoveOnBoard, createInitialBoard, sq } from '../engine/board'
import { parseFen, startingFen } from '../engine/fen'
import { generateLegalMoves } from '../engine/moves'
import { STUDY_LINES, getStudyLine, listStudyLines } from './catalog'
import {
  bookMoveSquares,
  parseUci,
  pickHintMove,
  resolveStudyLine,
} from './navigate'
import type { BookNode, StudyLine } from './types'
import type { Move, Side } from '../engine/types'

function assertLineLegal(line: StudyLine) {
  const { board, sideToMove } = parseFen(line.startFen ?? startingFen())
  assertNodeLegal(line.root, board, sideToMove)
}

function assertNodeLegal(
  node: BookNode,
  board = createInitialBoard(),
  side: Side = 'red',
) {
  for (const edge of node.moves) {
    const m = parseUci(edge.uci)
    expect(m, `bad uci ${edge.uci}`).not.toBeNull()
    const legal = generateLegalMoves(board, side).some(
      (x) => x.from === m!.from && x.to === m!.to,
    )
    expect(legal, `illegal ${edge.uci} for ${side}`).toBe(true)
    const nextBoard = applyMoveOnBoard(board, m!.from, m!.to)
    const nextSide: Side = side === 'red' ? 'black' : 'red'
    assertNodeLegal(edge.next, nextBoard, nextSide)
  }
}

describe('学棋谱合法性', () => {
  it('全部课程着法合法（含中残局 startFen）', () => {
    expect(listStudyLines('opening').length).toBeGreaterThanOrEqual(15)
    expect(listStudyLines('middlegame').length).toBeGreaterThanOrEqual(8)
    expect(listStudyLines('endgame').length).toBeGreaterThanOrEqual(8)
    expect(STUDY_LINES.length).toBeGreaterThanOrEqual(31)
    for (const line of STUDY_LINES) {
      assertLineLegal(line)
    }
  })
})

describe('resolveStudyLine', () => {
  it('空历史在根节点且在谱上', () => {
    const o = getStudyLine('zhongpao-pingfeng')!
    const r = resolveStudyLine(o, [])
    expect(r.onBook).toBe(true)
    expect(r.matchedPly).toBe(0)
    expect(r.node.moves.some((m) => m.uci === 'h2-e2')).toBe(true)
  })

  it('沿主线前进', () => {
    const o = getStudyLine('zhongpao-pingfeng')!
    const h2e2 = parseUci('h2-e2')!
    const r = resolveStudyLine(o, [h2e2])
    expect(r.onBook).toBe(true)
    expect(r.matchedPly).toBe(1)
    expect(r.node.moves.some((m) => m.uci === 'h9-g7')).toBe(true)
  })

  it('偏离谱后 onBook=false 且停在分叉点', () => {
    const o = getStudyLine('zhongpao-pingfeng')!
    const history: Move[] = [
      parseUci('h2-e2')!,
      { from: sq(0, 6), to: sq(0, 5) },
    ]
    const r = resolveStudyLine(o, history)
    expect(r.onBook).toBe(false)
    expect(r.matchedPly).toBe(1)
  })

  it('中局从 startFen 局面开始', () => {
    const o = getStudyLine('mid-paoda-zhongbing')!
    expect(o.startFen).toBeTruthy()
    const r = resolveStudyLine(o, [])
    expect(r.node.moves.some((m) => m.uci === 'e2-e6')).toBe(true)
  })
})

describe('pickHintMove / bookMoveSquares', () => {
  it('优先 main，其次 preferred', () => {
    const o = getStudyLine('zhongpao-pingfeng')!
    const after = resolveStudyLine(o, [parseUci('h2-e2')!]).node
    expect(pickHintMove(after)?.uci).toBe('h9-g7')
    expect(pickHintMove(after, 'h7-e7')?.uci).toBe('h7-e7')
  })

  it('收集谱着起终点', () => {
    const o = getStudyLine('zhongpao-pingfeng')!
    const { origins, targets } = bookMoveSquares(o.root)
    expect(origins.has(sq(7, 2))).toBe(true)
    expect(targets.has(sq(4, 2))).toBe(true)
  })
})
