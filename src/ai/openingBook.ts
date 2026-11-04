import {
  applyMoveOnBoard,
  coordToSquare,
  createInitialBoard,
  moveToCoord,
} from '../engine/board'
import { boardToFen } from '../engine/fen'
import { generateLegalMoves } from '../engine/moves'
import type { Move, Piece, Side } from '../engine/types'

export type BookEntry = { move: Move; weight: number }

type RawAlt = { uci: string; weight: number }

/** 用走子序列定位局面，再挂上带权候选（仅收录合法着） */
function register(path: string[], alts: RawAlt[], into: Map<string, BookEntry[]>) {
  let board = createInitialBoard()
  let side: Side = 'red'
  for (const step of path) {
    const [fs, ts] = step.split('-')
    const from = coordToSquare(fs!)
    const to = coordToSquare(ts!)
    if (from === null || to === null) return
    const legal = generateLegalMoves(board, side).some(
      (m) => m.from === from && m.to === to,
    )
    if (!legal) return
    board = applyMoveOnBoard(board, from, to)
    side = side === 'red' ? 'black' : 'red'
  }
  const fen = boardToFen(board, side)
  const list = into.get(fen) ?? []
  for (const alt of alts) {
    const [fs, ts] = alt.uci.split('-')
    const from = coordToSquare(fs!)
    const to = coordToSquare(ts!)
    if (from === null || to === null) continue
    const ok = generateLegalMoves(board, side).some(
      (m) => m.from === from && m.to === to,
    )
    if (!ok) continue
    const existing = list.find((e) => e.move.from === from && e.move.to === to)
    if (existing) existing.weight += alt.weight
    else list.push({ move: { from, to }, weight: alt.weight })
  }
  if (list.length > 0) into.set(fen, list)
}

function buildBook(): Map<string, BookEntry[]> {
  const book = new Map<string, BookEntry[]>()

  register(
    [],
    [
      { uci: 'h2-e2', weight: 4 },
      { uci: 'b2-e2', weight: 3 },
      { uci: 'b0-c2', weight: 3 },
      { uci: 'h0-g2', weight: 3 },
      { uci: 'c3-c4', weight: 2 },
      { uci: 'g3-g4', weight: 2 },
      { uci: 'a3-a4', weight: 1 },
    ],
    book,
  )

  register(
    ['h2-e2'],
    [
      { uci: 'h9-g7', weight: 4 },
      { uci: 'b9-c7', weight: 3 },
      { uci: 'h7-e7', weight: 3 },
      { uci: 'b7-e7', weight: 2 },
      { uci: 'g6-g5', weight: 2 },
      { uci: 'c6-c5', weight: 2 },
    ],
    book,
  )

  register(
    ['b2-e2'],
    [
      { uci: 'b9-c7', weight: 4 },
      { uci: 'h9-g7', weight: 3 },
      { uci: 'b7-e7', weight: 3 },
      { uci: 'h7-e7', weight: 2 },
      { uci: 'c6-c5', weight: 2 },
      { uci: 'g6-g5', weight: 2 },
    ],
    book,
  )

  register(
    ['b0-c2'],
    [
      { uci: 'h9-g7', weight: 3 },
      { uci: 'b9-c7', weight: 3 },
      { uci: 'h7-e7', weight: 2 },
      { uci: 'g6-g5', weight: 2 },
      { uci: 'c6-c5', weight: 2 },
    ],
    book,
  )

  register(
    ['h0-g2'],
    [
      { uci: 'b9-c7', weight: 3 },
      { uci: 'h9-g7', weight: 3 },
      { uci: 'b7-e7', weight: 2 },
      { uci: 'c6-c5', weight: 2 },
      { uci: 'g6-g5', weight: 2 },
    ],
    book,
  )

  register(
    ['h2-e2', 'h9-g7'],
    [
      { uci: 'b0-c2', weight: 3 },
      { uci: 'h0-g2', weight: 3 },
      { uci: 'g3-g4', weight: 2 },
      { uci: 'a3-a4', weight: 1 },
      { uci: 'i3-i4', weight: 1 },
    ],
    book,
  )

  register(
    ['h2-e2', 'h7-e7'],
    [
      { uci: 'b0-c2', weight: 3 },
      { uci: 'h0-g2', weight: 3 },
      { uci: 'g3-g4', weight: 2 },
      { uci: 'c3-c4', weight: 2 },
    ],
    book,
  )

  register(
    ['h2-e2', 'b9-c7'],
    [
      { uci: 'b0-c2', weight: 3 },
      { uci: 'h0-g2', weight: 3 },
      { uci: 'g3-g4', weight: 2 },
      { uci: 'c3-c4', weight: 2 },
    ],
    book,
  )

  register(
    ['h2-e2', 'h9-g7', 'b0-c2'],
    [
      { uci: 'b9-c7', weight: 4 },
      { uci: 'g6-g5', weight: 2 },
      { uci: 'c6-c5', weight: 2 },
      { uci: 'a9-a8', weight: 1 },
    ],
    book,
  )

  register(
    ['h2-e2', 'h9-g7', 'h0-g2'],
    [
      { uci: 'b9-c7', weight: 3 },
      { uci: 'g6-g5', weight: 3 },
      { uci: 'c6-c5', weight: 2 },
      { uci: 'h7-e7', weight: 2 },
    ],
    book,
  )

  return book
}

const BOOK = buildBook()

export function bookPositionCount(): number {
  return BOOK.size
}

export function lookupOpeningBook(
  board: (Piece | null)[],
  side: Side,
): BookEntry[] | null {
  const fen = boardToFen(board, side)
  const entries = BOOK.get(fen)
  if (!entries || entries.length === 0) return null
  return entries
}

export function pickWeighted<T extends { weight: number }>(
  items: T[],
  rng: () => number,
): T {
  const total = items.reduce((s, it) => s + Math.max(0, it.weight), 0)
  if (total <= 0) return items[0]!
  let r = rng() * total
  for (const it of items) {
    r -= Math.max(0, it.weight)
    if (r <= 0) return it
  }
  return items[items.length - 1]!
}

/** 开局库命中则按权重抽一手；否则 null */
export function chooseBookMove(
  board: (Piece | null)[],
  side: Side,
  rng: () => number = Math.random,
): Move | null {
  const entries = lookupOpeningBook(board, side)
  if (!entries) return null
  return pickWeighted(entries, rng).move
}

/** 测试/调试：列出某局面库着 */
export function bookMovesUci(board: (Piece | null)[], side: Side): string[] {
  const entries = lookupOpeningBook(board, side)
  if (!entries) return []
  return entries.map((e) => moveToCoord(e.move.from, e.move.to))
}
