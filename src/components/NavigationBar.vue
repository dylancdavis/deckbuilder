<script setup lang="ts">
import { useUIStore } from '@/stores/ui'
import { useGameStore } from '@/stores/game'

const uiStore = useUIStore()
const gameStore = useGameStore()

const switchToCollection = () => uiStore.switchToCollection()
const switchToRun = () => uiStore.switchToRun()
</script>

<template>
  <div class="nav">
    <button 
      class="nav-button"
      :class="{ active: uiStore.isCollectionView }"
      @click="switchToCollection"
    >
      Collection
    </button>
    <div class="nav-divider">|</div>
    <button 
      class="nav-button"
      :class="{ active: uiStore.isRunView, disabled: !gameStore.isRunActive }"
      @click="switchToRun"
      :disabled="!gameStore.isRunActive"
    >
      Current Run
    </button>
  </div>
</template>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  gap: 1rem;
}

.nav-button {
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  color: #6c757d;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.nav-button:hover:not(.disabled) {
  background-color: #e9ecef;
  color: #495057;
}

.nav-button.active {
  background-color: #007bff;
  color: white;
}

.nav-button.disabled {
  color: #adb5bd;
  cursor: not-allowed;
}

.nav-divider {
  color: #dee2e6;
  font-weight: 300;
}
</style>