import { ref, computed, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { startingDeck } from '../constants.ts'
import type { Counter } from '@/utils/counter.ts'
import type { PlayableCardID, RulesCard, CardID, RulesCardID } from '@/utils/cards.ts'
import { cards, getCardChoices } from '@/utils/cards.ts'
import {
  processStartOfGame,
  drawFirstHand,
  populateDrawPile,
  resolveCard,
  type Run,
} from '@/utils/run.ts'
import { add, sub } from '@/utils/counter.ts'
import { Resource } from '@/utils/resource.ts'
import type { Deck } from '@/utils/deck.ts'
import type { GameState } from '@/utils/game.ts'

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

  function openCardChoiceModal(options: number, tags: string[]) {
    const choices = getCardChoices(options, tags)
    gameState.value.viewData = {
      modalView: 'card-choice',
      cardOptions: choices,
    }
  }

  function collectCard(cardId: CardID) {
    // Add the selected card to the collection
    gameState.value.game.collection.cards = add(gameState.value.game.collection.cards, cardId)
  }

  function closeModal() {
    gameState.value.viewData = {
      modalView: null,
      cardOptions: [],
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

  function makeRun(deck: Deck): Run {
    const baseRun: Run = {
      deck: deck,
      cards: { drawPile: [], hand: [], board: [], discardPile: [] },
      resources: { points: 0 },
      stats: { turns: 1, rounds: 1 },
      events: [],
    }

    const runWithDrawPile = populateDrawPile(baseRun)
    const runWithStartEffects = processStartOfGame(runWithDrawPile)
    return drawFirstHand(runWithStartEffects)
  }

  function playCard(cardIndex: number) {
    const run = gameState.value.game.run
    if (!run || !run.deck.rulesCard) {
      throw new Error('Cannot play card: no active run or rules card')
    }

    const card = run.cards.hand[cardIndex]
    if (!card) {
      throw new Error(`Cannot play card: no card at index ${cardIndex}`)
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

    // Open a modal for choice effects, resolving with a callback
    const hasChoiceEffect = card.effects.some((effect) => effect.type === 'collect-basic')
    if (hasChoiceEffect) {
      const choiceEffect = card.effects.find((effect) => effect.type === 'collect-basic')
      if (choiceEffect) {
        openCardChoiceModal(choiceEffect.params.options, choiceEffect.params.tags)
      }
    }

    // Use pure function to process card play and non-choice effects
    const updatedRun = resolveCard(run, cardIndex)
    gameState.value.game.run = updatedRun
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
      drawCards(turnStructure.drawAmount)
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
    drawCards(turnStructure.drawAmount)
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
    playCard,
    nextTurn,
    startNewRound,
    endRun,
    gainResource,
    collectCard,
    closeModal,
    drawCards,
    changeDeckName,
    addCardToDeck,
    removeCardFromDeck,
    setDeckRulesCard,
    clearDeckRulesCard,
  }
})
