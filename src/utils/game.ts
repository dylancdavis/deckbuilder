import type { Collection } from './collection.ts'
import type { Run } from './run.ts'
import type { CardID } from './cards.ts'
import { getCardChoices } from './cards.ts'
import { handleEffects } from './effects.ts'

export type GameState = {
  game: {
    collection: Collection
    run: Run | null
  }
  ui: {
    currentView: string[]
    collection: {
      selectedDeck: string | null
    }
  }
  viewData: {
    modalView: 'card-choice' | null
    cardOptions: CardID[]
  }
}

/**
 * Pure function that opens a card choice modal by setting the viewData.
 * Returns a new game state with the modal opened and card options populated.
 *
 * @param gameState - The current game state
 * @param options - Number of card options to present
 * @param tags - Tags to filter card choices
 * @returns A new game state with the modal opened
 */
export function openCardChoiceModal(
  gameState: GameState,
  options: number,
  tags: string[]
): GameState {
  const choices = getCardChoices(options, tags)
  return {
    ...gameState,
    viewData: {
      modalView: 'card-choice',
      cardOptions: choices,
    },
  }
}

/**
 * Pure function that processes playing a card from hand at the given index.
 * Applies card effects, moves card to discard pile, and logs the event.
 *
 * Note: This does not handle choice effects or validation - those should be
 * handled by the caller (e.g., the store).
 *
 * @param gameState - The current game state
 * @param cardIndex - The index of the card in the hand to play
 * @returns A new game state with the card played and effects applied
 */
export function resolveCard(gameState: GameState, cardIndex: number): GameState {
  const run = gameState.game.run as Run

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
    ...gameState,
    game: {
      ...gameState.game,
      run: {
        ...updatedRun,
        cards: {
          ...updatedRun.cards,
          hand: newHand,
          discardPile: newDiscardPile,
        },
        events: newEvents,
      },
    },
  }
}
