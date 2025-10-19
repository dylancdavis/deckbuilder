import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../../utils/effects'
import type { CollectBasicEffect } from '../../../utils/effects'
import { createTestRun } from './shared'

describe('handleEffect - collect-basic', () => {
  it('throws error for collect-basic effect', () => {
    const run = createTestRun()
    const effect: CollectBasicEffect = {
      type: 'collect-basic',
      params: { options: 3, tags: ['basic'] },
    }

    expect(() => handleEffect(run, effect)).toThrow(
      'collect-basic effect should be handled by the store',
    )
  })
})
