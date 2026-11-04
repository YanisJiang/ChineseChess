import {
  applyMoveOnBoard,
  cloneBoard,
  createInitialBoard,
  moveToCoord,
  opponent,
  pieceType,
} from './board'
import { boardToFen, parseFen, startingFen } from './fen'
import { generateLegalMoves, generateLegalMovesFrom, inCheck } from './moves'
import type {
  GameResult,
  GameSnapshot,
  Move,
  Piece,
  Side,
  Square,
} from './types'

/** 自然限着：连续半着数（无吃子且无兵/卒动）。60 回合 = 120 半着 */
export const DEFAULT_NATURAL_LIMIT_PLIES = 120

let naturalLimitPlies = DEFAULT_NATURAL_LIMIT_PLIES

export function getNaturalLimitPlies(): number {
  return naturalLimitPlies
}

/** 仅单测使用 */
export function setNaturalLimitPliesForTest(n: number): void {
  naturalLimitPlies = n
}

export function resetNaturalLimitPlies(): void {
  naturalLimitPlies = DEFAULT_NATURAL_LIMIT_PLIES
}

export class Game {
  private board: (Piece | null)[]
  private sideToMove: Side
  private history: Move[] = []
  private boardHistory: (Piece | null)[][] = []
  private sideHistory: Side[] = []
  private result: GameResult | null = null
  private drawOfferBy: Side | null = null
  /** 本局起始局面（标准开局或 loadFen 时的局面） */
  private startFen: string = startingFen()
  /** 含起始：每次着后追加当前 FEN（含行棋方） */
  private positionHistory: string[] = []
  private halfmoveClock = 0
  private halfmoveClockHistory: number[] = []

  constructor() {
    this.board = createInitialBoard()
    this.sideToMove = 'red'
    this.startFen = startingFen()
    this.positionHistory = [boardToFen(this.board, this.sideToMove)]
  }

  static fromFen(fen: string): Game {
    const g = new Game()
    const { board, sideToMove } = parseFen(fen)
    g.board = board
    g.sideToMove = sideToMove
    g.history = []
    g.boardHistory = []
    g.sideHistory = []
    g.result = null
    g.drawOfferBy = null
    g.startFen = boardToFen(board, sideToMove)
    g.positionHistory = [g.startFen]
    g.halfmoveClock = 0
    g.halfmoveClockHistory = []
    g.refreshResult()
    return g
  }

  getStartFen(): string {
    return this.startFen
  }

  snapshot(): GameSnapshot {
    return {
      board: cloneBoard(this.board),
      sideToMove: this.sideToMove,
      moveHistory: this.history.slice(),
      result: this.result,
      drawOfferBy: this.drawOfferBy,
    }
  }

  getBoard(): (Piece | null)[] {
    return cloneBoard(this.board)
  }

  getSideToMove(): Side {
    return this.sideToMove
  }

  getResult(): GameResult | null {
    return this.result
  }

  getDrawOfferBy(): Side | null {
    return this.drawOfferBy
  }

  getMoveHistoryCoords(): string[] {
    return this.history.map((m) => moveToCoord(m.from, m.to))
  }

  toFen(): string {
    return boardToFen(this.board, this.sideToMove)
  }

  isInCheck(): boolean {
    return inCheck(this.board, this.sideToMove)
  }

  legalMoves(): Move[] {
    if (this.result) return []
    return generateLegalMoves(this.board, this.sideToMove)
  }

  legalMovesFrom(from: Square): Move[] {
    if (this.result) return []
    return generateLegalMovesFrom(this.board, this.sideToMove, from)
  }

  tryMove(from: Square, to: Square): boolean {
    if (this.result) return false
    const ok = this.legalMovesFrom(from).some((m) => m.to === to)
    if (!ok) return false

    const moving = this.board[from]
    const captured = this.board[to]
    this.halfmoveClockHistory.push(this.halfmoveClock)
    const pawnMove = !!moving && pieceType(moving) === 'P'
    if (pawnMove || captured !== null) this.halfmoveClock = 0
    else this.halfmoveClock += 1

    this.boardHistory.push(cloneBoard(this.board))
    this.sideHistory.push(this.sideToMove)
    this.board = applyMoveOnBoard(this.board, from, to)
    this.history.push({ from, to })
    this.sideToMove = opponent(this.sideToMove)
    this.drawOfferBy = null
    this.positionHistory.push(boardToFen(this.board, this.sideToMove))
    this.refreshResult()
    return true
  }

  canUndo(): boolean {
    return this.boardHistory.length > 0 && this.result === null
  }

  /** 单撤最后一手（内部/测试用） */
  undo(): boolean {
    if (this.result !== null) return false
    if (this.boardHistory.length === 0) return false
    this.board = this.boardHistory.pop()!
    this.sideToMove = this.sideHistory.pop()!
    this.history.pop()
    this.positionHistory.pop()
    this.halfmoveClock = this.halfmoveClockHistory.pop() ?? 0
    this.drawOfferBy = null
    this.result = null
    return true
  }

  /**
   * 撤回 side 自己的上一手。
   * 若对方已应着，则连撤「对方应着 + side 上一手」。
   */
  canUndoFor(side: Side): boolean {
    if (this.result !== null) return false
    const n = this.history.length
    if (n === 0) return false
    const lastMover = this.sideHistory[n - 1]!
    if (lastMover === side) return true
    if (n >= 2 && this.sideHistory[n - 2] === side) return true
    return false
  }

  undoFor(side: Side): boolean {
    if (!this.canUndoFor(side)) return false
    const n = this.history.length
    const lastMover = this.sideHistory[n - 1]!
    const steps = lastMover === side ? 1 : 2
    for (let i = 0; i < steps; i++) {
      if (!this.undo()) return false
    }
    return true
  }

  resign(side: Side): void {
    if (this.result) return
    this.result = { kind: 'resign', winner: opponent(side) }
    this.drawOfferBy = null
  }

  offerDraw(side: Side): void {
    if (this.result) return
    if (this.drawOfferBy && this.drawOfferBy !== side) {
      this.result = { kind: 'draw', reason: 'agreement' }
      this.drawOfferBy = null
      return
    }
    this.drawOfferBy = side
  }

  acceptDraw(side: Side): void {
    if (this.result) return
    if (this.drawOfferBy && this.drawOfferBy !== side) {
      this.result = { kind: 'draw', reason: 'agreement' }
      this.drawOfferBy = null
    }
  }

  declineDraw(): void {
    this.drawOfferBy = null
  }

  reset(): void {
    this.board = createInitialBoard()
    this.sideToMove = 'red'
    this.history = []
    this.boardHistory = []
    this.sideHistory = []
    this.result = null
    this.drawOfferBy = null
    this.startFen = startingFen()
    this.positionHistory = [boardToFen(this.board, this.sideToMove)]
    this.halfmoveClock = 0
    this.halfmoveClockHistory = []
  }

  loadFen(fen: string): void {
    const { board, sideToMove } = parseFen(fen)
    this.board = board
    this.sideToMove = sideToMove
    this.history = []
    this.boardHistory = []
    this.sideHistory = []
    this.drawOfferBy = null
    this.result = null
    this.startFen = boardToFen(board, sideToMove)
    this.positionHistory = [this.startFen]
    this.halfmoveClock = 0
    this.halfmoveClockHistory = []
    this.refreshResult()
  }

  /**
   * 循环 [b, n) 内：若恰有一方着着将军，返回该方。
   * positionHistory 下标：b 为上一回相同局面，n 为当前。
   */
  private findPerpetualChecker(b: number, n: number): Side | null {
    const checks: { red: boolean[]; black: boolean[] } = {
      red: [],
      black: [],
    }
    for (let i = b; i < n; i++) {
      const mover = this.sideHistory[i]!
      const before = this.boardHistory[i]!
      const m = this.history[i]!
      const after = applyMoveOnBoard(before, m.from, m.to)
      checks[mover].push(inCheck(after, opponent(mover)))
    }
    const redAll = checks.red.length > 0 && checks.red.every(Boolean)
    const blackAll = checks.black.length > 0 && checks.black.every(Boolean)
    if (redAll && !blackAll) return 'red'
    if (blackAll && !redAll) return 'black'
    return null
  }

  private refreshResult(): void {
    const moves = generateLegalMoves(this.board, this.sideToMove)
    if (moves.length === 0) {
      const checked = inCheck(this.board, this.sideToMove)
      const winner = opponent(this.sideToMove)
      this.result = checked
        ? { kind: 'checkmate', winner }
        : { kind: 'stalemate', winner }
      return
    }

    const fen = this.positionHistory[this.positionHistory.length - 1]!
    const hits: number[] = []
    for (let i = 0; i < this.positionHistory.length; i++) {
      if (this.positionHistory[i] === fen) hits.push(i)
    }
    if (hits.length >= 3) {
      const b = hits[hits.length - 2]!
      const n = hits[hits.length - 1]!
      const checker = this.findPerpetualChecker(b, n)
      if (checker) {
        this.result = {
          kind: 'perpetualCheck',
          winner: opponent(checker),
        }
        return
      }
      this.result = { kind: 'draw', reason: 'repetition' }
      return
    }

    if (this.halfmoveClock >= naturalLimitPlies) {
      this.result = { kind: 'draw', reason: 'natural' }
      return
    }

    this.result = null
  }
}
