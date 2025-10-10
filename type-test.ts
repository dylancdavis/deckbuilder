// Testing increasingly complex variants of handleEffect with Run type
import type { Run } from './src/stores/game'
import { starterRules } from './src/utils/cards'
import { handleEffect } from './src/utils/effects'
import { Resource } from './src/utils/resource'

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

// V1: Simple spread
function v1_simpleSpread(run: Run): Run {
  return {
    ...run,
    resources: {
      ...run.resources,
      points: (run.resources.points || 0) + 5,
    },
  }
}

// V2: With single-case switch
type SimpleEffect = { type: 'update' }
function v2_singleSwitch(run: Run, effect: SimpleEffect): Run {
  switch (effect.type) {
    case 'update':
      return {
        ...run,
        resources: {
          ...run.resources,
          points: (run.resources.points || 0) + 5,
        },
      }
  }
}

// V3: With union type (2 cases)
type TwoEffect = { type: 'update'; delta: number } | { type: 'set'; value: number }
function v3_twoSwitch(run: Run, effect: TwoEffect): Run {
  switch (effect.type) {
    case 'update':
      return {
        ...run,
        resources: {
          ...run.resources,
          points: (run.resources.points || 0) + effect.delta,
        },
      }
    case 'set':
      return {
        ...run,
        resources: {
          ...run.resources,
          points: effect.value,
        },
      }
  }
}

// V4: With 3 union types + default case (like real handleEffect)
type ThreeEffect =
  | { type: 'update'; delta: number }
  | { type: 'set'; value: number }
  | { type: 'other' }

function v4_threeSwitch(run: Run, effect: ThreeEffect): Run {
  switch (effect.type) {
    case 'update':
      return {
        ...run,
        resources: {
          ...run.resources,
          points: (run.resources.points || 0) + effect.delta,
        },
      }
    case 'set':
      return {
        ...run,
        resources: {
          ...run.resources,
          points: effect.value,
        },
      }
    case 'other':
      return run
    default: {
      const _exhaustive: never = effect
      throw new Error(`Unknown: ${JSON.stringify(_exhaustive)}`)
    }
  }
}

// Test all versions
const r1 = v1_simpleSpread(testRun)
const r2 = v2_singleSwitch(testRun, { type: 'update' })
const r3 = v3_twoSwitch(testRun, { type: 'update', delta: 5 })
const r4 = v4_threeSwitch(testRun, { type: 'update', delta: 5 })

// V5: Exact copy of handleEffect - does copying it locally fix the issue?
import type { Counter } from './src/utils/counter'
import { toArray } from './src/utils/counter'
import { playableCards, type PlayableCardID } from './src/utils/cards'

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

// V6: Actual handleEffect from codebase (imported)
const r5 = handleEffect(testRun, {
  type: 'update-resource',
  params: { resource: Resource.POINTS, delta: 5 },
})

// V7: Local copy of handleEffect
const r6 = localHandleEffect(testRun, {
  type: 'update-resource',
  params: { resource: Resource.POINTS, delta: 5 },
})

// Which ones allow invalid access?
testRun.hello()  // Should error
r1.hello()       // Should error
r2.hello()       // Should error
r3.hello()       // Should error
r4.hello()       // Should error
r5.hello()       // Should error - KEY TEST (imported handleEffect)!
r6.hello()       // Should error - Does local copy work?
