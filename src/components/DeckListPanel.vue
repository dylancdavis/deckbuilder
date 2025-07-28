<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { useUIStore } from '@/stores/ui'

const gameStore = useGameStore()
const uiStore = useUIStore()

const decklists = computed(() => gameStore.collection.decklists)

const selectDeck = (deckId: string) => {
  uiStore.selectDeck(deckId)
}

const addNewDeck = () => {
  const newDeckId = gameStore.addNewDeck()
  uiStore.selectDeck(newDeckId)
}

const startRun = (deckId: string) => {
  gameStore.startRun(deckId)
  uiStore.switchToRun()
}

const isValidDeck = (deckId: string) => {
  const deck = gameStore.getDeck(deckId)
  if (!deck) return false
  
  const rulesCard = gameStore.getCard(deck.rulesCard)
  if (!rulesCard || !rulesCard.deckLimits) return false
  
  const totalCards = Object.values(deck.cards).reduce((sum, count) => sum + count, 0)
  const [minSize, maxSize] = rulesCard.deckLimits.size
  
  return totalCards >= minSize && totalCards <= maxSize
}
</script>

<template>
  <div class="deck-list-panel">
    <div class="panel-header">
      <h3>Decks</h3>
      <button class="add-deck-btn" @click="addNewDeck">+ New Deck</button>
    </div>
    
    <div class="deck-list">
      <div 
        v-for="(deck, deckId) in decklists" 
        :key="deckId"
        class="deck-item"
        :class="{ 
          selected: uiStore.selectedDeckId === deckId,
          invalid: !isValidDeck(deckId as string)
        }"
        @click="selectDeck(deckId as string)"
      >
        <div class="deck-info">
          <div class="deck-name">{{ deck.name }}</div>
          <div class="deck-size">
            {{ Object.values(deck.cards).reduce((sum, count) => sum + count, 0) }} cards
          </div>
          <div class="deck-rules">Rules: {{ gameStore.getCard(deck.rulesCard)?.name }}</div>
        </div>
        
        <div class="deck-actions">
          <button 
            v-if="isValidDeck(deckId as string)"
            class="start-run-btn"
            @click.stop="startRun(deckId as string)"
          >
            Start Run
          </button>
          <span v-else class="invalid-label">Invalid</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.deck-list-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.panel-header h3 {
  margin: 0;
  color: #495057;
}

.add-deck-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
}

.add-deck-btn:hover {
  background-color: #218838;
}

.deck-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.deck-item {
  padding: 1rem;
  border: 1px solid transparent;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  background-color: white;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.deck-item:hover {
  border-color: #007bff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.deck-item.selected {
  border-color: #007bff;
  background-color: #f0f8ff;
}

.deck-item.invalid {
  background-color: #fff5f5;
  border-color: #f56565;
}

.deck-info {
  flex: 1;
}

.deck-name {
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.25rem;
}

.deck-size {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.deck-rules {
  font-size: 0.8rem;
  color: #868e96;
}

.deck-actions {
  margin-left: 1rem;
}

.start-run-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.2s ease;
}

.start-run-btn:hover {
  background-color: #0056b3;
}

.invalid-label {
  color: #dc3545;
  font-size: 0.8rem;
  font-weight: 500;
}
</style>