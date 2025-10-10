import type { PlayableCardID } from './cards'

export type CardPlayEvent = {
  type: 'card-play'
  round: number
  turn: number
  cardId: PlayableCardID
}

export type Event = CardPlayEvent
