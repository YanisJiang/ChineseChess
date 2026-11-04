import type { Piece } from '../engine/types'

const LABELS: Record<Piece, string> = {
  K: '帅',
  A: '仕',
  B: '相',
  N: '马',
  R: '车',
  C: '炮',
  P: '兵',
  k: '将',
  a: '士',
  b: '象',
  n: '马',
  r: '车',
  c: '炮',
  p: '卒',
}

export function pieceLabel(p: Piece): string {
  return LABELS[p]
}
