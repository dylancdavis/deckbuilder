import type { Collection } from './collection.ts'
import type { Run } from './run.ts'
import type { CardID, PlayableCard } from './cards.ts'
import type { CardPlayEvent, Event } from './event.ts'
import { getCardChoices } from './cards.ts'
import { handleEvent, isAsset } from './ability-processor.ts'
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
 *
 * @param gameState - The current game state
 * @param n - Number of cards to draw
 * @returns A new game state with cards moved from draw pile to hand and on-draw effects applied
 */
export function drawCards(gameState: GameState, n: number): GameState {
  debugger
  let currentState = gameState
  if (!currentState.game.run) {
    throw new Error('Cannot draw cards: no active run')
  }

  // Draw cards one at a time, processing on-draw effects for each
  for (let i = 0; i < n && currentState.game.run!.cards.drawPile.length > 0; i++) {
    // Use handleEffect to draw one card
    const { game: newState, events } = handleEffect(currentState, {
      type: 'draw-cards',
      params: { amount: 1 },
    })
    currentState = newState

    // Process abilities and log events for each drawn card
    for (const event of events) {
      currentState = handleEvent(currentState, event)
      currentState = logEvent(currentState, event)
    }
  }

  return currentState
}

/**
 * Pure function that processes playing a card from hand with the given instance ID.
 * Moves the card to the stack, emits & process a card-play event, then returns with
 * either the card resolved on the board or on the stack awaiting a choice event to resolve.
 * @param gameState - The current game state
 * @param instanceId - The instance ID of the card in the hand to play
 * @returns A new game state with the card played and effects applied
 */
export function playCard(gameState: GameState, instanceId: string): GameState {
  const run = gameState.game.run!
  let updatedGameState

  // Find card in hand
  const card = run.cards.hand.find((card) => card.instanceId === instanceId)

  if (!card) {
    throw new Error(`Cannot play card: no card with instanceId ${instanceId} found in hand`)
  }

  // 1. Move the card from hand to stack
  const newHand = run.cards.hand.filter((c) => c.instanceId !== instanceId)
  const newStack = run.cards.stack.concat(card)
  updatedGameState = {
    ...gameState,
    game: {
      ...gameState.game,
      run: {
        ...run,
        cards: {
          ...run.cards,
          hand: newHand,
          stack: newStack,
        },
      },
    },
  }

  const playEvent: CardPlayEvent = {
    type: 'card-play',
    cardId: card.id,
    instanceId: instanceId,
    round: run.stats.rounds,
    turn: run.stats.turns,
  }

  // handleEvent logs event and processes all abilities
  updatedGameState = handleEvent(updatedGameState, playEvent)

  // Finalize the card play (move from stack to final destination)
  // If a modal is open, wrap the resolver to finalize after continuation completes
  return finalizeCardPlay(updatedGameState, instanceId, card)
}

/**
 * Moves a played card from stack to its final destination (board or discard).
 * If a modal is open (card-choice in progress), wraps the resolver to call
 * this function after the continuation completes.
 */
function finalizeCardPlay(gameState: GameState, instanceId: string, card: PlayableCard): GameState {
  // If modal is open, wrap the resolver to finalize after continuation
  if (gameState.viewData.modalView === 'card-choice' && gameState.viewData.resolver) {
    const originalResolver = gameState.viewData.resolver
    const wrappedResolver = (gs: GameState, chosenCard: CardID) => {
      const result = originalResolver(gs, chosenCard)
      return finalizeCardPlay(result, instanceId, card)
    }
    return {
      ...gameState,
      viewData: {
        ...gameState.viewData,
        resolver: wrappedResolver,
      },
    }
  }

  // No modal - finalize now
  const run = gameState.game.run as Run
  const cardStillInStack = run.cards.stack.some((c) => c.instanceId === instanceId)

  if (!cardStillInStack) {
    return gameState
  }

  // Determine destination based on card abilities
  const destination = isAsset(card) ? 'board' : 'discardPile'
  const newStack = run.cards.stack.filter((c) => c.instanceId !== instanceId)
  const newDestination = [...run.cards[destination], card]

  return {
    ...gameState,
    game: {
      ...gameState.game,
      run: {
        ...run,
        cards: {
          ...run.cards,
          stack: newStack,
          [destination]: newDestination,
        },
      },
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
