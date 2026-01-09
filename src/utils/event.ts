import type { PlayableCardID, CardID } from './cards'
import type { Location } from './run'
import type { Resource } from './resource'

type BaseEvent = {
  round: number
  turn: number
}

export type CardDrawEvent = BaseEvent & {
  type: 'card-draw'
  cardId: PlayableCardID
  instanceId: string
}

export type CardPlayEvent = BaseEvent & {
  type: 'card-play'
  cardId: PlayableCardID
  instanceId: string
}

export type CardDiscardEvent = BaseEvent & {
  type: 'card-discard'
  cardId: PlayableCardID
  instanceId: string
  fromLocation: Location
}

export type CardCollectEvent = BaseEvent & {
  type: 'card-collect'
  cardId: CardID
  amount: number
}

export type CardRemoveEvent = BaseEvent & {
  type: 'card-remove'
  cardId: PlayableCardID
  instanceId: string
  fromLocation: Location
}

// Caused by manual interaction with a card
export type CardActivateEvent = BaseEvent & {
  type: 'card-activate'
  cardId: PlayableCardID
  instanceId: string
  abilityIndex: number
}

export type TurnStartEvent = BaseEvent & {
  type: 'turn-start'
}

export type TurnEndEvent = BaseEvent & {
  type: 'turn-end'
}

export type RoundStartEvent = BaseEvent & {
  type: 'round-start'
}

export type RoundEndEvent = BaseEvent & {
  type: 'round-end'
}

export type RunStartEvent = BaseEvent & {
  type: 'run-start'
}

export type RunEndEvent = BaseEvent & {
  type: 'run-end'
}

export type ResourceChangeEvent = BaseEvent & {
  type: 'resource-change'
  resource: Resource
  oldValue: number
  newValue: number
  delta: number
}

// Union Type
export type Event =
  | CardDrawEvent
  | CardPlayEvent
  | CardDiscardEvent
  | CardCollectEvent
  | CardRemoveEvent
  | CardActivateEvent
  | TurnStartEvent
  | TurnEndEvent
  | RoundStartEvent
  | RoundEndEvent
  | RunStartEvent
  | RunEndEvent
  | ResourceChangeEvent

/**
 * The type string of an event, used in triggers to specify which event activates an ability.
 */
export type EventType = Event['type']

/**
 * Events that are related to a specific card instance.
 */
export type CardEvent =
  | CardDrawEvent
  | CardPlayEvent
  | CardDiscardEvent
  | CardRemoveEvent
  | CardActivateEvent

/**
 * Type guard to check if an event is a card-related event.
 *
 * @param event - The event to check
 * @returns true if the event has an instanceId (is card-related)
 */
export function isCardEvent(event: Event): event is CardEvent {
  return 'instanceId' in event
}

/**
 * Events related to turn/round/run lifecycle.
 */
export type LifecycleEvent =
  | TurnStartEvent
  | TurnEndEvent
  | RoundStartEvent
  | RoundEndEvent
  | RunStartEvent
  | RunEndEvent

/**
 * Type guard to check if an event is a lifecycle event.
 *
 * @param event - The event to check
 * @returns true if the event is a lifecycle event
 */
export function isLifecycleEvent(event: Event): event is LifecycleEvent {
  return (
    event.type === 'turn-start' ||
    event.type === 'turn-end' ||
    event.type === 'round-start' ||
    event.type === 'round-end' ||
    event.type === 'run-start' ||
    event.type === 'run-end'
  )
}
