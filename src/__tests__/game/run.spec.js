import { describe, it, expect } from 'vitest'
import { moveCards, populateDrawPile, processStartOfGame } from '../../utils/run.js'

const baseRules = {
  name: "Example Rules",
  type: "rules",
  deckLimits: { size: [0, 0] },
  turnStructure: { drawAmount: 1, playAmount: 1 },
  endConditions: { rounds: 1 },
  effects: null,
  cost: 2
}

const rulesWithAddedCards = {
  name: "Example Rules",
  type: "rules",
  deckLimits: { size: [0, 0] },
  turnStructure: { drawAmount: 1, playAmount: 1 },
  endConditions: { rounds: 1 },
  effects: { gameStart: [["add-cards", "drawPile", { foo: 2, bar: 2 }]] },
  cost: 2
}

const preMoveRun = {
  cards: { 
    drawPile: ['a', 'b', 'c', 'd', 'e'], 
    hand: ['f', 'g', 'h', 'i'], 
    discardPile: [] 
  }
}

describe('moveCards', () => {
  it('moves top 3 cards from draw-pile to hand', () => {
    const result = moveCards(preMoveRun, 'drawPile', 'hand', 3)
    expect(result).toEqual({
      cards: { 
        drawPile: ['d', 'e'], 
        hand: ['f', 'g', 'h', 'i', 'a', 'b', 'c'], 
        discardPile: [] 
      }
    })
  })

  it('moves top 3 cards from draw-pile to discard', () => {
    const result = moveCards(preMoveRun, 'drawPile', 'discardPile', 3)
    expect(result).toEqual({
      cards: { 
        drawPile: ['d', 'e'], 
        hand: ['f', 'g', 'h', 'i'], 
        discardPile: ['a', 'b', 'c'] 
      }
    })
  })
})

const exampleCounter = { a: 3, b: 2, c: 1 }

const emptyHandRun = {
  resources: { points: 0 },
  cards: { drawPile: [], hand: [], discardPile: [] },
  deckInfo: { cards: exampleCounter, rulesCard: rulesWithAddedCards },
  data: {},
  effects: [],
  outcomes: []
}

const populateWithIdentity = (run) => populateDrawPile(run, (arr) => arr) // No shuffle

describe('populateDrawPile', () => {
  it('adds cards to draw-pile from deck', () => {
    const result = populateWithIdentity(emptyHandRun)
    const drawPileCounter = {}
    result.cards.drawPile.forEach(card => {
      drawPileCounter[card] = (drawPileCounter[card] || 0) + 1
    })
    expect(drawPileCounter).toEqual(exampleCounter)
  })
})

const populatedHandRun = {
  resources: { points: 0 },
  cards: { drawPile: ['a', 'a', 'a', 'b', 'b', 'c'], hand: [], discardPile: [] },
  deckInfo: { cards: exampleCounter, rulesCard: rulesWithAddedCards },
  data: {},
  effects: [],
  outcomes: []
}

const populatedHandRunNoAdded = {
  resources: { points: 0 },
  cards: { drawPile: ['a', 'a', 'a', 'b', 'b', 'c'], hand: [], discardPile: [] },
  deckInfo: { cards: exampleCounter, rulesCard: baseRules },
  data: {},
  effects: [],
  outcomes: []
}

const processStartWithIdentity = (run) => processStartOfGame(run, (arr) => arr) // No shuffle

describe('processStartOfGame', () => {
  it("doesn't modify cards in draw-pile when no cards are added", () => {
    const result = processStartWithIdentity(populatedHandRunNoAdded)
    expect(result.cards.drawPile).toEqual(populatedHandRunNoAdded.cards.drawPile)
  })

  it('adds cards to draw-pile from rules card', () => {
    const result = processStartWithIdentity(populatedHandRun)
    const drawPileCounter = {}
    result.cards.drawPile.forEach(card => {
      drawPileCounter[card] = (drawPileCounter[card] || 0) + 1
    })
    expect(drawPileCounter).toEqual({ a: 3, b: 2, c: 1, foo: 2, bar: 2 })
  })

  it('preserves original draw order when cards are added', () => {
    const result = processStartWithIdentity(populatedHandRun)
    const originalCards = result.cards.drawPile.filter(card => !['foo', 'bar'].includes(card))
    expect(originalCards).toEqual(populatedHandRun.cards.drawPile)
  })
})