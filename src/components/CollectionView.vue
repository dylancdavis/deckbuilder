<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore, type Deck } from '../stores/game'
import CardItem from './CardItem.vue'
import { cards, type Card, type CardID } from '@/utils/cards'
import { entries } from '@/utils/utils'

const gameStore = useGameStore()
const collection = computed(() => gameStore.collection)
const selectedDeck = computed(() => gameStore.selectedDeck as Deck)
const selectedDeckKey = computed(() => gameStore.selectedDeckKey)

function deckSize(deck: Deck) {
  if (!deck || !deck.cards) return 0
  return Object.values(deck.cards).reduce((sum, count) => sum + count, 0)
}

function deckEntry([key, {name}]: [string, Deck]) {
  return {key, name}
}

function onSelectDeck(deckKey: string) {
  gameStore.selectDeck(deckKey)
}

function onAddNewDeck() {
  // TODO: Implement add new deck
}

function onChangeDeckName(value: string) {
  if (!selectedDeckKey.value || !value) return
  gameStore.changeDeckName(selectedDeckKey.value, value)
}

function onBackToDecks() {
  gameStore.selectDeck(null)
}

function onStartRun() {
  if (!selectedDeck.value)
    throw new Error('No deck selected to start run')
  gameStore.startRun(selectedDeck.value)
}

function onAddCardToSelectedDeck(card: CardID) {
  // TODO: Implement add card to selected deck
  console.log('Adding card to selected deck:', card)
  throw new Error('Not implemented: onAddCardToSelectedDeck')
}

function onRemoveCardFromSelectedDeck(card: CardID) {
  // TODO: Implement remove card from selected deck
  console.log('Removing card from selected deck:', card)
  throw new Error('Not implemented: onRemoveCardFromSelectedDeck')
}

function onSetSelectedDeckRulesCard(card: CardID) {
  // TODO: Implement set rules card
  console.log('Setting rules card for selected deck:', card)
  throw new Error('Not implemented: onSetSelectedDeckRulesCard')
}

function onClearSelectedDeckRulesCard() {
  // TODO: Implement clear rules card
  console.log('Clearing rules card for selected deck')
  throw new Error('Not implemented: onClearSelectedDeckRulesCard')
}

const deckEntries = computed(() => {
  return Object.entries(collection.value.decks || {}).map(deckEntry)
})

const selectedDeckCardsEntries = computed(() => {
  if (!selectedDeck.value) return []
  const idCounter = selectedDeck.value.cards
  const deckCards = entries(idCounter)
  return deckCards.map(([id, amount]) => ([cards[id], amount] as [Card, number]))
})

const collectionCardsEntries = computed(() => {
  const collectionCards = entries(collection.value.cards)
  return collectionCards.map(([id, amount]) => ([cards[id], amount] as [Card, number]))
})

const currentDeckSize = computed(() => deckSize(selectedDeck.value))
const requiredDeckSize = computed(() => selectedDeck.value.rulesCard.deckLimits.size)
const isDeckValid = computed(() => true) // TODO: Implement deck validity check

function deckSizeText(currentSize: number, requiredSize: [number, number]) {
  if (!requiredSize || requiredSize[1] === 0) {
    return "No Cards Allowed"
  }

  const [minSize, maxSize] = requiredSize
  const deckText = minSize === maxSize ? minSize.toString() : `${minSize}-${maxSize}`

  return `Cards in Deck: (${currentSize}/${deckText})`
}
</script>

<template>
  <div class="collection-view">
    <div class="decklist-panel">
      <div class="panel-header">Decks</div>

      <!-- Deck List View -->
      <div v-if="!selectedDeckKey" class="decks-container">
        <div
          v-for="entry in deckEntries"
          :key="entry.key"
          class="decklist-item"
          @click="onSelectDeck(entry.key)"
        >
          {{ entry.name }}
        </div>
        <button class="add-new-deck" @click="onAddNewDeck">Add New Deck</button>
      </div>

      <!-- Deck Edit View -->
      <div v-else class="selected-deck-view">
        <h2>
          <span class="back-to-decks" @click="onBackToDecks">←</span>
          <input
            :value="selectedDeck?.name || ''"
            @input="onChangeDeckName(($event.target as HTMLInputElement).value)"
          />
        </h2>

        <div class="card-list-container">
          <!-- Rules Card Display -->
          <div class="card-list-block">
            <div v-if="!selectedDeck?.rulesCard" class="card-list-header">
              No Rules Card Selected
            </div>
            <div v-else>
              <div class="card-list-header">Rules Card:</div>
              <ul>
                <li class="deck-card-count-item">
                  <span>{{ selectedDeck.rulesCard.name }}</span>
                  <button @click="onClearSelectedDeckRulesCard">X</button>
                </li>
              </ul>
            </div>
          </div>

          <!-- Selected Deck Cards Display -->
          <div class="card-list-block">
            <div class="card-list-header">
              {{ deckSizeText(currentDeckSize, requiredDeckSize) }}
            </div>
            <ul v-if="selectedDeckCardsEntries.length > 0">
              <li
                v-for="[card, amount] in selectedDeckCardsEntries"
                :key="card.name"
                class="deck-card-count-item"
              >
                <span>{{ card.name }} x{{ amount }}</span>
                <button @click="onRemoveCardFromSelectedDeck(card.id)">X</button>
              </li>
            </ul>
          </div>

          <button
            class="run-deck"
            :class="isDeckValid ? 'clickable' : 'disabled'"
            @click="isDeckValid ? onStartRun() : null"
          >
            Run This Deck
          </button>
        </div>
      </div>
    </div>

    <div class="cards-panel">
      <div class="panel-header">Cards</div>
      <div class="card-grid">
        <div v-if="collectionCardsEntries.length === 0">
          No Cards in Collection. Run the starter deck!
        </div>
        <div
          v-for="[card, amountInCollection] in collectionCardsEntries"
          :key="card.name"
          class="card-collection-item"
          :class="selectedDeck ? 'clickable' : ''"
          @click="selectedDeck && card.type === 'rules' ? onSetSelectedDeckRulesCard(card.id) : selectedDeck ? onAddCardToSelectedDeck(card.id) : null"
        >
          <CardItem :card="card" />
          <div class="card-interaction-row">
            <div class="amount">x {{ amountInCollection }}</div>
            <div v-if="selectedDeck" class="add-card">+</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
