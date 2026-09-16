import { describe, it, expect } from 'vitest'
import { applyCommand } from '../../../utils/commands'
import type { DiscardCardsCommand } from '../../../utils/commands'
import { score, dualScore } from '../../../utils/cards'
import { createTestGameState } from './shared'

describe('DiscardCardsCommand', () => {
  describe('single instanceId variant', () => {
    it('discards a specific card by instanceId', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [],
          hand: [{ ...score, instanceId: 'a' }],
          board: [{ ...dualScore, instanceId: 'b' }],
          discardPile: [],
        },
      })
      const command: DiscardCardsCommand = {
        type: 'discard-cards',
        params: { instanceIds: ['a'] },
      }

      const result = applyCommand(gameState, command)

      expect(result.game.game.run!.cards.hand).toHaveLength(0)
      expect(result.game.game.run!.cards.board).toHaveLength(1)
      expect(result.game.game.run!.cards.discardPile).toHaveLength(1)
    })

    it('emits card-discard event with correct fromLocation', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [{ ...score, instanceId: 'a' }],
          hand: [],
          board: [],
          discardPile: [],
        },
      })
      const command: DiscardCardsCommand = {
        type: 'discard-cards',
        params: { instanceIds: ['a'] },
      }

      const result = applyCommand(gameState, command)

      expect(result.event).toMatchObject({
        type: 'card-discard',
        instanceId: 'a',
        fromLocation: 'drawPile',
      })
    })

    it('returns null event when instanceId is not found', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [],
          hand: [{ ...score, instanceId: 'a' }],
          board: [],
          discardPile: [],
        },
      })
      const command: DiscardCardsCommand = {
        type: 'discard-cards',
        params: { instanceIds: ['nonexistent'] },
      }

      const result = applyCommand(gameState, command)

      expect(result.game.game.run!.cards.discardPile).toHaveLength(0)
      expect(result.event).toBeNull()
    })
  })

  describe('non-decomposed variants throw', () => {
    it('throws for non-decomposed amount variant', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [],
          hand: [{ ...score, instanceId: 'a' }],
          board: [],
          discardPile: [],
        },
      })
      const command: DiscardCardsCommand = {
        type: 'discard-cards',
        params: { from: 'hand', amount: 2 },
      } as DiscardCardsCommand

      expect(() => applyCommand(gameState, command)).toThrow('must be decomposed')
    })

    it('throws for non-decomposed multi-instanceId variant', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [],
          hand: [
            { ...score, instanceId: 'a' },
            { ...dualScore, instanceId: 'b' },
          ],
          board: [],
          discardPile: [],
        },
      })
      const command: DiscardCardsCommand = {
        type: 'discard-cards',
        params: { instanceIds: ['a', 'b'] },
      }

      expect(() => applyCommand(gameState, command)).toThrow('must be decomposed')
    })
  })

  it('does not mutate original game state', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [{ ...score, instanceId: 'a' }],
        board: [],
        discardPile: [],
      },
    })
    const command: DiscardCardsCommand = {
      type: 'discard-cards',
      params: { instanceIds: ['a'] },
    }

    applyCommand(gameState, command)

    expect(gameState.game.run!.cards.hand).toHaveLength(1)
    expect(gameState.game.run!.cards.discardPile).toHaveLength(0)
  })
})
