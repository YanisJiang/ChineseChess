import type { BookNode } from './types'

/** 叶节点：本线学完 */
export function end(comment?: string): BookNode {
  return {
    comment: comment ?? '本线告一段落，可重学或换谱。',
    moves: [],
  }
}
