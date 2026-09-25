import { ref, computed, watch, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { presetSaves, type PresetSave } from '../constants.ts'
import type { PlayableCardID, CardID, RulesCardID } from '@/utils/cards.ts'
import { initializeRun } from '@/utils/run.ts'
import { add, set, sub } from '@/utils/counter.ts'
import type { GameState } from '@/utils/game.ts'
import { handleCommand } from '@/utils/ability-processor.ts'
import type { Collection } from '@/utils/collection.ts'
import {
  loadCollection,
  parseCollection,
  saveCollection,
  serializeCollection,
} from '@/utils/persistence.ts'

/** A fresh copy of a preset save, so edits never reach the shared constants. */
function presetCollection(preset: PresetSave): Collection {
  return structuredClone(presetSaves[preset])
}

function initialCollection(): Collection {
  try {
    return loadCollection(localStorage) ?? presetCollection('default')
  } catch (error) {
    console.error('Discarding invalid saved collection', error)
    return presetCollection('default')
  }
}

export const useGameStore = defineStore('game', () => {
  const gameState: Ref<GameState> = ref({
    game: {
      collection: initialCollection(),
      run: null,
    },
    ui: {
      currentView: ['collection'],
      collection: { selectedDeck: null },
    },
    viewData: {
      modalView: null,
      cardOptions: [],
      pendingChoice: null,
    },
  })

  watch(
    () => gameState.value.game.collection,
    (collection) => saveCollection(localStorage, collection),
    { deep: true },
  )

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

  function setView(view: string[]) {
    gameState.value.ui.currentView = view
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

    deck.rulesCardId = rulesCardId
  }

  function clearDeckRulesCard(deckKey: string) {
    const deck = gameState.value.game.collection.decks[deckKey]
    if (!deck) return

    deck.rulesCardId = null
  }

  function addDeck(name: string) {
    const newDeckKey = crypto.randomUUID()
    gameState.value.game.collection.decks[newDeckKey] = {
      name: name,
      rulesCardId: null,
      cards: {},
    }
    return newDeckKey
  }

  function setCardQuantity(cardId: CardID, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error(`Invalid card quantity for ${cardId}: ${quantity}`)
    }
    const collection = gameState.value.game.collection
    collection.cards = set(collection.cards, cardId, quantity)
  }

  function loadPresetSave(preset: PresetSave) {
    gameState.value.game.collection = presetCollection(preset)
    gameState.value.ui.collection.selectedDeck = null
  }

  function exportSave() {
    return serializeCollection(gameState.value.game.collection)
  }

  /** Replaces the collection with a serialized one. Throws if the save is invalid. */
  function importSave(json: string) {
    gameState.value.game.collection = parseCollection(json)
    gameState.value.ui.collection.selectedDeck = null
  }

  function openEventLog() {
    if (!gameState.value.game.run) return
    gameState.value.viewData.modalView = 'event-log'
  }

  function closeEventLog() {
    gameState.value.viewData.modalView = null
  }

  /**
   * Declares an attack from one board card against another. Target legality is
   * enforced by the view; this only turns the interaction into an attack command.
   */
  function resolveAttack(attackerInstanceId: string, targetInstanceId: string) {
    if (!gameState.value.game.run) return

    gameState.value = handleCommand(
      gameState.value,
      {
        type: 'attack',
        params: { instanceId: attackerInstanceId, targetInstanceId },
      },
      { kind: 'player' },
    )
  }

  function tryPlayCard(instanceId: string) {
    gameState.value = handleCommand(
      gameState.value,
      { type: 'play-card', params: { instanceId } },
      { kind: 'player' },
    )
  }

  function nextTurn() {
    if (!gameState.value.game.run) return

    gameState.value = handleCommand(
      gameState.value,
      { type: 'turn-end', params: {} },
      { kind: 'player' },
    )

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
    setView,
    startRun,
    tryPlayCard,
    nextTurn,
    endRun,
    changeDeckName,
    addCardToDeck,
    removeCardFromDeck,
    setDeckRulesCard,
    clearDeckRulesCard,
    resolveAttack,
    setCardQuantity,
    loadPresetSave,
    exportSave,
    importSave,
    openEventLog,
    closeEventLog,
  }
})
