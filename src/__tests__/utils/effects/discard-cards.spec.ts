import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../../utils/effects'
import type { DiscardCardsEffect } from '../../../utils/effects'
import { score, dualScore, collectBasic } from '../../../utils/cards'
import { createTestGameState } from './shared'

describe('DiscardCardsEffect', () => {
  describe('instanceIds variant', () => {
    it('discards specific cards by instanceId from any location', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [],
          hand: [{ ...score, instanceId: 'a' }],
          stack: [],
          board: [{ ...dualScore, instanceId: 'b' }],
          discardPile: [],
        },
      })
      const effect: DiscardCardsEffect = {
        type: 'discard-cards',
        params: { instanceIds: ['a', 'b'] },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.cards.hand).toHaveLength(0)
      expect(result.game.game.run!.cards.board).toHaveLength(0)
      expect(result.game.game.run!.cards.discardPile).toHaveLength(2)
    })

    it('emits card-discard events with correct fromLocation', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [{ ...score, instanceId: 'a' }],
          hand: [{ ...dualScore, instanceId: 'b' }],
          stack: [],
          board: [],
          discardPile: [],
        },
      })
      const effect: DiscardCardsEffect = {
        type: 'discard-cards',
        params: { instanceIds: ['a', 'b'] },
      }

      const result = handleEffect(gameState, effect)

      expect(result.events).toHaveLength(2)
      expect(result.events).toContainEqual(
        expect.objectContaining({
          type: 'card-discard',
          instanceId: 'a',
          fromLocation: 'drawPile',
        }),
      )
      expect(result.events).toContainEqual(
        expect.objectContaining({
          type: 'card-discard',
          instanceId: 'b',
          fromLocation: 'hand',
        }),
      )
    })

    it('ignores instanceIds that are not found', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [],
          hand: [{ ...score, instanceId: 'a' }],
          stack: [],
          board: [],
          discardPile: [],
        },
      })
      const effect: DiscardCardsEffect = {
        type: 'discard-cards',
        params: { instanceIds: ['a', 'nonexistent'] },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.cards.discardPile).toHaveLength(1)
      expect(result.events).toHaveLength(1)
    })
  })

  describe('amount variant', () => {
    it('discards N cards from the front of the specified location', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [
            { ...score, instanceId: 'a' },
            { ...dualScore, instanceId: 'b' },
            { ...collectBasic, instanceId: 'c' },
          ],
          hand: [],
          stack: [],
          board: [],
          discardPile: [],
        },
      })
      const effect: DiscardCardsEffect = {
        type: 'discard-cards',
        params: { from: 'drawPile', amount: 2 },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.cards.drawPile).toHaveLength(1)
      expect(result.game.game.run!.cards.drawPile[0].instanceId).toBe('c')
      expect(result.game.game.run!.cards.discardPile).toHaveLength(2)
    })

    it('discards all cards when amount is "all"', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [],
          hand: [
            { ...score, instanceId: 'a' },
            { ...dualScore, instanceId: 'b' },
          ],
          stack: [],
          board: [],
          discardPile: [],
        },
      })
      const effect: DiscardCardsEffect = {
        type: 'discard-cards',
        params: { from: 'hand', amount: 'all' },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.cards.hand).toHaveLength(0)
      expect(result.game.game.run!.cards.discardPile).toHaveLength(2)
    })

    it('discards only available cards when amount exceeds location size', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [],
          hand: [{ ...score, instanceId: 'a' }],
          stack: [],
          board: [],
          discardPile: [],
        },
      })
      const effect: DiscardCardsEffect = {
        type: 'discard-cards',
        params: { from: 'hand', amount: 5 },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.cards.hand).toHaveLength(0)
      expect(result.game.game.run!.cards.discardPile).toHaveLength(1)
      expect(result.events).toHaveLength(1)
    })
  })

  describe('matching variant', () => {
    it('discards all matching cards from the specified location', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [],
          hand: [
            { ...score, instanceId: 'a' },
            { ...dualScore, instanceId: 'b' },
            { ...score, instanceId: 'c' },
          ],
          stack: [],
          board: [],
          discardPile: [],
        },
      })
      const effect: DiscardCardsEffect = {
        type: 'discard-cards',
        params: { from: 'hand', matching: { cardId: 'score' } },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.cards.hand).toHaveLength(1)
      expect(result.game.game.run!.cards.hand[0].instanceId).toBe('b')
      expect(result.game.game.run!.cards.discardPile).toHaveLength(2)
      expect(result.events).toHaveLength(2)
    })

    it('discards nothing when no cards match', () => {
      const gameState = createTestGameState({
        cards: {
          drawPile: [],
          hand: [{ ...score, instanceId: 'a' }],
          stack: [],
          board: [],
          discardPile: [],
        },
      })
      const effect: DiscardCardsEffect = {
        type: 'discard-cards',
        params: { from: 'hand', matching: { cardId: 'dual-score' } },
      }

      const result = handleEffect(gameState, effect)

      expect(result.game.game.run!.cards.hand).toHaveLength(1)
      expect(result.game.game.run!.cards.discardPile).toHaveLength(0)
      expect(result.events).toHaveLength(0)
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
          stack: [],
          board: [
            { ...score, instanceId: 'b1' },
            { ...dualScore, instanceId: 'b2' },
          ],
          discardPile: [],
        },
      })

    it('amount: discards from drawPile without touching hand or board', () => {
      const effect: DiscardCardsEffect = {
        type: 'discard-cards',
        params: { from: 'drawPile', amount: 2 },
      }

      const result = handleEffect(makeState(), effect)

      expect(result.game.game.run!.cards.drawPile).toHaveLength(0)
      expect(result.game.game.run!.cards.hand).toHaveLength(2)
      expect(result.game.game.run!.cards.board).toHaveLength(2)
      expect(result.game.game.run!.cards.discardPile).toHaveLength(2)
    })

    it('matching: discards matched cards from drawPile without touching hand or board', () => {
      const effect: DiscardCardsEffect = {
        type: 'discard-cards',
        params: { from: 'drawPile', matching: { cardId: 'score' } },
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
        stack: [],
        board: [],
        discardPile: [],
      },
    })
    const effect: DiscardCardsEffect = {
      type: 'discard-cards',
      params: { instanceIds: ['a'] },
    }

    handleEffect(gameState, effect)

    expect(gameState.game.run!.cards.hand).toHaveLength(1)
    expect(gameState.game.run!.cards.discardPile).toHaveLength(0)
  })
})
