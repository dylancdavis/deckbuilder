import { describe, it, expect } from 'vitest'
import { applyEffect } from '../../../utils/effects'
import type { DrawCardsEffect } from '../../../utils/effects'
import { score, dualScore } from '../../../utils/cards'
import { createTestGameState } from './shared'

describe('DrawCardsEffect', () => {
  it('draws a card from drawPile into hand', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [
          { ...score, instanceId: 'a' },
          { ...score, instanceId: 'b' },
          { ...score, instanceId: 'c' },
        ],
        hand: [],
        board: [],
        discardPile: [],
      },
    })
    const effect: DrawCardsEffect = {
      type: 'draw-cards',
      params: { amount: 1 },
    }

    const result = applyEffect(gameState, effect)

    expect(result.game.game.run!.cards.hand).toHaveLength(1)
    expect(result.game.game.run!.cards.drawPile).toHaveLength(2)
    expect(result.game.game.run!.cards.hand[0].instanceId).toBe('a')
    expect(result.game.game.run!.cards.drawPile[0].instanceId).toBe('b')
  })

  it('appends drawn card to existing hand', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [{ ...score, instanceId: 'b' }],
        hand: [{ ...dualScore, instanceId: 'a' }],
        board: [],
        discardPile: [],
      },
    })
    const effect: DrawCardsEffect = {
      type: 'draw-cards',
      params: { amount: 1 },
    }

    const result = applyEffect(gameState, effect)

    expect(result.game.game.run!.cards.hand).toHaveLength(2)
    expect(result.game.game.run!.cards.hand[0].instanceId).toBe('a')
    expect(result.game.game.run!.cards.hand[1].instanceId).toBe('b')
  })

  it('draws nothing when drawPile is empty', () => {
    const gameState = createTestGameState()
    const effect: DrawCardsEffect = {
      type: 'draw-cards',
      params: { amount: 1 },
    }

    const result = applyEffect(gameState, effect)

    expect(result.game.game.run!.cards.hand).toHaveLength(0)
    expect(result.game.game.run!.cards.drawPile).toHaveLength(0)
    expect(result.event).toBeNull()
  })

  it('emits a card-draw event for the drawn card', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [{ ...score, instanceId: 'a' }],
        hand: [],
        board: [],
        discardPile: [],
      },
    })
    const effect: DrawCardsEffect = {
      type: 'draw-cards',
      params: { amount: 1 },
    }

    const result = applyEffect(gameState, effect)

    expect(result.event).toMatchObject({
      type: 'card-draw',
      cardId: 'score',
      instanceId: 'a',
    })
  })

  it('does not mutate original game state', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [{ ...score, instanceId: 'a' }],
        hand: [],
        board: [],
        discardPile: [],
      },
    })
    const effect: DrawCardsEffect = {
      type: 'draw-cards',
      params: { amount: 1 },
    }

    applyEffect(gameState, effect)

    expect(gameState.game.run!.cards.drawPile).toHaveLength(1)
    expect(gameState.game.run!.cards.hand).toHaveLength(0)
  })
})
