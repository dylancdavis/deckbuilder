import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../../utils/effects'
import { handleEvent } from '../../../utils/ability-processor'
import { score, dualScore } from '../../../utils/cards'
import { createTestGameState } from '../effects/shared'
import { Resource } from '../../../utils/resource'
import type { GameState } from '../../../utils/game'
import type { PlayCardEffect } from '../../../utils/effects'

/** Helper that mirrors what the store does: handleEffect + reduce events through handleEvent */
function playCard(gameState: GameState, instanceId: string): GameState {
  const effect: PlayCardEffect = { type: 'play-card', params: { instanceId } }
  const { game, events } = handleEffect(gameState, effect)
  return events.reduce((state, event) => handleEvent(state, event), game)
}

describe('play-card effect', () => {
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

    const result = playCard(gameState, 'card-1')

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

    expect(() => playCard(gameState, 'nonexistent-id')).toThrow(
      'Cannot play card: no card with instanceId nonexistent-id found in hand',
    )
  })

  it('applies card effects after moving to discard', () => {
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

    const result = playCard(gameState, 'card-1')

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

    const result = playCard(gameState, 'card-1')

    expect(result.game.run!.events).toHaveLength(2)
    expect(result.game.run!.events[0]).toEqual({
      type: 'card-play',
      round: 2,
      turn: 3,
      cardId: 'score',
      instanceId: 'card-1',
    })
    // The score card's effect triggers a resource-change event
    expect(result.game.run!.events[1]).toEqual({
      type: 'resource-change',
      round: 2,
      turn: 3,
      resource: 'points',
      oldValue: 0,
      newValue: 1,
      delta: 1,
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

    const result = playCard(gameState, 'card-2')

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

    playCard(gameState, 'card-1')

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

    const result = playCard(gameState, 'card-1')

    expect(result.game.run!.cards.discardPile).toHaveLength(2)
    expect(result.game.run!.cards.discardPile[0].instanceId).toBe('existing')
    expect(result.game.run!.cards.discardPile[1].instanceId).toBe('card-1')
  })

  it("transforms 'self' in remove-card effect to card's instanceId", () => {
    const cardWithSelfRemoval = {
      ...score,
      instanceId: 'card-1',
      abilities: [
        {
          trigger: { on: 'card-play' as const, target: 'self' as const },
          effects: [
            { type: 'update-resource' as const, params: { resource: Resource.POINTS, delta: 1 } },
            { type: 'remove-card' as const, params: { instanceId: 'self' as const } },
          ],
        },
      ],
    }
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [cardWithSelfRemoval],
        board: [],
        discardPile: [],
      },
      resources: {
        points: 0,
      },
    })

    const result = playCard(gameState, 'card-1')

    // Effect should have been applied
    expect(result.game.run!.resources.points).toBe(1)
    // Card should not be in discard pile (removed instead)
    expect(result.game.run!.cards.discardPile).toHaveLength(0)
    // Card should not be in any location
    expect(result.game.run!.cards.hand).toHaveLength(0)
    expect(result.game.run!.cards.board).toHaveLength(0)
  })
})
