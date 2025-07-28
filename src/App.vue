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
  <div id="app">
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

