import type { Collection } from './collection.ts'
import type { Run } from './run.ts'
import type { CardID } from './cards.ts'
import type { Event } from './event.ts'
import { getCardChoices } from './cards.ts'
import { handleEvent } from './ability-processor.ts'
import { handleEffect } from './effects.ts'

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
  resolver: (game: GameState, chosenCard: CardID) => GameState,
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
 * Pure function that draws n cards from the draw pile to hand.
 * Processes on-draw effects for each card as it's drawn.
 * If an ability opens a modal mid-draw, wraps the resolver to continue drawing afterward.
 *
 * @param gameState - The current game state
 * @param n - Number of cards to draw
 * @returns A new game state with cards moved from draw pile to hand and on-draw effects applied
 */
export function drawCards(gameState: GameState, n: number): GameState {
  // Trivial cases
  if (!gameState.game.run) throw new Error('Cannot draw cards: no active run')
  if (n <= 0 || gameState.game.run.cards.drawPile.length === 0) return gameState

  // Process a single card draw
  const { game: newState, events } = handleEffect(gameState, {
    type: 'draw-cards',
    params: { amount: 1 },
  })
  const currentState = events.reduce((state, event) => handleEvent(state, event), newState)

  if (n === 1) return currentState

  const isMakingChoice =
    currentState.viewData.modalView === 'card-choice' && currentState.viewData.resolver

  // Directly recurse in the non-choice case
  if (!isMakingChoice) return drawCards(currentState, n - 1)

  // Otherwise wrap the current resolver in a recurse call
  const originalResolver = currentState.viewData.resolver! // forced because ts doesn't infer the const
  const wrappedResolver = (gs: GameState, chosenCard: CardID) => {
    const result = originalResolver(gs, chosenCard)
    return drawCards(result, n - 1)
  }
  return {
    ...currentState,
    viewData: {
      ...currentState.viewData,
      resolver: wrappedResolver,
    },
  }
}

export function logEvent(gameState: GameState, event: Event) {
  return {
    ...gameState,
    game: {
      ...gameState.game,
      run: {
        ...gameState.game.run!,
        events: gameState.game.run!.events.concat(event),
      },
    },
  }
}
