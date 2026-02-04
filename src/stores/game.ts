import { ref, computed, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { startingDeck } from '../constants.ts'
import type { Counter } from '@/utils/counter.ts'
import type { PlayableCardID, RulesCard, CardID, RulesCardID } from '@/utils/cards.ts'
import { cards } from '@/utils/cards.ts'
import { initializeRun } from '@/utils/run.ts'
import { add, sub } from '@/utils/counter.ts'
import { playCard, drawCards as drawCardsPure, type GameState } from '@/utils/game.ts'

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
  'double-choice': 4,
  'choice-draw': 4,
  'draw-watcher': 4,
  'draw-bonus': 4,
}

export const useGameStore = defineStore('game', () => {
  const gameState: Ref<GameState> = ref({
    game: {
      collection: {
        cards: initialCollectionCards,
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
      editable: true,
    }
    return newDeckKey
  }

  function tryPlayCard(instanceId: string) {
    // Validation checks
    const run = gameState.value.game.run
    if (!run || !run.deck.rulesCard) {
      throw new Error('Cannot play card: no active run or rules card')
    }

    const card = run.cards.hand.find((card) => card.instanceId === instanceId)
    if (!card) {
      throw new Error(`Cannot play card: no card with instanceId ${instanceId}`)
    }

    // Check playAmount limit by counting events for current turn
    const playAmount = run.deck.rulesCard.turnStructure.playAmount
    if (typeof playAmount === 'number') {
      const cardsPlayedThisTurn = run.events.filter(
        (e) => e.type === 'card-play' && e.round === run.stats.rounds && e.turn === run.stats.turns,
      ).length
      if (cardsPlayedThisTurn >= playAmount) {
        throw new Error(
          `Cannot play card: playAmount limit of ${playAmount} reached (${cardsPlayedThisTurn} cards played this turn)`,
        )
      }
    }

    // Use pure function to process card play and non-choice effects
    gameState.value = playCard(gameState.value, instanceId)
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

    // Check if round should end (draw pile empty after trying to draw)
    const shouldEndRound = run.cards.drawPile.length === 0

    if (shouldEndRound) {
      // End of round: reshuffle all cards into new draw pile and start new round
      startNewRound()
    } else {
      // Draw new cards from draw pile to hand
      gameState.value = drawCardsPure(gameState.value, turnStructure.drawAmount)
    }
  }

  function startNewRound() {
    const run = gameState.value.game.run
    if (!run || !run.deck.rulesCard) return

    // Increment round counter
    run.stats.rounds += 1

    // Check if run should end based on rules card end conditions
    const endConditions = run.deck.rulesCard.endConditions
    if (endConditions.rounds && run.stats.rounds >= endConditions.rounds) {
      // End the run
      endRun()
      return
    }

    // Collect all cards from hand, board, and discard pile
    const allCards = [...run.cards.hand, ...run.cards.board, ...run.cards.discardPile]

    // Shuffle the collected cards
    allCards.sort(() => Math.random() - 0.5)

    // Create new draw pile and clear other locations
    run.cards.drawPile = allCards
    run.cards.hand = []
    run.cards.board = []
    run.cards.discardPile = []

    // Reset turns to 1 for the new round
    run.stats.turns = 1

    // Draw starting hand for new round
    const turnStructure = run.deck.rulesCard.turnStructure
    gameState.value = drawCardsPure(gameState.value, turnStructure.drawAmount)
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
    startNewRound,
    endRun,
    changeDeckName,
    addCardToDeck,
    removeCardFromDeck,
    setDeckRulesCard,
    clearDeckRulesCard,
  }
})
