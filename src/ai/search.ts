import { applyMoveOnBoard, opponent, pieceType, sideOf } from '../engine/board'
import { generateLegalMoves, inCheck } from '../engine/moves'
import type { Move, Piece, Side } from '../engine/types'

const PIECE_VALUE: Record<string, number> = {
  K: 100000,
  R: 900,
  C: 450,
  N: 400,
  B: 200,
  A: 200,
  P: 100,
}

function evalBoard(board: (Piece | null)[], side: Side): number {
  let score = 0
  for (const p of board) {
    if (!p) continue
    const v = PIECE_VALUE[pieceType(p)] ?? 0
    score += sideOf(p) === side ? v : -v
  }
  if (inCheck(board, opponent(side))) score += 30
  if (inCheck(board, side)) score -= 30
  return score
}

function negamax(
  board: (Piece | null)[],
  side: Side,
  depth: number,
  alpha: number,
  beta: number,
): number {
  const moves = generateLegalMoves(board, side)
  if (moves.length === 0) {
    if (inCheck(board, side)) return -90000 - depth
    return -80000 - depth // 困毙
  }
  if (depth === 0) return evalBoard(board, side)

  let best = -Infinity
  for (const m of moves) {
    const next = applyMoveOnBoard(board, m.from, m.to)
    const score = -negamax(next, opponent(side), depth - 1, -beta, -alpha)
    if (score > best) best = score
    if (score > alpha) alpha = score
    if (alpha >= beta) break
  }
  return best
}

export type AiStrength = 'weak' | 'medium'

const DEPTH: Record<AiStrength, number> = {
  weak: 1,
  medium: 2,
}

/** 返回最佳着；无着返回 null */
export function chooseAiMove(
  board: (Piece | null)[],
  side: Side,
  strength: AiStrength,
): Move | null {
  const moves = generateLegalMoves(board, side)
  if (moves.length === 0) return null

  const depth = DEPTH[strength]
  // 弱档：略微打乱同分层级，避免永远同一着
  const ordered =
    strength === 'weak'
      ? [...moves].sort(() => Math.random() - 0.5)
      : moves

  let bestMove = ordered[0]!
  let bestScore = -Infinity
  let alpha = -Infinity
  const beta = Infinity

  for (const m of ordered) {
    const next = applyMoveOnBoard(board, m.from, m.to)
    const score = -negamax(next, opponent(side), depth - 1, -beta, -alpha)
    if (score > bestScore) {
      bestScore = score
      bestMove = m
    }
    if (score > alpha) alpha = score
  }
  return bestMove
}
