import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../../utils/effects'
import type { DestroyCardEffect } from '../../../utils/effects'
import { createTestGameState } from './shared'

describe('DestroyCardEffect', () => {
  it('removes single card from collection', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { score: 3, 'dual-score': 2 }

    const effect: DestroyCardEffect = {
      type: 'destroy-card',
      params: {
        cards: { score: 1 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.collection.cards).toEqual({ score: 2, 'dual-score': 2 })
  })

  it('removes all copies of a card when count matches', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { score: 3, 'dual-score': 2 }

    const effect: DestroyCardEffect = {
      type: 'destroy-card',
      params: {
        cards: { score: 3 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.collection.cards).toEqual({ 'dual-score': 2 })
  })

  it('removes card completely when count exceeds available', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { score: 2, 'dual-score': 1 }

    const effect: DestroyCardEffect = {
      type: 'destroy-card',
      params: {
        cards: { score: 5 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.collection.cards).toEqual({ 'dual-score': 1 })
  })

  it('removes multiple different cards from collection', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { score: 5, 'collect-basic': 3, 'dual-score': 2 }

    const effect: DestroyCardEffect = {
      type: 'destroy-card',
      params: {
        cards: { score: 2, 'collect-basic': 1, 'dual-score': 2 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.collection.cards).toEqual({
      score: 3,
      'collect-basic': 2,
    })
  })

  it('handles removing cards that do not exist in collection', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { score: 3 }

    const effect: DestroyCardEffect = {
      type: 'destroy-card',
      params: {
        cards: { 'dual-score': 2 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.collection.cards).toEqual({ score: 3 })
  })

  it('can remove rules cards', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { 'starter-rules': 2, score: 1 }

    const effect: DestroyCardEffect = {
      type: 'destroy-card',
      params: {
        cards: { 'starter-rules': 1 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.collection.cards).toEqual({ 'starter-rules': 1, score: 1 })
  })

  it('results in empty collection when all cards removed', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { score: 2 }

    const effect: DestroyCardEffect = {
      type: 'destroy-card',
      params: {
        cards: { score: 2 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.collection.cards).toEqual({})
  })

  it('does not mutate original game state', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { score: 5, 'dual-score': 2 }

    const effect: DestroyCardEffect = {
      type: 'destroy-card',
      params: {
        cards: { score: 2 },
      },
    }

    handleEffect(gameState, effect)

    expect(gameState.game.collection.cards).toEqual({ score: 5, 'dual-score': 2 }) // Original unchanged
  })

  it('does not affect run state', () => {
    const gameState = createTestGameState({ resources: { points: 10 } })
    gameState.game.collection.cards = { score: 5 }

    const effect: DestroyCardEffect = {
      type: 'destroy-card',
      params: {
        cards: { score: 2 },
      },
    }

    const result = handleEffect(gameState, effect)

    // Run state should be unchanged
    expect(result.game.run!.resources.points).toBe(10)
    expect(result.game.run!.cards.drawPile).toEqual([])
  })
})
