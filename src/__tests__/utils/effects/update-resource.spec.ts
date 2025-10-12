import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../../utils/effects'
import type { UpdateResourceEffect } from '../../../utils/effects'
import { Resource } from '../../../utils/resource'
import { createTestRun } from './shared'

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
