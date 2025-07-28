<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { useUIStore } from '@/stores/ui'

const gameStore = useGameStore()
const uiStore = useUIStore()

const resources = computed(() => gameStore.getCurrentResources)

const endRun = () => {
  gameStore.endRun()
  uiStore.switchToCollection()
}
</script>

<template>
  <div class="resource-display">
    <div class="resources-section">
      <h3>Current Resources</h3>
      <div v-if="resources" class="resource-list">
        <div class="resource-item">
          <span class="resource-label">{{ resources.points.display }}:</span>
          <span class="resource-value">{{ resources.points.value }}</span>
        </div>
      </div>
    </div>
    
    <div class="run-actions">
      <button class="end-run-btn" @click="endRun">
        End Run
      </button>
    </div>
  </div>
</template>

<style scoped>
.resource-display {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.resources-section h3 {
  margin: 0 0 0.5rem 0;
  color: #495057;
  font-size: 1.1rem;
}

.resource-list {
  display: flex;
  gap: 2rem;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.resource-label {
  color: #6c757d;
  font-weight: 500;
}

.resource-value {
  background-color: #007bff;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
}

.run-actions {
  display: flex;
  gap: 1rem;
}

.end-run-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.end-run-btn:hover {
  background-color: #c82333;
}
</style>