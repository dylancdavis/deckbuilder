<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { useUIStore } from '@/stores/ui'
import { cardRegistry } from '@/data/cards'

const gameStore = useGameStore()
const uiStore = useUIStore()

const availableCards = computed(() => {
  return Object.entries(cardRegistry)
    .filter(([, card]) => card.type !== 'rules')
    .map(([cardId, card]) => {
      const ownedCount = gameStore.collection.cards[cardId] || 0
      const usedCount = gameStore.getTotalCardUsage(cardId)
      const availableCount = ownedCount - usedCount
      
      return {
        cardId,
        card,
        ownedCount,
        usedCount,
        availableCount,
        canAdd: availableCount > 0 && uiStore.selectedDeckId
      }
    })
})

const addCardToDeck = (cardId: string) => {
  const deckId = uiStore.selectedDeckId
  if (deckId) {
    gameStore.addToDeck(deckId, cardId, 1)
  }
}

const addToCollection = (cardId: string) => {
  gameStore.addToCollection(cardId, 1)
}
</script>

<template>
  <div class="card-grid">
    <div class="panel-header">
      <h3>Collection</h3>
    </div>
    
    <div class="cards-list">
      <div 
        v-for="{ cardId, card, ownedCount, usedCount, availableCount, canAdd } in availableCards"
        :key="cardId"
        class="collection-card"
      >
        <div class="card-content">
          <div class="card-name">{{ card.name }}</div>
          <div class="card-description">{{ card.description }}</div>
          <div class="card-details">
            <span class="card-cost">Cost: {{ card.cost }}</span>
            <span v-if="card.deckLimit" class="deck-limit">
              Deck Limit: {{ card.deckLimit }}
            </span>
          </div>
          
          <div class="card-counts">
            <span class="owned">Owned: {{ ownedCount }}</span>
            <span class="used">Used: {{ usedCount }}</span>
            <span class="available">Available: {{ availableCount }}</span>
          </div>
        </div>
        
        <div class="card-actions">
          <button 
            class="add-to-collection-btn"
            @click="addToCollection(cardId)"
          >
            +1 to Collection
          </button>
          <button 
            v-if="uiStore.selectedDeckId"
            class="add-to-deck-btn"
            :disabled="!canAdd"
            @click="addCardToDeck(cardId)"
          >
            Add to Deck
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-grid {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.panel-header h3 {
  margin: 0;
  color: #495057;
}

.cards-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.collection-card {
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  padding: 1rem;
  transition: box-shadow 0.2s ease;
}

.collection-card:hover {
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.card-content {
  margin-bottom: 1rem;
}

.card-name {
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
}

.card-description {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.card-details {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.card-cost {
  color: #17a2b8;
  font-weight: 500;
  font-size: 0.85rem;
}

.deck-limit {
  color: #fd7e14;
  font-weight: 500;
  font-size: 0.85rem;
}

.card-counts {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
}

.owned {
  color: #28a745;
}

.used {
  color: #6c757d;
}

.available {
  color: #007bff;
  font-weight: 500;
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.add-to-collection-btn,
.add-to-deck-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s ease;
}

.add-to-collection-btn {
  background-color: #28a745;
  color: white;
}

.add-to-collection-btn:hover {
  background-color: #218838;
}

.add-to-deck-btn {
  background-color: #007bff;
  color: white;
}

.add-to-deck-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.add-to-deck-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
</style>