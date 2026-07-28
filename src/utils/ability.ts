import type { Effect, EffectType } from './effects'
import type { Event, EventType } from './event'
import type { CardInstance, RulesCard } from './cards'
import type { Run, Location } from './run'
import type { Resource } from './resource'
import type { TargetSpec } from './card-matchers'
import type { EffectContext } from './ability-processor'

export type Ability = ReactiveAbility | InterruptAbility

/** Reacts to events, produces an effect list */
export type ReactiveAbility = {
  type: 'reactive'
  trigger: EventTrigger
  effects: Effect[]
}

/** Intercepts an effect before it applies, producing substitute effects */
export type InterruptAbility = {
  type: 'interrupt'
  trigger: EffectTrigger
  /** Substitutes for the intercepted effect. An empty list prevents it entirely. */
  effects: Effect[] | ((context: InterruptContext) => Effect[])
}

/** Describes the event that triggers this ability, plus additional conditionals. */
export type EventTrigger = {
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

/** Describes the atomic effect that triggers this ability, plus additional conditionals. */
export type EffectTrigger = {
  on: EffectType
  /** Matched against the card the effect is about to act on, when it targets one */
  target?: TargetSpec
  /** List of locations for which the card containing the ability can trigger it from. If omitted, implies all locations */
  locations?: Location[]
  /** Additional conditional check, using interrupt context */
  when?: (context: InterruptContext) => boolean
}

export type TriggerContext = {
  event: Event
  /** Card with ability to be triggered */
  sourceCard: CardInstance | RulesCard
  /** If applicable, data for card referred to in event */
  targetCard?: CardInstance
  run: Run
}

export type InterruptContext = {
  /** The atomic effect about to resolve */
  effect: Effect
  /** Who produced the effect — a player action, or an ability and its source card */
  effectContext: EffectContext
  /** Card with the interrupt ability */
  sourceCard: CardInstance | RulesCard
  /** If applicable, the card the effect is about to act on */
  targetCard?: CardInstance
  run: Run
}
