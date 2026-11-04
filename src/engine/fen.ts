import { FILES, RANKS, createInitialBoard, sq } from './board'
import type { Piece, Side } from './types'

const PIECE_SET = new Set([
  'K',
  'A',
  'B',
  'N',
  'R',
  'C',
  'P',
  'k',
  'a',
  'b',
  'n',
  'r',
  'c',
  'p',
])

/**
 * 局面串（类 FEN）：10 行自黑方底线到红方底线，`/` 分隔；
 * 随后空格 + 行棋方 `w`（红）/`b`（黑）。
 * 例：标准开局
 * rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w
 */
export function boardToFen(board: (Piece | null)[], sideToMove: Side): string {
  const ranks: string[] = []
  for (let rank = RANKS - 1; rank >= 0; rank--) {
    let empty = 0
    let row = ''
    for (let file = 0; file < FILES; file++) {
      const p = board[sq(file, rank)]
      if (!p) {
        empty++
      } else {
        if (empty > 0) {
          row += String(empty)
          empty = 0
        }
        row += p
      }
    }
    if (empty > 0) row += String(empty)
    ranks.push(row)
  }
  const side = sideToMove === 'red' ? 'w' : 'b'
  return `${ranks.join('/')} ${side}`
}

export function parseFen(fen: string): {
  board: (Piece | null)[]
  sideToMove: Side
} {
  const trimmed = fen.trim()
  const parts = trimmed.split(/\s+/)
  if (parts.length < 1) throw new Error('局面串为空')
  const placement = parts[0]!
  const sideToken = parts[1] ?? 'w'
  const rows = placement.split('/')
  if (rows.length !== 10) {
    throw new Error(`局面串应有 10 行，实际 ${rows.length}`)
  }

  const board: (Piece | null)[] = Array(FILES * RANKS).fill(null)
  for (let i = 0; i < 10; i++) {
    const rank = 9 - i
    const row = rows[i]!
    let file = 0
    for (const ch of row) {
      if (file > 8) throw new Error(`第 ${rank} 行格子溢出`)
      if (ch >= '1' && ch <= '9') {
        file += Number(ch)
        continue
      }
      if (!PIECE_SET.has(ch)) throw new Error(`未知棋子字符: ${ch}`)
      board[sq(file, rank)] = ch as Piece
      file++
    }
    if (file !== 9) throw new Error(`第 ${rank} 行宽度应为 9，实际 ${file}`)
  }

  let sideToMove: Side
  if (sideToken === 'w' || sideToken === 'r') sideToMove = 'red'
  else if (sideToken === 'b') sideToMove = 'black'
  else throw new Error(`未知行棋方: ${sideToken}`)

  return { board, sideToMove }
}

export function startingFen(): string {
  return boardToFen(createInitialBoard(), 'red')
}
