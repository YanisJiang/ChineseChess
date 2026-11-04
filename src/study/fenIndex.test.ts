import { describe, expect, it } from 'vitest'
import { applyMoveOnBoard, coordToSquare, createInitialBoard } from '../engine/board'
import { boardToFen, startingFen } from '../engine/fen'
import { STUDY_LINES, getStudyLine } from './catalog'
import {
  buildStudyFenIndex,
  lookupStudyFen,
  pickFenHit,
} from './fenIndex'
import { parseUci } from './navigate'

describe('fenIndex', () => {
  const index = buildStudyFenIndex(STUDY_LINES)

  it('标准开局根可命中开局课且有后续着法', () => {
    const hit = lookupStudyFen(startingFen(), index)
    expect(hit).not.toBeNull()
    expect(hit!.line.phase).toBe('opening')
    expect(hit!.ply).toBe(0)
    expect(hit!.node.moves.length).toBeGreaterThan(0)
  })

  it('中炮后局面可命中', () => {
    let board = createInitialBoard()
    const m = parseUci('h2-e2')!
    board = applyMoveOnBoard(board, m.from, m.to)
    const fen = boardToFen(board, 'black')
    const hit = lookupStudyFen(fen, index)
    expect(hit).not.toBeNull()
    expect(hit!.ply).toBeGreaterThanOrEqual(1)
    expect(hit!.node.moves.some((x) => x.uci === 'h9-g7' || x.uci === 'h7-e7')).toBe(
      true,
    )
  })

  it('中局 startFen 可命中对应课', () => {
    const line = getStudyLine('mid-paoda-zhongbing')!
    expect(line.startFen).toBeTruthy()
    const hit = lookupStudyFen(line.startFen!, index, line.id)
    expect(hit?.line.id).toBe('mid-paoda-zhongbing')
    expect(hit?.ply).toBe(0)
  })

  it('无关局面返回 null', () => {
    // 空荡残局但不在课表里的构图
    const fen = '3a5/9/9/9/9/9/9/9/9/5K3 w'
    expect(lookupStudyFen(fen, index)).toBeNull()
  })

  it('同 FEN 优先剩余着法多的课', () => {
    const hits = index.get(startingFen()) ?? []
    expect(hits.length).toBeGreaterThan(1)
    const best = pickFenHit(hits)
    expect(best!.node.moves.length).toBeGreaterThan(0)
  })
})
