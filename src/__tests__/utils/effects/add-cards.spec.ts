import { describe, it, expect } from 'vitest'
import { applyEffect } from '../../../utils/effects'
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
        mode: 'shuffle',
      },
    }

    const result = applyEffect(gameState, effect)

    expect(result.game.game.run!.cards.drawPile).toHaveLength(1)
    expect(result.game.game.run!.cards.drawPile[0].id).toBe('score')
    expect(result.game.game.run!.cards.drawPile[0].instanceId).toBeDefined()
  })

  it('adds card to hand location', () => {
    const gameState = createTestGameState()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'hand',
        cards: { 'dual-score': 1 },
        mode: 'shuffle',
      },
    }

    const result = applyEffect(gameState, effect)

    expect(result.game.game.run!.cards.hand).toHaveLength(1)
    expect(result.game.game.run!.cards.hand[0].id).toBe('dual-score')
  })

  it('adds card to board location', () => {
    const gameState = createTestGameState()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'board',
        cards: { score: 1 },
        mode: 'shuffle',
      },
    }

    const result = applyEffect(gameState, effect)

    expect(result.game.game.run!.cards.board).toHaveLength(1)
  })

  it('adds card to discardPile location', () => {
    const gameState = createTestGameState()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'discardPile',
        cards: { score: 1 },
        mode: 'shuffle',
      },
    }

    const result = applyEffect(gameState, effect)

    expect(result.game.game.run!.cards.discardPile).toHaveLength(1)
  })

  it('adds card to bottom of existing pile when mode is "bottom"', () => {
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
        mode: 'bottom',
      },
    }

    const result = applyEffect(gameState, effect)

    expect(result.game.game.run!.cards.drawPile).toHaveLength(2)
    expect(result.game.game.run!.cards.drawPile[0].instanceId).toBe('foobar')
    expect(result.game.game.run!.cards.drawPile[1].id).toBe('score')
  })

  it('adds card to top when mode is "top"', () => {
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

    const result = applyEffect(gameState, effect)

    expect(result.game.game.run!.cards.drawPile).toHaveLength(2)
    expect(result.game.game.run!.cards.drawPile[0].id).toBe('score')
    expect(result.game.game.run!.cards.drawPile[1].instanceId).toBe('foobar')
  })

  it('assigns unique instanceId to added card', () => {
    const gameState = createTestGameState()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 1 },
        mode: 'shuffle',
      },
    }

    const result = applyEffect(gameState, effect)

    const instanceId = result.game.game.run!.cards.drawPile[0].instanceId
    expect(instanceId).toBeDefined()
    expect(typeof instanceId).toBe('string')
    expect(instanceId.length).toBeGreaterThan(0)
  })

  it('emits card-add event', () => {
    const gameState = createTestGameState()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 1 },
        mode: 'shuffle',
      },
    }

    const result = applyEffect(gameState, effect)

    expect(result.event).toMatchObject({
      type: 'card-add',
      cardId: 'score',
      toLocation: 'drawPile',
    })
  })

  it('does not mutate original game state', () => {
    const gameState = createTestGameState()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 1 },
        mode: 'shuffle',
      },
    }

    applyEffect(gameState, effect)

    expect(gameState.game.run!.cards.drawPile).toHaveLength(0) // Original unchanged
  })
})
