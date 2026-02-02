import type { Counter } from './counter'
import { toArray, mergeCounters, subtractCounters } from './counter'
import { playableCards, type CardID, type PlayableCardID } from './cards'
import { Resource } from './resource'
import { type Run, type Location, locations } from './run'
import type { GameState } from './game'
import type { CardMatcher } from './card-matchers'
import type {
  CardAddEvent,
  CardCollectEvent,
  CardDestroyEvent,
  CardDrawEvent,
  CardRemoveEvent,
  DeckRefreshEvent,
  Event,
  ResourceChangeEvent,
  TurnEndEvent,
  TurnStartEvent,
} from './event'

// Card placement modes when adding cards to locations
export type PlacementMode = 'top' | 'bottom' | 'shuffle'

export type AddCardsEffect = {
  type: 'add-cards'
  params: {
    location: Location
    cards: Counter<PlayableCardID>
    mode?: PlacementMode
  }
}

export type UpdateResourceEffect = {
  type: 'update-resource'
  params: {
    resource: Resource
  } & (
    | { delta: number }
    | { set: number }
    | { update: (currentAmount: number, run: Run) => number }
  )
}

export type CollectCardEffect = {
  type: 'collect-card'
  params: {
    cards: Counter<CardID>
  }
}

export type DestroyCardEffect = {
  type: 'destroy-card'
  params: {
    cards: Counter<CardID>
  }
}

export type CardChoiceEffect = {
  type: 'card-choice'
  params: {
    options: number
    tags: string[]
    choiceHandler: (chosenCard: CardID) => Effect[]
  }
}

export type RemoveCardEffect = {
  type: 'remove-card'
  params: { instanceId: string | 'self' } | { matching: CardMatcher }
}

export type DrawCardsEffect = {
  type: 'draw-cards'
  params: { amount: number }
}

export type DiscardCardsEffect = {
  type: 'discard-cards'
  params: { instanceIds: string[] } | { amount: number | 'all' } | { matching: CardMatcher }
}

export type MoveCardEffect = {
  type: 'move-card'
  params: {
    instanceId: string | 'self'
    from: Location
    to: Location
    position?: 'top' | 'bottom' | 'shuffle'
  }
}

export type RetriggerCardEffect = {
  type: 'retrigger-card'
  params: {
    instanceId: string | 'self'
  }
}

// Lifecycle effects
export type TurnStartEffect = {
  type: 'turn-start'
  params: Record<string, never>
}

export type TurnEndEffect = {
  type: 'turn-end'
  params: Record<string, never>
}

export type RoundStartEffect = {
  type: 'round-start'
  params: Record<string, never>
}

export type RoundEndEffect = {
  type: 'round-end'
  params: Record<string, never>
}

export type RunStartEffect = {
  type: 'run-start'
  params: Record<string, never>
}

export type RunEndEffect = {
  type: 'run-end'
  params: Record<string, never>
}

export type RefreshDeckEffect = {
  type: 'refresh-deck'
  params: Record<string, never>
}

export type Effect =
  | AddCardsEffect
  | UpdateResourceEffect
  | CollectCardEffect
  | CardChoiceEffect
  | DestroyCardEffect
  | RemoveCardEffect
  | DrawCardsEffect
  | DiscardCardsEffect
  | MoveCardEffect
  | RetriggerCardEffect
  | TurnStartEffect
  | TurnEndEffect
  | RoundStartEffect
  | RoundEndEffect
  | RunStartEffect
  | RunEndEffect
  | RefreshDeckEffect

/**
 * Handles a given effect and updates the event log if the effect successfully generated events.
 * Returns the new GameState and any generated events.
 */
export function handleEffect(
  gameState: GameState,
  effect: Effect,
): { game: GameState; events: Event[] } {
  if (!gameState.game.run) throw new Error('No active run in game state')
  const run = gameState.game.run
  const round = run.stats.rounds
  const turn = run.stats.turns

  switch (effect.type) {
    case 'update-resource': {
      const resource = effect.params.resource
      const oldValue = run.resources[resource]
      let newValue: number

      if ('delta' in effect.params) {
        newValue = oldValue + effect.params.delta
      } else if ('set' in effect.params) {
        newValue = effect.params.set
      } else {
        newValue = effect.params.update(oldValue, run)
      }

      const event: ResourceChangeEvent = {
        type: 'resource-change',
        resource,
        oldValue,
        newValue,
        delta: newValue - oldValue,
        round,
        turn,
      }

      return {
        game: {
          ...gameState,
          game: {
            ...gameState.game,
            run: {
              ...run,
              resources: {
                ...run.resources,
                [effect.params.resource]: newValue,
              },
            },
          },
        },
        events: [event],
      }
    }
    case 'add-cards': {
      const { location, cards, mode } = effect.params
      const shuffledIDs = toArray(cards).sort(() => Math.random() - 0.5)
      const cardsToAdd = shuffledIDs.map((id) => ({
        ...playableCards[id],
        instanceId: crypto.randomUUID(),
      }))
      const existingCards = run.cards[location]
      const newCardArr =
        mode === 'top' ? [...cardsToAdd, ...existingCards] : [...existingCards, ...cardsToAdd]

      const events: CardAddEvent[] = cardsToAdd.map((card) => ({
        type: 'card-add',
        cardId: card.id,
        instanceId: card.instanceId,
        toLocation: location,
        round,
        turn,
      }))

      return {
        game: {
          ...gameState,
          game: {
            ...gameState.game,
            run: {
              ...run,
              cards: {
                ...run.cards,
                [location]: newCardArr,
              },
            },
          },
        },
        events,
      }
    }
    case 'collect-card': {
      const { cards } = effect.params

      const collectedCardIds = toArray(cards)

      const events: CardCollectEvent[] = collectedCardIds.map((cardId) => ({
        type: 'card-collect',
        cardId,
        round,
        turn,
      }))

      return {
        game: {
          ...gameState,
          game: {
            ...gameState.game,
            collection: {
              ...gameState.game.collection,
              cards: mergeCounters(gameState.game.collection.cards, cards),
            },
          },
        },
        events,
      }
    }
    case 'destroy-card': {
      const { cards } = effect.params

      const destroyedCardIds = toArray(cards)

      const events: CardDestroyEvent[] = destroyedCardIds.map((cardId) => ({
        type: 'card-destroy',
        cardId,
        round,
        turn,
      }))

      return {
        game: {
          ...gameState,
          game: {
            ...gameState.game,
            collection: {
              ...gameState.game.collection,
              cards: subtractCounters(gameState.game.collection.cards, cards),
            },
          },
        },
        events,
      }
    }
    case 'remove-card': {
      if ('matching' in effect.params) throw new Error('Card matcher removal not yet implemented')

      const { instanceId } = effect.params

      // Find the location containing the card with the matching instanceId
      const updatedCards = { ...run.cards }
      let removedCard: CardRemoveEvent | null = null

      for (const location of locations) {
        const cardIndex = updatedCards[location].findIndex((card) => card.instanceId === instanceId)
        if (cardIndex !== -1) {
          const card = updatedCards[location][cardIndex]

          // Create event for the removed card
          removedCard = {
            type: 'card-remove',
            cardId: card.id,
            instanceId: card.instanceId,
            fromLocation: location,
            round,
            turn,
          }

          // Remove the card from this location
          updatedCards[location] = [
            ...updatedCards[location].slice(0, cardIndex),
            ...updatedCards[location].slice(cardIndex + 1),
          ]
          break
        }
      }

      return {
        game: {
          ...gameState,
          game: {
            ...gameState.game,
            run: {
              ...run,
              cards: updatedCards,
            },
          },
        },
        events: removedCard ? [removedCard] : [],
      }
    }
    case 'turn-start': {
      const newTurn = turn + 1
      const event: TurnStartEvent = {
        type: 'turn-start',
        round: round,
        turn: newTurn,
      }

      return {
        game: {
          ...gameState,
          game: {
            ...gameState.game,
            run: {
              ...run,
              stats: {
                ...run.stats,
                turns: newTurn,
              },
            },
          },
        },
        events: [event],
      }
    }
    case 'turn-end': {
      const event: TurnEndEvent = {
        type: 'turn-end',
        round,
        turn,
      }

      return {
        game: gameState,
        events: [event],
      }
    }
    case 'round-start': {
      const newRound = round + 1
      const event: Event = {
        type: 'round-start',
        round: newRound,
        turn: 0,
      }

      return {
        game: {
          ...gameState,
          game: {
            ...gameState.game,
            run: {
              ...run,
              stats: {
                ...run.stats,
                rounds: newRound,
                turns: 0,
              },
            },
          },
        },
        events: [event],
      }
    }
    case 'round-end': {
      const event: Event = {
        type: 'round-end',
        round,
        turn,
      }

      return {
        game: gameState,
        events: [event],
      }
    }
    case 'run-start': {
      const event: Event = {
        type: 'run-start',
        round,
        turn,
      }

      return {
        game: gameState,
        events: [event],
      }
    }
    case 'run-end': {
      const event: Event = {
        type: 'run-end',
        round,
        turn,
      }

      return {
        game: gameState,
        events: [event],
      }
    }
    case 'refresh-deck': {
      // Collect all cards from hand, board, and discard pile
      const allCards = [...run.cards.hand, ...run.cards.board, ...run.cards.discardPile]

      // Shuffle the collected cards
      allCards.sort(() => Math.random() - 0.5)

      const event: DeckRefreshEvent = {
        type: 'deck-refresh',
        round: run.stats.rounds,
        turn: run.stats.turns,
      }

      return {
        game: {
          ...gameState,
          game: {
            ...gameState.game,
            run: {
              ...run,
              cards: {
                ...run.cards,
                drawPile: allCards,
                hand: [],
                board: [],
                discardPile: [],
              },
            },
          },
        },
        events: [event],
      }
    }
    case 'draw-cards': {
      const { amount } = effect.params
      const drawPile = run.cards.drawPile
      const cardsToDraw = drawPile.slice(0, amount)
      const remainingDrawPile = drawPile.slice(amount)

      const events: CardDrawEvent[] = cardsToDraw.map((card) => ({
        type: 'card-draw',
        cardId: card.id,
        instanceId: card.instanceId,
        round,
        turn,
      }))

      return {
        game: {
          ...gameState,
          game: {
            ...gameState.game,
            run: {
              ...run,
              cards: {
                ...run.cards,
                drawPile: remainingDrawPile,
                hand: [...run.cards.hand, ...cardsToDraw],
              },
            },
          },
        },
        events,
      }
    }
    default: {
      throw new Error(`Unknown effect type: ${JSON.stringify(effect.type)}`)
    }
  }
}

/**
 * Applies multiple effects to a game state sequentially, returning the final game state.
 */
export function handleEffects(gameState: GameState, effects: Effect[]): GameState {
  return effects.reduce(
    (currentState, effect) => handleEffect(currentState, effect).game,
    gameState,
  )
}
