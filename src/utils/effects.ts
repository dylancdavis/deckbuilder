import type { Counter } from './counter'
import { toArray, mergeCounters, subtractCounters } from './counter'
import { playableCards, type CardID, type PlayableCardID } from './cards'
import { Resource } from './resource'
import type { Run, Location } from './run'
import type { GameState } from './game'
import type { CardMatcher } from './card-matchers'

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
  params: {
    instanceId: string | 'self'
  }
}

export type DrawCardsEffect = {
  type: 'draw-cards'
  params: {
    amount: number
  }
}

export type DiscardCardsEffect = {
  type: 'discard-cards'
  params: {
    instanceIds?: string[]
    amount?: number
    matching?: CardMatcher
  }
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

/**
 * Applies an effect to a game state, returning the updated game state.
 * This is a pure function that does not mutate the original game state.
 */
export function handleEffect(gameState: GameState, effect: Effect): GameState {
  const run = gameState.game.run
  if (!run) {
    throw new Error('No active run in game state')
  }

  switch (effect.type) {
    case 'update-resource': {
      const currentAmount = run.resources[effect.params.resource] || 0
      let newAmount: number

      if ('delta' in effect.params) {
        newAmount = currentAmount + effect.params.delta
      } else if ('set' in effect.params) {
        newAmount = effect.params.set
      } else {
        newAmount = effect.params.update(currentAmount, run)
      }

      return {
        ...gameState,
        game: {
          ...gameState.game,
          run: {
            ...run,
            resources: {
              ...run.resources,
              [effect.params.resource]: newAmount,
            },
          },
        },
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

      return {
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
      }
    }
    case 'collect-card': {
      const { cards } = effect.params
      return {
        ...gameState,
        game: {
          ...gameState.game,
          collection: {
            ...gameState.game.collection,
            cards: mergeCounters(gameState.game.collection.cards, cards),
          },
        },
      }
    }
    case 'destroy-card': {
      const { cards } = effect.params
      return {
        ...gameState,
        game: {
          ...gameState.game,
          collection: {
            ...gameState.game.collection,
            cards: subtractCounters(gameState.game.collection.cards, cards),
          },
        },
      }
    }
    case 'remove-card': {
      const { instanceId } = effect.params
      const locations: Array<keyof typeof run.cards> = [
        'drawPile',
        'hand',
        'board',
        'stack',
        'discardPile',
      ]

      // Find the location containing the card with the matching instanceId
      const updatedCards = { ...run.cards }
      for (const location of locations) {
        const cardIndex = updatedCards[location].findIndex((card) => card.instanceId === instanceId)
        if (cardIndex !== -1) {
          // Remove the card from this location
          updatedCards[location] = [
            ...updatedCards[location].slice(0, cardIndex),
            ...updatedCards[location].slice(cardIndex + 1),
          ]
          break
        }
      }

      return {
        ...gameState,
        game: {
          ...gameState.game,
          run: {
            ...run,
            cards: updatedCards,
          },
        },
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
  return effects.reduce((currentState, effect) => handleEffect(currentState, effect), gameState)
}
