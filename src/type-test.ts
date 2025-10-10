/**
 * Effect processing utilities
 */

import type { Run } from '@/stores/game'
import { starterRules } from '@/utils/cards'
import { handleEffect, type Effect } from '@/utils/effects'
import { Resource } from '@/utils/resource'
import type { Counter } from '@/utils/counter'
import { toArray } from '@/utils/counter'
import { playableCards, type PlayableCardID } from '@/utils/cards'

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

// Local copy of handleEffect using the REAL Effect type from utils/effects
export function localHandleEffect(run: Run, effect: Effect): Run {
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
