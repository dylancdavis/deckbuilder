/**
 * Effect processing pipeline.
 *
 * The pipeline follows a decompose → apply → cascade loop:
 * 1. DECOMPOSE: Break compound effects into atomic, single-card effects (just-in-time)
 * 2. APPLY: Execute atomic effect → state change + 0 or 1 event
 * 3. CASCADE: Event → find matching abilities → their effects enter step 1
 *
 * Card-choice effects pause the pipeline by storing pending work as inspectable
 * data on the game state. The UI calls resolveChoice to resume.
 */

import type { Ability, Trigger, TriggerContext } from './ability'
import { type CardInstance, type RulesCard, getCardChoices } from './cards'
import type { Event, CardEvent, CardActivateEvent } from './event'
import { isCardEvent } from './event'
import { type Run, type Location, locations } from './run'
import type { GameState, PendingChoice } from './game'
import { matchesCard, type TargetSpec } from './card-matchers'
import { applyEffect, type Effect, type CardChoiceEffect } from './effects'
import { logEvent } from './game'
import { values, entries } from './utils'
import { toArray } from './counter'
import type { CardID } from './cards'

/**
 * Context passed to effect processing.
 *
 * - `player`: a top-level action the player initiated (run-start, turn-end, play-card).
 *   No source card; 'self' references are illegal and will throw at apply time.
 * - `ability`: an effect cascaded from an ability that matched an event. `sourceCard`
 *   identifies the card whose ability produced the effect; `event` is the trigger.
 */
export type EffectContext =
  | { kind: 'player' }
  | { kind: 'ability'; sourceCard: CardInstance | RulesCard; event: Event }

/**
 * Represents a single effect waiting to be processed in the queue.
 * Each effect from an ability becomes its own queue item.
 */
export type EffectQueueItem = {
  context: EffectContext
  effect: Effect
}

/**
 * Single entry point for all game actions. Takes a high-level effect,
 * decomposes it, applies atomic effects, and cascades triggered abilities.
 *
 * Player-driven actions (run-start, turn-end, play-card) should pass
 * `{ kind: 'player' }`. Internal callers resuming a cascade pass an
 * ability context.
 */
export function handleEffect(
  gameState: GameState,
  effect: Effect,
  context: EffectContext,
): GameState {
  if (!gameState.game.run) throw new Error('Cannot handle effect with no run')

  return drainQueue(gameState, [{ context, effect }])
}

/**
 * Called by the UI when the user makes a card choice.
 * Reads the pending choice from state, generates effects from the choice handler,
 * and resumes queue processing.
 *
 * @param gameState - The current game state (must have a pending choice)
 * @param chosenCard - The card the user selected
 * @returns Updated game state after choice effects and remaining queue resolve
 */
export function resolveChoice(gameState: GameState, chosenCard: CardID): GameState {
  const pending = gameState.viewData.pendingChoice
  if (!pending) throw new Error('No pending choice to resolve')

  const choiceEffects = pending.choiceEffect.params.choiceHandler(chosenCard)
  const choiceItems: EffectQueueItem[] = choiceEffects.map((effect) => ({
    context: pending.context,
    effect,
  }))

  // Clear the pending choice and resume processing
  const clearedState: GameState = {
    ...gameState,
    viewData: {
      modalView: null,
      cardOptions: [],
      pendingChoice: null,
      pendingAttack: null,
    },
  }

  return drainQueue(clearedState, [...choiceItems, ...pending.remainingQueue])
}

/**
 * Core processing loop. Treats `queue` as a depth-first work stack: shift the
 * next item off the front, decompose/apply/cascade it, and unshift any new work
 * (triggered abilities, decomposition remainder) back onto the front so it
 * resolves before the rest. Pauses on card-choice effects.
 *
 * `queue` is owned by the caller (built fresh in handleEffect/resolveChoice),
 * so mutating it in place is safe.
 */
function drainQueue(gameState: GameState, queue: EffectQueueItem[]): GameState {
  let currentState = gameState

  while (queue.length > 0) {
    const { context, effect } = queue.shift()!

    // Card-choice: pause processing. After the shift, `queue` is exactly the
    // remaining work, so it can be stored as-is.
    if (effect.type === 'card-choice') return openCardChoice(currentState, effect, context, queue)

    // Decompose compound effects into atomic ones
    const decomposed = decomposeEffect(effect, currentState.game.run!)
    if (!decomposed) continue // Nothing to do (pile empty, no matches, etc.)

    const { atomic, remaining } = decomposed

    // Resolve symbolic references ('self' → source card, 'target' → event's card).
    // Unresolved symbols pass through and throw at apply time.
    const resolvedEffect = resolveSymbolicReferences(atomic, context)

    // Apply the atomic effect
    const { game, event } = applyEffect(currentState, resolvedEffect)
    currentState = game

    // Cascade: if the effect produced an event, find triggered abilities
    const triggeredItems: EffectQueueItem[] = []
    if (event) {
      currentState = logEvent(currentState, event)
      const abilities = findMatchingAbilities(currentState.game.run!, event)
      const cascaded = abilities.flatMap((match) =>
        match.ability.effects.map((e) => ({
          context: { kind: 'ability' as const, sourceCard: match.card, event },
          effect: e,
        })),
      )
      triggeredItems.push(...cascaded)
    }

    // Push new work onto the front, triggered effects first, then this effect's
    // decomposition remainder — a single unshift so the array reads in final
    // front-to-back order (depth-first).
    const next = remaining ? [...triggeredItems, { context, effect: remaining }] : triggeredItems
    if (next.length > 0) queue.unshift(...next)
  }

  return currentState
}

/**
 * Decomposes a compound effect into an atomic effect to execute now,
 * plus the remaining compound effect (if any).
 *
 * Returns null if there's nothing to do (pile empty, no matches, etc.).
 */
function decomposeEffect(effect: Effect, run: Run): { atomic: Effect; remaining: Effect | null } {
  switch (effect.type) {
    // --- Amount-based: resolve one card at a time ---

    case 'draw-cards': {
      const remaining: Effect | null =
        effect.params.amount > 1
          ? { type: 'draw-cards', params: { amount: effect.params.amount - 1 } }
          : null
      // Atomic draw-cards with amount 1 is handled directly by applyEffect
      return {
        atomic: { type: 'draw-cards', params: { amount: 1 } },
        remaining,
      }
    }

    // --- Multi-card counters: decompose one card ID at a time ---

    case 'add-cards': {
      const cardIds = toArray(effect.params.cards)
      const firstId = cardIds[0]
      const { location, mode } = effect.params

      const atomic: Effect = {
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
      const cardIds = toArray(effect.params.cards)
      const firstId = cardIds[0]

      const atomic: Effect = {
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
      const cardIds = toArray(effect.params.cards)
      const firstId = cardIds[0]

      const atomic: Effect = {
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
      if ('instanceIds' in effect.params) {
        const ids = effect.params.instanceIds
        const remaining: Effect | null =
          ids.length > 1 ? { type: 'discard-cards', params: { instanceIds: ids.slice(1) } } : null
        return {
          atomic: { type: 'discard-cards', params: { instanceIds: [ids[0]] } },
          remaining,
        }
      }

      // Amount or matching variant: resolve against current state
      const { from } = effect.params
      const pile = run.cards[from]

      if ('matching' in effect.params) {
        // Resolve all matching instanceIds upfront
        const { matching } = effect.params
        const matchingIds = pile.filter((c) => matchesCard(c, matching)).map((c) => c.instanceId)
        // Convert to instanceIds variant for serial processing
        const asInstanceIds: Effect = {
          type: 'discard-cards',
          params: { instanceIds: matchingIds },
        }
        return decomposeEffect(asInstanceIds, run)
      }

      // Amount variant
      const count = effect.params.amount === 'all' ? pile.length : effect.params.amount
      const instanceIds = pile.slice(0, count).map((c) => c.instanceId)
      const asInstanceIds: Effect = {
        type: 'discard-cards',
        params: { instanceIds },
      }
      return decomposeEffect(asInstanceIds, run)
    }

    case 'move-card': {
      const { to, position } = effect.params

      if ('instanceIds' in effect.params) {
        const ids = effect.params.instanceIds
        const remaining: Effect | null =
          ids.length > 1
            ? { type: 'move-card', params: { instanceIds: ids.slice(1), to, position } }
            : null
        return {
          atomic: { type: 'move-card', params: { instanceIds: [ids[0]], to, position } },
          remaining,
        }
      }

      // Amount or matching variant: resolve against current state
      const { from } = effect.params
      const pile = run.cards[from]

      if ('matching' in effect.params) {
        const { matching } = effect.params
        const matchingIds = pile.filter((c) => matchesCard(c, matching)).map((c) => c.instanceId)
        const asInstanceIds: Effect = {
          type: 'move-card',
          params: { instanceIds: matchingIds, to, position },
        }
        return decomposeEffect(asInstanceIds, run)
      }

      const count = effect.params.amount === 'all' ? pile.length : effect.params.amount
      const instanceIds = pile.slice(0, count).map((c) => c.instanceId)
      const asInstanceIds: Effect = {
        type: 'move-card',
        params: { instanceIds, to, position },
      }
      return decomposeEffect(asInstanceIds, run)
    }

    // --- Self-reference resolution ---

    case 'remove-card': {
      if ('matching' in effect.params) {
        // Resolve matching to instanceIds, then remove each
        // For now, throw as this was already unimplemented
        throw new Error('Card matcher removal not yet implemented')
      }
      // Self-reference will be resolved by transformSelfReferences in drainQueue
      // Already atomic
      return { atomic: effect, remaining: null }
    }

    // --- Already atomic effects (pass through) ---

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
      return { atomic: effect, remaining: null }

    // card-choice is handled in drainQueue before decomposition
    case 'card-choice':
      throw new Error('card-choice should be handled in drainQueue, not decomposeEffect')
  }
}

/**
 * Stores a card-choice as inspectable data on the game state,
 * pausing the effect queue until the user makes a selection.
 */
function openCardChoice(
  gameState: GameState,
  effect: CardChoiceEffect,
  context: EffectContext,
  remainingQueue: EffectQueueItem[],
): GameState {
  const { options, tags } = effect.params
  const choices = getCardChoices(options, tags)

  const pendingChoice: PendingChoice = {
    cardOptions: choices,
    tags,
    choiceEffect: effect,
    context,
    remainingQueue,
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
 * Resolves symbolic card references in effect params to actual instanceIds.
 *
 * - `'self'`: the card that owns the triggered ability (only valid when the
 *   source is a playable card — rules cards have no instance).
 * - `'target'`: the card the triggering event is about (only valid when the
 *   event is a card event).
 *
 * Symbols that can't be resolved in the current context pass through unchanged
 * and will throw at apply time, surfacing authoring errors.
 */
function resolveSymbolicReferences(effect: Effect, context: EffectContext): Effect {
  if (context.kind !== 'ability') return effect

  const refs: Record<string, string> = {}
  if (context.sourceCard.type === 'playable') {
    refs.self = context.sourceCard.instanceId
  }
  if (isCardEvent(context.event)) {
    refs.target = context.event.instanceId
  }
  if (Object.keys(refs).length === 0) return effect

  if ('instanceId' in effect.params && typeof effect.params.instanceId === 'string') {
    const resolved = refs[effect.params.instanceId]
    if (resolved !== undefined) {
      return {
        ...effect,
        params: { ...effect.params, instanceId: resolved },
      } as Effect
    }
  }
  if ('instanceIds' in effect.params) {
    const ids = effect.params.instanceIds as string[]
    if (ids.some((id) => id in refs)) {
      return {
        ...effect,
        params: {
          ...effect.params,
          instanceIds: ids.map((id) => refs[id] ?? id),
        },
      } as Effect
    }
  }
  return effect
}

/**
 * Find all abilities that match an event, in execution order.
 * Abilities are processed in the order cards appear in their locations.
 * Locations are checked in order: board, hand, stack, discardPile, drawPile.
 */
export function findMatchingAbilities(
  run: Run,
  event: Event,
): Array<{ card: CardInstance | RulesCard; ability: Ability }> {
  const matches: Array<{ card: CardInstance | RulesCard; ability: Ability }> = []

  const rulesCard = run.deck.rulesCard!
  for (const ability of rulesCard.abilities) {
    if (matchesTrigger(event, rulesCard, 'board', ability.trigger, run))
      matches.push({ card: rulesCard, ability })
  }

  for (const location of locations) {
    for (const card of run.cards[location]) {
      for (const ability of card.abilities) {
        if (matchesTrigger(event, card, location, ability.trigger, run)) {
          matches.push({ card: card, ability })
        }
      }
    }
  }

  return matches
}

/**
 * Check if a trigger on a card should resolve for an event.
 */
export function matchesTrigger(
  event: Event,
  sourceCard: CardInstance | RulesCard,
  cardLocation: Location,
  trigger: Trigger,
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
