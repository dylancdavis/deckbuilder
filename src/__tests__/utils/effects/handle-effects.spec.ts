import { describe, it, expect } from 'vitest'
import { handleEffects } from '../../../utils/effects'
import type { UpdateResourceEffect, AddCardsEffect } from '../../../utils/effects'
import { Resource } from '../../../utils/resource'
import { createTestGameState } from './shared'

describe('handleEffects - sequential processing', () => {
  it('applies multiple effects in sequence', () => {
    const gameState = createTestGameState({ resources: { points: 0 } })
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

    const result = handleEffects(gameState, effects)

    expect(result.game.run!.resources.points).toBe(8)
  })

  it('effects see results of previous effects', () => {
    const gameState = createTestGameState({ resources: { points: 2 } })
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

    const result = handleEffects(gameState, effects)

    expect(result.game.run!.resources.points).toBe(10)
  })

  it('handles mix of resource and add-cards effects', () => {
    const gameState = createTestGameState({ resources: { points: 0 } })
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

    const result = handleEffects(gameState, effects)

    expect(result.game.run!.resources.points).toBe(6)
    expect(result.game.run!.cards.drawPile).toHaveLength(1)
    expect(result.game.run!.cards.drawPile[0].id).toBe('debt')
  })

  it('returns original game state when effects array is empty', () => {
    const gameState = createTestGameState()
    const result = handleEffects(gameState, [])

    expect(result).toBe(gameState)
  })
})
