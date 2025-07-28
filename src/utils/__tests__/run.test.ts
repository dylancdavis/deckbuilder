import { describe, it, expect } from 'vitest'
import type { RunState, Card } from '@/types/game'

// Run utility functions adapted from ClojureScript implementation
export function moveCards(runState: RunState, fromZone: keyof RunState['cards'], toZone: keyof RunState['cards'], count: number): RunState {
  const fromCards = [...runState.cards[fromZone]]
  const toCards = [...runState.cards[toZone]]
  
  const movedCards = fromCards.splice(0, count)
  toCards.unshift(...movedCards)
  
  return {
    ...runState,
    cards: {
      ...runState.cards,
      [fromZone]: fromCards,
      [toZone]: toCards
    }
  }
}

export function populateDrawPile(runState: RunState, shuffleFn: (cards: string[]) => string[] = (cards) => cards): RunState {
  const deckCards: string[] = []
  
  for (const [cardId, count] of Object.entries(runState.deckInfo.cards)) {
    for (let i = 0; i < count; i++) {
      deckCards.push(cardId)
    }
  }
  
  return {
    ...runState,
    cards: {
      ...runState.cards,
      drawPile: shuffleFn(deckCards)
    }
  }
}

export function processStartOfGame(runState: RunState, shuffleFn: (cards: string[]) => string[] = (cards) => cards): RunState {
  const rulesCard = runState.deckInfo.rulesCard as any as Card
  
  if (!rulesCard?.effects?.gameStart) {
    return runState
  }
  
  let newRunState = { ...runState }
  
  for (const effect of rulesCard.effects.gameStart) {
    const [action, zone, cardsData] = effect
    
    if (action === 'add-cards' && zone === 'draw-pile') {
      const cardsToAdd: string[] = []
      
      const cardsToAddData = typeof cardsData === 'string' ? JSON.parse(cardsData) : cardsData
      for (const [cardId, count] of Object.entries(cardsToAddData as Record<string, number>)) {
        for (let i = 0; i < count; i++) {
          cardsToAdd.push(cardId)
        }
      }
      
      // Insert at random positions to preserve original order
      const newDrawPile = [...newRunState.cards.drawPile]
      cardsToAdd.forEach(card => {
        const randomIndex = Math.floor(Math.random() * (newDrawPile.length + 1))
        newDrawPile.splice(randomIndex, 0, card)
      })
      
      newRunState = {
        ...newRunState,
        cards: {
          ...newRunState.cards,
          drawPile: newDrawPile
        }
      }
    }
  }
  
  return newRunState
}

describe('Run Utilities', () => {
  const baseRules: Card = {
    name: 'Example Rules',
    description: 'Test rules',
    cost: 2,
    type: 'rules',
    deckLimits: { size: [0, 0] },
    turnStructure: {
      drawAmount: 1,
      playAmount: 1,
      discardAmount: 'all'
    },
    endConditions: { rounds: 1 },
    effects: undefined
  }

  const rulesWithAddedCards: Card = {
    ...baseRules,
    effects: {
      gameStart: [['add-cards', 'draw-pile', JSON.stringify({ foo: 2, bar: 2 })]]
    }
  }

  const preMoveRun: RunState = {
    resources: { points: { display: 'Points', value: 0 } },
    cards: {
      drawPile: ['a', 'b', 'c', 'd', 'e'],
      hand: ['f', 'g', 'h', 'i'],
      board: [],
      discardPile: []
    },
    deckInfo: {
      cards: {},
      rulesCard: 'base-rules'
    },
    stats: { turn: {}, round: {}, drawnCards: {} },
    effects: [],
    outcomes: []
  }

  describe('moveCards', () => {
    it('moves cards between zones correctly', () => {
      const result1 = moveCards(preMoveRun, 'drawPile', 'hand', 3)
      expect(result1.cards.drawPile).toEqual(['d', 'e'])
      expect(result1.cards.hand).toEqual(['a', 'b', 'c', 'f', 'g', 'h', 'i'])
      expect(result1.cards.discardPile).toEqual([])

      const result2 = moveCards(preMoveRun, 'drawPile', 'discardPile', 3)
      expect(result2.cards.drawPile).toEqual(['d', 'e'])
      expect(result2.cards.hand).toEqual(['f', 'g', 'h', 'i'])
      expect(result2.cards.discardPile).toEqual(['a', 'b', 'c'])
    })
  })

  const exampleCounter = { a: 3, b: 2, c: 1 }

  const emptyHandRun: RunState = {
    resources: { points: { display: 'Points', value: 0 } },
    cards: {
      drawPile: [],
      hand: [],
      board: [],
      discardPile: []
    },
    deckInfo: {
      cards: exampleCounter,
      rulesCard: 'rules-with-added-cards'
    },
    stats: { turn: {}, round: {}, drawnCards: {} },
    effects: [],
    outcomes: []
  }

  describe('populateDrawPile', () => {
    it('adds cards to draw pile from deck', () => {
      const identity = (cards: string[]) => cards
      const result = populateDrawPile(emptyHandRun, identity)
      
      const frequencies: Record<string, number> = {}
      result.cards.drawPile.forEach(card => {
        frequencies[card] = (frequencies[card] || 0) + 1
      })
      
      expect(frequencies).toEqual(exampleCounter)
    })
  })

  const populatedHandRun: RunState = {
    resources: { points: { display: 'Points', value: 0 } },
    cards: {
      drawPile: ['a', 'a', 'a', 'b', 'b', 'c'],
      hand: [],
      board: [],
      discardPile: []
    },
    deckInfo: {
      cards: exampleCounter,
      rulesCard: rulesWithAddedCards as any
    },
    stats: { turn: {}, round: {}, drawnCards: {} },
    effects: [],
    outcomes: []
  }

  const populatedHandRunNoAdded: RunState = {
    ...populatedHandRun,
    deckInfo: {
      ...populatedHandRun.deckInfo,
      rulesCard: baseRules as any
    }
  }

  describe('processStartOfGame', () => {
    it('preserves draw pile when no cards are added', () => {
      const identity = (cards: string[]) => cards
      const result = processStartOfGame(populatedHandRunNoAdded, identity)
      expect(result.cards.drawPile).toEqual(populatedHandRunNoAdded.cards.drawPile)
    })

    it('adds cards to draw pile from rules card', () => {
      const identity = (cards: string[]) => cards
      const result = processStartOfGame(populatedHandRun, identity)
      
      const frequencies: Record<string, number> = {}
      result.cards.drawPile.forEach(card => {
        frequencies[card] = (frequencies[card] || 0) + 1
      })
      
      expect(frequencies).toEqual({ a: 3, b: 2, c: 1, foo: 2, bar: 2 })
    })

    it('preserves original draw order when cards are added', () => {
      const identity = (cards: string[]) => cards
      const result = processStartOfGame(populatedHandRun, identity)
      
      const originalCards = result.cards.drawPile.filter(card => !['foo', 'bar'].includes(card))
      expect(originalCards).toEqual(populatedHandRun.cards.drawPile)
    })
  })
})