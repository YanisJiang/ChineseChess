import { describe, expect, it } from 'vitest'
import { coordToSquare } from '../engine/board'
import { startingFen } from '../engine/fen'
import { buildGameRecord, recordToTxt } from './exportGame'

function m(uci: string) {
  const [a, b] = uci.split('-')
  return { from: coordToSquare(a!)!, to: coordToSquare(b!)! }
}

describe('exportGame', () => {
  it('标准开局中炮几手写入中文与 FEN', () => {
    const record = buildGameRecord({
      mode: 'hotseat',
      startFen: startingFen(),
      moves: [m('h2-e2'), m('h9-g7'), m('b0-c2')],
      result: null,
    })
    expect(record.moves.map((x) => x.chinese)).toEqual([
      '炮二平五',
      '马8进7',
      '马八进七',
    ])
    const txt = recordToTxt(record)
    expect(txt).toContain('起始：标准开局')
    expect(txt).toContain('炮二平五')
    expect(txt).toContain('结果：未结束')
  })
})
