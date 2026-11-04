import { describe, expect, it } from 'vitest'
import { OPENING_LINES } from './openings'
import { parseUci } from './navigate'
import { autoMatchStudyLine } from './matchLine'
import type { StudyLine } from './types'

describe('autoMatchStudyLine', () => {
  it('空历史可匹配多课；返回某一开局课', () => {
    const m = autoMatchStudyLine([], OPENING_LINES)
    expect(m).not.toBeNull()
    expect(m!.phase).toBe('opening')
    expect(m!.startFen).toBeUndefined()
  })

  it('中炮后黑跳马8进7 挂上中炮对屏风马', () => {
    const history = [parseUci('h2-e2')!, parseUci('h9-g7')!]
    const m = autoMatchStudyLine(history, OPENING_LINES)
    expect(m?.id).toBe('zhongpao-pingfeng')
  })

  it('离谱后返回 null', () => {
    const history = [parseUci('h2-e2')!, parseUci('a9-a8')!]
    const m = autoMatchStudyLine(history, OPENING_LINES)
    expect(m).toBeNull()
  })

  it('跳过带 startFen 的课', () => {
    const withFen: StudyLine = {
      id: 'fake-mid',
      phase: 'middlegame',
      title: '假',
      summary: '',
      startFen: '4k4/9/9/9/9/9/9/9/9/4K4 w',
      root: { moves: [] },
    }
    expect(autoMatchStudyLine([], [withFen, ...OPENING_LINES])).not.toBeNull()
    expect(autoMatchStudyLine([], [withFen])).toBeNull()
  })
})
