import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../../utils/effects'
import type { DrawCardsEffect } from '../../../utils/effects'
import { score, dualScore } from '../../../utils/cards'
import { createTestGameState } from './shared'

describe('DrawCardsEffect', () => {
  it('draws cards from drawPile into hand', () => {
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
      params: { amount: 2 },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.hand).toHaveLength(2)
    expect(result.game.game.run!.cards.drawPile).toHaveLength(1)
    expect(result.game.game.run!.cards.hand[0].instanceId).toBe('a')
    expect(result.game.game.run!.cards.hand[1].instanceId).toBe('b')
    expect(result.game.game.run!.cards.drawPile[0].instanceId).toBe('c')
  })

  it('appends drawn cards to existing hand', () => {
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

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.hand).toHaveLength(2)
    expect(result.game.game.run!.cards.hand[0].instanceId).toBe('a')
    expect(result.game.game.run!.cards.hand[1].instanceId).toBe('b')
  })

  it('draws nothing when drawPile is empty', () => {
    const gameState = createTestGameState()
    const effect: DrawCardsEffect = {
      type: 'draw-cards',
      params: { amount: 3 },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.hand).toHaveLength(0)
    expect(result.game.game.run!.cards.drawPile).toHaveLength(0)
    expect(result.events).toHaveLength(0)
  })

  it('draws only available cards when amount exceeds drawPile size', () => {
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
      params: { amount: 5 },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.hand).toHaveLength(1)
    expect(result.game.game.run!.cards.drawPile).toHaveLength(0)
    expect(result.events).toHaveLength(1)
  })

  it('emits card-draw events for each drawn card', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [
          { ...score, instanceId: 'a' },
          { ...dualScore, instanceId: 'b' },
        ],
        hand: [],
        board: [],
        discardPile: [],
      },
    })
    const effect: DrawCardsEffect = {
      type: 'draw-cards',
      params: { amount: 2 },
    }

    const result = handleEffect(gameState, effect)

    expect(result.events).toHaveLength(2)
    expect(result.events[0]).toMatchObject({
      type: 'card-draw',
      cardId: 'score',
      instanceId: 'a',
    })
    expect(result.events[1]).toMatchObject({
      type: 'card-draw',
      cardId: 'dual-score',
      instanceId: 'b',
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

    handleEffect(gameState, effect)

    expect(gameState.game.run!.cards.drawPile).toHaveLength(1)
    expect(gameState.game.run!.cards.hand).toHaveLength(0)
  })
})
