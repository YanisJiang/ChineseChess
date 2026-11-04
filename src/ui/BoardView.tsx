import type { ReactNode } from 'react'
import type { Move, Piece, Square } from '../engine/types'
import { pieceLabel } from './pieceLabel'

interface Props {
  board: (Piece | null)[]
  selected: Square | null
  targets: Set<Square>
  lastMove: Move | null
  onSquareClick: (sq: Square) => void
  disabled?: boolean
}

/** SVG：file→x，rank9 在上 → y=0；格点在线网交点 */
function BoardLines() {
  const verts: ReactNode[] = []
  for (let f = 0; f <= 8; f++) {
    verts.push(
      <line key={`vt-${f}`} x1={f} y1={0} x2={f} y2={4} />,
      <line key={`vb-${f}`} x1={f} y1={5} x2={f} y2={9} />,
    )
  }
  const hors: ReactNode[] = []
  for (let r = 0; r <= 9; r++) {
    hors.push(<line key={`h-${r}`} x1={0} y1={r} x2={8} y2={r} />)
  }
  return (
    <svg className="board-lines" viewBox="0 0 8 9" preserveAspectRatio="none" aria-hidden>
      <g className="board-grid">
        {hors}
        {verts}
        {/* 九宫斜线：黑方 y0–2，红方 y7–9 */}
        <line x1={3} y1={0} x2={5} y2={2} />
        <line x1={5} y1={0} x2={3} y2={2} />
        <line x1={3} y1={7} x2={5} y2={9} />
        <line x1={5} y1={7} x2={3} y2={9} />
      </g>
      <text className="river-text" x={2} y={4.62} textAnchor="middle">
        楚 河
      </text>
      <text className="river-text" x={6} y={4.62} textAnchor="middle">
        汉 界
      </text>
    </svg>
  )
}

export function BoardView({
  board,
  selected,
  targets,
  lastMove,
  onSquareClick,
  disabled,
}: Props) {
  const points: ReactNode[] = []
  for (let rank = 9; rank >= 0; rank--) {
    for (let file = 0; file < 9; file++) {
      const s = rank * 9 + file
      const piece = board[s]
      const isSel = selected === s
      const isTarget = targets.has(s)
      const isFrom = lastMove?.from === s
      const isTo = lastMove?.to === s
      const left = `${(file / 8) * 100}%`
      const top = `${((9 - rank) / 9) * 100}%`

      points.push(
        <button
          key={s}
          type="button"
          className={[
            'point',
            isSel ? 'point-selected' : '',
            isTarget ? 'point-target' : '',
            isFrom ? 'point-last-from' : '',
            isTo ? 'point-last-to' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ left, top }}
          disabled={disabled}
          onClick={() => onSquareClick(s)}
          aria-label={`${String.fromCharCode(97 + file)}${rank}`}
        >
          {piece ? (
            <span
              className={`piece ${piece === piece.toUpperCase() ? 'red' : 'black'}`}
            >
              {pieceLabel(piece)}
            </span>
          ) : isTarget ? (
            <span className="dot" />
          ) : null}
        </button>,
      )
    }
  }

  return (
    <div className="board">
      <div className="board-frame">
        <BoardLines />
        <div className="point-layer">{points}</div>
      </div>
    </div>
  )
}
