import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../utils/effects'
import type { Run } from '../../stores/game'
import type { UpdateResourceEffect } from '../../utils/effects'
import { Resource } from '../../utils/resource'
import { starterRules } from '../../utils/cards'

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

describe('update-resource with delta', () => {
  it('adds positive delta to resource', () => {
    const effect: UpdateResourceEffect = {
      type: 'update-resource',
      params: {
        resource: Resource.POINTS,
        delta: 5,
      },
    }
    const result = handleEffect(baseRun, effect)

    // Force type check - assign to never to see what type TS thinks result is
    const typeCheck: never = result

    baseRun.hello()
    result.hello()

    expect(result.resources.points).toBe(15)
  })
})
