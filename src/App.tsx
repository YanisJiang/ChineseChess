import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AiStrength } from './ai/search'
import type { AiRequest, AiResponse } from './ai/ai.worker'
import { findKing, Game, squareToCoord, type Piece, type Side, type Square } from './engine'
import { getStudyLine, listStudyLines } from './study/catalog'
import { autoMatchStudyLine } from './study/matchLine'
import {
  bookMoveSquares,
  formatBookMove,
  parseUci,
  pickHintMove,
  resolveStudyLine,
} from './study/navigate'
import { OPENING_LINES } from './study/openings'
import { buildGameRecord } from './record/exportGame'
import { BoardView, type FlyAnim } from './ui/BoardView'
import { ExportPanel } from './ui/ExportPanel'
import { StudyPanel } from './ui/StudyPanel'
import './App.css'

type Mode = 'hotseat' | 'ai' | 'study'
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

  const [studyOpeningId, setStudyOpeningId] = useState<string | null>(null)
  const [studySide, setStudySide] = useState<Side>('red')
  const [preferredUci, setPreferredUci] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  /** 人机：谱着提示 */
  const [aiBookHint, setAiBookHint] = useState(false)
  const [aiBookAuto, setAiBookAuto] = useState(true)
  const [aiBookLineId, setAiBookLineId] = useState<string>(
    OPENING_LINES[0]?.id ?? 'zhongpao-pingfeng',
  )

  const aiGen = useRef(0)
  const studyGen = useRef(0)
  const workerRef = useRef<Worker | null>(null)
  const animRef = useRef<FlyAnim | null>(null)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const bumpAiGen = useCallback(() => {
    aiGen.current += 1
    setThinking(false)
  }, [])

  const bumpStudyGen = useCallback(() => {
    studyGen.current += 1
  }, [])

  const clearAnim = useCallback(() => {
    setAnim(null)
    animRef.current = null
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

  const studyOpening = studyOpeningId
    ? (getStudyLine(studyOpeningId) ?? null)
    : null

  const studyResolve = useMemo(() => {
    if (!studyOpening) return null
    return resolveStudyLine(studyOpening, snap.moveHistory)
  }, [studyOpening, snap.moveHistory])

  const loadStudyStart = useCallback(
    (lineId: string | null) => {
      const line = lineId ? getStudyLine(lineId) : null
      if (line?.startFen) game.loadFen(line.startFen)
      else game.reset()
    },
    [game],
  )

  const studyOnBook = studyResolve?.onBook ?? false
  const studyBranches = studyOnBook ? (studyResolve?.node.moves ?? []) : []
  const studyCompleted =
    mode === 'study' &&
    !!studyOpening &&
    studyOnBook &&
    studyBranches.length === 0

  const aiHintLine = useMemo(() => {
    if (mode !== 'ai' || !aiBookHint) return null
    if (aiBookAuto) {
      return autoMatchStudyLine(snap.moveHistory, OPENING_LINES)
    }
    return getStudyLine(aiBookLineId) ?? null
  }, [mode, aiBookHint, aiBookAuto, aiBookLineId, snap.moveHistory])

  const aiHintResolve = useMemo(() => {
    if (!aiHintLine) return null
    return resolveStudyLine(aiHintLine, snap.moveHistory)
  }, [aiHintLine, snap.moveHistory])

  const aiHintOnBook = aiHintResolve?.onBook ?? false
  const aiHintBranches = aiHintOnBook ? (aiHintResolve?.node.moves ?? []) : []

  const bookSets = useMemo(() => {
    if (mode === 'study') {
      if (!studyResolve?.onBook || studyCompleted) {
        return { origins: new Set<Square>(), targets: new Set<Square>() }
      }
      return bookMoveSquares(studyResolve.node)
    }
    if (mode === 'ai' && aiBookHint && aiHintResolve?.onBook) {
      return bookMoveSquares(aiHintResolve.node)
    }
    return { origins: new Set<Square>(), targets: new Set<Square>() }
  }, [mode, studyResolve, studyCompleted, aiBookHint, aiHintResolve])

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

  const bottomSide: Side =
    mode === 'ai'
      ? aiSide === 'red'
        ? 'black'
        : 'red'
      : mode === 'study'
        ? studySide
        : 'red'

  const humanTurn =
    !snap.result &&
    !anim &&
    !thinking &&
    (mode === 'hotseat' ||
      (mode === 'ai' && snap.sideToMove !== aiSide) ||
      (mode === 'study' &&
        !!studyOpening &&
        !studyCompleted &&
        snap.sideToMove === studySide))

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
    setPreferredUci(null)
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

  const resetStudyLine = useCallback(() => {
    bumpStudyGen()
    clearAnim()
    bumpAiGen()
    loadStudyStart(studyOpeningId)
    setSelected(null)
    setLastCaptureTo(null)
    setPreferredUci(null)
    setMessage('')
    refresh()
  }, [
    bumpStudyGen,
    clearAnim,
    bumpAiGen,
    loadStudyStart,
    studyOpeningId,
    refresh,
  ])

  const startStudy = (id: string) => {
    bumpStudyGen()
    clearAnim()
    bumpAiGen()
    setStudyOpeningId(id)
    setStudySide('red')
    setPreferredUci(null)
    loadStudyStart(id)
    setSelected(null)
    setLastCaptureTo(null)
    setMessage('')
    refresh()
  }

  // 人机
  useEffect(() => {
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

  const studyOpponentTurn =
    mode === 'study' &&
    !!studyOpening &&
    !studyCompleted &&
    studyOnBook &&
    !anim &&
    !snap.result &&
    snap.sideToMove !== studySide

  const playStudyHint = () => {
    if (!studyResolve?.onBook || !humanTurn) return
    const hint = pickHintMove(studyResolve.node, preferredUci)
    if (!hint) return
    const move = parseUci(hint.uci)
    if (move) beginMove(move.from, move.to)
  }

  /** 学棋：对方着停住，点「对方走」或点选变招才落子 */
  const playStudyOpponent = () => {
    if (!studyOpponentTurn || !studyResolve?.onBook) return
    const hint = pickHintMove(studyResolve.node, preferredUci)
    if (!hint) return
    const move = parseUci(hint.uci)
    if (move) beginMove(move.from, move.to)
  }

  const chooseBranch = (uci: string) => {
    setPreferredUci(uci)
    if (!studyResolve?.onBook || anim || snap.result) return
    if (!humanTurn && !studyOpponentTurn) return
    const move = parseUci(uci)
    if (move) beginMove(move.from, move.to)
  }

  const checkKing =
    !anim && game.isInCheck() ? findKing(viewBoard, snap.sideToMove) : null

  const statusLine = (() => {
    if (mode === 'study') {
      if (!studyOpening) return '学棋：请选择阶段与课程'
      if (studyCompleted) return '本线学完'
      if (!studyOnBook) return '已离开本谱'
      if (anim) return '走子中…'
      if (snap.sideToMove !== studySide)
        return '对方着：请选变招或点「对方走」'
      const check = game.isInCheck() ? '（将军）' : ''
      return `跟谱中 · 轮到你${check}`
    }
    if (snap.result) return resultText(snap.result)
    if (thinking) return '电脑思考中…'
    if (anim) return '走子中…'
    const check = game.isInCheck() ? '（将军）' : ''
    return `轮到${sideName(snap.sideToMove)}${check}`
  })()

  const switchMode = (next: Mode) => {
    bumpAiGen()
    bumpStudyGen()
    clearAnim()
    setMode(next)
    setSelected(null)
    setMessage('')
    setExportOpen(false)
    if (next === 'study') {
      setStudyOpeningId(null)
      game.reset()
      setLastCaptureTo(null)
      refresh()
    }
  }

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
          bookOrigins={
            mode === 'study' || (mode === 'ai' && aiBookHint)
              ? bookSets.origins
              : undefined
          }
          bookTargets={
            mode === 'study' || (mode === 'ai' && aiBookHint)
              ? bookSets.targets
              : undefined
          }
          lastMove={
            snap.moveHistory.length > 0
              ? snap.moveHistory[snap.moveHistory.length - 1]!
              : null
          }
          lastCaptureTo={lastCaptureTo}
          checkKing={checkKing}
          bottomSide={bottomSide}
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
                onChange={() => switchMode('hotseat')}
              />
              热座双人
            </label>
            <label className="row">
              <input
                type="radio"
                checked={mode === 'ai'}
                onChange={() => switchMode('ai')}
              />
              人机
            </label>
            <label className="row">
              <input
                type="radio"
                checked={mode === 'study'}
                onChange={() => switchMode('study')}
              />
              学棋
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
                <label className="row">
                  <input
                    type="checkbox"
                    checked={aiBookHint}
                    onChange={(e) => {
                      setAiBookHint(e.target.checked)
                      setPreferredUci(null)
                    }}
                  />
                  谱着提示
                </label>
                {aiBookHint ? (
                  <>
                    <label className="row">
                      <input
                        type="checkbox"
                        checked={aiBookAuto}
                        onChange={(e) => {
                          setAiBookAuto(e.target.checked)
                          setPreferredUci(null)
                        }}
                      />
                      自动匹配开局谱
                    </label>
                    {!aiBookAuto ? (
                      <label className="row">
                        跟谱
                        <select
                          value={aiBookLineId}
                          onChange={(e) => {
                            setAiBookLineId(e.target.value)
                            setPreferredUci(null)
                          }}
                        >
                          {listStudyLines('opening').map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.title}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    {aiBookAuto ? (
                      <p className="hint">
                        {aiHintLine
                          ? `已匹配：${aiHintLine.title}`
                          : '未匹配到开局谱（已离谱或尚未形成谱形）'}
                      </p>
                    ) : null}
                  </>
                ) : null}
              </>
            ) : null}
          </section>

          {mode === 'ai' && aiBookHint ? (
            <section>
              <h2>谱上着法</h2>
              {!aiHintLine ? (
                <p className="hint">请选手选开局谱，或走出可匹配的开局。</p>
              ) : !aiHintOnBook ? (
                <p className="msg">已离开本谱，提示暂停。</p>
              ) : aiHintBranches.length === 0 ? (
                <p className="hint">本线谱着已走完。</p>
              ) : (
                <>
                  {aiHintResolve?.node.comment ? (
                    <p className="study-note">{aiHintResolve.node.comment}</p>
                  ) : null}
                  <ul className="study-branches">
                    {aiHintBranches.map((b) => (
                      <li key={b.uci}>
                        <button
                          type="button"
                          className={preferredUci === b.uci ? 'active' : ''}
                          onClick={() => setPreferredUci(b.uci)}
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
              )}
            </section>
          ) : null}

          {mode === 'study' ? (
            <StudyPanel
              opening={studyOpening}
              studySide={studySide}
              onBook={studyOnBook}
              completed={studyCompleted}
              nodeComment={studyResolve?.node.comment}
              branches={studyBranches}
              preferredUci={preferredUci}
              onSelectOpening={startStudy}
              onChangeSide={(side) => {
                setStudySide(side)
                resetStudyLine()
              }}
              onPrefer={chooseBranch}
              onPlayHint={playStudyHint}
              onPlayOpponent={playStudyOpponent}
              onResetLine={resetStudyLine}
              onBackToList={() => {
                bumpStudyGen()
                clearAnim()
                setStudyOpeningId(null)
                setPreferredUci(null)
                game.reset()
                setSelected(null)
                setLastCaptureTo(null)
                refresh()
              }}
              canPlayHint={humanTurn && studyOnBook && studyBranches.length > 0}
              canPlayOpponent={
                studyOpponentTurn && studyBranches.length > 0
              }
              opponentTurn={studyOpponentTurn}
            />
          ) : null}

          <section>
            <h2>操作</h2>
            <div className="btn-row">
              <button
                type="button"
                disabled={
                  !!anim ||
                  thinking ||
                  !(mode === 'ai'
                    ? game.canUndoFor(aiSide === 'red' ? 'black' : 'red')
                    : mode === 'study'
                      ? !!studyOpening && game.canUndoFor(studySide)
                      : game.canUndoFor(snap.sideToMove))
                }
                onClick={() => {
                  const who: Side =
                    mode === 'ai'
                      ? aiSide === 'red'
                        ? 'black'
                        : 'red'
                      : mode === 'study'
                        ? studySide
                        : snap.sideToMove
                  bumpAiGen()
                  bumpStudyGen()
                  clearAnim()
                  if (game.undoFor(who)) {
                    setSelected(null)
                    setLastCaptureTo(null)
                    setPreferredUci(null)
                    refresh()
                  }
                }}
              >
                悔棋
              </button>
              {mode !== 'study' ? (
                <>
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
                      clearAnim()
                      game.reset()
                      setSelected(null)
                      setLastCaptureTo(null)
                      setMessage('')
                      refresh()
                    }}
                  >
                    再来一局
                  </button>
                </>
              ) : null}
            </div>
            {mode !== 'study' ? (
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
            ) : null}
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
            {mode === 'hotseat' || mode === 'ai' ? (
              <div className="btn-row">
                <button
                  type="button"
                  disabled={snap.moveHistory.length === 0}
                  onClick={() => setExportOpen(true)}
                >
                  导出棋谱
                </button>
              </div>
            ) : null}
          </section>

          {exportOpen && (mode === 'hotseat' || mode === 'ai') ? (
            <ExportPanel
              record={buildGameRecord({
                mode,
                startFen: game.getStartFen(),
                moves: snap.moveHistory,
                result: snap.result,
              })}
              onClose={() => setExportOpen(false)}
              onCopied={setMessage}
            />
          ) : null}

          {mode !== 'study' ? (
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
                      clearAnim()
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
          ) : null}
        </aside>
      </main>
    </div>
  )
}
