<script setup lang="ts">
import { useUIStore } from '@/stores/ui'
import { useGameStore } from '@/stores/game'
import CollectionView from '@/components/CollectionView.vue'
import RunView from '@/components/RunView.vue'
import NavigationBar from '@/components/NavigationBar.vue'

const uiStore = useUIStore()
const gameStore = useGameStore()

// Initialize the database
gameStore.initializeDb()
</script>

<template>
  <div class="app">
    <h1 class="game-title">Deckbuilder</h1>
    <div class="main-content">
      <div class="main-panel">
        <NavigationBar />
        <CollectionView v-if="uiStore.isCollectionView" />
        <RunView v-else-if="uiStore.isRunView" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.game-title {
  text-align: center;
  color: #333;
  margin: 0;
  padding: 1rem;
  background-color: #fff;
  border-bottom: 2px solid #ddd;
}

.main-content {
  padding: 1rem;
}

.main-panel {
  max-width: 1200px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}
</style>
