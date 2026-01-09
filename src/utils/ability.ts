import type { Effect } from './effects'
import type { Event, EventType } from './event'
import type { PlayableCard } from './cards'
import type { Run, Location } from './run'
import type { Resource } from './resource'
import type { TargetSpec } from './card-matchers'

export type Ability = {
  trigger: Trigger
  effects: Effect[]
}

// Describes the conditions for ability triggering
export type Trigger = {
  on: EventType
  target?: TargetSpec
  locations?: Location[] // if omitted, implies all locations
  when?: (context: TriggerContext) => boolean // additional conditional check
  costs?: Partial<Record<Resource, number>>
  limit?: {
    perTurn?: number
    perRound?: number
    perRun?: number
  }
}

export type TriggerContext = {
  event: Event
  // Card with triggered ability
  sourceCard: PlayableCard & { instanceId: string }
  // If triggering event was from a card, the triggering card
  targetCard?: PlayableCard & { instanceId: string }
  run: Run
}
