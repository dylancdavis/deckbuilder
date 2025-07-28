import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { cards } from '../utils/cards.js'
import { startingDeckList } from '../constants.js'

export const useGameStore = defineStore('game', () => {
  const gameState = ref({
    game: {
      collection: {
        cards: { [cards.score]: 9, [cards.starterRules]: 1 },
        decklists: { startingDeck: startingDeckList }
      },
      run: null
    },
    ui: {
      currentView: ['collection'],
      collection: { selectedDeck: null }
    }
  })

  // Getters
  const run = computed(() => gameState.value.game.run)
  const runDeck = computed(() => gameState.value.game.run?.deckInfo)
  const runCards = computed(() => gameState.value.game.run?.cards)
  const resources = computed(() => gameState.value.game.run?.resources)
  const view = computed(() => gameState.value.ui.currentView)
  const collection = computed(() => gameState.value.game.collection)
  const selectedDeckKey = computed(() => gameState.value.ui.collection.selectedDeck)
  const selectedDeck = computed(() => {
    const key = selectedDeckKey.value
    return key ? gameState.value.game.collection.decklists[key] : null
  })

  // Actions
  function initializeDb() {
    gameState.value = {
      game: {
        collection: {
          cards: { [cards.score]: 9, [cards.starterRules]: 1 },
          decklists: { startingDeck: startingDeckList }
        },
        run: null
      },
      ui: {
        currentView: ['collection'],
        collection: { selectedDeck: null }
      }
    }
  }

  function selectDeck(deckName) {
    gameState.value.ui.collection.selectedDeck = deckName
  }

  function startRun(deck) {
    gameState.value.ui.currentView = ['run']
    gameState.value.game.run = makeRun(deck)
  }

  function endRun() {
    gameState.value.ui.currentView = ['collection']
    gameState.value.game.run = null
  }

  function gainResource(resourceName, amount) {
    if (gameState.value.game.run) {
      gameState.value.game.run.resources[resourceName] = 
        (gameState.value.game.run.resources[resourceName] || 0) + amount
    }
  }

  function buyBasic() {
    gameState.value.viewData = { modalView: 'buy-basic' }
  }

  function drawCards(n) {
    if (gameState.value.game.run) {
      // Implement draw cards logic here
    }
  }

  function changeDeckName(key, newName) {
    if (gameState.value.game.collection.decklists[key]) {
      gameState.value.game.collection.decklists[key].name = newName
    }
  }

  // Placeholder for makeRun function - will implement when migrating run logic
  function makeRun(deck) {
    return {
      deckInfo: deck,
      cards: { hand: [], drawPile: [], discardPile: [] },
      resources: { points: 0 }
    }
  }

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
    changeDeckName
  }
})
