import { applyMoveOnBoard } from '../engine/board'
import { boardToFen, parseFen, startingFen } from '../engine/fen'
import type { Side } from '../engine/types'
import { parseUci } from './navigate'
import type { BookNode, StudyLine } from './types'

export type FenHit = {
  line: StudyLine
  node: BookNode
  /** 从该课根走到此节点的半着数 */
  ply: number
}

function walk(
  line: StudyLine,
  node: BookNode,
  fen: string,
  ply: number,
  into: Map<string, FenHit[]>,
) {
  const list = into.get(fen) ?? []
  list.push({ line, node, ply })
  into.set(fen, list)

  const { board, sideToMove } = parseFen(fen)
  for (const edge of node.moves) {
    const m = parseUci(edge.uci)
    if (!m) continue
    const nextBoard = applyMoveOnBoard(board, m.from, m.to)
    const nextSide: Side = sideToMove === 'red' ? 'black' : 'red'
    walk(line, edge.next, boardToFen(nextBoard, nextSide), ply + 1, into)
  }
}

/** 为学棋课建立局面 FEN → 节点索引（含根局面） */
export function buildStudyFenIndex(lines: StudyLine[]): Map<string, FenHit[]> {
  const into = new Map<string, FenHit[]>()
  for (const line of lines) {
    const start = line.startFen ?? startingFen()
    walk(line, line.root, start, 0, into)
  }
  return into
}

/**
 * 同 FEN 多命中时：剩余着法多 > ply 深 > id 字典序。
 * preferLineId：若该课也命中，在同等分支数时优先留在该课。
 */
export function pickFenHit(
  hits: FenHit[],
  preferLineId?: string | null,
): FenHit | null {
  if (hits.length === 0) return null
  const scored = [...hits].sort((a, b) => {
    const ba = a.node.moves.length
    const bb = b.node.moves.length
    if (bb !== ba) return bb - ba
    if (b.ply !== a.ply) return b.ply - a.ply
    if (preferLineId) {
      if (a.line.id === preferLineId && b.line.id !== preferLineId) return -1
      if (b.line.id === preferLineId && a.line.id !== preferLineId) return 1
    }
    return a.line.id.localeCompare(b.line.id)
  })
  return scored[0]!
}

export function lookupStudyFen(
  fen: string,
  index: Map<string, FenHit[]>,
  preferLineId?: string | null,
): FenHit | null {
  const hits = index.get(fen.trim()) ?? []
  return pickFenHit(hits, preferLineId)
}

/** 该局面上「仍有续着」的不同课 id 数量（用于避免多课抢自动转谱） */
export function countViableLinesAtFen(
  fen: string,
  index: Map<string, FenHit[]>,
): number {
  const hits = index.get(fen.trim()) ?? []
  const ids = new Set(
    hits.filter((h) => h.node.moves.length > 0).map((h) => h.line.id),
  )
  return ids.size
}

/** 只在指定课内按 FEN 查找节点 */
export function lookupFenInLine(
  fen: string,
  lineId: string,
  index: Map<string, FenHit[]>,
): FenHit | null {
  const hits = (index.get(fen.trim()) ?? []).filter((h) => h.line.id === lineId)
  return pickFenHit(hits)
}

let cachedIndex: Map<string, FenHit[]> | null = null
let cachedLinesRef: StudyLine[] | null = null

/** 对给定课表取（可缓存）索引 */
export function getStudyFenIndex(lines: StudyLine[]): Map<string, FenHit[]> {
  if (cachedLinesRef === lines && cachedIndex) return cachedIndex
  cachedLinesRef = lines
  cachedIndex = buildStudyFenIndex(lines)
  return cachedIndex
}
