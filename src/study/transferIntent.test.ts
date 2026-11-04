import { describe, expect, it } from 'vitest'
import type { NearBookEntry } from './nearBook'
import {
  firstCrossLineIdForUci,
  isAmbiguousMultiLineUci,
} from './transferIntent'

function near(
  uci: string,
  lineId: string,
  title = lineId,
): NearBookEntry {
  return {
    uci,
    move: { from: 0, to: 1 },
    line: {
      id: lineId,
      phase: 'middlegame',
      title,
      summary: '',
      root: { moves: [] },
    },
    remaining: 2,
    label: '着',
  }
}

describe('transferIntent', () => {
  it('本谱+跨课同着 → 一着多谱', () => {
    expect(
      isAmbiguousMultiLineUci('a0-a1', ['a0-a1', 'g2-e3'], [
        near('a0-a1', 'pf-red-2'),
      ]),
    ).toBe(true)
  })

  it('仅本谱 → 非多谱', () => {
    expect(isAmbiguousMultiLineUci('a0-a1', ['a0-a1'], [])).toBe(false)
  })

  it('跨课同着两课 → 多谱', () => {
    expect(
      isAmbiguousMultiLineUci('h0-g2', [], [
        near('h0-g2', 'sanbuhu'),
        near('h0-g2', 'other'),
      ]),
    ).toBe(true)
  })

  it('firstCrossLineIdForUci 按顺序第一个', () => {
    expect(
      firstCrossLineIdForUci('h0-g2', [
        near('h0-g2', 'sanbuhu'),
        near('h0-g2', 'other'),
      ]),
    ).toBe('sanbuhu')
  })
})
