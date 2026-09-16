/**
 * Command processing pipeline.
 *
 * The pipeline follows a decompose → interrupt → apply → cascade loop:
 * 1. DECOMPOSE: Break compound commands into atomic, single-card commands (just-in-time)
 * 2. INTERRUPT: A matching interrupt ability substitutes its commands for the
 *    atomic one (emitting a command-replace event) instead of applying it
 * 3. APPLY: Execute atomic command → state change + 0 or 1 event
 * 4. CASCADE: Event → find matching abilities → their commands enter step 1
 *
 * Card-choice commands pause the pipeline by storing pending work as inspectable
 * data on the game state. The UI calls resolveChoice to resume.
 */

import type {
  ReactiveAbility,
  InterruptAbility,
  EventTrigger,
  CommandTrigger,
  TriggerContext,
  InterruptContext,
} from './ability'
import { type CardInstance, type RulesCard, getCardChoices } from './cards'
import type { Event, CardEvent, CardActivateEvent, CommandReplaceEvent } from './event'
import { isCardEvent } from './event'
import { type Run, type Location, locations } from './run'
import type { GameState, PendingChoice } from './game'
import { matchesCard, type TargetSpec } from './card-matchers'
import { applyCommand, type Command, type CardChoiceCommand } from './commands'
import { logEvent } from './game'
import { values, entries } from './utils'
import { toArray } from './counter'
import type { CardID } from './cards'

/**
 * Context passed to command processing.
 *
 * - `player`: a top-level action the player initiated (run-start, turn-end, play-card).
 *   No source card; 'self' references are illegal and will throw at apply time.
 * - `ability`: a command cascaded from an ability that matched an event. `sourceCard`
 *   identifies the card whose ability produced the command; `event` is the trigger.
 */
export type CommandContext =
  | { kind: 'player' }
  | { kind: 'ability'; sourceCard: CardInstance | RulesCard; event: Event }

/**
 * Represents a single command waiting to be processed on the stack.
 * Each command from an ability becomes its own stack item.
 */
export type CommandStackItem = {
  context: CommandContext
  command: Command
  /**
   * Keys of interrupt abilities already applied along this substitution chain.
   * An interrupt applies at most once per chain, preventing infinite loops.
   */
  interrupted?: string[]
}

/**
 * Single entry point for all game actions. Takes a high-level command,
 * decomposes it, applies atomic commands, and cascades triggered abilities.
 *
 * Player-driven actions (run-start, turn-end, play-card) should pass
 * `{ kind: 'player' }`. Internal callers resuming a cascade pass an
 * ability context.
 */
export function handleCommand(
  gameState: GameState,
  command: Command,
  context: CommandContext,
): GameState {
  if (!gameState.game.run) throw new Error('Cannot handle command with no run')

  return drainStack(gameState, [{ context, command }])
}

/**
 * Called by the UI when the user makes a card choice.
 * Reads the pending choice from state, generates commands from the choice handler,
 * and resumes stack processing.
 *
 * @param gameState - The current game state (must have a pending choice)
 * @param chosenCard - The card the user selected
 * @returns Updated game state after choice commands and the remaining stack resolve
 */
export function resolveChoice(gameState: GameState, chosenCard: CardID): GameState {
  const pending = gameState.viewData.pendingChoice
  if (!pending) throw new Error('No pending choice to resolve')

  const choiceCommands = pending.choiceCommand.params.choiceHandler(chosenCard)
  const choiceItems: CommandStackItem[] = choiceCommands.map((command) => ({
    context: pending.context,
    command,
  }))

  // Clear the pending choice and resume processing
  const clearedState: GameState = {
    ...gameState,
    viewData: {
      modalView: null,
      cardOptions: [],
      pendingChoice: null,
    },
  }

  return drainStack(clearedState, [...choiceItems, ...pending.remainingStack])
}

/**
 * Core processing loop. The front of `stack` is the top: shift the next item
 * off the front, decompose/apply/cascade it, and unshift any new work
 * (triggered abilities, decomposition remainder) back onto the front so it
 * resolves before the rest. Front-anchored so a pushed batch reads in
 * execution order (depth-first). Pauses on card-choice commands.
 *
 * `stack` is owned by the caller (built fresh in handleCommand/resolveChoice),
 * so mutating it in place is safe.
 */
function drainStack(gameState: GameState, stack: CommandStackItem[]): GameState {
  let currentState = gameState

  while (stack.length > 0) {
    const { context, command, interrupted } = stack.shift()!

    // Card-choice: pause processing. After the shift, `stack` is exactly the
    // remaining work, so it can be stored as-is.
    if (command.type === 'card-choice') return openCardChoice(currentState, command, context, stack)

    // Resolve symbolic references ('self' → source card, 'target' → event's card)
    // before decomposing, since decomposition may look cards up by instanceId.
    // Unresolved symbols pass through and throw at apply time.
    const resolvedCommand = resolveSymbolicReferences(command, context)

    // Decompose compound commands into atomic ones
    const decomposed = decomposeCommand(resolvedCommand, currentState.game.run!)
    if (!decomposed) continue // Nothing to do (pile empty, no matches, etc.)

    const { atomic, remaining } = decomposed

    // Interrupt: a matching interrupt ability substitutes its commands for the
    // atomic one, which never applies. The substitutes re-enter the stack under
    // the original context so stacked interrupts still see the true producer.
    const match = findMatchingInterrupt(currentState.game.run!, atomic, context, interrupted ?? [])
    if (match) {
      const run = currentState.game.run!
      const { card, ability } = match
      const targetInstanceId = commandTargetInstanceId(atomic)
      const targetCard = targetInstanceId ? findCard(targetInstanceId, run) : undefined
      const interruptContext: InterruptContext = {
        command: atomic,
        commandContext: context,
        sourceCard: card,
        targetCard,
        run,
      }
      const rawCommands =
        typeof ability.commands === 'function' ? ability.commands(interruptContext) : ability.commands

      const replaceEvent: CommandReplaceEvent = {
        type: 'command-replace',
        sourceCardId: card.id,
        ...(targetCard ? { cardId: targetCard.id, instanceId: targetCard.instanceId } : {}),
        originalCommand: atomic,
        newCommands: [],
        round: run.stats.rounds,
        turn: run.stats.turns,
      }
      // Resolve the substitutes' symbolic references eagerly against the
      // interrupting card ('self') and the affected card ('target'), so they
      // can carry the original context without losing those references.
      replaceEvent.newCommands = rawCommands.map((e) =>
        resolveSymbolicReferences(e, { kind: 'ability', sourceCard: card, event: replaceEvent }),
      )
      currentState = logEvent(currentState, replaceEvent)

      const triggeredItems: CommandStackItem[] = findMatchingAbilities(
        currentState.game.run!,
        replaceEvent,
      ).flatMap((m) => {
        const commands = abilityCommands(m.ability, m.card, replaceEvent, currentState.game.run!)
        return commands.map((e) => ({
          context: { kind: 'ability' as const, sourceCard: m.card, event: replaceEvent },
          command: e,
        }))
      })
      const substituteItems: CommandStackItem[] = replaceEvent.newCommands.map((e) => ({
        context,
        command: e,
        interrupted: [...(interrupted ?? []), interruptKey(card, ability)],
      }))
      const next = [
        ...triggeredItems,
        ...substituteItems,
        ...(remaining ? [{ context, command: remaining, interrupted }] : []),
      ]
      if (next.length > 0) stack.unshift(...next)
      continue
    }

    // Apply the atomic command
    const { game, event } = applyCommand(currentState, atomic)
    currentState = game

    // Cascade: if the command produced an event, find triggered abilities
    const triggeredItems: CommandStackItem[] = []
    if (event) {
      currentState = logEvent(currentState, event)
      const abilities = findMatchingAbilities(currentState.game.run!, event)
      const cascaded = abilities.flatMap((match) => {
        const commands = abilityCommands(match.ability, match.card, event, currentState.game.run!)
        return commands.map((e) => ({
          context: { kind: 'ability' as const, sourceCard: match.card, event },
          command: e,
        }))
      })
      triggeredItems.push(...cascaded)
    }

    // Push new work onto the front, triggered commands first, then this command's
    // decomposition remainder — a single unshift so the array reads in final
    // front-to-back order (depth-first).
    const next = remaining ? [...triggeredItems, { context, command: remaining }] : triggeredItems
    if (next.length > 0) stack.unshift(...next)
  }

  return currentState
}

/**
 * Decomposes a compound command into an atomic command to execute now,
 * plus the remaining compound command (if any).
 *
 * Returns null if there's nothing to do (pile empty, no matches, etc.).
 */
function decomposeCommand(
  command: Command,
  run: Run,
): { atomic: Command; remaining: Command | null } | null {
  switch (command.type) {
    case 'attack': {
      const attacker = findCard(command.params.instanceId, run)
      if (!attacker || attacker.attack === undefined) return null // Cannot attack
      return { atomic: command, remaining: null }
    }
    // --- Amount-based: resolve one card at a time ---

    case 'draw-cards': {
      if (command.params.amount < 1 || run.cards.drawPile.length === 0) return null
      const remaining: Command | null =
        command.params.amount > 1
          ? { type: 'draw-cards', params: { amount: command.params.amount - 1 } }
          : null
      // Atomic draw-cards with amount 1 is handled directly by applyCommand
      return {
        atomic: { type: 'draw-cards', params: { amount: 1 } },
        remaining,
      }
    }

    // --- Multi-card counters: decompose one card ID at a time ---

    case 'add-cards': {
      const cardIds = toArray(command.params.cards)
      if (cardIds.length === 0) return null
      const firstId = cardIds[0]
      const { location, mode } = command.params

      const atomic: Command = {
        type: 'add-cards',
        params: { location, cards: { [firstId]: 1 }, mode },
      }

      // Build remaining counter without the first card
      const remainingIds = cardIds.slice(1)
      if (remainingIds.length === 0) return { atomic, remaining: null }

      const remainingCards: Record<string, number> = {}
      for (const id of remainingIds) {
        remainingCards[id] = (remainingCards[id] ?? 0) + 1
      }
      return {
        atomic,
        remaining: { type: 'add-cards', params: { location, cards: remainingCards, mode } },
      }
    }

    case 'collect-card': {
      const cardIds = toArray(command.params.cards)
      if (cardIds.length === 0) return null
      const firstId = cardIds[0]

      const atomic: Command = {
        type: 'collect-card',
        params: { cards: { [firstId]: 1 } },
      }

      const remainingIds = cardIds.slice(1)
      if (remainingIds.length === 0) return { atomic, remaining: null }

      const remainingCards: Record<string, number> = {}
      for (const id of remainingIds) {
        remainingCards[id] = (remainingCards[id] ?? 0) + 1
      }
      return {
        atomic,
        remaining: { type: 'collect-card', params: { cards: remainingCards } },
      }
    }

    case 'destroy-card': {
      const cardIds = toArray(command.params.cards)
      if (cardIds.length === 0) return null
      const firstId = cardIds[0]

      const atomic: Command = {
        type: 'destroy-card',
        params: { cards: { [firstId]: 1 } },
      }

      const remainingIds = cardIds.slice(1)
      if (remainingIds.length === 0) return { atomic, remaining: null }

      const remainingCards: Record<string, number> = {}
      for (const id of remainingIds) {
        remainingCards[id] = (remainingCards[id] ?? 0) + 1
      }
      return {
        atomic,
        remaining: { type: 'destroy-card', params: { cards: remainingCards } },
      }
    }

    // --- Instance ID lists: decompose one at a time ---

    case 'discard-cards': {
      if ('instanceIds' in command.params) {
        const ids = command.params.instanceIds
        if (ids.length === 0) return null
        const remaining: Command | null =
          ids.length > 1 ? { type: 'discard-cards', params: { instanceIds: ids.slice(1) } } : null
        return {
          atomic: { type: 'discard-cards', params: { instanceIds: [ids[0]] } },
          remaining,
        }
      }

      // Amount or matching variant: resolve against current state
      const { from } = command.params
      const pile = run.cards[from]

      if ('matching' in command.params) {
        // Resolve all matching instanceIds upfront
        const { matching } = command.params
        const matchingIds = pile.filter((c) => matchesCard(c, matching)).map((c) => c.instanceId)
        // Convert to instanceIds variant for serial processing
        const asInstanceIds: Command = {
          type: 'discard-cards',
          params: { instanceIds: matchingIds },
        }
        return decomposeCommand(asInstanceIds, run)
      }

      // Amount variant
      const count = command.params.amount === 'all' ? pile.length : command.params.amount
      const instanceIds = pile.slice(0, count).map((c) => c.instanceId)
      const asInstanceIds: Command = {
        type: 'discard-cards',
        params: { instanceIds },
      }
      return decomposeCommand(asInstanceIds, run)
    }

    case 'move-card': {
      const { to, position } = command.params

      if ('instanceIds' in command.params) {
        const ids = command.params.instanceIds
        if (ids.length === 0) return null
        const remaining: Command | null =
          ids.length > 1
            ? { type: 'move-card', params: { instanceIds: ids.slice(1), to, position } }
            : null
        return {
          atomic: { type: 'move-card', params: { instanceIds: [ids[0]], to, position } },
          remaining,
        }
      }

      // Amount or matching variant: resolve against current state
      const { from } = command.params
      const pile = run.cards[from]

      if ('matching' in command.params) {
        const { matching } = command.params
        const matchingIds = pile.filter((c) => matchesCard(c, matching)).map((c) => c.instanceId)
        const asInstanceIds: Command = {
          type: 'move-card',
          params: { instanceIds: matchingIds, to, position },
        }
        return decomposeCommand(asInstanceIds, run)
      }

      const count = command.params.amount === 'all' ? pile.length : command.params.amount
      const instanceIds = pile.slice(0, count).map((c) => c.instanceId)
      const asInstanceIds: Command = {
        type: 'move-card',
        params: { instanceIds, to, position },
      }
      return decomposeCommand(asInstanceIds, run)
    }

    // --- Self-reference resolution ---

    case 'remove-card': {
      if ('matching' in command.params) {
        // Resolve matching to instanceIds, then remove each
        // For now, throw as this was already unimplemented
        throw new Error('Card matcher removal not yet implemented')
      }
      // Self-reference will be resolved by resolveSymbolicReferences in drainStack
      // Already atomic
      return { atomic: command, remaining: null }
    }

    // --- Already atomic commands (pass through) ---

    case 'update-resource':
    case 'play-card':
    case 'retrigger-card':
    case 'damage':
    case 'turn-start':
    case 'turn-end':
    case 'round-start':
    case 'round-end':
    case 'run-start':
    case 'run-end':
    case 'refresh-deck':
      return { atomic: command, remaining: null }

    // card-choice is handled in drainStack before decomposition
    case 'card-choice':
      throw new Error('card-choice should be handled in drainStack, not decomposeCommand')
  }
}

/**
 * Stores a card-choice as inspectable data on the game state,
 * pausing the command stack until the user makes a selection.
 */
function openCardChoice(
  gameState: GameState,
  command: CardChoiceCommand,
  context: CommandContext,
  remainingStack: CommandStackItem[],
): GameState {
  const { options, tags } = command.params
  const choices = getCardChoices(options, tags)

  const pendingChoice: PendingChoice = {
    cardOptions: choices,
    tags,
    choiceCommand: command,
    context,
    remainingStack,
  }

  return {
    ...gameState,
    viewData: {
      ...gameState.viewData,
      modalView: 'card-choice',
      cardOptions: choices,
      pendingChoice,
    },
  }
}

/**
 * Resolves symbolic card references in command params to actual instanceIds.
 *
 * - `'self'`: the card that owns the triggered ability (only valid when the
 *   source is a playable card — rules cards have no instance).
 * - `'target'`: the card the triggering event is about (only valid when the
 *   event is a card event).
 *
 * Symbols that can't be resolved in the current context pass through unchanged
 * and will throw at apply time, surfacing authoring errors.
 */
function resolveSymbolicReferences(command: Command, context: CommandContext): Command {
  if (context.kind !== 'ability') return command

  const refs: Record<string, string> = {}
  if (context.sourceCard.type === 'playable') {
    refs.self = context.sourceCard.instanceId
  }
  // For card-attack events, event.instanceId is the attacker, so 'target'
  // resolves to the attacker (e.g. retaliation abilities on the attacked card).
  if (isCardEvent(context.event)) {
    refs.target = context.event.instanceId
  }
  if (Object.keys(refs).length === 0) return command

  const params = command.params as Record<string, unknown>
  const updates: Record<string, unknown> = {}

  for (const key of ['instanceId', 'targetInstanceId']) {
    const value = params[key]
    if (typeof value === 'string' && refs[value] !== undefined) {
      updates[key] = refs[value]
    }
  }
  if (Array.isArray(params.instanceIds)) {
    const ids = params.instanceIds as string[]
    if (ids.some((id) => id in refs)) {
      updates.instanceIds = ids.map((id) => refs[id] ?? id)
    }
  }

  if (Object.keys(updates).length === 0) return command
  return { ...command, params: { ...command.params, ...updates } } as Command
}

/**
 * The commands an ability produces for an event, evaluating the function form
 * against the trigger context.
 */
function abilityCommands(
  ability: ReactiveAbility,
  sourceCard: CardInstance | RulesCard,
  event: Event,
  run: Run,
): Command[] {
  if (typeof ability.commands !== 'function') return ability.commands
  const targetCard = isCardEvent(event) ? findCard(event.instanceId, run) : undefined
  return ability.commands({ event, sourceCard, targetCard, run })
}

type AbilityMatch = { card: CardInstance | RulesCard; ability: ReactiveAbility }

/**
 * Find all reactive abilities that match an event, in execution order: rules
 * abilities ordered `before-cards`, then card abilities, then rules abilities
 * ordered `after-cards`. Card abilities are ordered by location — board, hand,
 * discardPile, drawPile — and by position within each. Rules abilities keep
 * their declared order within a group.
 */
export function findMatchingAbilities(run: Run, event: Event): AbilityMatch[] {
  const beforeCards: AbilityMatch[] = []
  const cardMatches: AbilityMatch[] = []
  const afterCards: AbilityMatch[] = []

  const rulesCard = run.deck.rulesCard!
  for (const ability of rulesCard.abilities) {
    if (ability.type !== 'reactive') continue
    if (matchesTrigger(event, rulesCard, 'board', ability.trigger, run)) {
      const list = ability.order === 'after-cards' ? afterCards : beforeCards
      list.push({ card: rulesCard, ability })
    }
  }

  for (const location of locations) {
    for (const card of run.cards[location]) {
      for (const ability of card.abilities) {
        if (ability.type !== 'reactive') continue
        if (matchesTrigger(event, card, location, ability.trigger, run)) {
          cardMatches.push({ card: card, ability })
        }
      }
    }
  }

  return [...beforeCards, ...cardMatches, ...afterCards]
}

/**
 * Find the first interrupt ability matching an atomic command, in the same
 * order as findMatchingAbilities: rules card first, then cards by location.
 * Abilities whose key is in `applied` already fired on this substitution
 * chain and are skipped.
 */
function findMatchingInterrupt(
  run: Run,
  command: Command,
  commandContext: CommandContext,
  applied: string[],
): { card: CardInstance | RulesCard; ability: InterruptAbility } | null {
  const rulesCard = run.deck.rulesCard!
  for (const ability of rulesCard.abilities) {
    if (ability.type !== 'interrupt' || applied.includes(interruptKey(rulesCard, ability))) continue
    if (matchesCommandTrigger(command, rulesCard, 'board', ability.trigger, commandContext, run))
      return { card: rulesCard, ability }
  }

  for (const location of locations) {
    for (const card of run.cards[location]) {
      for (const ability of card.abilities) {
        if (ability.type !== 'interrupt' || applied.includes(interruptKey(card, ability))) continue
        if (matchesCommandTrigger(command, card, location, ability.trigger, commandContext, run)) {
          return { card, ability }
        }
      }
    }
  }

  return null
}

/**
 * Identity key for an interrupt ability on a specific card, used for
 * once-per-chain tracking. Ability objects can be shared across instances of
 * the same card definition, so the key includes the owning instance.
 */
function interruptKey(card: CardInstance | RulesCard, ability: InterruptAbility): string {
  const cardKey = card.type === 'playable' ? card.instanceId : card.id
  return `${cardKey}#${card.abilities.indexOf(ability)}`
}

/**
 * Check if a command trigger on a card should intercept an atomic command.
 */
function matchesCommandTrigger(
  command: Command,
  sourceCard: CardInstance | RulesCard,
  cardLocation: Location,
  trigger: CommandTrigger,
  commandContext: CommandContext,
  run: Run,
): boolean {
  // 1. Command type must match
  if (command.type !== trigger.on) return false

  // 2. If specified, must be in the right location
  if (trigger.locations && !trigger.locations.includes(cardLocation)) return false

  const targetInstanceId = commandTargetInstanceId(command)

  // 3. Target matching, against the card the command is about to act on
  if (trigger.target && sourceCard.type === 'playable') {
    if (!matchesCommandTarget(targetInstanceId, sourceCard, trigger.target, run)) return false
  }

  // 4. Custom condition check
  if (trigger.when) {
    const targetCard = targetInstanceId ? findCard(targetInstanceId, run) : undefined
    const context: InterruptContext = { command, commandContext, sourceCard, targetCard, run }
    if (!trigger.when(context)) return false
  }

  return true
}

/**
 * Check if the target specification matches the card a command acts on.
 */
function matchesCommandTarget(
  targetInstanceId: string | undefined,
  sourceCard: CardInstance,
  target: TargetSpec,
  run: Run,
): boolean {
  switch (target) {
    case 'self':
      return targetInstanceId === sourceCard.instanceId
    case 'other':
      return targetInstanceId !== undefined && targetInstanceId !== sourceCard.instanceId
    case 'any':
      return true
  }

  // Only other option is CardMatcher
  if (!targetInstanceId) return false
  const targetCard = findCard(targetInstanceId, run)
  if (!targetCard) return false
  return matchesCard(targetCard, target)
}

/**
 * The instanceId of the card an atomic command acts on, if it targets one.
 * Assumes symbolic references were already resolved and compound variants
 * decomposed to a single instance.
 */
function commandTargetInstanceId(command: Command): string | undefined {
  const params = command.params as Record<string, unknown>
  // An attack acts on its target, not the attacker
  if (command.type === 'attack') {
    return typeof params.targetInstanceId === 'string' ? params.targetInstanceId : undefined
  }
  if (Array.isArray(params.instanceIds) && typeof params.instanceIds[0] === 'string') {
    return params.instanceIds[0]
  }
  if (typeof params.instanceId === 'string') return params.instanceId
  return undefined
}

/**
 * Check if a trigger on a card should resolve for an event.
 */
export function matchesTrigger(
  event: Event,
  sourceCard: CardInstance | RulesCard,
  cardLocation: Location,
  trigger: EventTrigger,
  run: Run,
): boolean {
  // 1. Event type must match
  if (event.type !== trigger.on) return false

  // 2. If specified, must be in the right location
  if (trigger.locations && !trigger.locations.includes(cardLocation)) return false

  // 3. For card-activate events, check costs and limits
  if (
    event.type === 'card-activate' &&
    trigger.on === 'card-activate' &&
    sourceCard.type === 'playable'
  ) {
    if (!canActivate(trigger, sourceCard, run)) return false
  }

  // 4. Target matching (for card-related events)
  if (isCardEvent(event) && trigger.target && sourceCard.type === 'playable') {
    if (!matchesTarget(event, sourceCard, trigger.target, run)) {
      return false
    }
  }

  // 5. Custom condition check
  if (trigger.when) {
    const targetCard = isCardEvent(event) ? findCard(event.instanceId, run) : undefined
    const context: TriggerContext = {
      event,
      sourceCard,
      targetCard,
      run,
    }
    if (!trigger.when(context)) return false
  }

  return true
}

/**
 * Check if the target specification matches the event's card.
 */
function matchesTarget(
  event: CardEvent,
  sourceCard: CardInstance,
  target: TargetSpec,
  run: Run,
): boolean {
  switch (target) {
    case 'self':
      return event.instanceId === sourceCard.instanceId
    case 'other':
      return event.instanceId !== sourceCard.instanceId
    case 'any':
      return true
  }

  // Only other option is CardMatcher
  const targetCard = findCard(event.instanceId, run)
  if (!targetCard) return false
  return matchesCard(targetCard, target)
}

/**
 * Check if an activated ability can be used (costs and limits).
 */
export function canActivate(trigger: EventTrigger, sourceCard: CardInstance, run: Run): boolean {
  // Check resource costs
  if (trigger.costs) {
    for (const [resource, cost] of Object.entries(trigger.costs)) {
      const currentAmount = run.resources[resource as keyof typeof run.resources] || 0
      if (currentAmount < cost) {
        return false
      }
    }
  }

  // Check usage limits
  if (trigger.limit) {
    const usageCount = getActivationCount(sourceCard, run)

    if (trigger.limit.perTurn !== undefined && usageCount.turn >= trigger.limit.perTurn) {
      return false
    }
    if (trigger.limit.perRound !== undefined && usageCount.round >= trigger.limit.perRound) {
      return false
    }
    if (trigger.limit.perRun !== undefined && usageCount.run >= trigger.limit.perRun) {
      return false
    }
  }

  return true
}

/**
 * Get activation count for a card this turn/round/run.
 */
function getActivationCount(
  sourceCard: CardInstance,
  run: Run,
): { turn: number; round: number; run: number } {
  const activations = run.events.filter(
    (e) =>
      e.type === 'card-activate' &&
      'instanceId' in e &&
      (e as CardActivateEvent).instanceId === sourceCard.instanceId,
  ) as CardActivateEvent[]

  const currentTurn = run.stats.turns
  const currentRound = run.stats.rounds

  return {
    turn: activations.filter((e) => e.turn === currentTurn).length,
    round: activations.filter((e) => e.round === currentRound).length,
    run: activations.length,
  }
}

/**
 * Searches all locations for a card by instance ID, returning the card and where it was found.
 */
export function locateCard(
  instanceId: string,
  run: Run,
): { location: Location; index: number; card: CardInstance } | undefined {
  for (const [location, cards] of entries(run.cards)) {
    const index = cards.findIndex((c) => c.instanceId === instanceId)
    if (index !== -1) {
      return { location, index, card: cards[index] as CardInstance }
    }
  }
  return undefined
}

/**
 * Searches all locations for a card by instance ID, returning the card.
 */
function findCard(instanceId: string, run: Run): CardInstance | undefined {
  for (const cards of values(run.cards)) {
    const card = cards.find((c) => c.instanceId === instanceId)
    if (card) return card as CardInstance
  }
  return undefined
}
