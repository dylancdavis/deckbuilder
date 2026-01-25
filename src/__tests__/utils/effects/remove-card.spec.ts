import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../../utils/effects'
import type { RemoveCardEffect } from '../../../utils/effects'
import { score } from '../../../utils/cards'
import { createTestGameState } from './shared'

describe('RemoveCardEffect', () => {
  it('removes card from drawPile by instanceId', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [
          { ...score, instanceId: 'card-1' },
          { ...score, instanceId: 'card-2' },
          { ...score, instanceId: 'card-3' },
        ],
        hand: [],
        board: [],
        stack: [],
        discardPile: [],
      },
    })
    const effect: RemoveCardEffect = {
      type: 'remove-card',
      params: {
        instanceId: 'card-2',
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.drawPile).toHaveLength(2)
    expect(result.game.game.run!.cards.drawPile[0].instanceId).toBe('card-1')
    expect(result.game.game.run!.cards.drawPile[1].instanceId).toBe('card-3')
  })

  it('removes card from hand by instanceId', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [
          { ...score, instanceId: 'card-1' },
          { ...score, instanceId: 'card-2' },
        ],
        board: [],
        stack: [],
        discardPile: [],
      },
    })
    const effect: RemoveCardEffect = {
      type: 'remove-card',
      params: {
        instanceId: 'card-1',
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.hand).toHaveLength(1)
    expect(result.game.game.run!.cards.hand[0].instanceId).toBe('card-2')
  })

  it('removes card from board by instanceId', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [],
        board: [{ ...score, instanceId: 'card-1' }],
        stack: [],
        discardPile: [],
      },
    })
    const effect: RemoveCardEffect = {
      type: 'remove-card',
      params: {
        instanceId: 'card-1',
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.board).toHaveLength(0)
  })

  it('removes card from stack by instanceId', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [],
        board: [],
        stack: [{ ...score, instanceId: 'card-1' }],
        discardPile: [],
      },
    })
    const effect: RemoveCardEffect = {
      type: 'remove-card',
      params: {
        instanceId: 'card-1',
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.stack).toHaveLength(0)
  })

  it('removes card from discardPile by instanceId', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [],
        board: [],
        stack: [],
        discardPile: [
          { ...score, instanceId: 'card-1' },
          { ...score, instanceId: 'card-2' },
        ],
      },
    })
    const effect: RemoveCardEffect = {
      type: 'remove-card',
      params: {
        instanceId: 'card-2',
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.discardPile).toHaveLength(1)
    expect(result.game.game.run!.cards.discardPile[0].instanceId).toBe('card-1')
  })

  it('removes only the first matching card when multiple locations have cards', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [{ ...score, instanceId: 'card-1' }],
        hand: [{ ...score, instanceId: 'card-2' }],
        board: [{ ...score, instanceId: 'card-3' }],
        stack: [],
        discardPile: [],
      },
    })
    const effect: RemoveCardEffect = {
      type: 'remove-card',
      params: {
        instanceId: 'card-1',
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.drawPile).toHaveLength(0)
    expect(result.game.game.run!.cards.hand).toHaveLength(1)
    expect(result.game.game.run!.cards.board).toHaveLength(1)
  })

  it('does not remove any cards if instanceId is not found', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [{ ...score, instanceId: 'card-1' }],
        hand: [{ ...score, instanceId: 'card-2' }],
        board: [],
        stack: [],
        discardPile: [],
      },
    })
    const effect: RemoveCardEffect = {
      type: 'remove-card',
      params: {
        instanceId: 'non-existent',
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.drawPile).toHaveLength(1)
    expect(result.game.game.run!.cards.hand).toHaveLength(1)
  })

  it('does not mutate original game state', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [{ ...score, instanceId: 'card-1' }],
        hand: [],
        board: [],
        stack: [],
        discardPile: [],
      },
    })
    const effect: RemoveCardEffect = {
      type: 'remove-card',
      params: {
        instanceId: 'card-1',
      },
    }

    handleEffect(gameState, effect)

    expect(gameState.game.run!.cards.drawPile).toHaveLength(1) // Original unchanged
  })
})
