import { useCallback, useEffect, useMemo, useState } from 'react'
import { chooseAiMove, type AiStrength } from './ai/search'
import { Game, squareToCoord, type Side, type Square } from './engine'
import { BoardView } from './ui/BoardView'
import './App.css'

type Mode = 'hotseat' | 'ai'
type AiSide = Side

function sideName(side: Side): string {
  return side === 'red' ? '红方' : '黑方'
}

function resultText(
  result: NonNullable<ReturnType<Game['getResult']>>,
): string {
  switch (result.kind) {
    case 'checkmate':
      return `${sideName(result.winner)}将死获胜`
    case 'stalemate':
      return `${sideName(result.winner)}困毙获胜`
    case 'resign':
      return `${sideName(result.winner)}对手认输获胜`
    case 'draw':
      return '双方同意和棋'
  }
}

export default function App() {
  const [game] = useState(() => new Game())
  const [tick, setTick] = useState(0)
  const [selected, setSelected] = useState<Square | null>(null)
  const [mode, setMode] = useState<Mode>('hotseat')
  const [aiSide, setAiSide] = useState<AiSide>('black')
  const [aiStrength, setAiStrength] = useState<AiStrength>('weak')
  const [fenInput, setFenInput] = useState('')
  const [message, setMessage] = useState('')

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const snap = useMemo(() => {
    void tick
    return game.snapshot()
  }, [game, tick])

  const targets = useMemo(() => {
    if (selected === null) return new Set<Square>()
    return new Set(game.legalMovesFrom(selected).map((m) => m.to))
  }, [game, selected, tick])

  const humanTurn =
    !snap.result &&
    (mode === 'hotseat' || snap.sideToMove !== aiSide)

  const onSquareClick = (sq: Square) => {
    if (!humanTurn) return
    const piece = snap.board[sq]
    if (selected === null) {
      if (piece && (piece === piece.toUpperCase()) === (snap.sideToMove === 'red')) {
        setSelected(sq)
      }
      return
    }
    if (selected === sq) {
      setSelected(null)
      return
    }
    if (targets.has(sq)) {
      game.tryMove(selected, sq)
      setSelected(null)
      setMessage('')
      refresh()
      return
    }
    if (piece && (piece === piece.toUpperCase()) === (snap.sideToMove === 'red')) {
      setSelected(sq)
      return
    }
    setSelected(null)
  }

  useEffect(() => {
    if (mode !== 'ai' || snap.result) return
    if (snap.sideToMove !== aiSide) return
    const timer = window.setTimeout(() => {
      const move = chooseAiMove(game.getBoard(), aiSide, aiStrength)
      if (move) {
        game.tryMove(move.from, move.to)
        setSelected(null)
        refresh()
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [mode, aiSide, aiStrength, snap.sideToMove, snap.result, game, refresh, tick])

  const statusLine = (() => {
    if (snap.result) return resultText(snap.result)
    const check = game.isInCheck() ? '（将军）' : ''
    return `轮到${sideName(snap.sideToMove)}${check}`
  })()

  return (
    <div className="app">
      <header className="header">
        <h1>中国象棋</h1>
        <p className="status">{statusLine}</p>
        {message ? <p className="msg">{message}</p> : null}
      </header>

      <main className="main">
        <BoardView
          board={snap.board}
          selected={selected}
          targets={targets}
          onSquareClick={onSquareClick}
          disabled={!!snap.result || !humanTurn}
        />

        <aside className="panel">
          <section>
            <h2>模式</h2>
            <label className="row">
              <input
                type="radio"
                checked={mode === 'hotseat'}
                onChange={() => {
                  setMode('hotseat')
                  setSelected(null)
                }}
              />
              热座双人
            </label>
            <label className="row">
              <input
                type="radio"
                checked={mode === 'ai'}
                onChange={() => {
                  setMode('ai')
                  setSelected(null)
                }}
              />
              人机
            </label>
            {mode === 'ai' ? (
              <>
                <label className="row">
                  电脑执
                  <select
                    value={aiSide}
                    onChange={(e) => setAiSide(e.target.value as AiSide)}
                  >
                    <option value="black">黑</option>
                    <option value="red">红</option>
                  </select>
                </label>
                <label className="row">
                  难度
                  <select
                    value={aiStrength}
                    onChange={(e) => setAiStrength(e.target.value as AiStrength)}
                  >
                    <option value="weak">弱</option>
                    <option value="medium">中</option>
                  </select>
                </label>
              </>
            ) : null}
          </section>

          <section>
            <h2>操作</h2>
            <div className="btn-row">
              <button
                type="button"
                disabled={!game.canUndo()}
                onClick={() => {
                  if (game.undo()) {
                    setSelected(null)
                    refresh()
                  }
                }}
              >
                悔棋
              </button>
              <button
                type="button"
                disabled={!!snap.result}
                onClick={() => {
                  game.resign(snap.sideToMove)
                  setSelected(null)
                  refresh()
                }}
              >
                认输
              </button>
              <button
                type="button"
                onClick={() => {
                  game.reset()
                  setSelected(null)
                  setMessage('')
                  refresh()
                }}
              >
                再来一局
              </button>
            </div>
            <div className="btn-row">
              {!snap.drawOfferBy ? (
                <button
                  type="button"
                  disabled={!!snap.result}
                  onClick={() => {
                    game.offerDraw(snap.sideToMove)
                    refresh()
                  }}
                >
                  提议和棋
                </button>
              ) : (
                <>
                  <span>
                    {sideName(snap.drawOfferBy)}提议和棋
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const other =
                        snap.drawOfferBy === 'red' ? 'black' : 'red'
                      game.acceptDraw(other)
                      refresh()
                    }}
                  >
                    同意
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      game.declineDraw()
                      refresh()
                    }}
                  >
                    拒绝
                  </button>
                </>
              )}
            </div>
          </section>

          <section>
            <h2>走子</h2>
            <ol className="moves">
              {game.getMoveHistoryCoords().map((c, i) => (
                <li key={`${c}-${i}`}>
                  {i % 2 === 0 ? '红' : '黑'} {c}
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2>局面串</h2>
            <textarea
              value={fenInput || game.toFen()}
              onChange={(e) => setFenInput(e.target.value)}
              onFocus={() => setFenInput(game.toFen())}
              rows={3}
            />
            <div className="btn-row">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(game.toFen())
                  setMessage('已复制局面串')
                }}
              >
                复制
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    game.loadFen(fenInput.trim() || game.toFen())
                    setSelected(null)
                    setMessage('已导入局面')
                    setFenInput('')
                    refresh()
                  } catch (e) {
                    setMessage(e instanceof Error ? e.message : '导入失败')
                  }
                }}
              >
                导入
              </button>
            </div>
            {selected !== null ? (
              <p className="hint">选中：{squareToCoord(selected)}</p>
            ) : null}
          </section>
        </aside>
      </main>
    </div>
  )
}
