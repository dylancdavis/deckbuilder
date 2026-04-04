import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../../utils/effects'
import type { MoveCardEffect } from '../../../utils/effects'
import { score, dualScore, collectBasic } from '../../../utils/cards'
import { createTestGameState } from './shared'

describe('MoveCardEffect', () => {
  describe('instanceIds variant', () => {
    it('moves specific cards by instanceId to target location', () => {
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
        params: { instanceIds: ['a', 'b'], to: 'discardPile' },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.cards.hand).toHaveLength(0)
      expect(result.game.game.run!.cards.board).toHaveLength(0)
      expect(result.game.game.run!.cards.discardPile).toHaveLength(2)
    })

    it('emits CardMoveEvent with correct fromLocation and toLocation', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [{ ...score, instanceId: 'a' }],
          hand: [{ ...dualScore, instanceId: 'b' }],
          board: [],
          discardPile: [],
        },
      })
      const effect: MoveCardEffect = {
        type: 'move-card',
        params: { instanceIds: ['a', 'b'], to: 'board' },
      }

      const result = handleEffect(gameState, effect)

      expect(result.events).toHaveLength(2)
      expect(result.events).toContainEqual(
        expect.objectContaining({
          type: 'card-move',
          instanceId: 'a',
          fromLocation: 'drawPile',
          toLocation: 'board',
        }),
      )
      expect(result.events).toContainEqual(
        expect.objectContaining({
          type: 'card-move',
          instanceId: 'b',
          fromLocation: 'hand',
          toLocation: 'board',
        }),
      )
    })

    it('ignores instanceIds not found', () => {
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
        params: { instanceIds: ['a', 'nonexistent'], to: 'board' },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.cards.board).toHaveLength(1)
      expect(result.events).toHaveLength(1)
    })
  })

  describe('amount variant', () => {
    it('moves N cards from the front of source to target', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [
            { ...score, instanceId: 'a' },
            { ...dualScore, instanceId: 'b' },
            { ...collectBasic, instanceId: 'c' },
          ],
          hand: [],
          board: [],
          discardPile: [],
        },
      })
      const effect: MoveCardEffect = {
        type: 'move-card',
        params: { from: 'drawPile', amount: 2, to: 'hand' },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.cards.drawPile).toHaveLength(1)
      expect(result.game.game.run!.cards.drawPile[0].instanceId).toBe('c')
      expect(result.game.game.run!.cards.hand).toHaveLength(2)
    })

    it('moves all cards when amount is "all"', () => {
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
        params: { from: 'hand', amount: 'all', to: 'discardPile' },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.cards.hand).toHaveLength(0)
      expect(result.game.game.run!.cards.discardPile).toHaveLength(2)
    })

    it('moves only available cards when amount exceeds source size', () => {
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
        params: { from: 'hand', amount: 5, to: 'board' },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.cards.hand).toHaveLength(0)
      expect(result.game.game.run!.cards.board).toHaveLength(1)
      expect(result.events).toHaveLength(1)
    })
  })

  describe('matching variant', () => {
    it('moves all matching cards from source to target', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [],
          hand: [
            { ...score, instanceId: 'a' },
            { ...dualScore, instanceId: 'b' },
            { ...score, instanceId: 'c' },
          ],
          board: [],
          discardPile: [],
        },
      })
      const effect: MoveCardEffect = {
        type: 'move-card',
        params: { from: 'hand', matching: { cardId: 'score' }, to: 'board' },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.cards.hand).toHaveLength(1)
      expect(result.game.game.run!.cards.hand[0].instanceId).toBe('b')
      expect(result.game.game.run!.cards.board).toHaveLength(2)
      expect(result.events).toHaveLength(2)
    })

    it('moves nothing when no cards match', () => {
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
        params: { from: 'hand', matching: { cardId: 'dual-score' }, to: 'board' },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.cards.hand).toHaveLength(1)
      expect(result.game.game.run!.cards.board).toHaveLength(0)
      expect(result.events).toHaveLength(0)
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

      const result = handleEffect(gameState, effect)

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

      const result = handleEffect(gameState, effect)

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

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.cards.board).toHaveLength(2)
      const ids = result.game.game.run!.cards.board.map((c) => c.instanceId)
      expect(ids).toContain('existing')
      expect(ids).toContain('new')
    })
  })

  describe('only affects the specified location', () => {
    const makeState = () =>
      createTestGameState({
        cards: {
          drawPile: [
            { ...score, instanceId: 'd1' },
            { ...score, instanceId: 'd2' },
          ],
          hand: [
            { ...score, instanceId: 'h1' },
            { ...dualScore, instanceId: 'h2' },
          ],
          board: [
            { ...score, instanceId: 'b1' },
            { ...dualScore, instanceId: 'b2' },
          ],
          discardPile: [],
        },
      })

    it('amount: moves from drawPile, hand and board unchanged', () => {
      const effect: MoveCardEffect = {
        type: 'move-card',
        params: { from: 'drawPile', amount: 2, to: 'discardPile' },
      }

      const result = handleEffect(makeState(), effect)

      expect(result.game.game.run!.cards.drawPile).toHaveLength(0)
      expect(result.game.game.run!.cards.hand).toHaveLength(2)
      expect(result.game.game.run!.cards.board).toHaveLength(2)
      expect(result.game.game.run!.cards.discardPile).toHaveLength(2)
    })

    it('matching: moves from drawPile, hand and board unchanged', () => {
      const effect: MoveCardEffect = {
        type: 'move-card',
        params: { from: 'drawPile', matching: { cardId: 'score' }, to: 'discardPile' },
      }

      const result = handleEffect(makeState(), effect)

      expect(result.game.game.run!.cards.drawPile).toHaveLength(0)
      expect(result.game.game.run!.cards.hand).toHaveLength(2)
      expect(result.game.game.run!.cards.board).toHaveLength(2)
      expect(result.game.game.run!.cards.discardPile).toHaveLength(2)
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

    handleEffect(gameState, effect)

    expect(gameState.game.run!.cards.hand).toHaveLength(1)
    expect(gameState.game.run!.cards.board).toHaveLength(0)
  })
})
