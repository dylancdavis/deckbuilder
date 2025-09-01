import { ref, computed, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { startingDeck } from '../constants.ts'
import type { Counter } from '@/utils/counter.ts'
import type { PlayableCardID, PlayableCard, RulesCard, CardID, RulesCardID } from '@/utils/cards.ts'
import { cards } from '@/utils/cards.ts'
import { processStartOfGame } from '@/utils/run.ts'
import { add, sub } from '@/utils/counter.ts'

export enum Resource {
  POINTS = 'points',
}

export type Deck = {
  name: string
  rulesCard: RulesCard | null
  cards: Counter<PlayableCardID>
  editable: boolean
}

export type Collection = {
  cards: Counter<CardID>
  decks: Record<string, Deck>
}

export type Run = {
  deck: Deck
  cards: {
    drawPile: PlayableCard[]
    hand: PlayableCard[]
    board: PlayableCard[]
    discardPile: PlayableCard[]
  }
  resources: { points: number }
  stats: { turns: number; rounds: number }
}

type GameState = {
  game: {
    collection: Collection
    run: Run | null
  }
  ui: {
    currentView: string[]
    collection: {
      selectedDeck: string | null
    }
  }
  viewData: {
    modalView: string | null
  }
}

export const useGameStore = defineStore('game', () => {
  const gameState: Ref<GameState> = ref({
    game: {
      collection: {
        cards: { score: 9, 'starter-rules': 1 },
        decks: { startingDeck: startingDeck },
      },
      run: null,
    },
    ui: {
      currentView: ['collection'],
      collection: { selectedDeck: null },
    },
    viewData: {
      modalView: null,
    },
  })

  // Getters
  const run = computed(() => gameState.value.game.run)
  const runDeck = computed(() => gameState.value.game.run?.deck)
  const runCards = computed(() => gameState.value.game.run?.cards)
  const resources = computed(() => gameState.value.game.run?.resources)
  const view = computed(() => gameState.value.ui.currentView)
  const collection = computed(() => gameState.value.game.collection)
  const selectedDeckKey = computed(() => gameState.value.ui.collection.selectedDeck)
  const selectedDeck = computed(() => {
    const key = selectedDeckKey.value
    return key ? gameState.value.game.collection.decks[key] : null
  })

  // Actions
  function initializeDb() {
    gameState.value = {
      game: {
        collection: {
          cards: { score: 9, 'starter-rules': 1 },
          decks: { startingDeck: startingDeck },
        },
        run: null,
      },
      ui: {
        currentView: ['collection'],
        collection: { selectedDeck: null },
      },
      viewData: {
        modalView: null,
      },
    }
  }

  function selectDeck(key: string | null) {
    gameState.value.ui.collection.selectedDeck = key
  }

  function startRun(deck: Deck) {
    gameState.value.ui.currentView = ['run']
    gameState.value.game.run = makeRun(deck)
  }

  function endRun() {
    gameState.value.ui.currentView = ['collection']
    gameState.value.game.run = null
  }

  function gainResource(resourceName: Resource, amount: number) {
    if (gameState.value.game.run) {
      gameState.value.game.run.resources[resourceName] =
        (gameState.value.game.run.resources[resourceName] || 0) + amount
    }
  }

  function buyBasic() {
    gameState.value.viewData = { modalView: 'buy-basic' }
  }

  function drawCards(n: number) {
    if (gameState.value.game.run) {
      const drawPile = gameState.value.game.run.cards.drawPile
      const hand = gameState.value.game.run.cards.hand

      for (let i = 0; i < n && drawPile.length > 0; i++) {
        const card = drawPile.pop()
        if (card) {
          hand.push(card)
        }
      }

      // Update the run state
      gameState.value.game.run.cards.drawPile = drawPile
      gameState.value.game.run.cards.hand = hand
    }
  }

  function changeDeckName(oldName: string, newName: string) {
    if (gameState.value.game.collection.decks[oldName]) {
      gameState.value.game.collection.decks[oldName].name = newName
    }
  }

  function addCardToDeck(deckKey: string, cardId: PlayableCardID) {
    const deck = gameState.value.game.collection.decks[deckKey]
    const collection = gameState.value.game.collection

    if (!deck) return
    if (!collection.cards[cardId] || collection.cards[cardId]! <= 0) return

    // Add card to deck configuration (collection still owns the card)
    deck.cards = add(deck.cards, cardId)
  }

  function removeCardFromDeck(deckKey: string, cardId: PlayableCardID) {
    const deck = gameState.value.game.collection.decks[deckKey]

    if (!deck) return
    if (!deck.cards[cardId] || deck.cards[cardId]! <= 0) return

    // Remove card from deck configuration (card remains in collection)
    deck.cards = sub(deck.cards, cardId)
  }

  function setDeckRulesCard(deckKey: string, rulesCardId: RulesCardID) {
    const deck = gameState.value.game.collection.decks[deckKey]
    if (!deck) return

    // Set rules card (just reference from cards collection)
    deck.rulesCard = cards[rulesCardId] as RulesCard
  }

  function clearDeckRulesCard(deckKey: string) {
    const deck = gameState.value.game.collection.decks[deckKey]
    if (!deck) return

    // Clear rules card - need to handle this based on deck structure requirements
    // For now, setting to starter rules as fallback
    deck.rulesCard = null
  }

  function makeRun(deck: Deck): Run {
    const baseRun: Run = {
      deck: deck,
      cards: { drawPile: [], hand: [], board: [], discardPile: [] },
      resources: { points: 0 },
      stats: { turns: 0, rounds: 0 },
    }

    return processStartOfGame(baseRun)
  }

  function nextTurn() {
    const run = gameState.value.game.run
    if (!run || !run.deck.rulesCard) return

    // Increment turn counter
    run.stats.turns += 1

    const turnStructure = run.deck.rulesCard.turnStructure

    // Handle discarding cards from hand to discard pile
    const discardAmount = turnStructure.discardAmount
    if (discardAmount === 'all') {
      // Move all cards from hand to discard pile
      const cardsToDiscard = run.cards.hand.length
      if (cardsToDiscard > 0) {
        run.cards.discardPile.push(...run.cards.hand)
        run.cards.hand = []
      }
    } else if (typeof discardAmount === 'number' && discardAmount > 0) {
      // Move specified number of cards from hand to discard pile
      const cardsToDiscard = Math.min(discardAmount, run.cards.hand.length)
      for (let i = 0; i < cardsToDiscard; i++) {
        const card = run.cards.hand.shift()
        if (card) {
          run.cards.discardPile.push(card)
        }
      }
    }

    debugger

    // Draw new cards from draw pile to hand
    drawCards(turnStructure.drawAmount)
  }

  // Initialize the store on creation
  initializeDb()

  return {
    gameState,
    run,
    runDeck,
    runCards,
    resources,
    view,
    collection,
    selectedDeck,
    selectedDeckKey,
    initializeDb,
    selectDeck,
    startRun,
    nextTurn,
    endRun,
    gainResource,
    buyBasic,
    drawCards,
    changeDeckName,
    addCardToDeck,
    removeCardFromDeck,
    setDeckRulesCard,
    clearDeckRulesCard,
  }
})
