import { describe, it, expect } from 'vitest'
import { resolveCard } from '../../../utils/game'
import { score, dualScore } from '../../../utils/cards'
import { createTestGameState } from '../effects/shared'
import { Resource } from '../../../utils/resource'

describe('resolveCard', () => {
  it('plays a card by instance ID', () => {
    const card1 = { ...score, instanceId: 'card-1' }
    const card2 = { ...score, instanceId: 'card-2' }
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [card1, card2],
        board: [],
        stack: [],
        discardPile: [],
      },
    })

    const result = resolveCard(gameState, 'card-1')

    expect(result.game.run!.cards.hand).toHaveLength(1)
    expect(result.game.run!.cards.hand[0].instanceId).toBe('card-2')
    expect(result.game.run!.cards.stack).toHaveLength(0)
    expect(result.game.run!.cards.discardPile).toHaveLength(1)
    expect(result.game.run!.cards.discardPile[0].instanceId).toBe('card-1')
  })

  it('throws error when instance ID not found in hand or stack', () => {
    const card1 = { ...score, instanceId: 'card-1' }
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [card1],
        board: [],
        stack: [],
        discardPile: [],
      },
    })

    expect(() => resolveCard(gameState, 'nonexistent-id')).toThrow(
      'Cannot resolve card: no card with instanceId nonexistent-id found in hand or stack',
    )
  })

  it('applies card effects before moving to discard', () => {
    const card1 = { ...score, instanceId: 'card-1' }
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [card1],
        board: [],
        stack: [],
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
    // Stack should be empty after resolution
    expect(result.game.run!.cards.stack).toHaveLength(0)
  })

  it('logs card play event', () => {
    const card1 = { ...score, instanceId: 'card-1' }
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [card1],
        board: [],
        stack: [],
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
        stack: [],
        discardPile: [],
      },
    })

    const result = resolveCard(gameState, 'card-2')

    expect(result.game.run!.cards.hand).toHaveLength(2)
    expect(result.game.run!.cards.hand[0].instanceId).toBe('card-1')
    expect(result.game.run!.cards.hand[1].instanceId).toBe('card-3')
    expect(result.game.run!.cards.stack).toHaveLength(0)
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
        stack: [],
        discardPile: [],
      },
    })

    const originalHandLength = gameState.game.run!.cards.hand.length
    const originalStackLength = gameState.game.run!.cards.stack.length
    const originalDiscardLength = gameState.game.run!.cards.discardPile.length

    resolveCard(gameState, 'card-1')

    expect(gameState.game.run!.cards.hand).toHaveLength(originalHandLength)
    expect(gameState.game.run!.cards.stack).toHaveLength(originalStackLength)
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
        stack: [],
        discardPile: [existingCard],
      },
    })

    const result = resolveCard(gameState, 'card-1')

    expect(result.game.run!.cards.discardPile).toHaveLength(2)
    expect(result.game.run!.cards.discardPile[0].instanceId).toBe('existing')
    expect(result.game.run!.cards.discardPile[1].instanceId).toBe('card-1')
  })

  it('can resolve card from stack (for continuation after choice)', () => {
    const card1 = { ...score, instanceId: 'card-1' }
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [],
        board: [],
        stack: [card1],
        discardPile: [],
      },
    })

    const result = resolveCard(gameState, 'card-1')

    expect(result.game.run!.cards.hand).toHaveLength(0)
    expect(result.game.run!.cards.stack).toHaveLength(0)
    expect(result.game.run!.cards.discardPile).toHaveLength(1)
    expect(result.game.run!.cards.discardPile[0].instanceId).toBe('card-1')
  })

  it("transforms 'self' in remove-card effect to card's instanceId", () => {
    const cardWithSelfRemoval = {
      ...score,
      instanceId: 'card-1',
      abilities: {
        'on-play': [
          { type: 'update-resource' as const, params: { resource: Resource.POINTS, delta: 1 } },
          { type: 'remove-card' as const, params: { instanceId: 'self' as const } },
        ],
      },
    }
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [cardWithSelfRemoval],
        board: [],
        stack: [],
        discardPile: [],
      },
      resources: {
        points: 0,
      },
    })

    const result = resolveCard(gameState, 'card-1')

    // Effect should have been applied
    expect(result.game.run!.resources.points).toBe(1)
    // Card should not be in discard pile (removed instead)
    expect(result.game.run!.cards.discardPile).toHaveLength(0)
    // Card should not be in any location
    expect(result.game.run!.cards.hand).toHaveLength(0)
    expect(result.game.run!.cards.stack).toHaveLength(0)
  })
})
