import { describe, expect, it } from 'vitest'
import { coordToSquare } from '../engine/board'
import { Game } from '../engine/game'
import { getStudyLine, listStudyLines, STUDY_LINES } from './catalog'
import {
  buildStudyFenIndex,
  countViableLinesAtFen,
  lookupStudyFen,
  pickFenHit,
} from './fenIndex'
import { fenAfterPath } from './lineFromPath'
import {
  PINGFENG_PATHS,
  PINGFENG_SHARED,
  PINGFENG_WEB_LINES,
} from './pingfengWeb'

function playPath(path: string[]): Game {
  const g = new Game()
  for (const step of path) {
    const [a, b] = step.split('-')
    const ok = g.tryMove(coordToSquare(a!)!, coordToSquare(b!)!)
    expect(ok, `failed ${step}`).toBe(true)
  }
  return g
}

describe('pingfeng short-line web', () => {
  it('枢纽短支路径合法（不要求终局）', () => {
    expect(playPath(PINGFENG_PATHS.hubMain).getResult()).toBeNull()
    expect(playPath(PINGFENG_PATHS.hubEdge).getResult()).toBeNull()
  })

  it('无凑终局尾巴课 id', () => {
    for (const line of PINGFENG_WEB_LINES) {
      expect(line.id).not.toMatch(/^pf-(red|black|draw)-/)
    }
    expect(PINGFENG_WEB_LINES.map((l) => l.id).sort()).toEqual([
      'end-duima-tingbing',
      'mid-paoda-zhongbing',
      'mid-pingfeng-pingchehou',
    ])
  })

  it('枢纽一课两方向，主线为平炮而非下卒送吃', () => {
    const fen = fenAfterPath([...PINGFENG_SHARED])
    const hub = getStudyLine('mid-pingfeng-pingchehou')!
    expect(hub.startFen).toBe(fen)
    const ucis = new Set(hub.root.moves.map((m) => m.uci))
    expect(ucis.has('h7-g7')).toBe(true)
    expect(ucis.has('h7-i7')).toBe(true)
    expect(ucis.has('g4-g3')).toBe(false)
    const main = hub.root.moves.find((m) => m.main)
    expect(main?.uci).toBe('h7-g7')

    const index = buildStudyFenIndex(STUDY_LINES)
    const hits = (index.get(fen) ?? []).filter((h) => h.node.moves.length > 0)
    expect(countViableLinesAtFen(fen, index)).toBe(1)
    expect(pickFenHit(hits)?.line.id).toBe('mid-pingfeng-pingchehou')
  })

  it('兑马挺兵走尽后枢纽可转谱且仅一课有续着', () => {
    const fen = fenAfterPath([...PINGFENG_SHARED])
    const index = buildStudyFenIndex(STUDY_LINES)
    expect(countViableLinesAtFen(fen, index)).toBe(1)
    const hit = lookupStudyFen(fen, index, 'end-duima-tingbing')
    expect(hit?.line.id).toBe('mid-pingfeng-pingchehou')
  })

  it('相邻短谱 FEN 衔接：打中兵终点 = 兑马挺兵起点', () => {
    const paoda = getStudyLine('mid-paoda-zhongbing')!
    const ting = getStudyLine('end-duima-tingbing')!
    const afterPaoda = fenAfterPath([
      'h2-e2',
      'h9-g7',
      'b0-c2',
      'b9-c7',
      'h0-g2',
      'g6-g5',
      'e2-e6',
      'g7-e6',
      'e3-e4',
      'f9-e8',
    ])
    expect(ting.startFen).toBe(afterPaoda)
    expect(paoda.startFen).toBe(
      fenAfterPath(['h2-e2', 'h9-g7', 'b0-c2', 'b9-c7', 'h0-g2', 'g6-g5']),
    )
  })

  it('谱名不剧透胜负', () => {
    for (const line of PINGFENG_WEB_LINES) {
      expect(line.title).not.toMatch(/胜|负|和棋|将死/)
      expect(line.summary).not.toMatch(/红胜|黑胜|和棋收束/)
    }
  })

  it('网课挂入目录；中残基础课数量仍达标', () => {
    expect(PINGFENG_WEB_LINES.length).toBe(3)
    expect(listStudyLines('middlegame').length).toBeGreaterThanOrEqual(8)
    expect(listStudyLines('endgame').length).toBeGreaterThanOrEqual(8)
    expect(getStudyLine('mid-paoda-zhongbing')).toBeTruthy()
    expect(getStudyLine('end-duima-tingbing')).toBeTruthy()
    expect(getStudyLine('mid-pingfeng-pingchehou')).toBeTruthy()
  })
})
