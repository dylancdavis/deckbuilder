<script setup lang="ts">
import { computed } from 'vue'
import type { Deck, Card } from '@/types/game'
import { useGameStore } from '@/stores/game'
import { useUIStore } from '@/stores/ui'

interface Props {
  deck: Deck
  cards: Array<{ card: Card, cardId: string, count: number }>
}

const props = defineProps<Props>()
const gameStore = useGameStore()
const uiStore = useUIStore()

const rulesCard = computed(() => {
  return gameStore.getCard(props.deck.rulesCard)
})

const totalCards = computed(() => {
  return Object.values(props.deck.cards).reduce((sum, count) => sum + count, 0)
})

const deckLimits = computed(() => {
  if (!rulesCard.value?.deckLimits) return null
  return rulesCard.value.deckLimits.size
})

const isValidSize = computed(() => {
  if (!deckLimits.value) return true
  const [min, max] = deckLimits.value
  return totalCards.value >= min && totalCards.value <= max
})

const removeCard = (cardId: string) => {
  const deckId = uiStore.selectedDeckId
  if (deckId && props.deck.editable) {
    gameStore.removeFromDeck(deckId, cardId, 1)
  }
}

const addCard = (cardId: string) => {
  const deckId = uiStore.selectedDeckId
  if (deckId && props.deck.editable) {
    gameStore.addToDeck(deckId, cardId, 1)
  }
}
</script>

<template>
  <div class="deck-editor">
    <div class="editor-header">
      <h3>{{ deck.name }}</h3>
      <div class="deck-status">
        <span class="card-count" :class="{ invalid: !isValidSize }">
          {{ totalCards }}
          <span v-if="deckLimits"> / {{ deckLimits[1] }}</span>
          cards
        </span>
        <span v-if="!deck.editable" class="readonly-label">Read Only</span>
      </div>
    </div>

    <div class="rules-section">
      <h4>Rules Card</h4>
      <div class="rules-card">
        <div class="card-name">{{ rulesCard?.name || 'No rules card' }}</div>
        <div v-if="rulesCard?.description" class="card-description">
          {{ rulesCard.description }}
        </div>
        <div v-if="deckLimits" class="deck-limits">
          Deck Size: {{ deckLimits[0] }}-{{ deckLimits[1] }} cards
        </div>
      </div>
    </div>

    <div class="cards-section">
      <h4>Cards in Deck</h4>
      <div v-if="cards.length === 0" class="empty-deck">
        This deck is empty. Add cards from the collection on the right.
      </div>
      <div v-else class="card-list">
        <div 
          v-for="{ card, cardId, count } in cards" 
          :key="cardId"
          class="deck-card"
        >
          <div class="card-info">
            <div class="card-name">{{ card.name }}</div>
            <div class="card-description">{{ card.description }}</div>
            <div class="card-cost">Cost: {{ card.cost }}</div>
          </div>
          <div class="card-controls">
            <span class="card-count">{{ count }}</span>
            <div v-if="deck.editable" class="card-buttons">
              <button class="remove-btn" @click="removeCard(cardId)">-</button>
              <button class="add-btn" @click="addCard(cardId)">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.deck-editor {
  height: 100%;
  padding: 1rem;
  overflow-y: auto;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.editor-header h3 {
  margin: 0;
  color: #495057;
}

.deck-status {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-count {
  font-weight: 500;
  color: #28a745;
}

.card-count.invalid {
  color: #dc3545;
}

.readonly-label {
  background-color: #6c757d;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.8rem;
}

.rules-section,
.cards-section {
  margin-bottom: 1.5rem;
}

.rules-section h4,
.cards-section h4 {
  margin: 0 0 0.5rem 0;
  color: #495057;
  font-size: 1rem;
}

.rules-card {
  background-color: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 6px;
  padding: 1rem;
}

.card-name {
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 0.5rem;
}

.card-description {
  color: #424242;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.card-cost {
  color: #666;
  font-size: 0.85rem;
}

.deck-limits {
  color: #1976d2;
  font-size: 0.85rem;
  font-weight: 500;
}

.empty-deck {
  color: #6c757d;
  font-style: italic;
  text-align: center;
  padding: 2rem;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.deck-card {
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.deck-card .card-name {
  color: #495057;
  margin-bottom: 0.25rem;
}

.card-info {
  flex: 1;
}

.card-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-count {
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.card-buttons {
  display: flex;
  gap: 0.25rem;
}

.add-btn,
.remove-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s ease;
}

.add-btn {
  background-color: #28a745;
  color: white;
}

.add-btn:hover {
  background-color: #218838;
}

.remove-btn {
  background-color: #dc3545;
  color: white;
}

.remove-btn:hover {
  background-color: #c82333;
}
</style>