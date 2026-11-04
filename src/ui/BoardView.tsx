import type { ReactNode } from 'react'
import { fileOf, rankOf } from '../engine/board'
import type { Piece, Square } from '../engine/types'
import { pieceLabel } from './pieceLabel'

interface Props {
  board: (Piece | null)[]
  selected: Square | null
  targets: Set<Square>
  onSquareClick: (sq: Square) => void
  disabled?: boolean
}

export function BoardView({
  board,
  selected,
  targets,
  onSquareClick,
  disabled,
}: Props) {
  const cells: ReactNode[] = []
  // 从上到下画 rank 9 → 0，使红方在屏幕下方
  for (let rank = 9; rank >= 0; rank--) {
    for (let file = 0; file < 9; file++) {
      const s = rank * 9 + file
      const piece = board[s]
      const isSel = selected === s
      const isTarget = targets.has(s)
      const river = rank === 4 || rank === 5
      cells.push(
        <button
          key={s}
          type="button"
          className={[
            'cell',
            river ? 'cell-river' : '',
            isSel ? 'cell-selected' : '',
            isTarget ? 'cell-target' : '',
            fileOf(s) >= 3 && fileOf(s) <= 5 && (rankOf(s) <= 2 || rankOf(s) >= 7)
              ? 'cell-palace'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          disabled={disabled}
          onClick={() => onSquareClick(s)}
          aria-label={`${String.fromCharCode(97 + file)}${rank}`}
        >
          {piece ? (
            <span className={`piece ${piece === piece.toUpperCase() ? 'red' : 'black'}`}>
              {pieceLabel(piece)}
            </span>
          ) : isTarget ? (
            <span className="dot" />
          ) : null}
        </button>,
      )
    }
  }

  return <div className="board">{cells}</div>
}
