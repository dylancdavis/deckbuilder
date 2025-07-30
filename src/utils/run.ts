/**
 * Game run utility functions
 */

import { moveItems } from './utils.ts'

/**
 * Move amount cards from fromLocation to toLocation.
 */
export function moveCards(run, fromLocation, toLocation, amount) {
  const runCards = run.cards
  const [newFrom, newTo] = moveItems(runCards[fromLocation], runCards[toLocation], amount)

  return {
    ...run,
    cards: {
      ...runCards,
      [fromLocation]: newFrom,
      [toLocation]: newTo
    }
  }
}

/**
 * Populates a run's draw pile with cards from the deck's counter.
 */
export function populateDrawPile(run, shuffleFn = arr => [...arr].sort(() => Math.random() - 0.5)) {
  const cards = run.deckInfo.cards
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
      drawPile: shuffleFn(cardArray)
    }
  }
}

/**
 * Process the game-start effects of the rules card, if any.
 */
export function processStartOfGame(run, shuffleFn = arr => [...arr].sort(() => Math.random() - 0.5)) {
  const gameStartEffects = run.deckInfo.rulesCard?.effects?.gameStart

  if (!gameStartEffects) {
    return run
  }

  let updatedRun = run

  for (const effect of gameStartEffects) {
    const [effectType, ...effectArgs] = effect

    if (effectType === 'add-cards') {
      const [addLocation, cardsToAdd] = effectArgs
      const cardsArray = []

      // Convert counter to array
      for (const [cardKey, count] of Object.entries(cardsToAdd)) {
        for (let i = 0; i < count; i++) {
          cardsArray.push(cardKey)
        }
      }

      const shuffledCards = shuffleFn(cardsArray)

      updatedRun = {
        ...updatedRun,
        cards: {
          ...updatedRun.cards,
          [addLocation]: [...updatedRun.cards[addLocation], ...shuffledCards]
        }
      }
    }
  }

  return updatedRun
}

/**
 * Move cards from the draw pile to the hand according to the rules card.
 */
export function drawFirstHand(run) {
  const drawAmount = run.deckInfo.rulesCard?.turnStructure?.drawAmount || 0
  return moveCards(run, 'drawPile', 'hand', drawAmount)
}
