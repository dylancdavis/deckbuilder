import type { Collection } from './collection.ts'
import type { Run } from './run.ts'
import type { CardID } from './cards.ts'
import type { Event } from './event.ts'
import { getCardChoices } from './cards.ts'

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
