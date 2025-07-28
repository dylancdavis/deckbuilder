<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { useUIStore } from '@/stores/ui'
import DeckListPanel from './DeckListPanel.vue'
import DeckEditor from './DeckEditor.vue'
import CardGrid from './CardGrid.vue'

const gameStore = useGameStore()
const uiStore = useUIStore()

const selectedDeck = computed(() => {
  const deckId = uiStore.selectedDeckId
  return deckId ? gameStore.getDeck(deckId) : null
})

const selectedDeckCards = computed(() => {
  const deckId = uiStore.selectedDeckId
  return deckId ? gameStore.getSelectedDeckCards(deckId) : []
})
</script>

<template>
  <div class="collection-view">
    <div class="collection-layout">
      <div class="left-panel">
        <DeckListPanel />
      </div>
      
      <div class="center-panel">
        <DeckEditor 
          v-if="selectedDeck"
          :deck="selectedDeck" 
          :cards="selectedDeckCards"
        />
        <div v-else class="no-deck-selected">
          <h3>Select a deck to edit</h3>
          <p>Choose a deck from the list on the left to view and modify its contents.</p>
        </div>
      </div>
      
      <div class="right-panel">
        <CardGrid />
      </div>
    </div>
  </div>
</template>

<style scoped>
.collection-view {
  padding: 1rem;
}

.collection-layout {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 1rem;
  height: 600px;
}

.left-panel,
.center-panel,
.right-panel {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow-y: auto;
}

.no-deck-selected {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
  text-align: center;
  padding: 2rem;
}

.no-deck-selected h3 {
  margin-bottom: 1rem;
  color: #495057;
}

.no-deck-selected p {
  margin: 0;
  font-size: 0.9rem;
}
</style>