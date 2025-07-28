<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import ResourceDisplay from './ResourceDisplay.vue'
import RulesDrawPilePanel from './RulesDrawPilePanel.vue'
import BoardHandPanel from './BoardHandPanel.vue'
import DiscardStatsPanel from './DiscardStatsPanel.vue'

const gameStore = useGameStore()

const isActive = computed(() => gameStore.isRunActive)
</script>

<template>
  <div class="run-view">
    <div v-if="!isActive" class="no-run">
      <h3>No Active Run</h3>
      <p>Start a run from a valid deck in the Collection view.</p>
    </div>
    
    <div v-else class="run-layout">
      <div class="top-section">
        <ResourceDisplay />
      </div>
      
      <div class="main-section">
        <div class="left-panel">
          <RulesDrawPilePanel />
        </div>
        
        <div class="center-panel">
          <BoardHandPanel />
        </div>
        
        <div class="right-panel">
          <DiscardStatsPanel />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.run-view {
  padding: 1rem;
  height: 100%;
}

.no-run {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
  text-align: center;
}

.no-run h3 {
  margin-bottom: 1rem;
  color: #495057;
}

.no-run p {
  margin: 0;
  font-size: 0.9rem;
}

.run-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.top-section {
  height: auto;
}

.main-section {
  flex: 1;
  display: grid;
  grid-template-columns: 250px 1fr 250px;
  gap: 1rem;
  min-height: 0;
}

.left-panel,
.center-panel,
.right-panel {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow-y: auto;
}
</style>