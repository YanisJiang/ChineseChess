import type { BookMove, Opening } from '../study/types'
import type { Side } from '../engine/types'
import { OPENINGS } from '../study/openings'
import { formatBookMove } from '../study/navigate'

type Props = {
  opening: Opening | null
  studySide: Side
  onBook: boolean
  completed: boolean
  nodeComment?: string
  branches: BookMove[]
  preferredUci: string | null
  opponentTurn: boolean
  onSelectOpening: (id: string) => void
  onChangeSide: (side: Side) => void
  onPrefer: (uci: string) => void
  onPlayHint: () => void
  onPlayOpponent: () => void
  onResetLine: () => void
  onBackToList: () => void
  canPlayHint: boolean
  canPlayOpponent: boolean
}

export function StudyPanel({
  opening,
  studySide,
  onBook,
  completed,
  nodeComment,
  branches,
  preferredUci,
  opponentTurn,
  onSelectOpening,
  onChangeSide,
  onPrefer,
  onPlayHint,
  onPlayOpponent,
  onResetLine,
  onBackToList,
  canPlayHint,
  canPlayOpponent,
}: Props) {
  if (!opening) {
    return (
      <section>
        <h2>学棋 · 选开局</h2>
        <p className="hint">跟谱学习：高亮谱着，侧栏看「好处」；可任走，离谱后可悔棋或回起点。</p>
        <ul className="study-branches">
          {OPENINGS.map((o) => (
            <li key={o.id}>
              <button type="button" onClick={() => onSelectOpening(o.id)}>
                <strong>{o.title}</strong>
                <br />
                <span className="hint">{o.summary}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <section>
      <h2>{opening.title}</h2>
      <p className="hint">{opening.summary}</p>
      <label className="row">
        我执
        <select
          value={studySide}
          onChange={(e) => onChangeSide(e.target.value as Side)}
        >
          <option value="red">红</option>
          <option value="black">黑</option>
        </select>
      </label>
      <div className="btn-row">
        <button type="button" disabled={!canPlayHint} onClick={onPlayHint}>
          按提示走
        </button>
        <button
          type="button"
          disabled={!canPlayOpponent}
          onClick={onPlayOpponent}
        >
          对方走
        </button>
        <button type="button" onClick={onResetLine}>
          回谱起点
        </button>
        <button type="button" onClick={onBackToList}>
          换谱
        </button>
      </div>

      {!onBook ? (
        <p className="msg">已离开本谱。可悔棋回到谱上，或点「回谱起点」。</p>
      ) : null}

      {onBook && nodeComment ? <p className="study-note">{nodeComment}</p> : null}

      {onBook && branches.length > 0 ? (
        <>
          <h3>{opponentTurn ? '对方着法' : '你的着法'}</h3>
          <ul className="study-branches">
            {branches.map((b) => (
              <li key={b.uci}>
                <button
                  type="button"
                  className={preferredUci === b.uci ? 'active' : ''}
                  onClick={() => onPrefer(b.uci)}
                >
                  {b.main ? '【主】' : ''}
                  {formatBookMove(b)}
                  <br />
                  <span className="hint">{b.benefit}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {completed ? (
        <div className="study-done">
          <strong>本线学完</strong>
          <div className="btn-row">
            <button type="button" onClick={onResetLine}>
              重学
            </button>
            <button type="button" onClick={onBackToList}>
              回开局列表
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
