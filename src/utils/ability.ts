import type { Command, CommandType } from './commands'
import type { Event, EventType } from './event'
import type { CardInstance, RulesCard } from './cards'
import type { Run, Location } from './run'
import type { Resource } from './resource'
import type { TargetSpec } from './card-matchers'
import type { CommandContext } from './ability-processor'

export type Ability = ReactiveAbility | InterruptAbility

/** Reacts to events, produces a command list */
export type ReactiveAbility = {
  type: 'reactive'
  trigger: EventTrigger
  commands: Command[] | ((context: TriggerContext) => Command[])
  /** Where this ability resolves relative to card abilities answering the same event. */
  order?: RulesOrder
}

export type RulesOrder = 'before-cards' | 'after-cards'

/** Intercepts a command before it applies, producing substitute commands */
export type InterruptAbility = {
  type: 'interrupt'
  trigger: CommandTrigger
  /** Substitutes for the intercepted command. An empty list prevents it entirely. */
  commands: Command[] | ((context: InterruptContext) => Command[])
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

/** Describes the atomic command that triggers this ability, plus additional conditionals. */
export type CommandTrigger = {
  on: CommandType
  /** Matched against the card the command is about to act on, when it targets one */
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
  /** The atomic command about to resolve */
  command: Command
  /** Who produced the command — a player action, or an ability and its source card */
  commandContext: CommandContext
  /** Card with the interrupt ability */
  sourceCard: CardInstance | RulesCard
  /** If applicable, the card the command is about to act on */
  targetCard?: CardInstance
  run: Run
}
