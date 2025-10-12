import { describe, it, expect } from 'vitest'
import { handleEffects } from '../../../utils/effects'
import type { UpdateResourceEffect, AddCardsEffect } from '../../../utils/effects'
import { Resource } from '../../../utils/resource'
import { createTestRun } from './shared'

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
