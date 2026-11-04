import { describe, expect, it } from 'vitest'
import { coordToSquare, fileOf } from '../engine/board'
import {
  blackFileChar,
  blackFileNo,
  redFileChar,
  redFileNo,
} from './notation'

describe('纵线路号（己方右手起算）', () => {
  it('红：i=一 … a=九', () => {
    expect(redFileNo(8)).toBe(1)
    expect(redFileNo(7)).toBe(2)
    expect(redFileNo(0)).toBe(9)
    expect(redFileChar(8)).toBe('一')
    expect(redFileChar(0)).toBe('九')
  })

  it('黑：a=1 … i=9', () => {
    expect(blackFileNo(0)).toBe(1)
    expect(blackFileNo(7)).toBe(8)
    expect(blackFileNo(8)).toBe(9)
    expect(blackFileChar(0)).toBe('1')
    expect(blackFileChar(7)).toBe('8')
  })

  it('开局常见着与路号一致', () => {
    const file = (uciFrom: string) => fileOf(coordToSquare(uciFrom)!)
    // 炮二平五 h2
    expect(redFileChar(file('h2'))).toBe('二')
    // 马八进七 b0（红左马）
    expect(redFileChar(file('b0'))).toBe('八')
    // 马二进三 h0（红右马）
    expect(redFileChar(file('h0'))).toBe('二')
    // 兵三进一 g3
    expect(redFileChar(file('g3'))).toBe('三')
    // 车一进一 i0
    expect(redFileChar(file('i0'))).toBe('一')
    // 马8进7 / 马2进3
    expect(blackFileChar(file('h9'))).toBe('8')
    expect(blackFileChar(file('b9'))).toBe('2')
  })
})
