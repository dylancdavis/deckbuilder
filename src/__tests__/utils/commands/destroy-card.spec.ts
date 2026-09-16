import { describe, it, expect } from 'vitest'
import { applyCommand } from '../../../utils/commands'
import type { DestroyCardCommand } from '../../../utils/commands'
import { createTestGameState } from './shared'

describe('DestroyCardCommand', () => {
  it('removes single card from collection', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { score: 3, 'dual-score': 2 }

    const command: DestroyCardCommand = {
      type: 'destroy-card',
      params: {
        cards: { score: 1 },
      },
    }

    const result = applyCommand(gameState, command)

    expect(result.game.game.collection.cards).toEqual({ score: 2, 'dual-score': 2 })
  })

  it('removes all copies of a card when count matches', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { score: 3, 'dual-score': 2 }

    const command: DestroyCardCommand = {
      type: 'destroy-card',
      params: {
        cards: { score: 3 },
      },
    }

    const result = applyCommand(gameState, command)

    expect(result.game.game.collection.cards).toEqual({ 'dual-score': 2 })
  })

  it('removes card completely when count exceeds available', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { score: 2, 'dual-score': 1 }

    const command: DestroyCardCommand = {
      type: 'destroy-card',
      params: {
        cards: { score: 5 },
      },
    }

    const result = applyCommand(gameState, command)

    expect(result.game.game.collection.cards).toEqual({ 'dual-score': 1 })
  })

  it('handles removing cards that do not exist in collection', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { score: 3 }

    const command: DestroyCardCommand = {
      type: 'destroy-card',
      params: {
        cards: { 'dual-score': 2 },
      },
    }

    const result = applyCommand(gameState, command)

    expect(result.game.game.collection.cards).toEqual({ score: 3 })
  })

  it('can remove rules cards', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { 'starter-rules': 2, score: 1 }

    const command: DestroyCardCommand = {
      type: 'destroy-card',
      params: {
        cards: { 'starter-rules': 1 },
      },
    }

    const result = applyCommand(gameState, command)

    expect(result.game.game.collection.cards).toEqual({ 'starter-rules': 1, score: 1 })
  })

  it('results in empty collection when all cards removed', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { score: 2 }

    const command: DestroyCardCommand = {
      type: 'destroy-card',
      params: {
        cards: { score: 2 },
      },
    }

    const result = applyCommand(gameState, command)

    expect(result.game.game.collection.cards).toEqual({})
  })

  it('does not mutate original game state', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { score: 5, 'dual-score': 2 }

    const command: DestroyCardCommand = {
      type: 'destroy-card',
      params: {
        cards: { score: 2 },
      },
    }

    applyCommand(gameState, command)

    expect(gameState.game.collection.cards).toEqual({ score: 5, 'dual-score': 2 }) // Original unchanged
  })

  it('does not affect run state', () => {
    const gameState = createTestGameState({ resources: { points: 10 } })
    gameState.game.collection.cards = { score: 5 }

    const command: DestroyCardCommand = {
      type: 'destroy-card',
      params: {
        cards: { score: 2 },
      },
    }

    const result = applyCommand(gameState, command)

    // Run state should be unchanged
    expect(result.game.game.run!.resources.points).toBe(10)
    expect(result.game.game.run!.cards.drawPile).toEqual([])
  })
})
