import { ref, computed, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { startingDeck } from '../constants.ts'
import type { Counter } from '@/utils/counter.ts'
import type { PlayableCardID, PlayableCard, RulesCard, CardID, RulesCardID } from '@/utils/cards.ts'
import { cards, playableCardIds, playableCards } from '@/utils/cards.ts'
import { processStartOfGame, populateDrawPile } from '@/utils/run.ts'
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
    cardOptions: PlayableCardID[]
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
      cardOptions: [],
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
        cardOptions: [],
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

  function buyCard(options: number, tag: string) {
    // Get available cards with the specified tag (excluding buy-basic itself)
    const availableCards = playableCardIds.filter(id => {
      const card = playableCards[id]
      return id !== 'buy-basic' && card.tags?.includes(tag)
    })

    const shuffled = [...availableCards].sort(() => Math.random() - 0.5)
    const selectedOptions = shuffled.slice(0, options)

    gameState.value.viewData = {
      modalView: 'buy-card',
      cardOptions: selectedOptions
    }
  }

  function selectCard(cardId: PlayableCardID) {
    // Add the selected card to the collection
    gameState.value.game.collection.cards = add(gameState.value.game.collection.cards, cardId)

    // Close the modal
    gameState.value.viewData = {
      modalView: null,
      cardOptions: []
    }
  }

  function closeModal() {
    gameState.value.viewData = {
      modalView: null,
      cardOptions: []
    }
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
      stats: { turns: 0, rounds: 1 },
    }

    const runWithDrawPile = populateDrawPile(baseRun)
    const runWithStartEffects = processStartOfGame(runWithDrawPile)
    // Use nextTurn to draw the initial hand (turn 0 → turn 1)
    return nextTurnInternal(runWithStartEffects)
  }

  function playCard(cardIndex: number) {
    debugger;

    const run = gameState.value.game.run
    if (!run) return

    const card = run.cards.hand[cardIndex]
    if (!card) return

    // Process card effects
    if (card.effects.length >= 3 && card.effects[0] === 'gain-resource') {
      const resource = card.effects[1] as Resource
      const amount = card.effects[2] as number
      gainResource(resource, amount)
    } else if (card.effects.length >= 3 && card.effects[0] === 'buy-card') {
      const options = card.effects[1] as number
      const tag = card.effects[2] as string
      buyCard(options, tag)
    }

    // Remove card from hand and add to discard pile
    run.cards.hand.splice(cardIndex, 1)
    run.cards.discardPile.push(card)
  }

  function nextTurnInternal(run: Run): Run {
    if (!run.deck.rulesCard) return run

    const turnStructure = run.deck.rulesCard.turnStructure
    const isFirstTurn = run.stats.turns === 0

    // Create a mutable copy of the run to modify
    let updatedRun = {
      ...run,
      cards: { ...run.cards },
      stats: { ...run.stats },
      resources: { ...run.resources }
    }

    // Increment turn counter
    updatedRun.stats.turns += 1

    // Skip discarding on the very first turn (initialization)
    if (!isFirstTurn) {
      // Handle discarding cards from hand to discard pile
      const discardAmount = turnStructure.discardAmount
      if (discardAmount === 'all') {
        // Move all cards from hand to discard pile
        updatedRun.cards.discardPile = [...updatedRun.cards.discardPile, ...updatedRun.cards.hand]
        updatedRun.cards.hand = []
      } else if (typeof discardAmount === 'number' && discardAmount > 0) {
        // Move specified number of cards from hand to discard pile
        const cardsToDiscard = Math.min(discardAmount, updatedRun.cards.hand.length)
        const discardedCards = updatedRun.cards.hand.slice(0, cardsToDiscard)
        updatedRun.cards.hand = updatedRun.cards.hand.slice(cardsToDiscard)
        updatedRun.cards.discardPile = [...updatedRun.cards.discardPile, ...discardedCards]
      }
    }

    // Check if we need to start a new round (draw pile empty)
    const needsNewRound = updatedRun.cards.drawPile.length === 0 && !isFirstTurn

    if (needsNewRound) {
      // Increment round counter
      updatedRun.stats.rounds += 1

      // Check if run should end based on rules card end conditions
      const endConditions = updatedRun.deck.rulesCard.endConditions
      if (endConditions.rounds && updatedRun.stats.rounds > endConditions.rounds) {
        // Return the run as-is, the caller will handle ending it
        return updatedRun
      }

      // Collect all cards from hand, board, and discard pile
      const allCards = [
        ...updatedRun.cards.hand,
        ...updatedRun.cards.board,
        ...updatedRun.cards.discardPile
      ]

      // Shuffle the collected cards
      allCards.sort(() => Math.random() - 0.5)

      // Create new draw pile and clear other locations
      updatedRun.cards.drawPile = allCards
      updatedRun.cards.hand = []
      updatedRun.cards.board = []
      updatedRun.cards.discardPile = []

      // Reset turns to 1 for the new round
      updatedRun.stats.turns = 1
    }

    // Draw new cards from draw pile to hand
    const cardsToDraw = Math.min(turnStructure.drawAmount, updatedRun.cards.drawPile.length)
    const drawnCards = updatedRun.cards.drawPile.slice(-cardsToDraw)
    updatedRun.cards.drawPile = updatedRun.cards.drawPile.slice(0, -cardsToDraw)
    updatedRun.cards.hand = [...updatedRun.cards.hand, ...drawnCards.reverse()]

    return updatedRun
  }

  function nextTurn() {
    const run = gameState.value.game.run
    if (!run || !run.deck.rulesCard) return

    const updatedRun = nextTurnInternal(run)

    // Check if run should end
    const endConditions = updatedRun.deck.rulesCard.endConditions
    if (endConditions.rounds && updatedRun.stats.rounds > endConditions.rounds) {
      endRun()
      return
    }

    // Update the game state with the new run
    gameState.value.game.run = updatedRun
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
    modalView,
    cardOptions,
    initializeDb,
    selectDeck,
    startRun,
    playCard,
    nextTurn,
    endRun,
    gainResource,
    buyCard,
    selectCard,
    closeModal,
    drawCards,
    changeDeckName,
    addCardToDeck,
    removeCardFromDeck,
    setDeckRulesCard,
    clearDeckRulesCard,
  }
})
