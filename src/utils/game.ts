import type { Collection } from './collection.ts'
import type { Run } from './run.ts'
import type { CardID } from './cards.ts'
import { getCardChoices } from './cards.ts'
import { handleEffect, type Effect } from './effects.ts'

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
    resolver: ((gameState: GameState, chosenCard: CardID) => GameState) | null
  }
}

/**
 * Pure function that opens a card choice modal by setting the viewData.
 * Returns a new game state with the modal opened and card options populated.
 *
 * @param gameState - The current game state
 * @param options - Number of card options to present
 * @param tags - Tags to filter card choices
 * @param resolver - Pure function to process gamestate update when a card is chosen
 * @returns A new game state with the modal opened
 */
export function openCardChoiceModal(
  gameState: GameState,
  options: number,
  tags: string[],
  resolver: (game: GameState, chosenCard: CardID) => GameState
): GameState {
  const choices = getCardChoices(options, tags)
  return {
    ...gameState,
    viewData: {
      modalView: 'card-choice',
      cardOptions: choices,
      resolver: resolver,
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
export function resolveCard(gameState: GameState, cardIndex: number, effects?: Effect[]): GameState {
  const run = gameState.game.run as Run
  const card = run.cards.hand[cardIndex]
  const cardEffects = effects ?? card.effects

  // Loop through and apply each effect to the game state
  let updatedRun = run
  for (const effect of cardEffects) {

    // In the choice case, just update the modal state and return early
    if (effect.type === 'card-choice') {
      const remainingEffects = cardEffects.slice(cardEffects.indexOf(effect) + 1)
      const { options, tags, then } = effect.params

      const resolver = (gameState: GameState, chosenCard: CardID) => {
        const newEffect = then(chosenCard)
        return resolveCard(gameState, cardIndex, [newEffect, ...remainingEffects])
      }

      return openCardChoiceModal(gameState, options, tags, resolver)

    }
    updatedRun = handleEffect(updatedRun, effect)
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
