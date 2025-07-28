import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../game'

describe('Game Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default state', () => {
    const gameStore = useGameStore()
    
    expect(gameStore.collection.cards.score).toBe(9)
    expect(gameStore.collection.cards['starter-rules']).toBe(1)
    expect(gameStore.run).toBeNull()
    expect(gameStore.isRunActive).toBe(false)
  })

  it('can add cards to collection', () => {
    const gameStore = useGameStore()
    
    gameStore.addToCollection('dual-score', 3)
    expect(gameStore.collection.cards['dual-score']).toBe(3)
  })

  it('can create new decks', () => {
    const gameStore = useGameStore()
    
    const deckId = gameStore.addNewDeck('Test Deck')
    const deck = gameStore.getDeck(deckId)
    
    expect(deck).toBeDefined()
    expect(deck?.name).toBe('Test Deck')
    expect(deck?.editable).toBe(true)
    expect(deck?.rulesCard).toBe('starter-rules')
  })

  it('can add cards to deck', () => {
    const gameStore = useGameStore()
    
    const deckId = gameStore.addNewDeck()
    gameStore.addToDeck(deckId, 'score', 2)
    
    const deck = gameStore.getDeck(deckId)
    expect(deck?.cards.score).toBe(2)
  })

  it('can start and end runs', () => {
    const gameStore = useGameStore()
    
    const deckId = gameStore.addNewDeck()
    gameStore.addToDeck(deckId, 'score', 2)
    
    gameStore.startRun(deckId)
    expect(gameStore.isRunActive).toBe(true)
    expect(gameStore.run).toBeDefined()
    expect(gameStore.run?.resources.points.value).toBe(0)
    
    gameStore.endRun()
    expect(gameStore.isRunActive).toBe(false)
    expect(gameStore.run).toBeNull()
  })

  it('processes game start effects correctly', () => {
    const gameStore = useGameStore()
    
    const deckId = gameStore.addNewDeck()
    gameStore.startRun(deckId)
    
    // Starter rules should add 7 score cards and 1 buy-basic to draw pile
    expect(gameStore.run?.cards.drawPile.length).toBe(8)
    expect(gameStore.run?.cards.drawPile.filter(card => card === 'score').length).toBe(7)
    expect(gameStore.run?.cards.drawPile.filter(card => card === 'buy-basic').length).toBe(1)
  })
})