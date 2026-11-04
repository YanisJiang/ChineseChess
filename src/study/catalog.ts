import { ENDGAME_LINES } from './endgame'
import { EXTRA_ENDGAME_LINES } from './extraEndgame'
import { EXTRA_MIDDLEGAME_LINES } from './extraMiddlegame'
import { EXTRA_OPENING_LINES } from './extraOpenings'
import { MIDDLEGAME_LINES } from './middlegame'
import { OPENING_LINES } from './openings'
import { PINGFENG_WEB_LINES } from './pingfengWeb'
import type { StudyLine, StudyPhase } from './types'

const WEB_IDS = new Set(PINGFENG_WEB_LINES.map((l) => l.id))

export const STUDY_LINES: StudyLine[] = [
  ...OPENING_LINES,
  ...EXTRA_OPENING_LINES,
  ...MIDDLEGAME_LINES.filter((l) => !WEB_IDS.has(l.id)),
  ...EXTRA_MIDDLEGAME_LINES,
  ...ENDGAME_LINES.filter((l) => !WEB_IDS.has(l.id)),
  ...EXTRA_ENDGAME_LINES,
  ...PINGFENG_WEB_LINES,
]

export function getStudyLine(id: string): StudyLine | undefined {
  return STUDY_LINES.find((l) => l.id === id)
}

export function listStudyLines(phase: StudyPhase): StudyLine[] {
  return STUDY_LINES.filter((l) => l.phase === phase)
}

/** @deprecated 使用 getStudyLine */
export function getOpening(id: string): StudyLine | undefined {
  return getStudyLine(id)
}

/** @deprecated 使用 STUDY_LINES / listStudyLines */
export const OPENINGS = OPENING_LINES
