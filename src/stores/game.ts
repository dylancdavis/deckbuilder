import { ref, computed, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { startingDeck } from '../constants.ts'
import type { Counter } from '@/utils/counter.ts'
import type { PlayableCardID, PlayableCard, RulesCard, CardID } from '@/utils/cards.ts'
import { processStartOfGame } from '@/utils/run.ts'
import { add, sub } from '@/utils/counter.ts'

export enum Resource {
  POINTS = 'points',
}

export type Deck = {
  name: string
  rulesCard: RulesCard
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
  stats: Record<string, number>
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

    // Add card to deck
    deck.cards = add(deck.cards, cardId)

    // Remove card from collection
    collection.cards = sub(collection.cards, cardId)
  }

  function removeCardFromDeck(deckKey: string, cardId: PlayableCardID) {
    const deck = gameState.value.game.collection.decks[deckKey]
    const collection = gameState.value.game.collection

    if (!deck) return
    if (!deck.cards[cardId] || deck.cards[cardId]! <= 0) return

    // Remove card from deck
    deck.cards = sub(deck.cards, cardId)

    // Add card back to collection
    collection.cards = add(collection.cards, cardId)
  }

  function makeRun(deck: Deck): Run {

    const baseRun: Run = {
      deck: deck,
      cards: { drawPile: [], hand: [], board: [], discardPile: [] },
      resources: { points: 0 },
      stats: { turns: 0, score: 0 },
    }

    return processStartOfGame(baseRun)
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
    endRun,
    gainResource,
    buyBasic,
    drawCards,
    changeDeckName,
    addCardToDeck,
    removeCardFromDeck,
  }
})
