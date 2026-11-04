import { applyMoveOnBoard, moveToCoord } from '../engine/board'
import { parseFen, startingFen } from '../engine/fen'
import type { GameResult, Move } from '../engine/types'
import { formatChineseMove } from './chineseMove'

export type RecordMode = 'hotseat' | 'ai' | 'coach'

export type RecordedMove = {
  uci: string
  chinese: string
}

export type GameRecord = {
  version: 1
  mode: RecordMode
  startFen: string
  moves: RecordedMove[]
  result: GameResult | null
}

function resultText(result: GameResult | null): string {
  if (!result) return '未结束'
  switch (result.kind) {
    case 'checkmate':
      return `${result.winner === 'red' ? '红方' : '黑方'}将死获胜`
    case 'stalemate':
      return `${result.winner === 'red' ? '红方' : '黑方'}困毙获胜`
    case 'resign':
      return `${result.winner === 'red' ? '红方' : '黑方'}对手认输获胜`
    case 'perpetualCheck':
      return `${result.winner === 'red' ? '红方' : '黑方'}获胜（对方长将）`
    case 'draw':
      if (result.reason === 'repetition') return '三次重复局面作和'
      if (result.reason === 'natural') return '自然限着作和'
      return '双方同意和棋'
  }
}

export function buildRecordedMoves(
  startFen: string,
  moves: Move[],
): RecordedMove[] {
  let { board } = parseFen(startFen)
  const out: RecordedMove[] = []
  for (const m of moves) {
    const chinese = formatChineseMove(board, m)
    out.push({ uci: moveToCoord(m.from, m.to), chinese })
    board = applyMoveOnBoard(board, m.from, m.to)
  }
  return out
}

export function buildGameRecord(input: {
  mode: RecordMode
  startFen: string
  moves: Move[]
  result: GameResult | null
}): GameRecord {
  return {
    version: 1,
    mode: input.mode,
    startFen: input.startFen,
    moves: buildRecordedMoves(input.startFen, input.moves),
    result: input.result,
  }
}

export function recordToJson(record: GameRecord): string {
  return `${JSON.stringify(record, null, 2)}\n`
}

export function recordToTxt(record: GameRecord): string {
  const modeLabel =
    record.mode === 'hotseat'
      ? '热座'
      : record.mode === 'coach'
        ? '陪练跟谱'
        : '人机'
  const startLine =
    record.startFen === startingFen()
      ? '起始：标准开局'
      : `起始局面：${record.startFen}`

  const lines: string[] = [
    '中国象棋棋谱',
    `模式：${modeLabel}`,
    startLine,
    '',
  ]

  let side = parseFen(record.startFen).sideToMove
  record.moves.forEach((m, i) => {
    const label = side === 'red' ? '红' : '黑'
    lines.push(`${i + 1}. ${label} ${m.chinese}（${m.uci}）`)
    side = side === 'red' ? 'black' : 'red'
  })

  lines.push('')
  lines.push(`结果：${resultText(record.result)}`)
  lines.push('')
  return lines.join('\n')
}

export function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function defaultRecordBasename(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `xiangqi-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}
