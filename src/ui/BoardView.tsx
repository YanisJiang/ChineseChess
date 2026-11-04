import { useEffect, useState, type ReactNode } from 'react'
import { fileOf, rankOf } from '../engine/board'
import type { Move, Piece, Square } from '../engine/types'
import { pieceLabel } from './pieceLabel'

export type FlyAnim = {
  from: Square
  to: Square
  piece: Piece
  capturing: boolean
}

interface Props {
  board: (Piece | null)[]
  selected: Square | null
  targets: Set<Square>
  lastMove: Move | null
  lastCaptureTo: Square | null
  checkKing: Square | null
  anim: FlyAnim | null
  onAnimComplete: () => void
  onSquareClick: (sq: Square) => void
  disabled?: boolean
}

function pointStyle(s: Square): { left: string; top: string } {
  return {
    left: `${(fileOf(s) / 8) * 100}%`,
    top: `${((9 - rankOf(s)) / 9) * 100}%`,
  }
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

function Flyer({
  anim,
  onAnimComplete,
}: {
  anim: FlyAnim
  onAnimComplete: () => void
}) {
  const [atDest, setAtDest] = useState(false)

  useEffect(() => {
    setAtDest(false)
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAtDest(true))
    })
    return () => cancelAnimationFrame(id)
  }, [anim.from, anim.to, anim.piece])

  const pos = pointStyle(atDest ? anim.to : anim.from)

  return (
    <div
      className={`flyer ${anim.piece === anim.piece.toUpperCase() ? 'red' : 'black'}${anim.capturing ? ' flyer-capture' : ''}`}
      style={pos}
      onTransitionEnd={(e) => {
        // left/top 会各触发一次，只在 left 上收束，避免 tryMove 两次
        if (e.propertyName === 'left') onAnimComplete()
      }}
    >
      <span className={`piece ${anim.piece === anim.piece.toUpperCase() ? 'red' : 'black'}`}>
        {pieceLabel(anim.piece)}
      </span>
    </div>
  )
}

export function BoardView({
  board,
  selected,
  targets,
  lastMove,
  lastCaptureTo,
  checkKing,
  anim,
  onAnimComplete,
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
      const isCaptureFlash = lastCaptureTo === s
      const isCheck = checkKing === s
      const { left, top } = pointStyle(s)

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
            isCaptureFlash ? 'point-capture' : '',
            isCheck ? 'point-check' : '',
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
        {anim ? <Flyer anim={anim} onAnimComplete={onAnimComplete} /> : null}
      </div>
    </div>
  )
}
