import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../../utils/effects'
import type { AddCardsEffect } from '../../../utils/effects'
import { dualScore } from '../../../utils/cards'
import { createTestGameState } from './shared'

describe('AddCardsEffect', () => {
  it('adds single card to drawPile', () => {
    const gameState = createTestGameState()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 1 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.drawPile).toHaveLength(1)
    expect(result.game.game.run!.cards.drawPile[0].id).toBe('score')
    expect(result.game.game.run!.cards.drawPile[0].instanceId).toBeDefined()
  })

  it('adds multiple cards to drawPile', () => {
    const gameState = createTestGameState()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 3, 'collect-basic': 1 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.drawPile).toHaveLength(4)
    const scoreCards = result.game.game.run!.cards.drawPile.filter((c) => c.id === 'score')
    const collectCards = result.game.game.run!.cards.drawPile.filter((c) => c.id === 'collect-basic')
    expect(scoreCards).toHaveLength(3)
    expect(collectCards).toHaveLength(1)
  })

  it('adds cards to hand location', () => {
    const gameState = createTestGameState()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'hand',
        cards: { 'dual-score': 2 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.hand).toHaveLength(2)
    expect(result.game.game.run!.cards.hand[0].id).toBe('dual-score')
  })

  it('adds cards to board location', () => {
    const gameState = createTestGameState()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'board',
        cards: { score: 1 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.board).toHaveLength(1)
  })

  it('adds cards to discardPile location', () => {
    const gameState = createTestGameState()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'discardPile',
        cards: { score: 1 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.discardPile).toHaveLength(1)
  })

  it('adds cards to end of existing pile (default mode)', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [{ ...dualScore, instanceId: 'foobar' }],
        hand: [],
        board: [],
        discardPile: [],
      },
    })
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 1 },
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.drawPile).toHaveLength(2)
    expect(result.game.game.run!.cards.drawPile[0].instanceId).toBe('foobar')
    expect(result.game.game.run!.cards.drawPile[1].id).toBe('score')
  })

  it('adds cards to top when mode is "top"', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [{ ...dualScore, instanceId: 'foobar' }],
        hand: [],
        board: [],
        discardPile: [],
      },
    })
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 1 },
        mode: 'top',
      },
    }

    const result = handleEffect(gameState, effect)

    expect(result.game.game.run!.cards.drawPile).toHaveLength(2)
    expect(result.game.game.run!.cards.drawPile[0].id).toBe('score')
    expect(result.game.game.run!.cards.drawPile[1].instanceId).toBe('foobar')
  })

  it('assigns unique instanceId to each added card', () => {
    const gameState = createTestGameState()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 3 },
      },
    }

    const result = handleEffect(gameState, effect)

    const instanceIds = result.game.game.run!.cards.drawPile.map((c) => c.instanceId)
    const uniqueIds = new Set(instanceIds)
    expect(uniqueIds.size).toBe(3) // All unique
  })

  it('does not mutate original game state', () => {
    const gameState = createTestGameState()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 1 },
      },
    }

    handleEffect(gameState, effect)

    expect(gameState.game.run!.cards.drawPile).toHaveLength(0) // Original unchanged
  })
})
