/**
 * Ability processing system for the event-driven trigger architecture.
 *
 * The ability processor uses a queue-based approach with continuations to handle
 * interactive effects like card-choice. When an event fires, all matching abilities
 * are queued, then processed sequentially. If any effect requires user input,
 * the processor captures the remaining work as a "continuation" and returns early.
 */

import type { Ability, Trigger, TriggerContext } from './ability'
import type { PlayableCard } from './cards'
import type { Event, CardEvent, CardActivateEvent } from './event'
import { isCardEvent } from './event'
import type { Run, Location } from './run'
import type { GameState } from './game'
import { matchesCard, type TargetSpec } from './card-matchers'
import { handleEffect, type Effect } from './effects'
import { openCardChoiceModal } from './game'
import { values } from './utils'

/**
 * A card using the new ability format (Ability[] instead of legacy trigger map).
 */
export type NewPlayableCard = Omit<PlayableCard, 'abilities'> & {
  abilities: Ability[]
}

/**
 * A card instance is a NewPlayableCard with a guaranteed instanceId.
 */
export type CardInstance = NewPlayableCard & { instanceId: string }

/**
 * Represents an ability waiting to be processed in the queue.
 * Tracks which effect to start from (for resuming after card-choice).
 */
type AbilityQueueItem = {
  card: CardInstance
  ability: Ability
  effectIndex: number
}

/**
 * Context passed to handleEffect for resolving 'self' references
 * and providing source card information.
 */
type EffectContext = {
  sourceCard: CardInstance
}

/**
 * Core function to process abilities for a given event.
 * Finds all matching abilities and processes them via the queue system.
 *
 * @param gameState - The current game state
 * @param event - The event that occurred
 * @returns Updated game state after processing all matching abilities
 */
export function processAbilities(gameState: GameState, event: Event): GameState {
  const run = gameState.game.run
  if (!run) return gameState

  // Find all abilities that match this event
  const matches = findMatchingAbilities(event, run)

  // Build initial queue with all matched abilities
  const queue: AbilityQueueItem[] = matches.map((match) => ({
    card: match.card,
    ability: match.ability,
    effectIndex: 0,
  }))

  // Process the queue
  return processAbilityQueue(gameState, queue, event)
}

/**
 * Processes a queue of abilities, handling card-choice by capturing continuations.
 * This function can be called initially by processAbilities, or by a resolver
 * after a card-choice has been made.
 *
 * @param gameState - The current game state
 * @param queue - The queue of abilities to process
 * @param event - The event that triggered this processing
 * @returns Updated game state after processing the queue
 */
function processAbilityQueue(
  gameState: GameState,
  queue: AbilityQueueItem[],
  event: Event,
): GameState {
  let currentState = gameState

  for (let queueIndex = 0; queueIndex < queue.length; queueIndex++) {
    const item = queue[queueIndex]
    const effects = item.ability.effects

    for (let effectIndex = item.effectIndex; effectIndex < effects.length; effectIndex++) {
      const effect = effects[effectIndex]

      // Handle card-choice by capturing continuation and returning early
      if (effect.type === 'card-choice') {
        // Build continuation: rest of current ability + remaining abilities in queue
        const continuation: AbilityQueueItem[] = [
          { ...item, effectIndex: effectIndex + 1 },
          ...queue.slice(queueIndex + 1),
        ]

        const { options, tags, then } = effect.params

        // Resolver continues processing after user makes a choice
        const resolver = (gs: GameState, chosenCard: Parameters<typeof then>[0]) => {
          const chosenEffect = then(chosenCard)
          const context: EffectContext = { sourceCard: item.card }
          const stateAfterChoice = handleEffectWithContext(gs, chosenEffect, context)
          return processAbilityQueue(stateAfterChoice, continuation, event)
        }

        // Note: The card being played remains in 'stack' while the modal is open.
        // It stays in this limbo state until all abilities (including continuations
        // after card-choice) complete, then moves to board or discard.
        return openCardChoiceModal(currentState, options, tags, resolver)
      }

      // Process non-interactive effects immediately
      const context: EffectContext = { sourceCard: item.card }
      currentState = handleEffectWithContext(currentState, effect, context)
    }
  }

  return currentState
}

/**
 * Wrapper around handleEffect that resolves 'self' references to actual instanceIds.
 *
 * @param gameState - The current game state
 * @param effect - The effect to process
 * @param context - Context containing the source card
 * @returns Updated game state after processing the effect
 */
function handleEffectWithContext(
  gameState: GameState,
  effect: Effect,
  context: EffectContext,
): GameState {
  // Transform 'self' references to actual instanceId
  const resolvedEffect = resolveSelfReferences(effect, context.sourceCard.instanceId)
  return handleEffect(gameState, resolvedEffect)
}

/**
 * Resolves 'self' references in an effect to actual instanceId values.
 *
 * @param effect - The effect to transform
 * @param instanceId - The instanceId to use for 'self'
 * @returns The effect with 'self' replaced by the actual instanceId
 */
function resolveSelfReferences(effect: Effect, instanceId: string): Effect {
  if (effect.type === 'remove-card' && effect.params.instanceId === 'self') {
    return {
      ...effect,
      params: {
        instanceId: instanceId,
      },
    }
  }
  // Add more 'self' resolution cases as needed for other effect types
  return effect
}

/**
 * Find all abilities that match an event, in execution order.
 * Abilities are processed in the order cards appear in their locations.
 * Locations are checked in order: board, hand, stack, discardPile, drawPile.
 *
 * @param event - The event to match against
 * @param run - The current run state
 * @returns Array of matching card/ability pairs
 */
export function findMatchingAbilities(
  event: Event,
  run: Run,
): Array<{ card: CardInstance; ability: Ability }> {
  const matches: Array<{ card: CardInstance; ability: Ability }> = []

  // Check all locations in a deterministic order
  // Board first (most common for persistent effects), then hand, then others
  const locations: Location[] = ['board', 'hand', 'stack', 'discardPile', 'drawPile']

  for (const location of locations) {
    for (const card of run.cards[location]) {
      // Force casting for now
      const cardInstance = card as unknown as CardInstance
      for (const ability of cardInstance.abilities) {
        if (matchesTrigger(event, cardInstance, location, ability.trigger, run)) {
          matches.push({ card: cardInstance, ability })
        }
      }
    }
  }

  return matches
}

/**
 * Check if a trigger matches an event.
 *
 * @param event - The event to check
 * @param sourceCard - The card that has this trigger
 * @param trigger - The trigger to evaluate
 * @param run - The current run state
 * @returns true if the trigger matches the event
 */
export function matchesTrigger(
  event: Event,
  sourceCard: CardInstance,
  cardLocation: Location,
  trigger: Trigger,
  run: Run,
): boolean {
  // 1. Event type must match
  if (event.type !== trigger.on) return false

  // 2. If specified, must be in the right location
  if (trigger.locations && !trigger.locations.includes(cardLocation)) return false

  // 3. For card-activate events, check costs and limits
  if (event.type === 'card-activate' && trigger.on === 'card-activate') {
    if (!canActivate(trigger, sourceCard, run)) return false
  }

  // 4. Target matching (for card-related events)
  if (isCardEvent(event) && trigger.target) {
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
 *
 * @param event - The card event
 * @param sourceCard - The card with the ability
 * @param target - The target specification
 * @param run - The current run state
 * @returns true if the target matches
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
 *
 * @param trigger - The trigger to check
 * @param sourceCard - The card with the ability
 * @param run - The current run state
 * @returns true if the ability can be activated
 */
export function canActivate(trigger: Trigger, sourceCard: CardInstance, run: Run): boolean {
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
 *
 * @param sourceCard - The card to count activations for
 * @param run - The current run state
 * @returns Object with turn, round, and run counts
 */
function getActivationCount(
  sourceCard: CardInstance,
  run: Run,
): { turn: number; round: number; run: number } {
  // Count card-activate events for this card
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
 * Find a card by instance ID across all locations.
 *
 * @param instanceId - The instance ID to find
 * @param run - The current run state
 * @returns The card instance, or null if not found
 */
function findCard(instanceId: string, run: Run): CardInstance | undefined {
  for (const cards of values(run.cards)) {
    const card = cards.find((c) => c.instanceId === instanceId)
    if (card) return card as CardInstance
  }
  return undefined
}

/**
 * Determines if a card should go to the board (asset) or discard pile (action).
 * Derived from the card's abilities - if any ability has a board location
 * requirement, the card is an asset.
 *
 * @param card - The card to check
 * @returns true if the card has board-based abilities
 */
export function hasBoardAbilities(card: PlayableCard): boolean {
  if (!Array.isArray(card.abilities)) return false
  return (card.abilities as Ability[]).some((ability) =>
    ability.trigger.locations?.includes('board'),
  )
}
