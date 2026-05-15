import { describe, it, expect } from 'vitest'
import { applyEffect } from '../../../utils/effects'
import type { MoveCardEffect } from '../../../utils/effects'
import { score, dualScore } from '../../../utils/cards'
import { createTestGameState } from './shared'

describe('MoveCardEffect', () => {
  describe('single instanceId variant', () => {
    it('moves a specific card by instanceId to target location', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [],
          hand: [{ ...score, instanceId: 'a' }],
          board: [{ ...dualScore, instanceId: 'b' }],
          discardPile: [],
        },
      })
      const effect: MoveCardEffect = {
        type: 'move-card',
        params: { instanceIds: ['a'], to: 'discardPile' },
      }

      const result = applyEffect(gameState, effect)

      expect(result.game.game.run!.cards.hand).toHaveLength(0)
      expect(result.game.game.run!.cards.board).toHaveLength(1)
      expect(result.game.game.run!.cards.discardPile).toHaveLength(1)
    })

    it('emits CardMoveEvent with correct fromLocation and toLocation', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [{ ...score, instanceId: 'a' }],
          hand: [],
          board: [],
          discardPile: [],
        },
      })
      const effect: MoveCardEffect = {
        type: 'move-card',
        params: { instanceIds: ['a'], to: 'board' },
      }

      const result = applyEffect(gameState, effect)

      expect(result.event).toMatchObject({
        type: 'card-move',
        instanceId: 'a',
        fromLocation: 'drawPile',
        toLocation: 'board',
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
      const effect: MoveCardEffect = {
        type: 'move-card',
        params: { instanceIds: ['nonexistent'], to: 'board' },
      }

      const result = applyEffect(gameState, effect)

      expect(result.game.game.run!.cards.board).toHaveLength(0)
      expect(result.event).toBeNull()
    })
  })

  describe('non-decomposed variants throw', () => {
    it('throws for non-decomposed amount variant', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [{ ...score, instanceId: 'a' }],
          hand: [],
          board: [],
          discardPile: [],
        },
      })
      const effect: MoveCardEffect = {
        type: 'move-card',
        params: { from: 'drawPile', amount: 2, to: 'hand' },
      } as MoveCardEffect

      expect(() => applyEffect(gameState, effect)).toThrow('must be decomposed')
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
      const effect: MoveCardEffect = {
        type: 'move-card',
        params: { instanceIds: ['a', 'b'], to: 'board' },
      }

      expect(() => applyEffect(gameState, effect)).toThrow('must be decomposed')
    })
  })

  describe('position', () => {
    it('appends to target by default', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [],
          hand: [{ ...score, instanceId: 'new' }],
          board: [{ ...dualScore, instanceId: 'existing' }],
          discardPile: [],
        },
      })
      const effect: MoveCardEffect = {
        type: 'move-card',
        params: { instanceIds: ['new'], to: 'board' },
      }

      const result = applyEffect(gameState, effect)

      expect(result.game.game.run!.cards.board).toHaveLength(2)
      expect(result.game.game.run!.cards.board[0].instanceId).toBe('existing')
      expect(result.game.game.run!.cards.board[1].instanceId).toBe('new')
    })

    it('"top" prepends to target', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [],
          hand: [{ ...score, instanceId: 'new' }],
          board: [{ ...dualScore, instanceId: 'existing' }],
          discardPile: [],
        },
      })
      const effect: MoveCardEffect = {
        type: 'move-card',
        params: { instanceIds: ['new'], to: 'board', position: 'top' },
      }

      const result = applyEffect(gameState, effect)

      expect(result.game.game.run!.cards.board).toHaveLength(2)
      expect(result.game.game.run!.cards.board[0].instanceId).toBe('new')
      expect(result.game.game.run!.cards.board[1].instanceId).toBe('existing')
    })

    it('"shuffle" results in all cards present in target', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [],
          hand: [{ ...score, instanceId: 'new' }],
          board: [{ ...dualScore, instanceId: 'existing' }],
          discardPile: [],
        },
      })
      const effect: MoveCardEffect = {
        type: 'move-card',
        params: { instanceIds: ['new'], to: 'board', position: 'shuffle' },
      }

      const result = applyEffect(gameState, effect)

      expect(result.game.game.run!.cards.board).toHaveLength(2)
      const ids = result.game.game.run!.cards.board.map((c) => c.instanceId)
      expect(ids).toContain('existing')
      expect(ids).toContain('new')
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
    const effect: MoveCardEffect = {
      type: 'move-card',
      params: { instanceIds: ['a'], to: 'board' },
    }

    applyEffect(gameState, effect)

    expect(gameState.game.run!.cards.hand).toHaveLength(1)
    expect(gameState.game.run!.cards.board).toHaveLength(0)
  })
})
