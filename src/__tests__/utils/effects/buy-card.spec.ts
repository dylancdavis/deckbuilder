import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../../utils/effects'
import type { BuyCardEffect } from '../../../utils/effects'
import { createTestRun } from './shared'

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
