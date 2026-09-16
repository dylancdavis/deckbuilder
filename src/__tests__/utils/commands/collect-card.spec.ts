import { describe, it, expect } from 'vitest'
import { applyCommand } from '../../../utils/commands'
import type { CollectCardCommand } from '../../../utils/commands'
import { createTestGameState } from './shared'

describe('CollectCardCommand', () => {
  it('adds single card to collection', () => {
    const gameState = createTestGameState()
    const command: CollectCardCommand = {
      type: 'collect-card',
      params: {
        cards: { score: 1 },
      },
    }

    const result = applyCommand(gameState, command)

    expect(result.game.game.collection.cards).toEqual({ score: 1 })
  })

  it('adds multiple copies of a single card to collection', () => {
    const gameState = createTestGameState()
    const command: CollectCardCommand = {
      type: 'collect-card',
      params: {
        cards: { 'dual-score': 3 },
      },
    }

    const result = applyCommand(gameState, command)

    expect(result.game.game.collection.cards).toEqual({ 'dual-score': 3 })
  })

  it('merges with existing cards in collection', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { score: 5, 'point-reset': 1 }

    const command: CollectCardCommand = {
      type: 'collect-card',
      params: {
        cards: { score: 1 },
      },
    }

    const result = applyCommand(gameState, command)

    expect(result.game.game.collection.cards).toEqual({
      score: 6, // 5 + 1
      'point-reset': 1,
    })
  })

  it('can collect rules cards', () => {
    const gameState = createTestGameState()
    const command: CollectCardCommand = {
      type: 'collect-card',
      params: {
        cards: { 'starter-rules': 1 },
      },
    }

    const result = applyCommand(gameState, command)

    expect(result.game.game.collection.cards).toEqual({ 'starter-rules': 1 })
  })

  it('works when collection is initially empty', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = {}

    const command: CollectCardCommand = {
      type: 'collect-card',
      params: {
        cards: { score: 3 },
      },
    }

    const result = applyCommand(gameState, command)

    expect(result.game.game.collection.cards).toEqual({ score: 3 })
  })

  it('does not mutate original game state', () => {
    const gameState = createTestGameState()
    gameState.game.collection.cards = { score: 5 }

    const command: CollectCardCommand = {
      type: 'collect-card',
      params: {
        cards: { 'dual-score': 1 },
      },
    }

    applyCommand(gameState, command)

    expect(gameState.game.collection.cards).toEqual({ score: 5 }) // Original unchanged
  })

  it('does not affect run state', () => {
    const gameState = createTestGameState({ resources: { points: 10 } })
    const command: CollectCardCommand = {
      type: 'collect-card',
      params: {
        cards: { score: 1 },
      },
    }

    const result = applyCommand(gameState, command)

    // Run state should be unchanged
    expect(result.game.game.run!.resources.points).toBe(10)
    expect(result.game.game.run!.cards.drawPile).toEqual([])
  })
})
