import {
  fileOf,
  moveToCoord,
  pieceType,
  rankOf,
  sideOf,
} from '../engine/board'
import type { Move, Piece, Side, Square } from '../engine/types'
import { blackFileChar, redFileChar } from '../study/notation'
import { pieceLabel } from '../ui/pieceLabel'

const RED_STEPS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'] as const

function stepChar(side: Side, steps: number): string {
  if (side === 'red') return RED_STEPS[steps] ?? String(steps)
  return String(steps)
}

function fileChar(side: Side, file: number): string {
  return side === 'red' ? redFileChar(file) : blackFileChar(file)
}

/** 同线同兵种：按「靠前」（更接近对方）排序 */
function sortFrontFirst(squares: Square[], side: Side): Square[] {
  return [...squares].sort((a, b) => {
    const ra = rankOf(a)
    const rb = rankOf(b)
    return side === 'red' ? rb - ra : ra - rb
  })
}

function peerOnFile(
  board: (Piece | null)[],
  from: Square,
  piece: Piece,
): Square[] {
  const side = sideOf(piece)
  const type = pieceType(piece)
  const f = fileOf(from)
  const out: Square[] = []
  for (let s = 0; s < board.length; s++) {
    const p = board[s]
    if (!p) continue
    if (sideOf(p) !== side || pieceType(p) !== type) continue
    if (fileOf(s) !== f) continue
    out.push(s)
  }
  return out
}

function piecePrefix(board: (Piece | null)[], from: Square, piece: Piece): string {
  const side = sideOf(piece)
  const name = pieceLabel(piece)
  const peers = peerOnFile(board, from, piece)
  if (peers.length <= 1) {
    return `${name}${fileChar(side, fileOf(from))}`
  }
  const ordered = sortFrontFirst(peers, side)
  const idx = ordered.indexOf(from)
  let tag: string
  if (peers.length === 2) {
    tag = idx === 0 ? '前' : '后'
  } else if (idx === 0) {
    tag = '前'
  } else if (idx === ordered.length - 1) {
    tag = '后'
  } else {
    tag = '中'
  }
  return `${tag}${name}`
}

/**
 * 将一手合法着转为中式纵线着法（红一～九 / 黑1～9，均从己方右手起算）。
 * 同线多子用前/中/后。
 */
export function formatChineseMove(
  board: (Piece | null)[],
  move: Move,
): string {
  const piece = board[move.from]
  if (!piece) return moveToCoord(move.from, move.to)

  const side = sideOf(piece)
  const type = pieceType(piece)
  const fromF = fileOf(move.from)
  const fromR = rankOf(move.from)
  const toF = fileOf(move.to)
  const toR = rankOf(move.to)

  const prefix = piecePrefix(board, move.from, piece)

  if (fromR === toR) {
    return `${prefix}平${fileChar(side, toF)}`
  }

  const forward = side === 'red' ? toR > fromR : toR < fromR
  const verb = forward ? '进' : '退'

  // 马/相(象)/仕(士)：进退用目标路号
  if (type === 'N' || type === 'B' || type === 'A') {
    return `${prefix}${verb}${fileChar(side, toF)}`
  }

  // 车炮兵将帅等：进退用步数
  const steps = Math.abs(toR - fromR)
  return `${prefix}${verb}${stepChar(side, steps)}`
}
