import {
  applyMoveOnBoard,
  fileOf,
  findKing,
  inBounds,
  inPalace,
  ownSideOfRiver,
  pieceType,
  rankOf,
  sameSide,
  sideOf,
  sq,
} from './board'
import type { Move, Piece, Side, Square } from './types'

const ORTHO: Array<[number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

function addIfEmptyOrEnemy(
  board: (Piece | null)[],
  from: Square,
  file: number,
  rank: number,
  moves: Move[],
): boolean {
  if (!inBounds(file, rank)) return false
  const to = sq(file, rank)
  const target = board[to]
  if (!target) {
    moves.push({ from, to })
    return true
  }
  if (!sameSide(board[from]!, target)) moves.push({ from, to })
  return false
}

function genRook(board: (Piece | null)[], from: Square, moves: Move[]): void {
  const f0 = fileOf(from)
  const r0 = rankOf(from)
  for (const [df, dr] of ORTHO) {
    let f = f0 + df
    let r = r0 + dr
    while (inBounds(f, r)) {
      const to = sq(f, r)
      const target = board[to]
      if (!target) {
        moves.push({ from, to })
      } else {
        if (!sameSide(board[from]!, target)) moves.push({ from, to })
        break
      }
      f += df
      r += dr
    }
  }
}

function genCannon(board: (Piece | null)[], from: Square, moves: Move[]): void {
  const f0 = fileOf(from)
  const r0 = rankOf(from)
  for (const [df, dr] of ORTHO) {
    let f = f0 + df
    let r = r0 + dr
    let jumped = false
    while (inBounds(f, r)) {
      const to = sq(f, r)
      const target = board[to]
      if (!jumped) {
        if (!target) moves.push({ from, to })
        else jumped = true
      } else if (target) {
        if (!sameSide(board[from]!, target)) moves.push({ from, to })
        break
      }
      f += df
      r += dr
    }
  }
}

function genHorse(board: (Piece | null)[], from: Square, moves: Move[]): void {
  const f0 = fileOf(from)
  const r0 = rankOf(from)
  const legs: Array<{ bf: number; br: number; df: number; dr: number }> = [
    { bf: 0, br: 1, df: 1, dr: 2 },
    { bf: 0, br: 1, df: -1, dr: 2 },
    { bf: 0, br: -1, df: 1, dr: -2 },
    { bf: 0, br: -1, df: -1, dr: -2 },
    { bf: 1, br: 0, df: 2, dr: 1 },
    { bf: 1, br: 0, df: 2, dr: -1 },
    { bf: -1, br: 0, df: -2, dr: 1 },
    { bf: -1, br: 0, df: -2, dr: -1 },
  ]
  for (const leg of legs) {
    const blockF = f0 + leg.bf
    const blockR = r0 + leg.br
    if (!inBounds(blockF, blockR) || board[sq(blockF, blockR)]) continue
    addIfEmptyOrEnemy(board, from, f0 + leg.df, r0 + leg.dr, moves)
  }
}

function genElephant(board: (Piece | null)[], from: Square, moves: Move[]): void {
  const piece = board[from]!
  const side = sideOf(piece)
  const f0 = fileOf(from)
  const r0 = rankOf(from)
  for (const [df, dr] of [
    [2, 2],
    [2, -2],
    [-2, 2],
    [-2, -2],
  ] as const) {
    const eyeF = f0 + df / 2
    const eyeR = r0 + dr / 2
    const destF = f0 + df
    const destR = r0 + dr
    if (!inBounds(destF, destR)) continue
    if (!ownSideOfRiver(destR, side)) continue
    if (board[sq(eyeF, eyeR)]) continue
    addIfEmptyOrEnemy(board, from, destF, destR, moves)
  }
}

function genAdvisor(board: (Piece | null)[], from: Square, moves: Move[]): void {
  const side = sideOf(board[from]!)
  const f0 = fileOf(from)
  const r0 = rankOf(from)
  for (const [df, dr] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ] as const) {
    const f = f0 + df
    const r = r0 + dr
    if (!inPalace(f, r, side)) continue
    addIfEmptyOrEnemy(board, from, f, r, moves)
  }
}

function genKing(board: (Piece | null)[], from: Square, moves: Move[]): void {
  const side = sideOf(board[from]!)
  const f0 = fileOf(from)
  const r0 = rankOf(from)
  for (const [df, dr] of ORTHO) {
    const f = f0 + df
    const r = r0 + dr
    if (!inPalace(f, r, side)) continue
    addIfEmptyOrEnemy(board, from, f, r, moves)
  }
}

function genPawn(board: (Piece | null)[], from: Square, moves: Move[]): void {
  const side = sideOf(board[from]!)
  const f0 = fileOf(from)
  const r0 = rankOf(from)
  const forward = side === 'red' ? 1 : -1
  addIfEmptyOrEnemy(board, from, f0, r0 + forward, moves)
  if (side === 'red' ? r0 >= 5 : r0 <= 4) {
    addIfEmptyOrEnemy(board, from, f0 + 1, r0, moves)
    addIfEmptyOrEnemy(board, from, f0 - 1, r0, moves)
  }
}

export function generatePseudoMovesForSquare(
  board: (Piece | null)[],
  from: Square,
): Move[] {
  const piece = board[from]
  if (!piece) return []
  const moves: Move[] = []
  switch (pieceType(piece)) {
    case 'R':
      genRook(board, from, moves)
      break
    case 'C':
      genCannon(board, from, moves)
      break
    case 'N':
      genHorse(board, from, moves)
      break
    case 'B':
      genElephant(board, from, moves)
      break
    case 'A':
      genAdvisor(board, from, moves)
      break
    case 'K':
      genKing(board, from, moves)
      break
    case 'P':
      genPawn(board, from, moves)
      break
  }
  return moves
}

/** 将帅照面：同一纵线、中间无子 */
export function kingsFacing(board: (Piece | null)[]): boolean {
  const red = findKing(board, 'red')
  const black = findKing(board, 'black')
  if (red === null || black === null) return false
  if (fileOf(red) !== fileOf(black)) return false
  const f = fileOf(red)
  const lo = Math.min(rankOf(red), rankOf(black))
  const hi = Math.max(rankOf(red), rankOf(black))
  for (let r = lo + 1; r < hi; r++) {
    if (board[sq(f, r)]) return false
  }
  return true
}

export function isSquareAttackedBy(
  board: (Piece | null)[],
  target: Square,
  bySide: Side,
): boolean {
  // 反向：从目标格看各方子是否能走到目标（炮要特殊）
  for (let from = 0; from < board.length; from++) {
    const p = board[from]
    if (!p || sideOf(p) !== bySide) continue
    const attacks = generatePseudoMovesForSquare(board, from)
    if (attacks.some((m) => m.to === target)) return true
  }
  return false
}

export function inCheck(board: (Piece | null)[], side: Side): boolean {
  const king = findKing(board, side)
  if (king === null) return true
  if (kingsFacing(board)) return true
  const opp: Side = side === 'red' ? 'black' : 'red'
  return isSquareAttackedBy(board, king, opp)
}

export function generateLegalMoves(
  board: (Piece | null)[],
  side: Side,
): Move[] {
  const legal: Move[] = []
  for (let from = 0; from < board.length; from++) {
    const p = board[from]
    if (!p || sideOf(p) !== side) continue
    for (const m of generatePseudoMovesForSquare(board, from)) {
      const next = applyMoveOnBoard(board, m.from, m.to)
      if (!inCheck(next, side)) legal.push(m)
    }
  }
  return legal
}

export function generateLegalMovesFrom(
  board: (Piece | null)[],
  side: Side,
  from: Square,
): Move[] {
  const p = board[from]
  if (!p || sideOf(p) !== side) return []
  return generatePseudoMovesForSquare(board, from).filter((m) => {
    const next = applyMoveOnBoard(board, m.from, m.to)
    return !inCheck(next, side)
  })
}
