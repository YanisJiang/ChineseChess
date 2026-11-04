import { useState } from 'react'
import type { BookMove, StudyLine, StudyPhase } from '../study/types'
import { PHASE_LABEL } from '../study/types'
import { listStudyLines } from '../study/catalog'
import type { Side } from '../engine/types'
import { formatBookMove } from '../study/navigate'

const PHASES: StudyPhase[] = ['opening', 'middlegame', 'endgame']

type Props = {
  opening: StudyLine | null
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
  const [phase, setPhase] = useState<StudyPhase | null>(null)

  if (!opening) {
    if (phase === null) {
      return (
        <section>
          <h2>学棋 · 选阶段</h2>
          <p className="hint">开局从空头练布局；中局/残局从指定局面练手段与定式。</p>
          <ul className="study-branches">
            {PHASES.map((p) => (
              <li key={p}>
                <button type="button" onClick={() => setPhase(p)}>
                  <strong>{PHASE_LABEL[p]}</strong>
                  <br />
                  <span className="hint">{listStudyLines(p).length} 课</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )
    }

    const lines = listStudyLines(phase)
    return (
      <section>
        <h2>学棋 · {PHASE_LABEL[phase]}</h2>
        <p className="hint">
          跟谱学习：高亮谱着；棋盘可直出，点侧栏变招即走该步；离谱后可悔棋或回起点。
        </p>
        <div className="btn-row">
          <button type="button" onClick={() => setPhase(null)}>
            返回阶段
          </button>
        </div>
        <ul className="study-branches">
          {lines.map((o) => (
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
      <h2>
        <span className="hint">{PHASE_LABEL[opening.phase]} · </span>
        {opening.title}
      </h2>
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
          <p className="hint">
            点变招即走该步
            {opponentTurn ? '；也可点下方「对方走」按提示落子' : ''}。
          </p>
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
              回课程列表
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
