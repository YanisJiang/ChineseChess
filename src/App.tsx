import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AiStrength } from './ai/search'
import type { AiRequest, AiResponse } from './ai/ai.worker'
import {
  applyMoveOnBoard,
  findKing,
  Game,
  moveToCoord,
  squareToCoord,
  type Piece,
  type Side,
  type Square,
} from './engine'
import { getStudyLine, listStudyLines, STUDY_LINES } from './study/catalog'
import {
  countViableLinesAtFen,
  getStudyFenIndex,
  lookupFenInLine,
  lookupStudyFen,
} from './study/fenIndex'
import { autoMatchStudyLine } from './study/matchLine'
import { findOneMoveEntries } from './study/nearBook'
import {
  bookMoveSquares,
  formatBookMove,
  parseUci,
  pickHintMove,
  resolveStudyLine,
} from './study/navigate'
import { OPENING_LINES } from './study/openings'
import {
  resolveTransferLineId,
  shouldStayOnCurrentLine,
} from './study/transferIntent'
import { PHASE_LABEL, type StudyPhase } from './study/types'
import { boardToFen, parseFen } from './engine/fen'
import { buildGameRecord } from './record/exportGame'
import { BoardView, type FlyAnim } from './ui/BoardView'
import { ExportPanel } from './ui/ExportPanel'
import { StudyPanel } from './ui/StudyPanel'
import './App.css'

type Mode = 'hotseat' | 'ai' | 'study' | 'coach'
type AiSide = Side

const COACH_PHASES: StudyPhase[] = ['opening', 'middlegame', 'endgame']

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
    case 'perpetualCheck':
      return `${sideName(result.winner)}获胜（对方长将）`
    case 'draw':
      if (result.reason === 'repetition') return '三次重复局面作和'
      if (result.reason === 'natural') return '自然限着作和'
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
  /** 陪练跟谱 */
  const [coachLineId, setCoachLineId] = useState<string | null>(null)
  const [coachPhase, setCoachPhase] = useState<StudyPhase | null>(null)
  const [coachSide, setCoachSide] = useState<Side>('red')
  /** 点选「可转入」后的跨课意图；着后或已在目标局面时消费 */
  const [coachTransfer, setCoachTransfer] = useState<{
    uci: string
    lineId: string
  } | null>(null)

  const aiGen = useRef(0)
  const studyGen = useRef(0)
  const coachGen = useRef(0)
  const workerRef = useRef<Worker | null>(null)
  const animRef = useRef<FlyAnim | null>(null)
  const movesStripRef = useRef<HTMLOListElement>(null)
  const [narrowLayout, setNarrowLayout] = useState(false)
  const [panelMoreOpen, setPanelMoreOpen] = useState(false)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const bumpAiGen = useCallback(() => {
    aiGen.current += 1
    setThinking(false)
  }, [])

  const bumpStudyGen = useCallback(() => {
    studyGen.current += 1
  }, [])

  const bumpCoachGen = useCallback(() => {
    coachGen.current += 1
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

  useEffect(() => {
    // 竖屏窄宽，或横屏矮视口（手机横持常 >720px 宽）
    const mq = window.matchMedia(
      '(max-width: 720px), (orientation: landscape) and (max-height: 520px) and (max-width: 900px)',
    )
    const sync = () => setNarrowLayout(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const snap = useMemo(() => {
    void tick
    return game.snapshot()
  }, [game, tick])

  useEffect(() => {
    const el = movesStripRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [snap.moveHistory.length, narrowLayout])

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

  const coachLine = mode === 'coach' ? (getStudyLine(coachLineId) ?? null) : null
  const coachFen = useMemo(
    () => boardToFen(snap.board, snap.sideToMove),
    [snap.board, snap.sideToMove],
  )
  const studyFenIndex = useMemo(() => getStudyFenIndex(STUDY_LINES), [])

  const coachResolve = useMemo(() => {
    if (!coachLine) return null
    const byHistory = resolveStudyLine(coachLine, snap.moveHistory)
    if (byHistory.onBook) return byHistory
    // 历史离谱但局面仍落在本课某节点（转置/殊途）→ 视为在谱
    const hit = lookupFenInLine(coachFen, coachLine.id, studyFenIndex)
    if (hit) {
      return {
        node: hit.node,
        onBook: true,
        matchedPly: hit.ply,
        history: snap.moveHistory,
      }
    }
    return byHistory
  }, [coachLine, snap.moveHistory, coachFen, studyFenIndex])
  const coachOnBook = coachResolve?.onBook ?? false
  const coachBranches = coachOnBook ? (coachResolve?.node.moves ?? []) : []
  const coachComputerSide: Side = coachSide === 'red' ? 'black' : 'red'
  const coachBookPlay =
    coachOnBook && coachBranches.length > 0

  /** 跨课一手：跟谱时也常驻，便于选阵型；不含本课 */
  const coachNearEntries = useMemo(() => {
    if (mode !== 'coach' || !coachLine || snap.result) {
      return []
    }
    return findOneMoveEntries(snap.board, snap.sideToMove, studyFenIndex, {
      preferLineId: coachLineId,
      limit: 8,
    }).filter((e) => e.line.id !== coachLineId)
  }, [
    mode,
    coachLine,
    coachLineId,
    snap.board,
    snap.sideToMove,
    snap.result,
    studyFenIndex,
  ])

  const applyCoachLineTransfer = useCallback(
    (lineId: string, title: string) => {
      bumpAiGen()
      bumpCoachGen()
      const line = getStudyLine(lineId)
      if (line) setCoachPhase(line.phase)
      setCoachLineId(lineId)
      setPreferredUci(null)
      setCoachTransfer(null)
      setMessage(`已转谱：${title}`)
    },
    [bumpAiGen, bumpCoachGen],
  )

  // 陪练转谱：①本谱有续留本谱；②无续则侧栏意图或按序第一转入谱
  useEffect(() => {
    if (mode !== 'coach' || snap.result || !coachLine) return
    if (coachBookPlay) return
    if (snap.moveHistory.length === 0) return

    const history = snap.moveHistory
    const last = history[history.length - 1]!
    const lastUci = moveToCoord(last.from, last.to)

    const start = parseFen(game.getStartFen())
    let prevBoard = start.board
    let prevSide = start.sideToMove
    for (let i = 0; i < history.length - 1; i++) {
      const m = history[i]!
      prevBoard = applyMoveOnBoard(prevBoard, m.from, m.to)
      prevSide = prevSide === 'red' ? 'black' : 'red'
    }
    const prevFen = boardToFen(prevBoard, prevSide)
    const prevHit = coachLineId
      ? lookupFenInLine(prevFen, coachLineId, studyFenIndex)
      : null
    const prevBookUcis = prevHit?.node.moves.map((m) => m.uci) ?? []
    const prevCross = findOneMoveEntries(
      prevBoard,
      prevSide,
      studyFenIndex,
      { preferLineId: coachLineId, limit: 8 },
    ).filter((e) => e.line.id !== coachLineId)

    const currentHit = coachLineId
      ? lookupFenInLine(coachFen, coachLineId, studyFenIndex)
      : null
    const currentStillHasMoves = (currentHit?.node.moves.length ?? 0) > 0

    if (shouldStayOnCurrentLine(lastUci, prevBookUcis, currentStillHasMoves)) {
      return
    }

    const preferredLineId =
      coachTransfer && coachTransfer.uci === lastUci
        ? coachTransfer.lineId
        : null
    const targetId = resolveTransferLineId({
      lastUci,
      preferredLineId,
      crossNear: prevCross,
    })
    if (targetId) {
      const hit = lookupFenInLine(coachFen, targetId, studyFenIndex)
      if (hit && hit.node.moves.length > 0 && hit.line.id !== coachLineId) {
        applyCoachLineTransfer(hit.line.id, hit.line.title)
        return
      }
    }

    const byHistory = autoMatchStudyLine(history, OPENING_LINES)
    if (byHistory && byHistory.id !== coachLineId) {
      applyCoachLineTransfer(byHistory.id, byHistory.title)
      return
    }

    const viable = countViableLinesAtFen(coachFen, studyFenIndex)
    if (viable > 1) {
      const multiId =
        preferredLineId ?? resolveTransferLineId({ lastUci, preferredLineId: null, crossNear: prevCross })
      if (!multiId) return
      const hit = lookupFenInLine(coachFen, multiId, studyFenIndex)
      if (hit && hit.node.moves.length > 0 && hit.line.id !== coachLineId) {
        applyCoachLineTransfer(hit.line.id, hit.line.title)
      }
      return
    }

    const byFen = lookupStudyFen(coachFen, studyFenIndex, coachLineId)
    if (!byFen || byFen.line.id === coachLineId) return
    if (byFen.node.moves.length === 0) return
    applyCoachLineTransfer(byFen.line.id, byFen.line.title)
  }, [
    mode,
    coachBookPlay,
    coachLine,
    coachLineId,
    coachFen,
    coachTransfer,
    studyFenIndex,
    snap.moveHistory,
    snap.result,
    tick,
    game,
    applyCoachLineTransfer,
  ])

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
    if (mode === 'coach' && coachOnBook && coachResolve) {
      return bookMoveSquares(coachResolve.node)
    }
    return { origins: new Set<Square>(), targets: new Set<Square>() }
  }, [
    mode,
    studyResolve,
    studyCompleted,
    aiBookHint,
    aiHintResolve,
    coachOnBook,
    coachResolve,
  ])

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
        : mode === 'coach'
          ? coachSide
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
        snap.sideToMove === studySide) ||
      (mode === 'coach' &&
        !!coachLine &&
        snap.sideToMove === coachSide))

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

  // 陪练：在谱上时电脑只走谱
  useEffect(() => {
    if (mode !== 'coach' || !coachLine || snap.result || anim) return
    if (snap.sideToMove === coachSide) return
    if (!coachBookPlay || !coachResolve) return

    const hint = pickHintMove(coachResolve.node, preferredUci)
    if (!hint) return
    const move = parseUci(hint.uci)
    if (!move) return

    const gen = ++coachGen.current
    const timer = window.setTimeout(() => {
      if (gen !== coachGen.current) return
      beginMove(move.from, move.to)
    }, 450)

    return () => window.clearTimeout(timer)
  }, [
    mode,
    coachLine,
    coachSide,
    coachBookPlay,
    coachResolve,
    preferredUci,
    snap.sideToMove,
    snap.result,
    anim,
    beginMove,
    tick,
  ])

  // 人机；陪练离谱后：有一手进谱则优先贴谱，否则搜索
  useEffect(() => {
    if (snap.result || anim) return

    let computerSide: Side | null = null
    if (mode === 'ai') {
      if (snap.sideToMove !== aiSide) return
      computerSide = aiSide
    } else if (mode === 'coach') {
      if (snap.sideToMove !== coachComputerSide) return
      if (coachBookPlay) return
      computerSide = coachComputerSide

      // 一手可进谱：有点选用点选，否则按序第一项（不再门闩）
      if (coachNearEntries.length > 0) {
        const picked =
          (preferredUci
            ? coachNearEntries.find((e) => e.uci === preferredUci)
            : null) ?? coachNearEntries[0]
        if (picked) {
          const move = parseUci(picked.uci)
          if (move) {
            bumpAiGen()
            const gen = ++coachGen.current
            const timer = window.setTimeout(() => {
              if (gen !== coachGen.current) return
              beginMove(move.from, move.to)
            }, 450)
            return () => window.clearTimeout(timer)
          }
        }
      }
    } else {
      return
    }

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
      side: computerSide,
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
    coachComputerSide,
    coachBookPlay,
    coachNearEntries,
    preferredUci,
    bumpAiGen,
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
    setCoachTransfer(null)
    if (mode === 'study') {
      if (!studyResolve?.onBook || anim || snap.result) return
      if (!humanTurn && !studyOpponentTurn) return
      const move = parseUci(uci)
      if (move) beginMove(move.from, move.to)
      return
    }
    if (mode === 'coach') {
      if (!coachOnBook || anim || snap.result || !humanTurn) return
      const move = parseUci(uci)
      if (move) beginMove(move.from, move.to)
    }
  }

  /** 侧栏转入其它谱：立即转谱并自动走该着一步 */
  const selectCoachCrossEntry = (uci: string, lineId: string) => {
    setPreferredUci(uci)
    setCoachTransfer({ uci, lineId })
    const hit = lookupFenInLine(coachFen, lineId, studyFenIndex)
    if (hit && hit.node.moves.length > 0 && hit.line.id !== coachLineId) {
      applyCoachLineTransfer(hit.line.id, hit.line.title)
    }
    if (anim || snap.result) return
    const move = parseUci(uci)
    if (move) beginMove(move.from, move.to)
  }

  const resetCoachLine = useCallback(() => {
    if (!coachLineId) return
    bumpCoachGen()
    bumpAiGen()
    clearAnim()
    loadStudyStart(coachLineId)
    setSelected(null)
    setLastCaptureTo(null)
    setPreferredUci(null)
    setCoachTransfer(null)
    setMessage('')
    refresh()
  }, [
    bumpCoachGen,
    bumpAiGen,
    clearAnim,
    loadStudyStart,
    coachLineId,
    refresh,
  ])

  const startCoach = (id: string) => {
    bumpCoachGen()
    bumpAiGen()
    clearAnim()
    setCoachLineId(id)
    setCoachSide('red')
    setPreferredUci(null)
    setCoachTransfer(null)
    loadStudyStart(id)
    setSelected(null)
    setLastCaptureTo(null)
    setMessage('')
    refresh()
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
        return '对方着：点变招即走，或点「对方走」'
      const check = game.isInCheck() ? '（将军）' : ''
      return `跟谱中 · 轮到你${check}`
    }
    if (mode === 'coach') {
      if (snap.result) return resultText(snap.result)
      if (!coachLine) return '陪练：请选择阶段与课程'
      if (anim) return '走子中…'
      if (thinking) return '电脑思考中…'
      if (!coachOnBook) {
        if (coachNearEntries.length > 0)
          return '已离开本谱 · 电脑将优先一手贴谱'
        return '已离开本谱 · 可自动转谱或电脑按人机走'
      }
      if (coachBranches.length === 0) return '本线谱着已走完 · 尝试转谱或继续对局'
      if (snap.sideToMove !== coachSide) return '对方按谱走子…'
      const check = game.isInCheck() ? '（将军）' : ''
      return `陪练跟谱 · 轮到你${check}`
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
    bumpCoachGen()
    clearAnim()
    setMode(next)
    setSelected(null)
    setMessage('')
    setExportOpen(false)
    setPreferredUci(null)
    setCoachTransfer(null)
    if (next === 'study') {
      setStudyOpeningId(null)
      game.reset()
      setLastCaptureTo(null)
      refresh()
    } else if (next === 'coach') {
      setCoachLineId(null)
      setCoachPhase(null)
      game.reset()
      setLastCaptureTo(null)
      refresh()
    }
  }

  return (
    <div className="app">
      <div className="desk">
        <div className="header-main">
          <h1>中国象棋</h1>
          <p className="status">{statusLine}</p>
          <p className="msg">{message}</p>
        </div>
        <BoardView
          board={viewBoard}
          selected={selected}
          targets={targets}
          bookOrigins={
            mode === 'study' ||
            mode === 'coach' ||
            (mode === 'ai' && aiBookHint)
              ? bookSets.origins
              : undefined
          }
          bookTargets={
            mode === 'study' ||
            mode === 'coach' ||
            (mode === 'ai' && aiBookHint)
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

        <aside className="play-strip" aria-label="谱着与着法">
          <div className="play-strip-book">
            {mode === 'coach' && coachLine ? (
              <>
                <h2>
                  <span className="hint">{PHASE_LABEL[coachLine.phase]} · </span>
                  {coachLine.title}
                </h2>
                {!coachOnBook ? (
                  <p className="hint">已离开本谱</p>
                ) : null}
                {coachOnBook && coachBranches.length > 0 ? (
                  <>
                    <h3>
                      {snap.sideToMove === coachSide ? '你的着法' : '对方着法'}
                    </h3>
                    <ul className="study-branches study-branches-compact">
                      {coachBranches.map((b) => (
                        <li key={b.uci}>
                          <button
                            type="button"
                            className={preferredUci === b.uci ? 'active' : ''}
                            onClick={() => {
                              if (humanTurn) chooseBranch(b.uci)
                              else {
                                setPreferredUci(b.uci)
                                setCoachTransfer(null)
                              }
                            }}
                          >
                            {b.main ? '【主】' : ''}
                            {formatBookMove(b)}
                            <span className="hint"> · {b.benefit}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : coachOnBook ? (
                  <p className="hint">本线谱着已走完</p>
                ) : null}
                {coachNearEntries.length > 0 ? (
                  <>
                    <h3>可转入</h3>
                    <ul className="study-branches study-branches-compact">
                      {coachNearEntries.map((e) => (
                        <li key={`${e.line.id}-${e.uci}`}>
                          <button
                            type="button"
                            className={
                              coachTransfer?.lineId === e.line.id &&
                              coachTransfer.uci === e.uci
                                ? 'active'
                                : preferredUci === e.uci
                                  ? 'active'
                                  : ''
                            }
                            onClick={() =>
                              selectCoachCrossEntry(e.uci, e.line.id)
                            }
                          >
                            {e.label} →《{e.line.title}》
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </>
            ) : null}

            {mode === 'study' && studyOpening ? (
              <>
                <h2>
                  <span className="hint">
                    {PHASE_LABEL[studyOpening.phase]} ·{' '}
                  </span>
                  {studyOpening.title}
                </h2>
                {!studyOnBook ? (
                  <p className="hint">已离开本谱</p>
                ) : null}
                {studyOnBook && studyBranches.length > 0 ? (
                  <>
                    <h3>
                      {studyOpponentTurn ? '对方着法' : '你的着法'}
                    </h3>
                    <ul className="study-branches study-branches-compact">
                      {studyBranches.map((b) => (
                        <li key={b.uci}>
                          <button
                            type="button"
                            className={preferredUci === b.uci ? 'active' : ''}
                            onClick={() => chooseBranch(b.uci)}
                          >
                            {b.main ? '【主】' : ''}
                            {formatBookMove(b)}
                            <span className="hint"> · {b.benefit}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : studyOnBook ? (
                  <p className="hint">本线谱着已走完</p>
                ) : null}
              </>
            ) : null}

            {mode === 'ai' && aiBookHint ? (
              <>
                <h2>谱上着法</h2>
                {!aiHintLine ? (
                  <p className="hint">未匹配开局谱</p>
                ) : !aiHintOnBook ? (
                  <p className="hint">已离开本谱</p>
                ) : aiHintBranches.length > 0 ? (
                  <ul className="study-branches study-branches-compact">
                    {aiHintBranches.map((b) => (
                      <li key={b.uci}>
                        <button
                          type="button"
                          className={preferredUci === b.uci ? 'active' : ''}
                          onClick={() => setPreferredUci(b.uci)}
                        >
                          {b.main ? '【主】' : ''}
                          {formatBookMove(b)}
                          <span className="hint"> · {b.benefit}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="hint">本线谱着已走完</p>
                )}
              </>
            ) : null}

            {mode === 'coach' && !coachLine ? (
              <p className="hint">陪练：在「更多」里选课</p>
            ) : null}
            {mode === 'study' && !studyOpening ? (
              <p className="hint">学棋：在「更多」里选课</p>
            ) : null}
            {mode === 'hotseat' || (mode === 'ai' && !aiBookHint) ? (
              <p className="hint">对局中 · 着法见下方</p>
            ) : null}
          </div>

          <div className="play-strip-moves">
            <h2>走子</h2>
            <ol className="moves moves-strip" ref={movesStripRef}>
              {game.getMoveHistoryCoords().map((c, i) => (
                <li key={`strip-${c}-${i}`}>
                  {i % 2 === 0 ? '红' : '黑'} {c}
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <aside className="side-stack">
          {narrowLayout ? (
            <button
              type="button"
              className="panel-more-toggle"
              onClick={() => setPanelMoreOpen((o) => !o)}
            >
              {panelMoreOpen ? '收起设置' : '更多 · 模式与设置'}
            </button>
          ) : null}
          <div
            className={
              narrowLayout && !panelMoreOpen
                ? 'panel-body panel-body-hidden'
                : 'panel-body'
            }
          >
          <div className="side-top">
          <section className="side-moves">
            <h2>走子</h2>
            <ol className="moves header-moves-list">
              {game.getMoveHistoryCoords().map((c, i) => (
                <li key={`${c}-${i}`}>
                  {i % 2 === 0 ? '红' : '黑'} {c}
                </li>
              ))}
            </ol>
            {mode === 'hotseat' || mode === 'ai' || mode === 'coach' ? (
              <div className="btn-row header-moves-actions">
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
          <section className="side-fen">
            {mode !== 'study' ? (
              <>
                <label className="header-fen-label">
                局面串
                <input
                  className="header-fen-input"
                  value={fenInput || game.toFen()}
                  onChange={(e) => setFenInput(e.target.value)}
                  onFocus={() => setFenInput(game.toFen())}
                  spellCheck={false}
                />
              </label>
              <div className="btn-row header-fen-actions">
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
              <p className="hint header-selected">
                {selected !== null ? `选中：${squareToCoord(selected)}` : '\u00a0'}
              </p>
              </>
            ) : (
              <p className="hint">学棋模式不提供局面串导入</p>
            )}
          </section>
          <section className="panel-mode">
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
              <label className="row">
                <input
                  type="radio"
                  checked={mode === 'coach'}
                  onChange={() => switchMode('coach')}
                />
                陪练跟谱
              </label>
            </section>
            <section className="panel-strength">
              <h2>电脑强度</h2>
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
                </>
              ) : (
                <p className="hint">仅人机可用</p>
              )}
            </section>
          </div>

          <div className="panel-mid">
          {(mode === 'coach' && !!coachLine) ||
          (mode === 'ai' && aiBookHint) ? (
          <section className="panel-mode-extra">
            {mode === 'coach' && coachLine ? (
              <>
                <label className="row">
                  我执
                  <select
                    value={coachSide}
                    onChange={(e) => {
                      bumpCoachGen()
                      bumpAiGen()
                      clearAnim()
                      setCoachSide(e.target.value as Side)
                      setPreferredUci(null)
                      if (coachLineId) loadStudyStart(coachLineId)
                      setSelected(null)
                      setLastCaptureTo(null)
                      refresh()
                    }}
                  >
                    <option value="red">红</option>
                    <option value="black">黑</option>
                  </select>
                </label>
                <div className="btn-row">
                  <button type="button" onClick={resetCoachLine}>
                    回谱起点
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      bumpCoachGen()
                      bumpAiGen()
                      clearAnim()
                      setCoachLineId(null)
                      setPreferredUci(null)
                      game.reset()
                      setSelected(null)
                      setLastCaptureTo(null)
                      setMessage('')
                      refresh()
                    }}
                  >
                    换谱
                  </button>
                </div>
                <p className="hint">
                  在谱上时电脑只走谱；离谱后若当前局面落在其它课上会按局面转谱，否则改按人机下。
                </p>
              </>
            ) : null}
            {mode === 'ai' && aiBookHint ? (
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
          </section>
          ) : null}

          {mode === 'ai' && aiBookHint ? (
            <section className="panel-dup-book panel-book-grow">
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

          {mode === 'coach' && !coachLine ? (
            <section className="panel-book-grow side-coach-scroll">
              {coachPhase === null ? (
                <>
                  <h2>陪练 · 选阶段</h2>
                  <p className="hint">
                    选课后电脑在谱上只走谱；开局课离谱后可自动转谱。
                  </p>
                  <ul className="study-branches">
                    {COACH_PHASES.map((p) => (
                      <li key={p}>
                        <button type="button" onClick={() => setCoachPhase(p)}>
                          <strong>{PHASE_LABEL[p]}</strong>
                          <br />
                          <span className="hint">
                            {listStudyLines(p).length} 课
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <h2>陪练 · {PHASE_LABEL[coachPhase]}</h2>
                  <div className="btn-row">
                    <button type="button" onClick={() => setCoachPhase(null)}>
                      返回阶段
                    </button>
                  </div>
                  <ul className="study-branches">
                    {listStudyLines(coachPhase).map((l) => (
                      <li key={l.id}>
                        <button type="button" onClick={() => startCoach(l.id)}>
                          <strong>{l.title}</strong>
                          <br />
                          <span className="hint">{l.summary}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          ) : null}

          {mode === 'coach' && coachLine ? (
            <section className="panel-book-grow side-coach-scroll">
              <h2>
                <span className="hint">{PHASE_LABEL[coachLine.phase]} · </span>
                {coachLine.title}
              </h2>
              <p className="hint">{coachLine.summary}</p>
              {!coachOnBook ? (
                <p className="msg">
                  已离开本谱。若当前局面命中其它课将自动转谱；一手可进谱时电脑也会优先贴谱；否则可悔棋或回谱起点。
                </p>
              ) : null}
              {coachOnBook && coachResolve?.node.comment ? (
                <p className="study-note">{coachResolve.node.comment}</p>
              ) : null}
              <div className="panel-dup-book">
              {coachOnBook && coachBranches.length > 0 ? (
                <>
                  <h3>
                    {snap.sideToMove === coachSide ? '你的着法' : '对方着法'}
                  </h3>
                  <ul className="study-branches">
                    {coachBranches.map((b) => (
                      <li key={b.uci}>
                        <button
                          type="button"
                          className={preferredUci === b.uci ? 'active' : ''}
                          onClick={() => {
                            if (humanTurn) chooseBranch(b.uci)
                            else {
                              setPreferredUci(b.uci)
                              setCoachTransfer(null)
                            }
                          }}
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
              {coachNearEntries.length > 0 ? (
                <>
                  <h3>可转入其它谱</h3>
                  <p className="hint">
                    棋盘直出：本谱有续则留本谱，无续则按序进第一转入谱。点此条立即转谱并走一步。
                  </p>
                  <ul className="study-branches">
                    {coachNearEntries.map((e) => (
                      <li key={`${e.line.id}-${e.uci}`}>
                        <button
                          type="button"
                          className={
                            coachTransfer?.lineId === e.line.id &&
                            coachTransfer.uci === e.uci
                              ? 'active'
                              : preferredUci === e.uci
                                ? 'active'
                                : ''
                          }
                          onClick={() =>
                            selectCoachCrossEntry(e.uci, e.line.id)
                          }
                        >
                          走 {e.label} 可进入《{e.line.title}》
                          <br />
                          <span className="hint">
                            {PHASE_LABEL[e.line.phase]} · 续走约 {e.remaining}{' '}
                            分支
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              </div>
            </section>
          ) : null}

          {mode === 'study' ? (
            <div className="panel-book-grow">
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
            </div>
          ) : null}
          </div>

          <section className="panel-ops">
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
                      : mode === 'coach'
                        ? game.canUndoFor(coachSide)
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
                        : mode === 'coach'
                          ? coachSide
                          : snap.sideToMove
                  bumpAiGen()
                  bumpStudyGen()
                  bumpCoachGen()
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
                      bumpCoachGen()
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
                      bumpCoachGen()
                      clearAnim()
                      if (mode === 'coach' && coachLineId) {
                        loadStudyStart(coachLineId)
                      } else {
                        game.reset()
                      }
                      setSelected(null)
                      setLastCaptureTo(null)
                      setPreferredUci(null)
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

          {exportOpen &&
          (mode === 'hotseat' || mode === 'ai' || mode === 'coach') ? (
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
          </div>
        </aside>

      </div>
    </div>
  )
}
