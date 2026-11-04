import type { Move } from '../engine/types'

export type StudyPhase = 'opening' | 'middlegame' | 'endgame'

/** 某一局面下的谱着（含后续子树） */
export type BookMove = {
  /** 如 h2-e2 */
  uci: string
  /** 主线优先（按提示走默认） */
  main?: boolean
  /** 中文着名，如 炮二平五 */
  label: string
  /** 这么走的好处/意图 */
  benefit: string
  /** 走完后的局面节点 */
  next: BookNode
}

export type BookNode = {
  /** 局面短注（可选） */
  comment?: string
  moves: BookMove[]
}

/** 一课学棋谱（开局 / 中局 / 残局） */
export type StudyLine = {
  id: string
  phase: StudyPhase
  title: string
  summary: string
  /** 中残局必填；开局省略=标准开局 */
  startFen?: string
  root: BookNode
}

/** @deprecated 使用 StudyLine */
export type Opening = StudyLine

export type StudyResolve = {
  node: BookNode
  onBook: boolean
  /** 与谱吻合的半着数 */
  matchedPly: number
  history: Move[]
}

export const PHASE_LABEL: Record<StudyPhase, string> = {
  opening: '开局',
  middlegame: '中局',
  endgame: '残局',
}
