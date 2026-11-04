import { describe, expect, it } from 'vitest'
import type { NearBookEntry } from './nearBook'
import {
  firstCrossLineIdForUci,
  isAmbiguousMultiLineUci,
  resolveTransferLineId,
  shouldStayOnCurrentLine,
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

  it('① 本谱有该着且仍有后续 → 留本谱', () => {
    expect(shouldStayOnCurrentLine('g4-g3', ['g4-g3', 'h7-g7'], true)).toBe(
      true,
    )
  })

  it('① 不成立：本谱有该着但已无后续', () => {
    expect(shouldStayOnCurrentLine('g4-g3', ['g4-g3'], false)).toBe(false)
  })

  it('① 不成立：该着不在本谱', () => {
    expect(shouldStayOnCurrentLine('h7-g7', ['g4-g3'], true)).toBe(false)
  })

  it('② 无侧栏意图 → 按序第一转入谱', () => {
    expect(
      resolveTransferLineId({
        lastUci: 'h7-g7',
        preferredLineId: null,
        crossNear: [near('h7-g7', 'pf-a'), near('h7-g7', 'pf-b')],
      }),
    ).toBe('pf-a')
  })

  it('侧栏意图优先于顺序第一', () => {
    expect(
      resolveTransferLineId({
        lastUci: 'h7-g7',
        preferredLineId: 'pf-b',
        crossNear: [near('h7-g7', 'pf-a'), near('h7-g7', 'pf-b')],
      }),
    ).toBe('pf-b')
  })
})
