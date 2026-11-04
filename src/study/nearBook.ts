import { applyMoveOnBoard, moveToCoord } from '../engine/board'
import { boardToFen } from '../engine/fen'
import { generateLegalMoves } from '../engine/moves'
import type { Move, Piece, Side } from '../engine/types'
import { formatChineseMove } from '../record/chineseMove'
import type { StudyLine } from './types'

export type NearBookEntry = {
  uci: string
  move: Move
  line: StudyLine
  /** 进入后该节点剩余分支数 */
  remaining: number
  label: string
}

const DEFAULT_LIMIT = 6

/**
 * 枚举一手可命中学棋 FEN 的合法着（仅提示用，不代走）。
 * 去重：同一课 + 同一着只保留一条；优先剩余着法多。
 */
export function findOneMoveEntries(
  board: (Piece | null)[],
  side: Side,
  index: Map<string, FenHit[]>,
  options?: {
    limit?: number
    preferLineId?: string | null
  },
): NearBookEntry[] {
  const limit = options?.limit ?? DEFAULT_LIMIT
  const preferLineId = options?.preferLineId ?? null
  const nextSide: Side = side === 'red' ? 'black' : 'red'
  const seen = new Set<string>()
  const raw: NearBookEntry[] = []

  for (const move of generateLegalMoves(board, side)) {
    const nextBoard = applyMoveOnBoard(board, move.from, move.to)
    const fen = boardToFen(nextBoard, nextSide)
    const hits = (index.get(fen.trim()) ?? []).filter(
      (h) => h.node.moves.length > 0,
    )
    if (hits.length === 0) continue
    const uci = moveToCoord(move.from, move.to)
    const label = formatChineseMove(board, move)
    // 同一着可能落入多课：全部列出，不只保留 pick 赢家
    for (const hit of hits) {
      const key = `${hit.line.id}|${uci}`
      if (seen.has(key)) continue
      seen.add(key)
      raw.push({
        uci,
        move,
        line: hit.line,
        remaining: hit.node.moves.length,
        label,
      })
    }
  }

  raw.sort((a, b) => {
    if (b.remaining !== a.remaining) return b.remaining - a.remaining
    if (preferLineId) {
      if (a.line.id === preferLineId && b.line.id !== preferLineId) return -1
      if (b.line.id === preferLineId && a.line.id !== preferLineId) return 1
    }
    const byTitle = a.line.title.localeCompare(b.line.title, 'zh')
    if (byTitle !== 0) return byTitle
    return a.uci.localeCompare(b.uci)
  })

  return raw.slice(0, limit)
}
