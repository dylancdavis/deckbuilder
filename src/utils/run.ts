/**
 * Game run utility functions
 */

import type { Run } from '@/stores/game.ts'
import { moveItems } from './utils.ts'

export type Location = 'drawPile' | 'hand' | 'board' | 'discardPile'

/**
 * Move amount cards from fromLocation to toLocation.
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
export function populateDrawPile(run: Run) {
  const cards = run.deck.cards
  const cardArray = []

  // Convert counter to array
  for (const [cardKey, count] of Object.entries(cards)) {
    for (let i = 0; i < count; i++) {
      cardArray.push(cardKey)
    }
  }

  return {
    ...run,
    cards: {
      ...run.cards,
      // TODO: Use a proper shuffle function
      drawPile: cardArray.sort(() => Math.random() - 0.5),
    },
  }
}

/**
 * Process the game-start effects of the rules card, if any.
 */
export function processStartOfGame(run: Run) {
  const gameStartEffects = run.deck.rulesCard?.effects?.gameStart

  if (!gameStartEffects) {
    return run
  }

  let updatedRun = run

  for (const effect of gameStartEffects) {
    const [effectType, ...effectArgs] = effect

    if (effectType === 'add-cards') {
      const [addLocation, cardsToAdd] = effectArgs
      const cards = []

      // Convert counter to array
      for (const [cardKey, count] of Object.entries(cardsToAdd)) {
        for (let i = 0; i < count; i++) {
          cards.push(cardKey)
        }
      }

      const shuffledCards = [...cards].sort(() => Math.random() - 0.5)

      updatedRun = {
        ...updatedRun,
        cards: {
          ...updatedRun.cards,
          [addLocation]: [...updatedRun.cards[addLocation], ...shuffledCards],
        },
      }
    }
  }

  return updatedRun
}

/**
 * Move cards from the draw pile to the hand according to the rules card.
 */
export function drawFirstHand(run: Run) {
  const drawAmount = run.deck.rulesCard?.turnStructure?.drawAmount || 0
  return moveCards(run, 'drawPile', 'hand', drawAmount)
}
