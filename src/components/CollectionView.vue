<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore, type Deck } from '../stores/game'
import CardItem from './CardItem.vue'

const gameStore = useGameStore()
const collection = computed(() => gameStore.collection)
const selectedDeck = computed(() => gameStore.selectedDeck)
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

function onChangeDeckName(event) {
  gameStore.changeDeckName(selectedDeckKey.value, event.target.value)
}

function onBackToDecks() {
  gameStore.selectDeck(null)
}

function onStartRun() {
  gameStore.startRun(selectedDeck.value)
}

function onAddCardToSelectedDeck(card) {
  // TODO: Implement add card to selected deck
}

function onRemoveCardFromSelectedDeck(card) {
  // TODO: Implement remove card from selected deck
}

function onSetSelectedDeckRulesCard(card) {
  // TODO: Implement set rules card
}

function onClearSelectedDeckRulesCard() {
  // TODO: Implement clear rules card
}

const deckEntries = computed(() => {
  return Object.entries(collection.value.decks || {}).map(deckEntry)
})

const selectedDeckCardsEntries = computed(() => {
  if (!selectedDeck.value || !selectedDeck.value.cards) return []
  return Object.entries(selectedDeck.value.cards)
})

const collectionCardsEntries = computed(() => {
  if (!collection.value || !collection.value.cards) return []
  return Object.entries(collection.value.cards)
})

const currentDeckSize = computed(() => deckSize(selectedDeck.value))
const requiredDeckSize = computed(() => selectedDeck.value?.rulesCard?.deckLimits?.size)
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
            @change="onChangeDeckName"
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
                <button @click="onRemoveCardFromSelectedDeck(card)">X</button>
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
          @click="selectedDeck && card.type === 'rules' ? onSetSelectedDeckRulesCard(card) : selectedDeck ? onAddCardToSelectedDeck(card) : null"
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
