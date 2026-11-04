import type { Move } from '../engine/types'
import { resolveStudyLine } from './navigate'
import type { StudyLine } from './types'

/**
 * 在候选课里按已走历史自动匹配：优先仍在谱上（onBook）且 matchedPly 最长者。
 * 对不上任何谱上局面则返回 null。
 */
export function autoMatchStudyLine(
  history: Move[],
  lines: StudyLine[],
): StudyLine | null {
  let best: StudyLine | null = null
  let bestPly = -1

  for (const line of lines) {
    // 带自定义起点的中残局本轮不参与自动匹配
    if (line.startFen) continue
    const r = resolveStudyLine(line, history)
    if (!r.onBook) continue
    if (r.matchedPly > bestPly) {
      bestPly = r.matchedPly
      best = line
    }
  }

  return best
}
