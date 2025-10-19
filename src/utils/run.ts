/**
 * Game run utility functions
 */

import { moveItems } from './utils.ts'
import { toArray } from './counter.ts'
import { playableCards, type PlayableCard, type PlayableCardID } from './cards.ts'
import { handleEffects } from './effects.ts'
import type { Deck } from './deck.ts'
import type { Resource } from './resource.ts'
import type { Event } from './event.ts'

export type Location = 'drawPile' | 'hand' | 'board' | 'discardPile'

export type RunCards = {
  drawPile: PlayableCard[]
  hand: PlayableCard[]
  board: PlayableCard[]
  discardPile: PlayableCard[]
}

export type Run = {
  deck: Deck
  cards: RunCards
  resources: Record<Resource, number>
  stats: { turns: number; rounds: number }
  events: Event[]
}

/**
 * Move amount cards from fromLocation to toLocation.
 * Cards are taken from the front, and added to the back of arrays.
 */
export function moveCards(run: Run, fromLocation: Location, toLocation: Location, amount: number) {
  const runCards = run.cards
  const [newFrom, newTo] = moveItems(runCards[fromLocation], runCards[toLocation], amount)

  return {
    ...run,
    cards: {
      ...runCards,
      [fromLocation]: newFrom,
      [toLocation]: newTo,
    },
  }
}

/**
 * Populates a run's draw pile with cards from the deck's counter.
 */
export function populateDrawPile(run: Run): Run {
  const idsToAdd: PlayableCardID[] = toArray(run.deck.cards)
  idsToAdd.sort(() => Math.random() - 0.5) // shuffle
  const cardsToAdd = idsToAdd.map((id) => ({
    ...playableCards[id],
    instanceId: crypto.randomUUID(),
  }))

  return {
    ...run,
    cards: {
      ...run.cards,
      // TODO: Use a proper shuffle function
      drawPile: cardsToAdd,
    },
  }
}

/**
 * Process the game-start effects of the rules card, if any.
 */
export function processStartOfGame(run: Run): Run {
  if (run.deck.rulesCard == null) {
    throw new Error('Tried to process a run without a rules card.')
  }

  const gameStartEffects = run.deck.rulesCard.effects.gameStart

  if (!gameStartEffects) return run

  return handleEffects(run, gameStartEffects)
}

/**
 * Move cards from the draw pile to the hand according to the rules card.
 */
export function drawFirstHand(run: Run) {
  const drawAmount = run.deck.rulesCard?.turnStructure?.drawAmount || 0
  return moveCards(run, 'drawPile', 'hand', drawAmount)
}

/**
 * Pure function that processes playing a card from hand at the given index.
 * Applies card effects, moves card to discard pile, and logs the event.
 *
 * Note: This does not handle choice effects or validation - those should be
 * handled by the caller (e.g., the store).
 *
 * @param run - The current run state
 * @param cardIndex - The index of the card in the hand to play
 * @returns A new run with the card played and effects applied
 */
export function resolveCard(run: Run, cardIndex: number): Run {
  const card = run.cards.hand[cardIndex]
  if (!card) {
    throw new Error(`Cannot play card: no card at index ${cardIndex}`)
  }

  // Process non-choice effects
  let updatedRun = run
  for (const effect of card.effects) {
    if (effect.type !== 'collect-basic') {
      updatedRun = handleEffects(updatedRun, [effect])
    }
  }

  // Remove card from hand and add to discard pile
  const newHand = [...updatedRun.cards.hand]
  const removedCard = newHand.splice(cardIndex, 1)[0]
  const newDiscardPile = [...updatedRun.cards.discardPile, removedCard]

  // Log the card play event
  const newEvents = [
    ...updatedRun.events,
    {
      type: 'card-play' as const,
      round: updatedRun.stats.rounds,
      turn: updatedRun.stats.turns,
      cardId: card.id,
    },
  ]

  return {
    ...updatedRun,
    cards: {
      ...updatedRun.cards,
      hand: newHand,
      discardPile: newDiscardPile,
    },
    events: newEvents,
  }
}
