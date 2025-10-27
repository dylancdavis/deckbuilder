import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../../utils/effects'
import type { CollectCardEffect } from '../../../utils/effects'
import { createTestGameState } from './shared'

describe('CollectCardEffect', () => {
  it('adds single card to collection', () => {
    const gameState = createTestGameState()
    const effect: CollectCardEffect = {
      type: 'collect-card',
      params: {
        cards: { score: 1 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.collection.cards).toEqual({ score: 1 })
  })

  it('adds multiple copies of a single card to collection', () => {
    const gameState = createTestGameState()
    const effect: CollectCardEffect = {
      type: 'collect-card',
      params: {
        cards: { 'dual-score': 3 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.collection.cards).toEqual({ 'dual-score': 3 })
  })

  it('adds multiple different cards to collection', () => {
    const gameState = createTestGameState()
    const effect: CollectCardEffect = {
      type: 'collect-card',
      params: {
        cards: { score: 2, 'collect-basic': 1, 'dual-score': 1 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.collection.cards).toEqual({
      score: 2,
      'collect-basic': 1,
      'dual-score': 1,
    })
  })

  it('merges with existing cards in collection', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { score: 5, 'point-reset': 1 }

    const effect: CollectCardEffect = {
      type: 'collect-card',
      params: {
        cards: { score: 2, 'dual-score': 1 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.collection.cards).toEqual({
      score: 7, // 5 + 2
      'point-reset': 1,
      'dual-score': 1,
    })
  })

  it('can collect rules cards', () => {
    const gameState = createTestGameState()
    const effect: CollectCardEffect = {
      type: 'collect-card',
      params: {
        cards: { 'starter-rules': 1 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.collection.cards).toEqual({ 'starter-rules': 1 })
  })

  it('works when collection is initially empty', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = {}

    const effect: CollectCardEffect = {
      type: 'collect-card',
      params: {
        cards: { score: 3 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.collection.cards).toEqual({ score: 3 })
  })

  it('does not mutate original game state', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { score: 5 }

    const effect: CollectCardEffect = {
      type: 'collect-card',
      params: {
        cards: { 'dual-score': 2 },
      },
    }

    handleEffect(gameState, effect)

    expect(gameState.game.collection.cards).toEqual({ score: 5 }) // Original unchanged
  })

  it('does not affect run state', () => {
    const gameState = createTestGameState({ resources: { points: 10 } })
    const effect: CollectCardEffect = {
      type: 'collect-card',
      params: {
        cards: { score: 1 },
      },
    }

    const result = handleEffect(gameState, effect)

    // Run state should be unchanged
    expect(result.game.run!.resources.points).toBe(10)
    expect(result.game.run!.cards.drawPile).toEqual([])
  })
})
