<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useGameStore, type Deck } from '../stores/game'
import CardItem from './CardItem.vue'
import {
  cards,
  cardType,
  type Card,
  type CardID,
  type PlayableCard,
  type PlayableCardID,
  type RulesCardID,
} from '@/utils/cards'
import { entries, values, firstMissingNum } from '@/utils/utils'
import { total } from '@/utils/counter'
import { getDeckValidationErrors } from '@/utils/deck'
import { useFlyAnimation } from '@/composables/useFlyAnimation'
import { TILT_PRESETS } from '@/composables/useTilt'

const gameStore = useGameStore()
const collection = computed(() => gameStore.collection)
const selectedDeck = computed(() => gameStore.selectedDeck as Deck)
const selectedDeckKey = computed(() => gameStore.selectedDeckKey)

const { flyElement } = useFlyAnimation()
const cardRefs = useTemplateRef<InstanceType<typeof CardItem>[]>('cardRefs')

function deckSize(deck: Deck) {
  if (!deck || !deck.cards) return 0
  return total(deck.cards)
}

function deckEntry([key, { name }]: [string, Deck]) {
  return { key, name }
}

function onSelectDeck(deckKey: string) {
  gameStore.selectDeck(deckKey)
}

function onAddNewDeck() {
  const deckNames = values(collection.value.decks).map((deck) => deck.name)
  const newDeckNumbers = deckNames
    .map((name) => name.match(/New Deck (\d+)/)?.[1])
    .filter((match) => match !== undefined)
    .map((num) => parseInt(num!))

  const nextNumber = newDeckNumbers.length === 0 ? 1 : firstMissingNum(newDeckNumbers)
  const newDeckName = `New Deck ${nextNumber}`

  const newDeckKey = gameStore.addDeck(newDeckName)
  gameStore.selectDeck(newDeckKey)
}

function onChangeDeckName(value: string) {
  if (!selectedDeckKey.value || !value) return
  gameStore.changeDeckName(selectedDeckKey.value, value)
}

function onBackToDecks() {
  gameStore.selectDeck(null)
}

function onStartRun() {
  if (!selectedDeck.value) throw new Error('No deck selected to start run')
  gameStore.startRun(selectedDeck.value)
}

function handleCardClick(id: CardID, index: number) {
  if (cardType(id) === 'rules' && selectedDeck.value?.rulesCard) {
    return
  }

  switch (cardType(id)) {
    case 'rules':
      onSetSelectedDeckRulesCard(id as RulesCardID)
      break
    case 'playable':
      onAddCardToSelectedDeck(id as PlayableCardID, index)
      break
  }
}

function onAddCardToSelectedDeck(cardId: PlayableCardID, index: number) {
  if (!selectedDeckKey.value) return

  // Add card to deck first
  gameStore.addCardToDeck(selectedDeckKey.value, cardId)

  const cardComponent = cardRefs.value?.[index]
  if (!cardComponent?.$el) return

  const sourceElement = cardComponent.$el as HTMLElement

  requestAnimationFrame(() => {
    const targetElement = document.querySelector(
      `.deck-cards-list [data-deck-card-id="${cardId}"]`,
    ) as HTMLElement
    if (!targetElement) return
    flyElement(sourceElement, targetElement)
  })
}

function onRemoveCardFromSelectedDeck(card: PlayableCardID) {
  if (!selectedDeckKey.value) return
  gameStore.removeCardFromDeck(selectedDeckKey.value, card)
}

function onSetSelectedDeckRulesCard(card: RulesCardID) {
  if (!selectedDeckKey.value) return
  gameStore.setDeckRulesCard(selectedDeckKey.value, card)
}

function onClearSelectedDeckRulesCard() {
  if (!selectedDeckKey.value) return
  gameStore.clearDeckRulesCard(selectedDeckKey.value)
}

const deckEntries = computed(() => {
  return Object.entries(collection.value.decks || {}).map(deckEntry)
})

const selectedDeckCardsEntries = computed(() => {
  if (!selectedDeck.value) return []
  const idCounter = selectedDeck.value.cards
  const deckCards = entries(idCounter)
  return deckCards.map(([id, amount]) => [cards[id], amount] as [PlayableCard, number])
})

const collectionCardsEntries = computed(() => {
  const collectionCards = entries(collection.value.cards)
  return collectionCards.map(([id, amount]) => [cards[id], amount] as [Card, number])
})

const currentDeckSize = computed(() => deckSize(selectedDeck.value))
const requiredDeckSize = computed(() => selectedDeck.value.rulesCard?.deckLimits.size)
const deckValidationErrors = computed(() => {
  if (!selectedDeck.value) return []
  return getDeckValidationErrors(selectedDeck.value, collection.value)
})
const isDeckValid = computed(() => deckValidationErrors.value.length === 0)

function deckSizeText(currentSize: number, requiredSize: [number, number]) {
  if (!requiredSize || requiredSize[1] === 0) {
    return 'No Cards Allowed'
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
          <div class="card-list-block deck-cards-list">
            <div class="card-list-header">
              {{ deckSizeText(currentDeckSize, requiredDeckSize || [0, 0]) }}
            </div>
            <ul v-if="selectedDeckCardsEntries.length > 0">
              <li
                v-for="[card, amount] in selectedDeckCardsEntries"
                :key="card.name"
                class="deck-card-count-item"
                :data-deck-card-id="card.id"
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

          <!-- Validation Errors Display -->
          <div v-if="!isDeckValid && deckValidationErrors.length > 0" class="validation-errors">
            <div
              class="validation-error"
              v-for="(error, index) in deckValidationErrors"
              :key="index"
            >
              • {{ error }}
            </div>
          </div>
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
          v-for="([card, amountInCollection], index) in collectionCardsEntries"
          :key="card.name"
          class="card-collection-item"
          :class="{
            clickable: selectedDeck && !(card.type === 'rules' && selectedDeck.rulesCard),
            disabled: selectedDeck && card.type === 'rules' && selectedDeck.rulesCard,
          }"
          @click="handleCardClick(card.id, index)"
        >
          <CardItem ref="cardRefs" :card="card" :tilt="TILT_PRESETS.collection" />
          <div class="card-interaction-row">
            <div class="amount">x {{ amountInCollection }}</div>
            <div v-if="selectedDeck" class="add-card">+</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
