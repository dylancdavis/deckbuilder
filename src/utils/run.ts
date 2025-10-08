/**
 * Game run utility functions
 */

import type { Run } from '@/stores/game.ts'
import { moveItems } from './utils.ts'
import { toArray } from './counter.ts'
import { playableCards, type PlayableCardID } from './cards.ts'
import { handleEffects } from './effects.ts'

export type Location = 'drawPile' | 'hand' | 'board' | 'discardPile'

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
