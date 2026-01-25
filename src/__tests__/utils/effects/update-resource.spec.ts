import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../../utils/effects'
import type { UpdateResourceEffect } from '../../../utils/effects'
import { Resource } from '../../../utils/resource'
import { createTestGameState } from './shared'

describe('UpdateResourceEffect', () => {
  describe('with delta, ', () => {
    it('adds positive delta to existing resource', () => {
      const gameState = createTestGameState({ resources: { points: 5 } })
      const effect: UpdateResourceEffect = {
        type: 'update-resource',
        params: { resource: Resource.POINTS, delta: 3 },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.resources.points).toBe(8)
    })

    it('subtracts with negative delta', () => {
      const gameState = createTestGameState({ resources: { points: 10 } })
      const effect: UpdateResourceEffect = {
        type: 'update-resource',
        params: { resource: Resource.POINTS, delta: -4 },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.resources.points).toBe(6)
    })

    it('handles zero delta', () => {
      const gameState = createTestGameState({ resources: { points: 7 } })
      const effect: UpdateResourceEffect = {
        type: 'update-resource',
        params: { resource: Resource.POINTS, delta: 0 },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.resources.points).toBe(7)
    })
  })

  describe('with set, ', () => {
    it('sets resource to specific value', () => {
      const gameState = createTestGameState({ resources: { points: 10 } })
      const effect: UpdateResourceEffect = {
        type: 'update-resource',
        params: { resource: Resource.POINTS, set: 4 },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.resources.points).toBe(4)
    })

    it('sets resource to zero', () => {
      const gameState = createTestGameState({ resources: { points: 100 } })
      const effect: UpdateResourceEffect = {
        type: 'update-resource',
        params: { resource: Resource.POINTS, set: 0 },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.resources.points).toBe(0)
    })
  })

  describe('with update function, ', () => {
    it('uses update function with current value', () => {
      const gameState = createTestGameState({ resources: { points: 4 } })
      const effect: UpdateResourceEffect = {
        type: 'update-resource',
        params: {
          resource: Resource.POINTS,
          update: (current) => current * 2,
        },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.resources.points).toBe(8)
    })

    it('update function receives run as second parameter', () => {
      const gameState = createTestGameState({
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

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.resources.points).toBe(3)
    })

    it('update function can conditionally modify value', () => {
      const gameState = createTestGameState({ resources: { points: 0 } })
      const effect: UpdateResourceEffect = {
        type: 'update-resource',
        params: {
          resource: Resource.POINTS,
          update: (current) => (current === 0 ? 6 : current),
        },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.resources.points).toBe(6)
    })
  })

  it('does not mutate original game state', () => {
    const gameState = createTestGameState({ resources: { points: 5 } })
    const effect: UpdateResourceEffect = {
      type: 'update-resource',
      params: { resource: Resource.POINTS, delta: 3 },
    }

    handleEffect(gameState, effect)

    expect(gameState.game.run!.resources.points).toBe(5) // Original unchanged
  })
})
