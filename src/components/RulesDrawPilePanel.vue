<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

const runState = computed(() => gameStore.run)
const rulesCard = computed(() => {
  if (!runState.value) return null
  return gameStore.getCard(runState.value.deckInfo.rulesCard)
})

const drawPileCount = computed(() => {
  return runState.value?.cards.drawPile.length || 0
})

const drawCards = () => {
  if (!rulesCard.value?.turnStructure) return
  const drawAmount = rulesCard.value.turnStructure.drawAmount
  gameStore.drawCards(drawAmount)
}
</script>

<template>
  <div class="rules-draw-panel">
    <div class="panel-section">
      <h4>Rules Card</h4>
      <div v-if="rulesCard" class="rules-card">
        <div class="card-name">{{ rulesCard.name }}</div>
        <div v-if="rulesCard.turnStructure" class="turn-structure">
          <div>Draw: {{ rulesCard.turnStructure.drawAmount }}</div>
          <div>Play: {{ rulesCard.turnStructure.playAmount }}</div>
          <div>Discard: {{ rulesCard.turnStructure.discardAmount }}</div>
        </div>
        <div v-if="rulesCard.endConditions" class="end-conditions">
          Rounds: {{ rulesCard.endConditions.rounds }}
        </div>
      </div>
    </div>
    
    <div class="panel-section">
      <h4>Draw Pile</h4>
      <div class="draw-pile">
        <div class="pile-count">{{ drawPileCount }} cards remaining</div>
        <button 
          v-if="rulesCard?.turnStructure"
          class="draw-btn"
          :disabled="drawPileCount === 0"
          @click="drawCards"
        >
          Draw {{ rulesCard.turnStructure.drawAmount }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rules-draw-panel {
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.panel-section h4 {
  margin: 0 0 1rem 0;
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
  margin-bottom: 1rem;
}

.turn-structure {
  margin-bottom: 0.5rem;
}

.turn-structure div {
  color: #424242;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.end-conditions {
  color: #666;
  font-size: 0.85rem;
}

.draw-pile {
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
  text-align: center;
}

.pile-count {
  color: #6c757d;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.draw-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.draw-btn:hover:not(:disabled) {
  background-color: #218838;
}

.draw-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
</style>