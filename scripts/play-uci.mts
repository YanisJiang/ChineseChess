/**
 * 推演 UCI 序列：打印每步后 FEN、中文着、是否终局。
 * 用法: npx tsx scripts/play-uci.mts h2-e2 h9-g7 ...
 * 或: npx tsx scripts/play-uci.mts --fen '...' m1 m2 ...
 */
import {
  applyMoveOnBoard,
  coordToSquare,
  createInitialBoard,
  moveToCoord,
} from '../src/engine/board.ts'
import { boardToFen, parseFen } from '../src/engine/fen.ts'
import { Game } from '../src/engine/game.ts'
import { generateLegalMoves } from '../src/engine/moves.ts'
import { formatChineseMove } from '../src/record/chineseMove.ts'
import type { Side } from '../src/engine/types.ts'

const args = process.argv.slice(2)
let fenArg: string | null = null
const ucis: string[] = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--fen') {
    fenArg = args[++i]!
  } else {
    ucis.push(args[i]!)
  }
}

const game = fenArg ? Game.fromFen(fenArg) : new Game()
console.log('start', game.getStartFen())

for (const step of ucis) {
  const [fs, ts] = step.split('-')
  const from = coordToSquare(fs!)
  const to = coordToSquare(ts!)
  if (from === null || to === null) {
    console.error('bad uci', step)
    process.exit(1)
  }
  const board = game.getBoard()
  const side = game.getSideToMove()
  const ok = generateLegalMoves(board, side).some(
    (m) => m.from === from && m.to === to,
  )
  if (!ok) {
    console.error('illegal', step, 'side', side)
    console.error(
      'legal sample',
      generateLegalMoves(board, side)
        .slice(0, 20)
        .map((m) => moveToCoord(m.from, m.to)),
    )
    process.exit(1)
  }
  const label = formatChineseMove(board, { from, to }, side)
  if (!game.tryMove(from, to)) {
    console.error('play failed', step)
    process.exit(1)
  }
  const r = game.getResult()
  console.log(
    `${label}\t${step}\t${boardToFen(game.getBoard(), game.getSideToMove())}${r ? `\tRESULT ${JSON.stringify(r)}` : ''}`,
  )
}
