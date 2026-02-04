import type { Effect } from './effects'
import type { Event, EventType } from './event'
import type { CardInstance } from './cards'
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
  sourceCard: CardInstance // Card with ability to be triggered
  targetCard?: CardInstance // If applicable, data for card referred to in event
  run: Run
}
