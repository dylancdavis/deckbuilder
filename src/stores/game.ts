import { defineStore } from 'pinia'
import type { GameState } from '@/types/game'
import { cardRegistry } from '@/data/cards'

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    collection: {
      cards: {
        score: 9,
        'starter-rules': 1
      },
      decklists: {
        'starting-deck': {
          name: 'Starter Deck',
          cards: {},
          rulesCard: 'starter-rules',
          editable: false
        }
      }
    },
    run: null
  }),

  getters: {
    getCard: () => (cardId: string) => cardRegistry[cardId],
    
    getDeck: (state) => (deckId: string) => state.collection.decklists[deckId],
    
    getSelectedDeckCards: (state) => (deckId: string) => {
      const deck = state.collection.decklists[deckId]
      if (!deck) return []
      
      return Object.entries(deck.cards).map(([cardId, count]) => ({
        card: cardRegistry[cardId],
        cardId,
        count
      }))
    },

    isRunActive: (state) => state.run !== null,

    getCurrentResources: (state) => state.run?.resources || null
  },

  actions: {
    initializeDb() {
      // Reset to initial state if needed
    },

    addToDeck(deckId: string, cardId: string, count: number = 1) {
      const deck = this.collection.decklists[deckId]
      if (!deck || !deck.editable) return

      if (!deck.cards[cardId]) {
        deck.cards[cardId] = 0
      }
      deck.cards[cardId] += count

      // Ensure we don't exceed collection limits
      const availableInCollection = this.collection.cards[cardId] || 0
      const totalInAllDecks = this.getTotalCardUsage(cardId)
      
      if (totalInAllDecks > availableInCollection) {
        deck.cards[cardId] -= count
      }
    },

    removeFromDeck(deckId: string, cardId: string, count: number = 1) {
      const deck = this.collection.decklists[deckId]
      if (!deck || !deck.editable) return

      if (deck.cards[cardId]) {
        deck.cards[cardId] -= count
        if (deck.cards[cardId] <= 0) {
          delete deck.cards[cardId]
        }
      }
    },

    setDeckRulesCard(deckId: string, rulesCardId: string) {
      const deck = this.collection.decklists[deckId]
      if (deck && deck.editable) {
        deck.rulesCard = rulesCardId
      }
    },

    addNewDeck(name?: string) {
      const deckCount = Object.keys(this.collection.decklists).length
      const deckName = name || `New Deck ${deckCount}`
      const deckId = `deck-${Date.now()}`

      this.collection.decklists[deckId] = {
        name: deckName,
        cards: {},
        rulesCard: 'starter-rules',
        editable: true
      }

      return deckId
    },

    addToCollection(cardId: string, count: number = 1) {
      if (!this.collection.cards[cardId]) {
        this.collection.cards[cardId] = 0
      }
      this.collection.cards[cardId] += count
    },

    startRun(deckId: string) {
      const deck = this.collection.decklists[deckId]
      if (!deck) return

      const rulesCard = cardRegistry[deck.rulesCard]
      if (!rulesCard) return

      // Initialize run state
      this.run = {
        resources: {
          points: { display: 'Points', value: 0 }
        },
        cards: {
          drawPile: [],
          hand: [],
          board: [],
          discardPile: []
        },
        deckInfo: {
          cards: { ...deck.cards },
          rulesCard: deck.rulesCard
        },
        stats: {
          turn: {},
          round: {},
          drawnCards: {}
        },
        effects: [],
        outcomes: []
      }

      // Process game start effects
      if (rulesCard.effects?.gameStart) {
        for (const effect of rulesCard.effects.gameStart) {
          this.processGameStartEffect(effect)
        }
      }

      // Add deck cards to draw pile
      for (const [cardId, count] of Object.entries(deck.cards)) {
        for (let i = 0; i < count; i++) {
          this.run.cards.drawPile.push(cardId)
        }
      }

      // Shuffle draw pile
      this.shuffleDrawPile()
    },

    endRun() {
      this.run = null
    },

    gainResource(resourceType: string, amount: number) {
      if (!this.run) return

      if (resourceType === 'points') {
        this.run.resources.points.value += amount
      }
    },

    drawCards(count: number) {
      if (!this.run) return

      for (let i = 0; i < count && this.run.cards.drawPile.length > 0; i++) {
        const card = this.run.cards.drawPile.pop()
        if (card) {
          this.run.cards.hand.push(card)
        }
      }
    },

    playCard(cardId: string) {
      if (!this.run) return

      const handIndex = this.run.cards.hand.indexOf(cardId)
      if (handIndex === -1) return

      // Move card from hand to board
      this.run.cards.hand.splice(handIndex, 1)
      this.run.cards.board.push(cardId)

      // Process card event
      const card = cardRegistry[cardId]
      if (card?.event) {
        this.processCardEvent(card.event)
      }
    },

    processCardEvent(event: string[]) {
      if (!this.run) return

      const [action, ...args] = event

      switch (action) {
        case 'gain-resource':
          const [resourceType, amount] = args
          this.gainResource(resourceType, parseInt(amount))
          break
        case 'buy-basic':
          // Implement buy basic logic
          break
      }
    },

    processGameStartEffect(effect: string[]) {
      if (!this.run) return

      const [action, zone, cardsJson] = effect

      if (action === 'add-cards' && zone === 'draw-pile') {
        const cards = JSON.parse(cardsJson) as Record<string, number>
        for (const [cardId, count] of Object.entries(cards)) {
          for (let i = 0; i < count; i++) {
            this.run.cards.drawPile.push(cardId)
          }
        }
      }
    },

    shuffleDrawPile() {
      if (!this.run) return

      const pile = this.run.cards.drawPile
      for (let i = pile.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[pile[i], pile[j]] = [pile[j], pile[i]]
      }
    },

    getTotalCardUsage(cardId: string): number {
      return Object.values(this.collection.decklists)
        .reduce((total, deck) => total + (deck.cards[cardId] || 0), 0)
    }
  }
})