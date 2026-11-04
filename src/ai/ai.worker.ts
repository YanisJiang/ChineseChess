import type { AiStrength } from './search'
import { chooseAiMove } from './search'
import type { Move, Piece, Side } from '../engine/types'

export type AiRequest = {
  requestId: number
  board: (Piece | null)[]
  side: Side
  strength: AiStrength
}

export type AiResponse = {
  requestId: number
  move: Move | null
}

self.onmessage = (ev: MessageEvent<AiRequest>) => {
  const { requestId, board, side, strength } = ev.data
  const move = chooseAiMove(board, side, strength)
  const res: AiResponse = { requestId, move }
  self.postMessage(res)
}
