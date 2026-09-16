import { describe, it, expect } from 'vitest'
import { applyCommand } from '../../../utils/commands'
import type { DrawCardsCommand } from '../../../utils/commands'
import { score, dualScore } from '../../../utils/cards'
import { createTestGameState } from './shared'

describe('DrawCardsCommand', () => {
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
    const command: DrawCardsCommand = {
      type: 'draw-cards',
      params: { amount: 1 },
    }

    const result = applyCommand(gameState, command)

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
    const command: DrawCardsCommand = {
      type: 'draw-cards',
      params: { amount: 1 },
    }

    const result = applyCommand(gameState, command)

    expect(result.game.game.run!.cards.hand).toHaveLength(2)
    expect(result.game.game.run!.cards.hand[0].instanceId).toBe('a')
    expect(result.game.game.run!.cards.hand[1].instanceId).toBe('b')
  })

  it('draws nothing when drawPile is empty', () => {
    const gameState = createTestGameState()
    const command: DrawCardsCommand = {
      type: 'draw-cards',
      params: { amount: 1 },
    }

    const result = applyCommand(gameState, command)

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
    const command: DrawCardsCommand = {
      type: 'draw-cards',
      params: { amount: 1 },
    }

    const result = applyCommand(gameState, command)

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
    const command: DrawCardsCommand = {
      type: 'draw-cards',
      params: { amount: 1 },
    }

    applyCommand(gameState, command)

    expect(gameState.game.run!.cards.drawPile).toHaveLength(1)
    expect(gameState.game.run!.cards.hand).toHaveLength(0)
  })
})
