import type { Effect } from './effects'
import type { Event, EventType } from './event'
import type { CardInstance, RulesCard } from './cards'
import type { Run, Location } from './run'
import type { Resource } from './resource'
import type { TargetSpec } from './card-matchers'

export type Ability = {
  trigger: Trigger
  effects: Effect[]
}

/** Describes the event that triggers this ability, plus additional conditionals. */
export type Trigger = {
  on: EventType
  target?: TargetSpec
  /** List of locations for which the card containing the ability can trigger it from. If omitted, implies all locations */
  locations?: Location[]
  /** Additional conditional check, using trigger context */
  when?: (context: TriggerContext) => boolean
  costs?: Partial<Record<Resource, number>>
  limit?: {
    perTurn?: number
    perRound?: number
    perRun?: number
  }
}

export type TriggerContext = {
  event: Event
  /** Card with ability to be triggered */
  sourceCard: CardInstance | RulesCard
  /** If applicable, data for card referred to in event */
  targetCard?: CardInstance
  run: Run
}
