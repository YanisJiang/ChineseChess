import {
  applyMoveOnBoard,
  coordToSquare,
  createInitialBoard,
} from '../engine/board'
import { boardToFen } from '../engine/fen'
import { generateLegalMoves } from '../engine/moves'
import type { Side } from '../engine/types'
import { formatChineseMove } from '../record/chineseMove'
import { end } from './bookUtil'
import type { BookMove, BookNode, StudyLine, StudyPhase } from './types'

export type PathPly = { uci: string; benefit: string; main?: boolean }

/** 从标准开局走到 path 末，返回 FEN；非法则抛错 */
export function fenAfterPath(path: string[]): string {
  let board = createInitialBoard()
  let side: Side = 'red'
  for (const step of path) {
    const [fs, ts] = step.split('-')
    const from = coordToSquare(fs!)
    const to = coordToSquare(ts!)
    if (from === null || to === null) throw new Error(`bad uci ${step}`)
    const legal = generateLegalMoves(board, side).some(
      (m) => m.from === from && m.to === to,
    )
    if (!legal) throw new Error(`illegal ${step} @ ${boardToFen(board, side)}`)
    board = applyMoveOnBoard(board, from, to)
    side = side === 'red' ? 'black' : 'red'
  }
  return boardToFen(board, side)
}

function edge(
  board: ReturnType<typeof createInitialBoard>,
  side: Side,
  ply: PathPly,
  next: BookNode,
): BookMove {
  const [fs, ts] = ply.uci.split('-')
  const from = coordToSquare(fs!)!
  const to = coordToSquare(ts!)!
  return {
    uci: ply.uci,
    main: ply.main,
    label: formatChineseMove(board, { from, to }, side),
    benefit: ply.benefit,
    next,
  }
}

function buildMain(
  plies: PathPly[],
  board: ReturnType<typeof createInitialBoard>,
  side: Side,
  lineId: string,
  endComment?: string,
): BookNode {
  if (plies.length === 0) return end(endComment)
  const [head, ...rest] = plies
  const from = coordToSquare(head!.uci.split('-')[0]!)!
  const to = coordToSquare(head!.uci.split('-')[1]!)!
  const ok = generateLegalMoves(board, side).some(
    (m) => m.from === from && m.to === to,
  )
  if (!ok) {
    throw new Error(
      `illegal in line ${lineId}: ${head!.uci} @ ${boardToFen(board, side)}`,
    )
  }
  const nextBoard = applyMoveOnBoard(board, from, to)
  const nextSide: Side = side === 'red' ? 'black' : 'red'
  return {
    moves: [
      edge(
        board,
        side,
        { ...head!, main: head!.main ?? true },
        buildMain(rest, nextBoard, nextSide, lineId, endComment),
      ),
    ],
  }
}

/** 线性短谱：prefix 推到 startFen，plies 为本课着法 */
export function lineFromPath(opts: {
  id: string
  phase: StudyPhase
  title: string
  summary: string
  /** 开局省略；中残为到达本课根之前的全局着法 */
  prefix: string[]
  plies: PathPly[]
  endComment?: string
  /** 根上额外旁支 */
  rootAlts?: { ply: PathPly; continuation?: PathPly[]; endComment?: string }[]
}): StudyLine {
  const startFen =
    opts.prefix.length === 0 ? undefined : fenAfterPath(opts.prefix)

  let board = createInitialBoard()
  let side: Side = 'red'
  for (const step of opts.prefix) {
    const [fs, ts] = step.split('-')
    board = applyMoveOnBoard(board, coordToSquare(fs!)!, coordToSquare(ts!)!)
    side = side === 'red' ? 'black' : 'red'
  }

  const mainNode = buildMain(
    opts.plies,
    board,
    side,
    opts.id,
    opts.endComment,
  )
  const moves = [...mainNode.moves]

  for (const alt of opts.rootAlts ?? []) {
    const from = coordToSquare(alt.ply.uci.split('-')[0]!)!
    const to = coordToSquare(alt.ply.uci.split('-')[1]!)!
    const ok = generateLegalMoves(board, side).some(
      (m) => m.from === from && m.to === to,
    )
    if (!ok) continue
    const nextBoard = applyMoveOnBoard(board, from, to)
    const nextSide: Side = side === 'red' ? 'black' : 'red'
    moves.push(
      edge(
        board,
        side,
        { ...alt.ply, main: false },
        buildMain(
          alt.continuation ?? [],
          nextBoard,
          nextSide,
          opts.id,
          alt.endComment,
        ),
      ),
    )
  }

  return {
    id: opts.id,
    phase: opts.phase,
    title: opts.title,
    summary: opts.summary,
    ...(startFen ? { startFen } : {}),
    root: { comment: undefined, moves },
  }
}

/** 全局路径切片：每段生成一课，段与段 FEN 相接 */
export function slicePath(opts: {
  idPrefix: string
  phaseFor: (index: number, total: number) => StudyPhase
  titleFor: (index: number) => string
  summaryFor: (index: number) => string
  fullPath: string[]
  chunkSizes: number[]
  benefit?: (uci: string, index: number) => string
}): StudyLine[] {
  const lines: StudyLine[] = []
  let offset = 0
  const sizes = [...opts.chunkSizes]
  for (let i = 0; i < sizes.length; i++) {
    const size =
      i === sizes.length - 1 ? opts.fullPath.length - offset : sizes[i]!
    const prefix = opts.fullPath.slice(0, offset)
    const plies = opts.fullPath.slice(offset, offset + size).map((uci, j) => ({
      uci,
      benefit: opts.benefit?.(uci, offset + j) ?? '示范续着，体会节奏。',
      main: true as const,
    }))
    if (plies.length === 0) break
    lines.push(
      lineFromPath({
        id: `${opts.idPrefix}-${i + 1}`,
        phase: opts.phaseFor(i, sizes.length),
        title: opts.titleFor(i),
        summary: opts.summaryFor(i),
        prefix,
        plies,
        endComment:
          i === sizes.length - 1 ? '本段示范走完。' : '本段告一段落，可转谱续走。',
      }),
    )
    offset += size
  }
  return lines
}
