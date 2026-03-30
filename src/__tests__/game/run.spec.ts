import { describe, it, expect } from 'vitest'
import {
  moveCardByIndex,
  moveCards,
  populateDrawPile,
  processStartOfGame,
  type Run,
} from '../../utils/run.js'
import { pileToIdCounter } from '../../utils/deck.ts'
import type { RulesCard } from '../../utils/cards.ts'
import type { GameState } from '../../utils/game.ts'
import type { AddCardsEffect } from '@/utils/effects.ts'

// Helper to wrap a Run in a minimal GameState for testing
const wrapInGameState = (run: Run): GameState => ({
  game: {
    collection: { cards: {}, decks: {} },
    run,
  },
  ui: { currentView: ['run'], collection: { selectedDeck: null } },
  viewData: { modalView: null, cardOptions: [], resolver: null },
})

const baseRules: RulesCard = {
  id: 'starter-rules',
  name: 'Example Rules',
  type: 'rules',
  art: {
    gradient: ['#4b4b4b', '#9e9e9e'],
    image: 'scarab',
  },
  deckLimits: { size: [0, 0] },
  turnStructure: { drawAmount: 1, playAmount: 1, discardAmount: 0 },
  endConditions: { rounds: 1 },
  effects: {
    gameStart: [],
  },
  abilities: [],
}

const addThreeScore: AddCardsEffect = {
  type: 'add-cards',
  params: {
    location: 'drawPile',
    cards: { score: 3 },
    mode: 'shuffle',
  },
}

const rulesWithAddedCards: RulesCard = {
  id: 'starter-rules',
  name: 'Example Rules',
  type: 'rules',
  art: {
    gradient: ['#4b4b4b', '#9e9e9e'],
    image: 'scarab',
  },
  deckLimits: { size: [0, 0] },
  turnStructure: { drawAmount: 1, playAmount: 1, discardAmount: 0 },
  endConditions: { rounds: 1 },
  effects: { gameStart: [addThreeScore] },
  abilities: [],
}

const preMoveRun: Partial<Run> = {
  cards: {
    drawPile: ['a', 'b', 'c', 'd', 'e'],
    hand: ['f', 'g', 'h', 'i'],
    discardPile: [],
    board: [],
  },
}

describe('moveCardByIndex', () => {
  it('moves card from hand to discard when toIndex is not specified', () => {
    const result = moveCardByIndex(preMoveRun, 'hand', 'discardPile', 1)
    expect(result).toEqual({
      cards: {
        drawPile: ['a', 'b', 'c', 'd', 'e'],
        hand: ['f', 'h', 'i'],
        discardPile: ['g'],
        board: [],
      },
    })
  })

  it('moves card from hand to specific index in board when toIndex is specified', () => {
    const result = moveCardByIndex(preMoveRun, 'hand', 'board', 2, 0)
    expect(result).toEqual({
      cards: {
        drawPile: ['a', 'b', 'c', 'd', 'e'],
        hand: ['f', 'g', 'i'],
        discardPile: [],
        board: ['h'],
      },
    })
  })
})

describe('moveCards', () => {
  it('moves top 3 cards from draw-pile to hand', () => {
    const result = moveCards(preMoveRun, 'drawPile', 'hand', 3)
    expect(result).toEqual({
      cards: {
        drawPile: ['d', 'e'],
        hand: ['f', 'g', 'h', 'i', 'a', 'b', 'c'],
        discardPile: [],
        board: [],
      },
    })
  })

  it('moves top 3 cards from draw-pile to discard', () => {
    const result = moveCards(preMoveRun, 'drawPile', 'discardPile', 3)
    expect(result).toEqual({
      cards: {
        drawPile: ['d', 'e'],
        hand: ['f', 'g', 'h', 'i'],
        discardPile: ['a', 'b', 'c'],
        board: [],
      },
    })
  })
})

const exampleCounter = { score: 4 }

const emptyHandRun: Run = {
  resources: { points: 0 },
  cards: { drawPile: [], hand: [], discardPile: [], board: [], stack: [] },
  deck: { name: '', cards: exampleCounter, rulesCard: rulesWithAddedCards },
  stats: { turns: 1, rounds: 1 },
}

describe('populateDrawPile', () => {
  it('adds cards to draw-pile from deck', () => {
    const result = populateDrawPile(emptyHandRun)
    const idCounter = pileToIdCounter(result.cards.drawPile)
    expect(idCounter).toEqual(exampleCounter)
  })
})

const a = { id: 'a' }
const b = { id: 'b' }
const c = { id: 'c' }
const examplePile = [a, a, a, b, b, c]

const populatedHandRun: Run = {
  resources: { points: 0 },
  cards: { drawPile: examplePile, hand: [], discardPile: [], board: [] },
  deck: { name: '', cards: exampleCounter, rulesCard: rulesWithAddedCards },
  stats: { turns: 1, rounds: 1 },
}

const populatedHandRunNoAdded: Run = {
  resources: { points: 0 },
  cards: { drawPile: examplePile, hand: [], discardPile: [], board: [] },
  deck: { name: '', cards: exampleCounter, rulesCard: baseRules },
  stats: { turns: 1, rounds: 1 },
}

describe('processStartOfGame', () => {
  it("doesn't modify cards in draw-pile when no cards are added", () => {
    const gameState = wrapInGameState(populatedHandRunNoAdded)
    const result = processStartOfGame(gameState)
    expect(result.game.run!.cards.drawPile).toEqual(populatedHandRunNoAdded.cards.drawPile)
  })

  it('adds cards to draw-pile from rules card', () => {
    const gameState = wrapInGameState(populatedHandRun)
    const result = processStartOfGame(gameState)
    const idCounter = pileToIdCounter(result.game.run!.cards.drawPile)
    expect(idCounter).toEqual({ a: 3, b: 2, c: 1, score: 3 })
  })
})
