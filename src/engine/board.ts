import type { Piece, Side, Square } from './types'

export const FILES = 9
export const RANKS = 10
export const SQUARES = FILES * RANKS

export function sq(file: number, rank: number): Square {
  return rank * FILES + file
}

export function fileOf(s: Square): number {
  return s % FILES
}

export function rankOf(s: Square): number {
  return Math.floor(s / FILES)
}

export function inBounds(file: number, rank: number): boolean {
  return file >= 0 && file < FILES && rank >= 0 && rank < RANKS
}

export function isRed(piece: Piece): boolean {
  return piece === piece.toUpperCase()
}

export function sideOf(piece: Piece): Side {
  return isRed(piece) ? 'red' : 'black'
}

export function pieceType(piece: Piece): string {
  return piece.toUpperCase()
}

export function sameSide(a: Piece, b: Piece): boolean {
  return isRed(a) === isRed(b)
}

export function opponent(side: Side): Side {
  return side === 'red' ? 'black' : 'red'
}

export function inPalace(file: number, rank: number, side: Side): boolean {
  if (file < 3 || file > 5) return false
  if (side === 'red') return rank >= 0 && rank <= 2
  return rank >= 7 && rank <= 9
}

export function crossedRiver(rank: number, side: Side): boolean {
  return side === 'red' ? rank >= 5 : rank <= 4
}

export function ownSideOfRiver(rank: number, side: Side): boolean {
  return side === 'red' ? rank <= 4 : rank >= 5
}

/** 标准开局：红在下（rank 0） */
export function createInitialBoard(): (Piece | null)[] {
  const b: (Piece | null)[] = Array(SQUARES).fill(null)
  const place = (file: number, rank: number, p: Piece) => {
    b[sq(file, rank)] = p
  }

  const back: Piece[] = ['R', 'N', 'B', 'A', 'K', 'A', 'B', 'N', 'R']
  for (let f = 0; f < 9; f++) place(f, 0, back[f]!)
  place(1, 2, 'C')
  place(7, 2, 'C')
  for (const f of [0, 2, 4, 6, 8]) place(f, 3, 'P')

  const blackBack: Piece[] = ['r', 'n', 'b', 'a', 'k', 'a', 'b', 'n', 'r']
  for (let f = 0; f < 9; f++) place(f, 9, blackBack[f]!)
  place(1, 7, 'c')
  place(7, 7, 'c')
  for (const f of [0, 2, 4, 6, 8]) place(f, 6, 'p')

  return b
}

export function cloneBoard(board: (Piece | null)[]): (Piece | null)[] {
  return board.slice()
}

export function findKing(board: (Piece | null)[], side: Side): Square | null {
  const target = side === 'red' ? 'K' : 'k'
  for (let i = 0; i < SQUARES; i++) {
    if (board[i] === target) return i
  }
  return null
}

export function applyMoveOnBoard(
  board: (Piece | null)[],
  from: Square,
  to: Square,
): (Piece | null)[] {
  const next = cloneBoard(board)
  next[to] = next[from]!
  next[from] = null
  return next
}

/** 简单坐标：如 a0、i9（file a-i，rank 0-9，红方视角） */
export function squareToCoord(s: Square): string {
  return `${String.fromCharCode(97 + fileOf(s))}${rankOf(s)}`
}

export function coordToSquare(coord: string): Square | null {
  const m = /^([a-i])([0-9])$/i.exec(coord.trim())
  if (!m) return null
  const file = m[1]!.toLowerCase().charCodeAt(0) - 97
  const rank = Number(m[2])
  if (!inBounds(file, rank)) return null
  return sq(file, rank)
}

export function moveToCoord(from: Square, to: Square): string {
  return `${squareToCoord(from)}-${squareToCoord(to)}`
}
