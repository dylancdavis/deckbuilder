import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../../utils/effects'
import type { RefreshDeckEffect } from '../../../utils/effects'
import { score, dualScore } from '../../../utils/cards'
import { createTestGameState } from './shared'

const effect: RefreshDeckEffect = {
  type: 'refresh-deck',
  params: {},
}

describe('RefreshDeckEffect', () => {
  it('moves hand, board, and discardPile into drawPile', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [{ ...score, instanceId: 'a' }],
        board: [{ ...dualScore, instanceId: 'b' }],
        discardPile: [{ ...score, instanceId: 'c' }],
      },
    })

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.drawPile).toHaveLength(3)
    expect(result.game.game.run!.cards.hand).toHaveLength(0)
    expect(result.game.game.run!.cards.board).toHaveLength(0)
    expect(result.game.game.run!.cards.discardPile).toHaveLength(0)
  })

  it('includes existing drawPile cards in the shuffle', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [{ ...score, instanceId: 'existing' }],
        hand: [{ ...dualScore, instanceId: 'from-hand' }],
        board: [],
        discardPile: [],
      },
    })

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.drawPile).toHaveLength(2)
    const ids = result.game.game.run!.cards.drawPile.map((c) => c.instanceId)
    expect(ids).toContain('existing')
    expect(ids).toContain('from-hand')
  })

  it('emits a deck-refresh event', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [{ ...score, instanceId: 'a' }],
        board: [],
        discardPile: [],
      },
    })

    const result = handleEffect(gameState, effect)

    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toMatchObject({ type: 'deck-refresh' })
  })

  it('does not mutate original game state', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [{ ...score, instanceId: 'a' }],
        board: [{ ...dualScore, instanceId: 'b' }],
        discardPile: [{ ...score, instanceId: 'c' }],
      },
    })

    handleEffect(gameState, effect)

    expect(gameState.game.run!.cards.hand).toHaveLength(1)
    expect(gameState.game.run!.cards.board).toHaveLength(1)
    expect(gameState.game.run!.cards.discardPile).toHaveLength(1)
  })
})
