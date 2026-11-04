import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AiStrength } from './ai/search'
import type { AiRequest, AiResponse } from './ai/ai.worker'
import { findKing, Game, squareToCoord, type Piece, type Side, type Square } from './engine'
import { BoardView, type FlyAnim } from './ui/BoardView'
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
  const [mode, setMode] = useState<Mode>('ai')
  const [aiSide, setAiSide] = useState<AiSide>('black')
  const [aiStrength, setAiStrength] = useState<AiStrength>('medium')
  const [fenInput, setFenInput] = useState('')
  const [message, setMessage] = useState('')
  const [anim, setAnim] = useState<FlyAnim | null>(null)
  const [thinking, setThinking] = useState(false)
  const [lastCaptureTo, setLastCaptureTo] = useState<Square | null>(null)

  const aiGen = useRef(0)
  const workerRef = useRef<Worker | null>(null)
  const animRef = useRef<FlyAnim | null>(null)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const bumpAiGen = useCallback(() => {
    aiGen.current += 1
    setThinking(false)
  }, [])

  useEffect(() => {
    const worker = new Worker(new URL('./ai/ai.worker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker
    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  const snap = useMemo(() => {
    void tick
    return game.snapshot()
  }, [game, tick])

  const targets = useMemo(() => {
    if (selected === null || anim) return new Set<Square>()
    return new Set(game.legalMovesFrom(selected).map((m) => m.to))
  }, [game, selected, tick, anim])

  const viewBoard = useMemo(() => {
    if (!anim) return snap.board
    const b = snap.board.slice()
    b[anim.from] = null
    return b
  }, [snap.board, anim])

  const humanTurn =
    !snap.result &&
    !anim &&
    !thinking &&
    (mode === 'hotseat' || snap.sideToMove !== aiSide)

  const beginMove = useCallback(
    (from: Square, to: Square) => {
      const board = game.getBoard()
      const piece = board[from]
      if (!piece) return
      const capturing = board[to] !== null
      const next: FlyAnim = { from, to, piece: piece as Piece, capturing }
      animRef.current = next
      setSelected(null)
      setMessage('')
      if (capturing) setLastCaptureTo(to)
      else setLastCaptureTo(null)
      setAnim(next)
    },
    [game],
  )

  const onAnimComplete = useCallback(() => {
    const cur = animRef.current
    if (!cur) return
    animRef.current = null
    game.tryMove(cur.from, cur.to)
    setAnim(null)
    refresh()
  }, [game, refresh])

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
      beginMove(selected, sq)
      return
    }
    if (piece && (piece === piece.toUpperCase()) === (snap.sideToMove === 'red')) {
      setSelected(sq)
      return
    }
    setSelected(null)
  }

  useEffect(() => {
    // 注意：不要把 thinking 放进依赖/早退，否则 setThinking(true) 会拆掉 listener
    if (mode !== 'ai' || snap.result || anim) return
    if (snap.sideToMove !== aiSide) return
    const worker = workerRef.current
    if (!worker) return

    const requestId = ++aiGen.current
    setThinking(true)

    const onMessage = (ev: MessageEvent<AiResponse>) => {
      if (ev.data.requestId !== aiGen.current) return
      worker.removeEventListener('message', onMessage)
      setThinking(false)
      if (ev.data.move) beginMove(ev.data.move.from, ev.data.move.to)
    }
    worker.addEventListener('message', onMessage)

    const payload: AiRequest = {
      requestId,
      board: game.getBoard(),
      side: aiSide,
      strength: aiStrength,
    }
    const timer = window.setTimeout(() => {
      worker.postMessage(payload)
    }, 120)

    return () => {
      window.clearTimeout(timer)
      worker.removeEventListener('message', onMessage)
    }
  }, [
    mode,
    aiSide,
    aiStrength,
    snap.sideToMove,
    snap.result,
    anim,
    game,
    beginMove,
    tick,
  ])

  const checkKing =
    !anim && game.isInCheck() ? findKing(viewBoard, snap.sideToMove) : null

  const statusLine = (() => {
    if (snap.result) return resultText(snap.result)
    if (thinking) return '电脑思考中…'
    if (anim) return '走子中…'
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
          board={viewBoard}
          selected={selected}
          targets={targets}
          lastMove={
            snap.moveHistory.length > 0
              ? snap.moveHistory[snap.moveHistory.length - 1]!
              : null
          }
          lastCaptureTo={lastCaptureTo}
          checkKing={checkKing}
          anim={anim}
          onAnimComplete={onAnimComplete}
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
                  bumpAiGen()
                  setAnim(null)
                  animRef.current = null
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
                  bumpAiGen()
                  setAnim(null)
                  animRef.current = null
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
                    onChange={(e) => {
                      bumpAiGen()
                      setAiSide(e.target.value as AiSide)
                    }}
                  >
                    <option value="black">黑</option>
                    <option value="red">红</option>
                  </select>
                </label>
                <label className="row">
                  难度
                  <select
                    value={aiStrength}
                    onChange={(e) => {
                      bumpAiGen()
                      setAiStrength(e.target.value as AiStrength)
                    }}
                  >
                    <option value="weak">弱</option>
                    <option value="medium">中</option>
                    <option value="strong">强</option>
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
                disabled={!game.canUndo() || !!anim || thinking}
                onClick={() => {
                  bumpAiGen()
                  setAnim(null)
                  animRef.current = null
                  if (game.undo()) {
                    setSelected(null)
                    setLastCaptureTo(null)
                    refresh()
                  }
                }}
              >
                悔棋
              </button>
              <button
                type="button"
                disabled={!!snap.result || !!anim || thinking}
                onClick={() => {
                  bumpAiGen()
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
                  bumpAiGen()
                  setAnim(null)
                  animRef.current = null
                  game.reset()
                  setSelected(null)
                  setLastCaptureTo(null)
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
                  disabled={!!snap.result || !!anim}
                  onClick={() => {
                    game.offerDraw(snap.sideToMove)
                    refresh()
                  }}
                >
                  提议和棋
                </button>
              ) : (
                <>
                  <span>{sideName(snap.drawOfferBy)}提议和棋</span>
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
                disabled={!!anim || thinking}
                onClick={() => {
                  try {
                    bumpAiGen()
                    setAnim(null)
                    animRef.current = null
                    game.loadFen(fenInput.trim() || game.toFen())
                    setSelected(null)
                    setLastCaptureTo(null)
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
