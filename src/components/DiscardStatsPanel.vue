<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

const runState = computed(() => gameStore.run)

const discardCards = computed(() => {
  if (!runState.value) return []
  return runState.value.cards.discardPile.map(cardId => ({
    cardId,
    card: gameStore.getCard(cardId)
  }))
})

const stats = computed(() => {
  if (!runState.value) return null
  return runState.value.stats
})

const deckInfo = computed(() => {
  if (!runState.value) return null
  return runState.value.deckInfo
})

const totalDeckCards = computed(() => {
  if (!deckInfo.value) return 0
  return Object.values(deckInfo.value.cards).reduce((sum, count) => sum + count, 0)
})
</script>

<template>
  <div class="discard-stats-panel">
    <div class="panel-section">
      <h4>Discard Pile</h4>
      <div class="discard-zone">
        <div class="discard-count">{{ discardCards.length }} cards</div>
        <div v-if="discardCards.length === 0" class="empty-discard">
          No cards discarded yet
        </div>
        <div v-else class="discard-list">
          <div 
            v-for="{ cardId, card } in discardCards"
            :key="`discard-${cardId}`"
            class="discard-card"
          >
            <span class="card-name">{{ card.name }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="panel-section">
      <h4>Deck Info</h4>
      <div v-if="deckInfo" class="deck-info">
        <div class="info-item">
          <span class="label">Total Cards:</span>
          <span class="value">{{ totalDeckCards }}</span>
        </div>
        <div class="info-item">
          <span class="label">Rules Card:</span>
          <span class="value">{{ gameStore.getCard(deckInfo.rulesCard)?.name }}</span>
        </div>
      </div>
    </div>
    
    <div class="panel-section">
      <h4>Game Stats</h4>
      <div class="stats-info">
        <div class="info-item">
          <span class="label">Current Turn:</span>
          <span class="value">{{ Object.keys(stats?.turn || {}).length || 1 }}</span>
        </div>
        <div class="info-item">
          <span class="label">Current Round:</span>
          <span class="value">{{ Object.keys(stats?.round || {}).length || 1 }}</span>
        </div>
        <div class="info-item">
          <span class="label">Cards Drawn:</span>
          <span class="value">{{ Object.keys(stats?.drawnCards || {}).length || 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.discard-stats-panel {
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel-section {
  flex-shrink: 0;
}

.panel-section:first-child {
  flex: 1;
  min-height: 0;
}

.panel-section h4 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1rem;
}

.discard-zone {
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
  height: calc(100% - 2rem);
  overflow-y: auto;
}

.discard-count {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  text-align: center;
}

.empty-discard {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80%;
  color: #6c757d;
  font-style: italic;
  font-size: 0.9rem;
}

.discard-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.discard-card {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 0.5rem;
}

.discard-card .card-name {
  font-size: 0.85rem;
  color: #495057;
}

.deck-info,
.stats-info {
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #6c757d;
  font-size: 0.85rem;
}

.value {
  color: #495057;
  font-weight: 500;
  font-size: 0.85rem;
}
</style>