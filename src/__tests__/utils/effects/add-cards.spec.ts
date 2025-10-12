import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../../utils/effects'
import type { AddCardsEffect } from '../../../utils/effects'
import { dualScore } from '../../../utils/cards'
import { createTestRun } from './shared'

describe('AddCardsEffect', () => {
  it('adds single card to drawPile', () => {
    const run = createTestRun()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 1 },
      },
    }

    const result = handleEffect(run, effect)

    expect(result.cards.drawPile).toHaveLength(1)
    expect(result.cards.drawPile[0].id).toBe('score')
    expect(result.cards.drawPile[0].instanceId).toBeDefined()
  })

  it('adds multiple cards to drawPile', () => {
    const run = createTestRun()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 3, 'collect-basic': 1 },
      },
    }

    const result = handleEffect(run, effect)

    expect(result.cards.drawPile).toHaveLength(4)
    const scoreCards = result.cards.drawPile.filter((c) => c.id === 'score')
    const collectCards = result.cards.drawPile.filter((c) => c.id === 'collect-basic')
    expect(scoreCards).toHaveLength(3)
    expect(collectCards).toHaveLength(1)
  })

  it('adds cards to hand location', () => {
    const run = createTestRun()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'hand',
        cards: { 'dual-score': 2 },
      },
    }

    const result = handleEffect(run, effect)

    expect(result.cards.hand).toHaveLength(2)
    expect(result.cards.hand[0].id).toBe('dual-score')
  })

  it('adds cards to board location', () => {
    const run = createTestRun()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'board',
        cards: { score: 1 },
      },
    }

    const result = handleEffect(run, effect)

    expect(result.cards.board).toHaveLength(1)
  })

  it('adds cards to discardPile location', () => {
    const run = createTestRun()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'discardPile',
        cards: { score: 1 },
      },
    }

    const result = handleEffect(run, effect)

    expect(result.cards.discardPile).toHaveLength(1)
  })

  it('adds cards to end of existing pile (default mode)', () => {
    const run = createTestRun({
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

    const result = handleEffect(run, effect)

    expect(result.cards.drawPile).toHaveLength(2)
    expect(result.cards.drawPile[0].instanceId).toBe('foobar')
    expect(result.cards.drawPile[1].id).toBe('score')
  })

  it('adds cards to top when mode is "top"', () => {
    const run = createTestRun({
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

    const result = handleEffect(run, effect)

    expect(result.cards.drawPile).toHaveLength(2)
    expect(result.cards.drawPile[0].id).toBe('score')
    expect(result.cards.drawPile[1].instanceId).toBe('foobar')
  })

  it('assigns unique instanceId to each added card', () => {
    const run = createTestRun()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 3 },
      },
    }

    const result = handleEffect(run, effect)

    const instanceIds = result.cards.drawPile.map((c) => c.instanceId)
    const uniqueIds = new Set(instanceIds)
    expect(uniqueIds.size).toBe(3) // All unique
  })

  it('does not mutate original run', () => {
    const run = createTestRun()
    const effect: AddCardsEffect = {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { score: 1 },
      },
    }

    handleEffect(run, effect)

    expect(run.cards.drawPile).toHaveLength(0) // Original unchanged
  })
})
