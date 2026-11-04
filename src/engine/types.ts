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

/** 和棋原因：协议 / 三次重复 / 自然限着 */
export type DrawReason = 'agreement' | 'repetition' | 'natural'

export type GameResult =
  | { kind: 'checkmate'; winner: Side }
  | { kind: 'stalemate'; winner: Side }
  | { kind: 'resign'; winner: Side }
  /** 长将：循环内某方着着将军 → 对方胜 */
  | { kind: 'perpetualCheck'; winner: Side }
  | { kind: 'draw'; reason?: DrawReason }

export interface GameSnapshot {
  board: (Piece | null)[]
  sideToMove: Side
  moveHistory: Move[]
  result: GameResult | null
  drawOfferBy: Side | null
}
