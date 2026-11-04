import { coordToSquare } from '../engine/board'
import type { Move } from '../engine/types'
import type { BookMove, BookNode, StudyLine, StudyResolve } from './types'

export function parseUci(uci: string): Move | null {
  const parts = uci.trim().split('-')
  if (parts.length !== 2) return null
  const from = coordToSquare(parts[0]!)
  const to = coordToSquare(parts[1]!)
  if (from === null || to === null) return null
  return { from, to }
}

export function sameMove(a: Move, b: Move): boolean {
  return a.from === b.from && a.to === b.to
}

export function findEdge(node: BookNode, move: Move): BookMove | undefined {
  return node.moves.find((m) => {
    const parsed = parseUci(m.uci)
    return parsed !== null && sameMove(parsed, move)
  })
}

/** 按已走历史沿谱下行；中途偏离则 onBook=false，停在最后吻合节点 */
export function resolveStudyLine(
  line: StudyLine,
  history: Move[],
): StudyResolve {
  let node = line.root
  let matchedPly = 0
  for (let i = 0; i < history.length; i++) {
    const edge = findEdge(node, history[i]!)
    if (!edge) {
      return { node, onBook: false, matchedPly, history }
    }
    node = edge.next
    matchedPly = i + 1
  }
  return { node, onBook: true, matchedPly, history }
}

/** @deprecated 使用 resolveStudyLine */
export const resolveOpening = resolveStudyLine

/** 按提示走：优先 preferredUci，否则 main，否则第一条 */
export function pickHintMove(
  node: BookNode,
  preferredUci: string | null = null,
): BookMove | null {
  if (node.moves.length === 0) return null
  if (preferredUci) {
    const pref = node.moves.find((m) => m.uci === preferredUci)
    if (pref) return pref
  }
  return node.moves.find((m) => m.main) ?? node.moves[0]!
}

export function bookMoveSquares(node: BookNode): {
  origins: Set<number>
  targets: Set<number>
} {
  const origins = new Set<number>()
  const targets = new Set<number>()
  for (const m of node.moves) {
    const parsed = parseUci(m.uci)
    if (!parsed) continue
    origins.add(parsed.from)
    targets.add(parsed.to)
  }
  return { origins, targets }
}

export function formatBookMove(m: BookMove): string {
  return m.label
}
