import { describe, it, expect } from 'vitest'
import { resolveCard } from '../../../utils/game'
import { score, dualScore } from '../../../utils/cards'
import { createTestGameState } from '../effects/shared'

describe('resolveCard', () => {
  it('plays a card by instance ID', () => {
    const card1 = { ...score, instanceId: 'card-1' }
    const card2 = { ...score, instanceId: 'card-2' }
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [card1, card2],
        board: [],
        discardPile: [],
      },
    })

    const result = resolveCard(gameState, 'card-1')

    expect(result.game.run!.cards.hand).toHaveLength(1)
    expect(result.game.run!.cards.hand[0].instanceId).toBe('card-2')
    expect(result.game.run!.cards.discardPile).toHaveLength(1)
    expect(result.game.run!.cards.discardPile[0].instanceId).toBe('card-1')
  })

  it('throws error when instance ID not found in hand', () => {
    const card1 = { ...score, instanceId: 'card-1' }
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [card1],
        board: [],
        discardPile: [],
      },
    })

    expect(() => resolveCard(gameState, 'nonexistent-id')).toThrow(
      'Cannot resolve card: no card with instanceId nonexistent-id found in hand',
    )
  })

  it('applies card effects before moving to discard', () => {
    const card1 = { ...score, instanceId: 'card-1' }
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [card1],
        board: [],
        discardPile: [],
      },
      resources: {
        points: 0,
      },
    })

    const result = resolveCard(gameState, 'card-1')

    // Score card gives 1 point
    expect(result.game.run!.resources.points).toBe(1)
    // Card moved to discard
    expect(result.game.run!.cards.discardPile).toHaveLength(1)
  })

  it('logs card play event', () => {
    const card1 = { ...score, instanceId: 'card-1' }
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [card1],
        board: [],
        discardPile: [],
      },
      stats: {
        turns: 3,
        rounds: 2,
      },
    })

    const result = resolveCard(gameState, 'card-1')

    expect(result.game.run!.events).toHaveLength(1)
    expect(result.game.run!.events[0]).toEqual({
      type: 'card-play',
      round: 2,
      turn: 3,
      cardId: 'score',
    })
  })

  it('removes correct card when multiple cards with same ID exist', () => {
    const card1 = { ...score, instanceId: 'card-1' }
    const card2 = { ...score, instanceId: 'card-2' }
    const card3 = { ...score, instanceId: 'card-3' }
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [card1, card2, card3],
        board: [],
        discardPile: [],
      },
    })

    const result = resolveCard(gameState, 'card-2')

    expect(result.game.run!.cards.hand).toHaveLength(2)
    expect(result.game.run!.cards.hand[0].instanceId).toBe('card-1')
    expect(result.game.run!.cards.hand[1].instanceId).toBe('card-3')
    expect(result.game.run!.cards.discardPile).toHaveLength(1)
    expect(result.game.run!.cards.discardPile[0].instanceId).toBe('card-2')
  })

  it('does not mutate original game state', () => {
    const card1 = { ...score, instanceId: 'card-1' }
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [card1],
        board: [],
        discardPile: [],
      },
    })

    const originalHandLength = gameState.game.run!.cards.hand.length
    const originalDiscardLength = gameState.game.run!.cards.discardPile.length

    resolveCard(gameState, 'card-1')

    expect(gameState.game.run!.cards.hand).toHaveLength(originalHandLength)
    expect(gameState.game.run!.cards.discardPile).toHaveLength(originalDiscardLength)
  })

  it('adds card to end of discard pile when discard already has cards', () => {
    const card1 = { ...score, instanceId: 'card-1' }
    const card2 = { ...dualScore, instanceId: 'card-2' }
    const existingCard = { ...score, instanceId: 'existing' }
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [card1, card2],
        board: [],
        discardPile: [existingCard],
      },
    })

    const result = resolveCard(gameState, 'card-1')

    expect(result.game.run!.cards.discardPile).toHaveLength(2)
    expect(result.game.run!.cards.discardPile[0].instanceId).toBe('existing')
    expect(result.game.run!.cards.discardPile[1].instanceId).toBe('card-1')
  })
})
