/**
 * Game run utility functions
 */

import { moveItem, moveItems } from './utils.ts'
import { toArray } from './counter.ts'
import { playableCards, type PlayableCard, type PlayableCardID } from './cards.ts'
import { handleEffects } from './effects.ts'
import type { GameState } from './game.ts'
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
  const [newFrom, newTo] = moveItem(runCards[fromLocation], runCards[toLocation], fromIndex, toIndex)

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
export function processStartOfGame(gameState: GameState): GameState {
  const run = gameState.game.run
  if (!run) {
    throw new Error('Cannot process start of game without an active run')
  }
  if (run.deck.rulesCard == null) {
    throw new Error('Tried to process a run without a rules card.')
  }

  const gameStartEffects = run.deck.rulesCard.effects.gameStart

  if (!gameStartEffects) return gameState

  return handleEffects(gameState, gameStartEffects)
}

/**
 * Move cards from the draw pile to the hand according to the rules card.
 */
export function drawFirstHand(run: Run) {
  const drawAmount = run.deck.rulesCard?.turnStructure?.drawAmount || 0
  return moveCards(run, 'drawPile', 'hand', drawAmount)
}
