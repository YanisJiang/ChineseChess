/** 红方为大写，黑方为小写；与常见象棋 FEN 一致 */
export type PieceType = 'K' | 'A' | 'B' | 'N' | 'R' | 'C' | 'P'
export type Piece =
  | 'K'
  | 'A'
  | 'B'
  | 'N'
  | 'R'
  | 'C'
  | 'P'
  | 'k'
  | 'a'
  | 'b'
  | 'n'
  | 'r'
  | 'c'
  | 'p'

export type Side = 'red' | 'black'
export type Square = number // 0..89 = rank * 9 + file；红方在下 rank0

export interface Move {
  from: Square
  to: Square
}

export type GameResult =
  | { kind: 'checkmate'; winner: Side }
  | { kind: 'stalemate'; winner: Side }
  | { kind: 'resign'; winner: Side }
  | { kind: 'draw' }

export interface GameSnapshot {
  board: (Piece | null)[]
  sideToMove: Side
  moveHistory: Move[]
  result: GameResult | null
  drawOfferBy: Side | null
}
