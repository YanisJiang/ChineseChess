import {
  applyMoveOnBoard,
  fileOf,
  opponent,
  pieceType,
  rankOf,
  sideOf,
} from '../engine/board'
import { generateLegalMoves, inCheck } from '../engine/moves'
import type { Move, Piece, Side } from '../engine/types'
import { chooseBookMove, pickWeighted } from './openingBook'

const PIECE_VALUE: Record<string, number> = {
  K: 100000,
  R: 1000,
  C: 450,
  N: 450,
  B: 250,
  A: 250,
  P: 100,
}

/** 过河兵位置加成（按 rank，红方视角；黑方镜像） */
function pawnPosBonus(file: number, rank: number, side: Side): number {
  const r = side === 'red' ? rank : 9 - rank
  let bonus = 0
  if (r >= 5) bonus += 40 // 过河
  if (r >= 7) bonus += 50 // 接近九宫
  if (r >= 5 && file >= 2 && file <= 6) bonus += 15 // 偏中路
  return bonus
}

function piecePosBonus(piece: Piece, square: number): number {
  const t = pieceType(piece)
  const side = sideOf(piece)
  const f = fileOf(square)
  const r = rankOf(square)
  if (t === 'P') return pawnPosBonus(f, r, side)
  if (t === 'R' || t === 'C') {
    return f === 4 ? 10 : f === 3 || f === 5 ? 6 : 0
  }
  if (t === 'N') {
    return r >= 3 && r <= 6 ? 12 : 0
  }
  return 0
}

function evalBoard(board: (Piece | null)[], side: Side): number {
  let score = 0
  for (let i = 0; i < board.length; i++) {
    const p = board[i]
    if (!p) continue
    const v = (PIECE_VALUE[pieceType(p)] ?? 0) + piecePosBonus(p, i)
    score += sideOf(p) === side ? v : -v
  }
  if (inCheck(board, opponent(side))) score += 80
  if (inCheck(board, side)) score -= 80
  return score
}

function captureGain(board: (Piece | null)[], move: Move): number {
  const victim = board[move.to]
  if (!victim) return 0
  return PIECE_VALUE[pieceType(victim)] ?? 0
}

function orderMoves(board: (Piece | null)[], moves: Move[]): Move[] {
  return [...moves].sort((a, b) => captureGain(board, b) - captureGain(board, a))
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
  for (const m of orderMoves(board, moves)) {
    const next = applyMoveOnBoard(board, m.from, m.to)
    const score = -negamax(next, opponent(side), depth - 1, -beta, -alpha)
    if (score > best) best = score
    if (score > alpha) alpha = score
    if (alpha >= beta) break
  }
  return best
}

export type AiStrength = 'weak' | 'medium' | 'strong'

const DEPTH: Record<AiStrength, number> = {
  weak: 2,
  medium: 3,
  strong: 4,
}

/** 根节点近分容差：弱更爱变招，强更贴最佳分 */
const MARGIN: Record<AiStrength, number> = {
  weak: 90,
  medium: 45,
  strong: 22,
}

export type ScoredMove = { move: Move; score: number; weight: number }

/** 在 best−margin 内的着，按相对分加权 */
export function nearBestPool(
  scored: { move: Move; score: number }[],
  margin: number,
): ScoredMove[] {
  if (scored.length === 0) return []
  let best = -Infinity
  for (const s of scored) if (s.score > best) best = s.score
  const floor = best - margin
  return scored
    .filter((s) => s.score >= floor)
    .map((s) => ({
      move: s.move,
      score: s.score,
      weight: s.score - floor + 1,
    }))
}

/** 返回着法；无着返回 null。优先开局库，否则近分随机。 */
export function chooseAiMove(
  board: (Piece | null)[],
  side: Side,
  strength: AiStrength,
  rng: () => number = Math.random,
): Move | null {
  const bookMove = chooseBookMove(board, side, rng)
  if (bookMove) return bookMove

  const moves = generateLegalMoves(board, side)
  if (moves.length === 0) return null

  const depth = DEPTH[strength]
  const ordered = orderMoves(board, moves)

  // 根节点全窗：要做近分池，分数必须可比较，不能边搜边收紧 α
  const scored: { move: Move; score: number }[] = []
  for (const m of ordered) {
    const next = applyMoveOnBoard(board, m.from, m.to)
    const score = -negamax(next, opponent(side), depth - 1, -Infinity, Infinity)
    scored.push({ move: m, score })
  }

  const pool = nearBestPool(scored, MARGIN[strength])
  if (pool.length === 0) return ordered[0]!
  return pickWeighted(pool, rng).move
}
