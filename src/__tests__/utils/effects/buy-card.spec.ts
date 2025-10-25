import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../../utils/effects'
import type { CollectBasicEffect } from '../../../utils/effects'
import { createTestGameState } from './shared'

describe('handleEffect - collect-basic', () => {
  it('throws error for collect-basic effect', () => {
    const gameState = createTestGameState()
    const effect: CollectBasicEffect = {
      type: 'collect-basic',
      params: { options: 3, tags: ['basic'] },
    }

    expect(() => handleEffect(gameState, effect)).toThrow('Unknown effect type')
  })
})
