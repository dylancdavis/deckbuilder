import type { Collection } from './collection.ts'
import type { Run } from './run.ts'
import type { CardID } from './cards.ts'
import { getCardChoices } from './cards.ts'
import { handleEffect, handleEffects, type Effect } from './effects.ts'

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
  let currentState = gameState
  const run = currentState.game.run
  if (!run) {
    throw new Error('Cannot draw cards: no active run')
  }

  // Draw cards one at a time, processing on-draw effects for each
  for (let i = 0; i < n && currentState.game.run!.cards.drawPile.length > 0; i++) {
    const currentRun = currentState.game.run!
    const drawPile = [...currentRun.cards.drawPile]
    const hand = [...currentRun.cards.hand]
    const card = drawPile.shift() // Take from front of draw pile

    if (card) {
      hand.push(card) // Add to hand

      // Update state with moved card
      currentState = {
        ...currentState,
        game: {
          ...currentState.game,
          run: {
            ...currentRun,
            cards: {
              ...currentRun.cards,
              drawPile,
              hand,
            },
          },
        },
      }

      // Process on-draw effects for this card
      const onDrawEffects = card.abilities['on-draw']
      if (onDrawEffects) {
        currentState = handleEffects(currentState, onDrawEffects)
      }
    }
  }

  return currentState
}

/**
 * Pure function that processes playing a card from hand with the given instance ID.
 * Applies card effects, moves card to discard pile, and logs the event.
 *
 * Note: This does not handle choice effects or validation - those should be
 * handled by the caller (e.g., the store).
 *
 * @param gameState - The current game state
 * @param instanceId - The instance ID of the card in the hand to play
 * @returns A new game state with the card played and effects applied
 */
export function resolveCard(
  gameState: GameState,
  instanceId: string,
  effects?: Effect[],
): GameState {
  const run = gameState.game.run as Run

  // Find card in either hand or stack
  const cardInHand = run.cards.hand.find((card) => card.instanceId === instanceId)
  const cardInStack = run.cards.stack.find((card) => card.instanceId === instanceId)
  const card = cardInHand ?? cardInStack

  if (!card) {
    throw new Error(
      `Cannot resolve card: no card with instanceId ${instanceId} found in hand or stack`,
    )
  }

  // If card is in hand, move it to stack before processing effects
  let updatedGameState = gameState
  if (cardInHand) {
    const newHand = run.cards.hand.filter((c) => c.instanceId !== instanceId)
    const newStack = [...run.cards.stack, card]
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
  }

  const cardEffects = effects ?? card.abilities['on-play'] ?? []

  // Transform 'self' references in remove-card effects to the actual instanceId
  const transformedEffects = cardEffects.map((effect) => {
    if (effect.type === 'remove-card' && effect.params.instanceId === 'self') {
      return {
        ...effect,
        params: {
          instanceId: instanceId,
        },
      }
    }
    return effect
  })

  // Loop through and apply each effect to the game state
  for (const effect of transformedEffects) {
    // In the choice case, just update the modal state and return early
    if (effect.type === 'card-choice') {
      const remainingEffects = transformedEffects.slice(transformedEffects.indexOf(effect) + 1)
      const { options, tags, then } = effect.params

      const resolver = (gameState: GameState, chosenCard: CardID) => {
        const newEffect = then(chosenCard)
        return resolveCard(gameState, instanceId, [newEffect, ...remainingEffects])
      }

      return openCardChoiceModal(updatedGameState, options, tags, resolver)
    }
    updatedGameState = handleEffect(updatedGameState, effect)
  }

  // Extract the updated run from the game state
  const updatedRun = updatedGameState.game.run as Run

  // Check if the card is still in the stack (it may have been removed by an effect)
  const cardStillInStack = updatedRun.cards.stack.some((c) => c.instanceId === instanceId)

  // Remove card from stack and add to discard pile (only if it's still in the stack)
  const newStack = updatedRun.cards.stack.filter((c) => c.instanceId !== instanceId)
  const newDiscardPile = cardStillInStack
    ? [...updatedRun.cards.discardPile, card]
    : updatedRun.cards.discardPile

  // Log the card play event
  const newEvents = [
    ...updatedRun.events,
    {
      type: 'card-play' as const,
      round: updatedRun.stats.rounds,
      turn: updatedRun.stats.turns,
      cardId: card.id,
      instanceId: instanceId,
    },
  ]

  return {
    ...updatedGameState,
    game: {
      ...updatedGameState.game,
      run: {
        ...updatedRun,
        cards: {
          ...updatedRun.cards,
          stack: newStack,
          discardPile: newDiscardPile,
        },
        events: newEvents,
      },
    },
  }
}
