/**
 * Effect processing utilities
 */

import type { Run } from '@/stores/game'
import type { Counter } from './counter'
import { toArray } from './counter'
import { playableCards, type PlayableCardID } from './cards'
import { Resource } from './resource'

// Game locations where cards can be placed
export type GameLocation = 'drawPile' | 'hand' | 'board' | 'discardPile'

// Card placement modes when adding cards to locations
export type PlacementMode = 'top' | 'bottom' | 'shuffle'

export type AddCardsEffect = {
  type: 'add-cards'
  params: {
    location: GameLocation
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

export type BuyCardEffect = {
  type: 'buy-card'
  params: {
    options: number
    tags: string[]
  }
}

export type Effect = AddCardsEffect | UpdateResourceEffect | BuyCardEffect

/**
 * Applies an effect to a run, returning the updated run.
 * This is a pure function that does not mutate the original run.
 */
export function handleEffect(run: Run, effect: Effect): Run {
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
        ...run,
        resources: {
          ...run.resources,
          [effect.params.resource]: newAmount,
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
        ...run,
        cards: {
          ...run.cards,
          [location]: newCardArr,
        },
      }
    }
    case 'buy-card': {
      // This needs UI interaction and should be handled by the store
      throw new Error('buy-card effect should be handled by the store')
    }
    default: {
      const _exhaustive: never = effect
      throw new Error(`Unknown effect type: ${JSON.stringify(_exhaustive)}`)
    }
  }
}

/**
 * Applies multiple effects to a run sequentially, returning the final run.
 */
export function handleEffects(run: Run, effects: Effect[]): Run {
  return effects.reduce((currentRun, effect) => handleEffect(currentRun, effect), run)
}
