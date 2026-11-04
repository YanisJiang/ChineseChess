import { afterAll, describe, expect, it } from 'vitest'
import { createInitialBoard, sq } from './board'
import { boardToFen, parseFen, startingFen } from './fen'
import {
  Game,
  resetNaturalLimitPlies,
  setNaturalLimitPliesForTest,
} from './game'
import { generateLegalMoves, inCheck } from './moves'

afterAll(() => {
  resetNaturalLimitPlies()
})

describe('开局与局面串', () => {
  it('标准开局红先行', () => {
    const g = new Game()
    expect(g.getSideToMove()).toBe('red')
    expect(g.getBoard()[sq(4, 0)]).toBe('K')
    expect(g.getBoard()[sq(4, 9)]).toBe('k')
  })

  it('FEN 往返', () => {
    const fen = startingFen()
    const { board, sideToMove } = parseFen(fen)
    expect(sideToMove).toBe('red')
    expect(boardToFen(board, sideToMove)).toBe(fen)
    expect(board).toEqual(createInitialBoard())
  })
})

describe('基本走法', () => {
  it('开局红兵可进一步', () => {
    const g = new Game()
    expect(g.tryMove(sq(0, 3), sq(0, 4))).toBe(true)
    expect(g.getSideToMove()).toBe('black')
    expect(g.getBoard()[sq(0, 4)]).toBe('P')
  })

  it('开局红马可跳', () => {
    const g = new Game()
    expect(g.tryMove(sq(1, 0), sq(2, 2))).toBe(true)
  })

  it('非法着被拒绝', () => {
    const g = new Game()
    // 车不能斜走
    expect(g.tryMove(sq(0, 0), sq(1, 1))).toBe(false)
  })
})

describe('悔棋与认输和棋', () => {
  it('可悔棋恢复局面', () => {
    const g = new Game()
    g.tryMove(sq(0, 3), sq(0, 4))
    expect(g.canUndo()).toBe(true)
    expect(g.undo()).toBe(true)
    expect(g.getSideToMove()).toBe('red')
    expect(g.getBoard()[sq(0, 3)]).toBe('P')
  })

  it('undoFor：对方应着后悔棋回到己方走前', () => {
    const g = new Game()
    expect(g.tryMove(sq(0, 3), sq(0, 4))).toBe(true) // 红
    expect(g.tryMove(sq(0, 6), sq(0, 5))).toBe(true) // 黑应
    expect(g.getSideToMove()).toBe('red')
    expect(g.canUndoFor('red')).toBe(true)
    expect(g.undoFor('red')).toBe(true)
    expect(g.getSideToMove()).toBe('red')
    expect(g.getBoard()[sq(0, 3)]).toBe('P')
    expect(g.getBoard()[sq(0, 4)]).toBeNull()
    expect(g.getBoard()[sq(0, 6)]).toBe('p')
    expect(g.getMoveHistoryCoords()).toEqual([])
  })

  it('undoFor：刚走完尚未应着时只撤一手', () => {
    const g = new Game()
    g.tryMove(sq(7, 2), sq(4, 2)) // 红炮
    expect(g.getSideToMove()).toBe('black')
    expect(g.undoFor('red')).toBe(true)
    expect(g.getSideToMove()).toBe('red')
    expect(g.getBoard()[sq(7, 2)]).toBe('C')
  })

  it('undoFor：尚未下过不可悔', () => {
    const g = new Game()
    g.tryMove(sq(0, 3), sq(0, 4))
    expect(g.canUndoFor('black')).toBe(false)
    expect(g.undoFor('black')).toBe(false)
  })

  it('认输结束', () => {
    const g = new Game()
    g.resign('red')
    expect(g.getResult()).toEqual({ kind: 'resign', winner: 'black' })
    expect(g.canUndo()).toBe(false)
  })

  it('提议并同意和棋', () => {
    const g = new Game()
    g.offerDraw('red')
    expect(g.getDrawOfferBy()).toBe('red')
    g.acceptDraw('black')
    expect(g.getResult()).toEqual({ kind: 'draw', reason: 'agreement' })
  })
})

describe('重复局面 / 自然限着 / 长将', () => {
  it('三次重复局面（无将军循环）作和', () => {
    const g = new Game()
    const cycle = () => {
      expect(g.tryMove(sq(1, 0), sq(2, 2))).toBe(true) // 马八进七
      expect(g.tryMove(sq(1, 9), sq(2, 7))).toBe(true) // 马8进7
      expect(g.tryMove(sq(2, 2), sq(1, 0))).toBe(true) // 马七退八
      expect(g.tryMove(sq(2, 7), sq(1, 9))).toBe(true) // 马7退8
    }
    cycle()
    expect(g.getResult()).toBeNull()
    cycle()
    expect(g.getResult()).toEqual({ kind: 'draw', reason: 'repetition' })
  })

  it('自然限着：无吃无兵达到上限作和', () => {
    setNaturalLimitPliesForTest(4)
    const g = new Game()
    expect(g.tryMove(sq(1, 0), sq(2, 2))).toBe(true)
    expect(g.tryMove(sq(1, 9), sq(2, 7))).toBe(true)
    expect(g.tryMove(sq(2, 2), sq(1, 0))).toBe(true)
    expect(g.getResult()).toBeNull()
    expect(g.tryMove(sq(2, 7), sq(1, 9))).toBe(true)
    expect(g.getResult()).toEqual({ kind: 'draw', reason: 'natural' })
    resetNaturalLimitPlies()
  })

  it('车来回将军成循环三次 → 长将方负', () => {
    // 黑将 d9，红车 d1 将军；帅偏 f0，避免将躲中路时将帅对面
    const g = Game.fromFen('3k5/9/9/9/9/9/9/9/3R5/5K3 b')
    expect(inCheck(g.getBoard(), 'black')).toBe(true)
    const swing = () => {
      expect(g.tryMove(sq(3, 9), sq(4, 9))).toBe(true) // 将4平5
      expect(g.tryMove(sq(3, 1), sq(4, 1))).toBe(true) // 车跟平中将
      expect(g.tryMove(sq(4, 9), sq(3, 9))).toBe(true) // 将5平4
      expect(g.tryMove(sq(4, 1), sq(3, 1))).toBe(true) // 车跟回肋将
    }
    swing()
    expect(g.getResult()).toBeNull()
    swing()
    expect(g.getResult()).toEqual({
      kind: 'perpetualCheck',
      winner: 'black',
    })
  })
})

describe('将军与将死困毙', () => {
  it('合法着不得吃将：车将同线空旷仍不算吃将着', () => {
    const fen = '4k4/9/9/9/9/9/9/9/4R4/4K4 w'
    const g = Game.fromFen(fen)
    expect(inCheck(g.getBoard(), 'black')).toBe(true)
    const legal = generateLegalMoves(g.getBoard(), 'red')
    expect(legal.some((m) => m.from === sq(4, 1) && m.to === sq(4, 9))).toBe(
      false,
    )
    expect(g.tryMove(sq(4, 1), sq(4, 9))).toBe(false)
    expect(g.getBoard()[sq(4, 9)]).toBe('k')
  })

  it('将死局面检测', () => {
    // 黑将 e9；红车 a9 控底线；红车 e8 将军；吃车则将帅对面
    const g = Game.fromFen('R3k4/4R4/9/9/9/9/9/9/9/4K4 b')
    expect(inCheck(g.getBoard(), 'black')).toBe(true)
    expect(generateLegalMoves(g.getBoard(), 'black')).toHaveLength(0)
    expect(g.getResult()).toEqual({ kind: 'checkmate', winner: 'red' })
  })

  it('困毙局面检测', () => {
    // 将与士填满九宫相关格，无合法着且未将军；红帅偏左不照面
    const g = Game.fromFen('3aka3/3aaa3/3aaa3/9/9/9/9/9/9/3K5 b')
    expect(inCheck(g.getBoard(), 'black')).toBe(false)
    expect(generateLegalMoves(g.getBoard(), 'black')).toHaveLength(0)
    expect(g.getResult()).toEqual({ kind: 'stalemate', winner: 'red' })
  })
})

describe('飞将', () => {
  it('照面时必须离开中线', () => {
    const fen = '4k4/9/9/9/9/9/9/9/9/4K4 w'
    const g = Game.fromFen(fen)
    expect(inCheck(g.getBoard(), 'red')).toBe(true)
    expect(g.tryMove(sq(4, 0), sq(3, 0))).toBe(true)
    expect(inCheck(g.getBoard(), 'black')).toBe(false)
  })
})
