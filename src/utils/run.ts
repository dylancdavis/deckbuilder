/**
 * Game run utility functions
 */

import { moveItem, moveItems } from './utils.ts'
import { toArray } from './counter.ts'
import { playableCards, type CardInstance } from './cards.ts'
import type { GameState } from './game.ts'
import type { Deck } from './deck.ts'
import type { Resource } from './resource.ts'
import type { Event, RunStartEvent } from './event.ts'
import { handleEvent } from './ability-processor.ts'

export type Location = 'drawPile' | 'hand' | 'board' | 'discardPile'

export type RunCards = Record<Location, CardInstance[]>

export type Run = {
  deck: Deck
  cards: RunCards
  resources: Record<Resource, number>
  stats: { turns: number; rounds: number }
  events: Event[]
}

export const locations: Location[] = ['board', 'hand', 'discardPile', 'drawPile']

/**
 * Move a card by its index in a location to another location.
 * If `toIndex` is not specified, it is added to the end of the array (the top of a pile).
 */
export function moveCardByIndex(
  run: Run,
  fromLocation: Location,
  toLocation: Location,
  fromIndex: number,
  toIndex?: number,
) {
  const runCards = run.cards
  const [newFrom, newTo] = moveItem(
    runCards[fromLocation],
    runCards[toLocation],
    fromIndex,
    toIndex,
  )

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
  const ids = toArray(run.deck.cards)
  const cardsToAdd = ids.map((id) => ({
    ...playableCards[id],
    instanceId: crypto.randomUUID(),
  }))

  return {
    ...run,
    cards: {
      ...run.cards,
      drawPile: cardsToAdd,
    },
  }
}

/**
 * Creates a new run from a deck with populated draw pile.
 */
export function makeRun(deck: Deck): Run {
  const baseRun: Run = {
    deck: deck,
    cards: { drawPile: [], hand: [], board: [], discardPile: [] },
    resources: { points: 0 },
    stats: { turns: 0, rounds: 0 },
    events: [],
  }

  return populateDrawPile(baseRun)
}

/**
 * Initializes a new run from the selected deck in gameState.
 * Emits a run-start event which triggers the ability chain:
 * run-start → round-start → turn-start → draw cards.
 */
export function initializeRun(gameState: GameState): GameState {
  const selectedDeckKey = gameState.ui.collection.selectedDeck
  if (!selectedDeckKey) {
    throw new Error('Cannot initialize run: no deck selected')
  }

  const deck = gameState.game.collection.decks[selectedDeckKey]
  if (!deck) {
    throw new Error(`Cannot initialize run: deck ${selectedDeckKey} not found`)
  }

  const run = makeRun(deck)
  const stateWithRun: GameState = {
    ...gameState,
    game: { ...gameState.game, run },
  }

  const runStartEvent: RunStartEvent = {
    type: 'run-start',
    round: run.stats.rounds,
    turn: run.stats.turns,
  }
  return handleEvent(stateWithRun, runStartEvent)
}
