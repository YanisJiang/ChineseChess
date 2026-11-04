import type { NearBookEntry } from './nearBook'

/**
 * 同一着会触发多谱：本谱分支 ∩ 跨课一手，或跨课一手同 uci ≥2 课。
 */
export function isAmbiguousMultiLineUci(
  uci: string,
  bookUcis: Iterable<string>,
  crossNear: NearBookEntry[],
): boolean {
  const inBook = new Set(bookUcis).has(uci)
  const nearFor = crossNear.filter((e) => e.uci === uci)
  if (nearFor.length >= 2) return true
  if (inBook && nearFor.length >= 1) return true
  return false
}

/** 同 uci 跨课列表按原序取第一个课 id */
export function firstCrossLineIdForUci(
  uci: string,
  crossNear: NearBookEntry[],
): string | null {
  return crossNear.find((e) => e.uci === uci)?.line.id ?? null
}

/**
 * 棋盘直出后是否留在当前课：
 * ① 上一局面本谱含该着，且走后本谱在新局面仍有后续 → 留
 */
export function shouldStayOnCurrentLine(
  lastUci: string,
  prevBookUcis: Iterable<string>,
  currentLineStillHasMoves: boolean,
): boolean {
  return new Set(prevBookUcis).has(lastUci) && currentLineStillHasMoves
}

/**
 * 需要转谱时的目标课：
 * - 侧栏明确意图优先
 * - 否则该着跨课按序第一条
 * - 本谱有续时返回 null（由调用方先用 shouldStayOnCurrentLine）
 */
export function resolveTransferLineId(opts: {
  lastUci: string
  preferredLineId: string | null
  crossNear: NearBookEntry[]
}): string | null {
  if (opts.preferredLineId) return opts.preferredLineId
  return firstCrossLineIdForUci(opts.lastUci, opts.crossNear)
}
