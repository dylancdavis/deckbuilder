import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../utils/effects'
import type { Run } from '../../stores/game'
import type { UpdateResourceEffect } from '../../utils/effects'
import { Resource } from '../../utils/resource'
import { starterRules } from '../../utils/cards'
import type { Counter } from '../../utils/counter'
import { toArray } from '../../utils/counter'
import { playableCards, type PlayableCardID } from '../../utils/cards'

const baseRun: Run = {
  deck: {
    name: 'Test Deck',
    rulesCard: starterRules,
    cards: { score: 4 },
    editable: false,
  },
  cards: {
    drawPile: [],
    hand: [],
    board: [],
    discardPile: [],
  },
  resources: {
    points: 10,
  },
  stats: {
    turns: 1,
    rounds: 1,
  },
  events: [],
}

// Local copy of handleEffect to test type safety
type GameLocation = 'drawPile' | 'hand' | 'board' | 'discardPile'
type PlacementMode = 'top' | 'bottom' | 'shuffle'

type AddCardsEffect = {
  type: 'add-cards'
  params: {
    location: GameLocation
    cards: Counter<PlayableCardID>
    mode?: PlacementMode
  }
}

type LocalUpdateResourceEffect = {
  type: 'update-resource'
  params: {
    resource: Resource
  } & (
    | { delta: number }
    | { set: number }
    | { update: (currentAmount: number, run: Run) => number }
  )
}

type BuyCardEffect = {
  type: 'buy-card'
  params: {
    options: number
    tags: string[]
  }
}

type LocalEffect = AddCardsEffect | LocalUpdateResourceEffect | BuyCardEffect

function localHandleEffect(run: Run, effect: LocalEffect): Run {
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
      throw new Error('buy-card effect should be handled by the store')
    }
    default: {
      const _exhaustive: never = effect
      throw new Error(`Unknown effect type: ${JSON.stringify(_exhaustive)}`)
    }
  }
}

describe('update-resource with delta', () => {
  it('adds positive delta to resource', () => {
    const effect: UpdateResourceEffect = {
      type: 'update-resource',
      params: {
        resource: Resource.POINTS,
        delta: 5,
      },
    }

    // Test with imported handleEffect
    const resultImported = handleEffect(baseRun, effect)

    // Test with local copy
    const resultLocal = localHandleEffect(baseRun, effect)

    baseRun.hello()
    resultImported.hello() // Should NOT error (circular dependency issue)
    resultLocal.hello() // Should error (local copy works)

    expect(resultImported.resources.points).toBe(15)
    expect(resultLocal.resources.points).toBe(15)
  })
})
