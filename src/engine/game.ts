import {
  applyMoveOnBoard,
  cloneBoard,
  createInitialBoard,
  moveToCoord,
  opponent,
} from './board'
import { boardToFen, parseFen } from './fen'
import { generateLegalMoves, generateLegalMovesFrom, inCheck } from './moves'
import type { GameResult, GameSnapshot, Move, Piece, Side, Square } from './types'

export class Game {
  private board: (Piece | null)[]
  private sideToMove: Side
  private history: Move[] = []
  private boardHistory: (Piece | null)[][] = []
  private sideHistory: Side[] = []
  private result: GameResult | null = null
  private drawOfferBy: Side | null = null

  constructor() {
    this.board = createInitialBoard()
    this.sideToMove = 'red'
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
    g.refreshResult()
    return g
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

    this.boardHistory.push(cloneBoard(this.board))
    this.sideHistory.push(this.sideToMove)
    this.board = applyMoveOnBoard(this.board, from, to)
    this.history.push({ from, to })
    this.sideToMove = opponent(this.sideToMove)
    this.drawOfferBy = null
    this.refreshResult()
    return true
  }

  canUndo(): boolean {
    return this.boardHistory.length > 0 && this.result === null
  }

  undo(): boolean {
    if (this.result !== null) return false
    if (this.boardHistory.length === 0) return false
    this.board = this.boardHistory.pop()!
    this.sideToMove = this.sideHistory.pop()!
    this.history.pop()
    this.drawOfferBy = null
    this.result = null
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
      this.result = { kind: 'draw' }
      this.drawOfferBy = null
      return
    }
    this.drawOfferBy = side
  }

  acceptDraw(side: Side): void {
    if (this.result) return
    if (this.drawOfferBy && this.drawOfferBy !== side) {
      this.result = { kind: 'draw' }
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
    this.refreshResult()
  }

  private refreshResult(): void {
    const moves = generateLegalMoves(this.board, this.sideToMove)
    if (moves.length > 0) {
      this.result = null
      return
    }
    const checked = inCheck(this.board, this.sideToMove)
    const winner = opponent(this.sideToMove)
    this.result = checked
      ? { kind: 'checkmate', winner }
      : { kind: 'stalemate', winner }
  }
}
