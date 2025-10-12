import { describe, it, expect } from 'vitest'
import { handleEffect, handleEffects } from '../../utils/effects'
import type { Run } from '../../utils/run'
import type { UpdateResourceEffect, AddCardsEffect, BuyCardEffect } from '../../utils/effects'
import { Resource } from '../../utils/resource'
import { dualScore, starterRules } from '../../utils/cards'

// Helper to create a minimal run for testing
const createTestRun = (overrides: Partial<Run> = {}): Run => ({
  deck: {
    name: 'Test Deck',
    editable: false,
    cards: { score: 1 },
    rulesCard: starterRules,
  },
  cards: {
    drawPile: [],
    hand: [],
    board: [],
    discardPile: [],
  },
  resources: {
    points: 0,
  },
  stats: {
    turns: 1,
    rounds: 1,
  },
  events: [],
  ...overrides,
})

describe('UpdateResourceEffect', () => {
  describe('with delta, ', () => {
    it('adds positive delta to existing resource', () => {
      const run = createTestRun({ resources: { points: 5 } })
      const effect: UpdateResourceEffect = {
        type: 'update-resource',
        params: { resource: Resource.POINTS, delta: 3 },
      }

      const result = handleEffect(run, effect)

      expect(result.resources.points).toBe(8)
    })

    it('subtracts with negative delta', () => {
      const run = createTestRun({ resources: { points: 10 } })
      const effect: UpdateResourceEffect = {
        type: 'update-resource',
        params: { resource: Resource.POINTS, delta: -4 },
      }

      const result = handleEffect(run, effect)

      expect(result.resources.points).toBe(6)
    })

    it('handles zero delta', () => {
      const run = createTestRun({ resources: { points: 7 } })
      const effect: UpdateResourceEffect = {
        type: 'update-resource',
        params: { resource: Resource.POINTS, delta: 0 },
      }

      const result = handleEffect(run, effect)

      expect(result.resources.points).toBe(7)
    })
  })

  describe('with set, ', () => {
    it('sets resource to specific value', () => {
      const run = createTestRun({ resources: { points: 10 } })
      const effect: UpdateResourceEffect = {
        type: 'update-resource',
        params: { resource: Resource.POINTS, set: 4 },
      }

      const result = handleEffect(run, effect)

      expect(result.resources.points).toBe(4)
    })

    it('sets resource to zero', () => {
      const run = createTestRun({ resources: { points: 100 } })
      const effect: UpdateResourceEffect = {
        type: 'update-resource',
        params: { resource: Resource.POINTS, set: 0 },
      }

      const result = handleEffect(run, effect)

      expect(result.resources.points).toBe(0)
    })
  })

  describe('with update function, ', () => {
    it('uses update function with current value', () => {
      const run = createTestRun({ resources: { points: 4 } })
      const effect: UpdateResourceEffect = {
        type: 'update-resource',
        params: {
          resource: Resource.POINTS,
          update: (current) => current * 2,
        },
      }

      const result = handleEffect(run, effect)

      expect(result.resources.points).toBe(8)
    })

    it('update function receives run as second parameter', () => {
      const run = createTestRun({
        resources: { points: 0 },
        stats: { turns: 1, rounds: 3 },
      })
      const effect: UpdateResourceEffect = {
        type: 'update-resource',
        params: {
          resource: Resource.POINTS,
          update: (current, run) => current + run.stats.rounds,
        },
      }

      const result = handleEffect(run, effect)

      expect(result.resources.points).toBe(3)
    })

    it('update function can conditionally modify value', () => {
      const run = createTestRun({ resources: { points: 0 } })
      const effect: UpdateResourceEffect = {
        type: 'update-resource',
        params: {
          resource: Resource.POINTS,
          update: (current) => (current === 0 ? 6 : current),
        },
      }

      const result = handleEffect(run, effect)

      expect(result.resources.points).toBe(6)
    })
  })

  it('does not mutate original run', () => {
    const run = createTestRun({ resources: { points: 5 } })
    const effect: UpdateResourceEffect = {
      type: 'update-resource',
      params: { resource: Resource.POINTS, delta: 3 },
    }

    handleEffect(run, effect)

    expect(run.resources.points).toBe(5) // Original unchanged
  })
})

describe('AddCardsEffect', () => {
  it('adds single card to drawPile', () => {
    const run = createTestRun()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 1 },
      },
    }

    const result = handleEffect(run, effect)

    expect(result.cards.drawPile).toHaveLength(1)
    expect(result.cards.drawPile[0].id).toBe('score')
    expect(result.cards.drawPile[0].instanceId).toBeDefined()
  })

  it('adds multiple cards to drawPile', () => {
    const run = createTestRun()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 3, 'collect-basic': 1 },
      },
    }

    const result = handleEffect(run, effect)

    expect(result.cards.drawPile).toHaveLength(4)
    const scoreCards = result.cards.drawPile.filter((c) => c.id === 'score')
    const collectCards = result.cards.drawPile.filter((c) => c.id === 'collect-basic')
    expect(scoreCards).toHaveLength(3)
    expect(collectCards).toHaveLength(1)
  })

  it('adds cards to hand location', () => {
    const run = createTestRun()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'hand',
        cards: { 'dual-score': 2 },
      },
    }

    const result = handleEffect(run, effect)

    expect(result.cards.hand).toHaveLength(2)
    expect(result.cards.hand[0].id).toBe('dual-score')
  })

  it('adds cards to board location', () => {
    const run = createTestRun()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'board',
        cards: { score: 1 },
      },
    }

    const result = handleEffect(run, effect)

    expect(result.cards.board).toHaveLength(1)
  })

  it('adds cards to discardPile location', () => {
    const run = createTestRun()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'discardPile',
        cards: { score: 1 },
      },
    }

    const result = handleEffect(run, effect)

    expect(result.cards.discardPile).toHaveLength(1)
  })

  it('adds cards to end of existing pile (default mode)', () => {
    const run = createTestRun({
      cards: {
        drawPile: [{ ...dualScore, instanceId: 'foobar' }],
        hand: [],
        board: [],
        discardPile: [],
      },
    })
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 1 },
      },
    }

    const result = handleEffect(run, effect)

    expect(result.cards.drawPile).toHaveLength(2)
    expect(result.cards.drawPile[0].instanceId).toBe('foobar')
    expect(result.cards.drawPile[1].id).toBe('score')
  })

  it('adds cards to top when mode is "top"', () => {
    const run = createTestRun({
      cards: {
        drawPile: [{ ...dualScore, instanceId: 'foobar' }],
        hand: [],
        board: [],
        discardPile: [],
      },
    })
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 1 },
        mode: 'top',
      },
    }

    const result = handleEffect(run, effect)

    expect(result.cards.drawPile).toHaveLength(2)
    expect(result.cards.drawPile[0].id).toBe('score')
    expect(result.cards.drawPile[1].instanceId).toBe('foobar')
  })

  it('assigns unique instanceId to each added card', () => {
    const run = createTestRun()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 3 },
      },
    }

    const result = handleEffect(run, effect)

    const instanceIds = result.cards.drawPile.map((c) => c.instanceId)
    const uniqueIds = new Set(instanceIds)
    expect(uniqueIds.size).toBe(3) // All unique
  })

  it('does not mutate original run', () => {
    const run = createTestRun()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 1 },
      },
    }

    handleEffect(run, effect)

    expect(run.cards.drawPile).toHaveLength(0) // Original unchanged
  })
})

describe('handleEffect - buy-card', () => {
  it('throws error for buy-card effect', () => {
    const run = createTestRun()
    const effect: BuyCardEffect = {
      type: 'buy-card',
      params: { options: 3, tags: ['basic'] },
    }

    expect(() => handleEffect(run, effect)).toThrow(
      'buy-card effect should be handled by the store',
    )
  })
})

describe('handleEffects - sequential processing', () => {
  it('applies multiple effects in sequence', () => {
    const run = createTestRun({ resources: { points: 0 } })
    const effects = [
      {
        type: 'update-resource',
        params: { resource: Resource.POINTS, delta: 5 },
      },
      {
        type: 'update-resource',
        params: { resource: Resource.POINTS, delta: 3 },
      },
    ] as UpdateResourceEffect[]

    const result = handleEffects(run, effects)

    expect(result.resources.points).toBe(8)
  })

  it('effects see results of previous effects', () => {
    const run = createTestRun({ resources: { points: 2 } })
    const effects = [
      {
        type: 'update-resource',
        params: { resource: Resource.POINTS, delta: 3 }, // 2 + 3 = 5
      },
      {
        type: 'update-resource',
        params: {
          resource: Resource.POINTS,
          update: (current) => current * 2, // 5 * 2 = 10
        },
      },
    ] as UpdateResourceEffect[]

    const result = handleEffects(run, effects)

    expect(result.resources.points).toBe(10)
  })

  it('handles mix of resource and add-cards effects', () => {
    const run = createTestRun({ resources: { points: 0 } })
    const effects = [
      {
        type: 'update-resource',
        params: { resource: Resource.POINTS, delta: 6 },
      },
      {
        type: 'add-cards',
        params: { location: 'drawPile', cards: { debt: 1 } },
      },
    ] as (UpdateResourceEffect | AddCardsEffect)[]

    const result = handleEffects(run, effects)

    expect(result.resources.points).toBe(6)
    expect(result.cards.drawPile).toHaveLength(1)
    expect(result.cards.drawPile[0].id).toBe('debt')
  })

  it('returns original run when effects array is empty', () => {
    const run = createTestRun()
    const result = handleEffects(run, [])

    expect(result).toBe(run)
  })
})
