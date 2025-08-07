/**
 * Game run utility functions
 */

import type { Run } from '@/stores/game.ts'
import { moveItems } from './utils.ts'
import { toArray } from './counter.ts'

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
  const cardArray = toArray(run.deck.cards)

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
export function processStartOfGame(run: Run): Run {
  const gameStartEffects = run.deck.rulesCard.effects.gameStart

  if (!gameStartEffects) return run

  let updatedRun = run

  // TODO: Apply effects with reduce
  for (const { type, params } of gameStartEffects) {
    switch (type) {
      case 'add-cards': {
        const { location, cards, mode } = params
        const shuffledCards = [toArray(cards)].sort(() => Math.random() - 0.5)

        updatedRun = {
          ...updatedRun,
          cards: {
            ...updatedRun.cards,
            [location]:
              mode === 'top'
                ? [...shuffledCards, ...updatedRun.cards[location]]
                : [...updatedRun.cards[location], ...shuffledCards],
          },
        }
        break
      }
      case 'gain-resource': {
        throw new Error('Not implemented: gain-resource effect')
      }
      default:
        throw new Error(`Unknown effect type: ${type}`)
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
