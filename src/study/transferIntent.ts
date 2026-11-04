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
