/**
 * 自对弈：每方选搜索最高分着，直到终局或上限。
 * npx tsx scripts/selfplay-best.mts [--fen FEN] [--depth 3] [--max 80]
 */
import { applyMoveOnBoard, moveToCoord, opponent } from '../src/engine/board.ts'
import { Game } from '../src/engine/game.ts'
import { generateLegalMoves, inCheck } from '../src/engine/moves.ts'
import type { Move, Piece, Side } from '../src/engine/types.ts'
import { formatChineseMove } from '../src/record/chineseMove.ts'

const PIECE_VALUE: Record<string, number> = {
  K: 100000,
  R: 1000,
  C: 450,
  N: 450,
  B: 250,
  A: 250,
  P: 100,
}

function evalBoard(board: (Piece | null)[], side: Side): number {
  let score = 0
  for (let i = 0; i < board.length; i++) {
    const p = board[i]
    if (!p) continue
    const v = PIECE_VALUE[p[1] as string] ?? 0
    // piece encoding: side+type e.g. rR — check types
    score += (p.startsWith('r') || p === 'rK' || /^r/.test(p) ? 1 : -1) 
  }
  return score
}

// Use proper piece helpers
import { pieceType, sideOf } from '../src/engine/board.ts'

function evaluate(board: (Piece | null)[], side: Side): number {
  let score = 0
  for (let i = 0; i < board.length; i++) {
    const p = board[i]
    if (!p) continue
    const v = PIECE_VALUE[pieceType(p)] ?? 0
    score += sideOf(p) === side ? v : -v
  }
  if (inCheck(board, opponent(side))) score += 80
  if (inCheck(board, side)) score -= 80
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
    return 0
  }
  if (depth === 0) return evaluate(board, side)
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

function bestMove(
  board: (Piece | null)[],
  side: Side,
  depth: number,
): Move | null {
  const moves = generateLegalMoves(board, side)
  if (moves.length === 0) return null
  let best: Move | null = null
  let bestScore = -Infinity
  for (const m of moves) {
    const next = applyMoveOnBoard(board, m.from, m.to)
    const score = -negamax(next, opponent(side), depth - 1, -Infinity, Infinity)
    if (score > bestScore) {
      bestScore = score
      best = m
    }
  }
  return best
}

const args = process.argv.slice(2)
let fen: string | null = null
let depth = 3
let max = 100
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--fen') fen = args[++i]!
  else if (args[i] === '--depth') depth = Number(args[++i])
  else if (args[i] === '--max') max = Number(args[++i])
}

const prefix = [
  'h2-e2',
  'h9-g7',
  'b0-c2',
  'b9-c7',
  'h0-g2',
  'g6-g5',
  'e2-e6',
  'g7-e6',
  'e3-e4',
  'f9-e8',
  'g3-g4',
  'g5-g4',
  'i0-h0',
]

const game = fen ? Game.fromFen(fen) : new Game()
if (!fen) {
  for (const step of prefix) {
    const [a, b] = step.split('-')
    const { coordToSquare } = await import('../src/engine/board.ts')
    const from = coordToSquare(a!)!
    const to = coordToSquare(b!)!
    if (!game.tryMove(from, to)) throw new Error('prefix fail ' + step)
  }
}

const recorded = fen ? [] : [...prefix]
console.log('from', game.toFen())

for (let i = 0; i < max; i++) {
  if (game.getResult()) break
  const m = bestMove(game.getBoard(), game.getSideToMove(), depth)
  if (!m) break
  const uci = moveToCoord(m.from, m.to)
  const label = formatChineseMove(game.getBoard(), m, game.getSideToMove())
  game.tryMove(m.from, m.to)
  recorded.push(uci)
  console.log(recorded.length, label, uci, game.getResult() ?? '')
}

console.log('---')
console.log(recorded.join(' '))
console.log('result', game.getResult())
