<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

const runState = computed(() => gameStore.run)

const handCards = computed(() => {
  if (!runState.value) return []
  return runState.value.cards.hand.map(cardId => ({
    cardId,
    card: gameStore.getCard(cardId)
  }))
})

const boardCards = computed(() => {
  if (!runState.value) return []
  return runState.value.cards.board.map(cardId => ({
    cardId,
    card: gameStore.getCard(cardId)
  }))
})

const playCard = (cardId: string) => {
  gameStore.playCard(cardId)
}
</script>

<template>
  <div class="board-hand-panel">
    <div class="board-section">
      <h4>Board (Played Cards)</h4>
      <div class="card-zone">
        <div v-if="boardCards.length === 0" class="empty-zone">
          No cards played yet
        </div>
        <div v-else class="card-list">
          <div 
            v-for="{ cardId, card } in boardCards"
            :key="`board-${cardId}`"
            class="game-card played"
          >
            <div class="card-name">{{ card.name }}</div>
            <div class="card-description">{{ card.description }}</div>
            <div class="card-cost">Cost: {{ card.cost }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="hand-section">
      <h4>Hand</h4>
      <div class="card-zone">
        <div v-if="handCards.length === 0" class="empty-zone">
          No cards in hand
        </div>
        <div v-else class="card-list">
          <div 
            v-for="{ cardId, card } in handCards"
            :key="`hand-${cardId}`"
            class="game-card playable"
            @click="playCard(cardId)"
          >
            <div class="card-name">{{ card.name }}</div>
            <div class="card-description">{{ card.description }}</div>
            <div class="card-cost">Cost: {{ card.cost }}</div>
            <div class="play-hint">Click to play</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.board-hand-panel {
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.board-section,
.hand-section {
  flex: 1;
  min-height: 0;
}

.board-section h4,
.hand-section h4 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1rem;
}

.card-zone {
  height: calc(100% - 2rem);
  background-color: white;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  overflow-y: auto;
}

.empty-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
  font-style: italic;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.game-card {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 0.75rem;
  transition: all 0.2s ease;
}

.game-card.playable {
  cursor: pointer;
  border-color: #28a745;
}

.game-card.playable:hover {
  background-color: #e8f5e8;
  border-color: #20c997;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.game-card.played {
  background-color: #e3f2fd;
  border-color: #bbdefb;
}

.card-name {
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
}

.card-description {
  color: #6c757d;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.card-cost {
  color: #17a2b8;
  font-size: 0.8rem;
  font-weight: 500;
}

.play-hint {
  color: #28a745;
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 0.5rem;
  opacity: 0.8;
}

.game-card.playable:hover .play-hint {
  opacity: 1;
}
</style>