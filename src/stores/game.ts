import { ref, computed, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { startingDeck, discardTestDeck, moveTestDeck, choiceTestDeck } from '../constants.ts'
import type { Counter } from '@/utils/counter.ts'
import type { PlayableCardID, RulesCard, CardID, RulesCardID } from '@/utils/cards.ts'
import { cards } from '@/utils/cards.ts'
import { initializeRun } from '@/utils/run.ts'
import { add, sub } from '@/utils/counter.ts'
import type { GameState } from '@/utils/game.ts'
import { handleEffect } from '@/utils/effects.ts'
import { handleEvent } from '@/utils/ability-processor.ts'
import type { TurnEndEvent } from '@/utils/event.ts'

const initialCollectionCards: Counter<CardID> = {
  score: 4,
  'collect-basic': 4,
  'dual-score': 4,
  'save-reward': 4,
  'zero-reward': 4,
  'point-reset': 4,
  'point-multiply': 4,
  'score-surge': 4,
  'score-synergy': 4,
  'point-loan': 4,
  'last-resort': 4,
  'starter-rules': 1,
  // Test cards
  'test-rules': 1,
  'discard-test-rules': 1,
  'hand-board-discard': 4,
  'move-test-rules': 1,
  'hand-to-board': 4,
  'double-choice': 4,
  'choice-draw': 4,
  'draw-watcher': 4,
  'draw-bonus': 4,
  'choice-add-choice': 4,
  'choice-test-rules': 1,
}

export const useGameStore = defineStore('game', () => {
  const gameState: Ref<GameState> = ref({
    game: {
      collection: {
        cards: initialCollectionCards,
        decks: {
          startingDeck: startingDeck,
          discardTestDeck: discardTestDeck,
          moveTestDeck: moveTestDeck,
          choiceTestDeck: choiceTestDeck,
        },
      },
      run: null,
    },
    ui: {
      currentView: ['collection'],
      collection: { selectedDeck: null },
    },
    viewData: {
      modalView: null,
      cardOptions: [],
      resolver: null,
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
  const modalView = computed(() => gameState.value.viewData.modalView)
  const cardOptions = computed(() => gameState.value.viewData.cardOptions)

  // Actions
  function selectDeck(key: string | null) {
    gameState.value.ui.collection.selectedDeck = key
  }

  function startRun() {
    gameState.value.ui.currentView = ['run']
    gameState.value = initializeRun(gameState.value)

    // Handle edge case: run-start abilities immediately ended the run
    if (gameState.value.game.run?.events.some((e) => e.type === 'run-end')) {
      endRun()
    }
  }

  function endRun() {
    gameState.value.ui.currentView = ['collection']
    gameState.value.game.run = null
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

  function addDeck(name: string) {
    const newDeckKey = crypto.randomUUID()
    gameState.value.game.collection.decks[newDeckKey] = {
      name: name,
      rulesCard: null,
      cards: {},
    }
    return newDeckKey
  }

  function tryPlayCard(instanceId: string) {
    const { game, events } = handleEffect(gameState.value, {
      type: 'play-card',
      params: { instanceId },
    })
    gameState.value = events.reduce((state, event) => handleEvent(state, event), game)
  }

  function nextTurn() {
    const run = gameState.value.game.run
    if (!run || !run.deck.rulesCard) return

    const turnEndEvent: TurnEndEvent = {
      type: 'turn-end',
      round: run.stats.rounds,
      turn: run.stats.turns,
    }
    gameState.value = handleEvent(gameState.value, turnEndEvent)

    // If run-end occurred during ability processing, clean up
    if (gameState.value.game.run?.events.some((e) => e.type === 'run-end')) {
      endRun()
    }
  }

  return {
    gameState,
    run,
    runDeck,
    addDeck,
    runCards,
    resources,
    view,
    collection,
    selectedDeck,
    selectedDeckKey,
    modalView,
    cardOptions,
    selectDeck,
    startRun,
    tryPlayCard,
    nextTurn,
    endRun,
    changeDeckName,
    addCardToDeck,
    removeCardFromDeck,
    setDeckRulesCard,
    clearDeckRulesCard,
  }
})
