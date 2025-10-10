import type { Run } from './src/stores/game'
import { starterRules } from './src/utils/cards'
import { handleEffect } from './src/utils/effects'
import { Resource } from './src/utils/resource'
import type { Counter } from './src/utils/counter'
import { toArray } from './src/utils/counter'
import { playableCards, type PlayableCardID } from './src/utils/cards'

const testRun: Run = {
  deck: {
    name: 'Test',
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
  resources: { points: 10 },
  stats: { turns: 1, rounds: 1 },
  events: [],
}

// Local copy of handleEffect (exact same implementation as in utils/effects.ts)
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

type UpdateResourceEffect = {
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

type LocalEffect = AddCardsEffect | UpdateResourceEffect | BuyCardEffect

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

// Test: Imported handleEffect from circular dependency module
const resultImported = handleEffect(testRun, {
  type: 'update-resource',
  params: { resource: Resource.POINTS, delta: 5 },
})

// Test: Local copy of handleEffect
const resultLocal = localHandleEffect(testRun, {
  type: 'update-resource',
  params: { resource: Resource.POINTS, delta: 5 },
})

// Type safety tests
testRun.hello() // ✅ Errors: Property 'hello' does not exist on type 'Run'
resultImported.hello() // ❌ Does NOT error (circular dependency breaks type enforcement)
resultLocal.hello() // ✅ Errors: Property 'hello' does not exist on type 'Run'
