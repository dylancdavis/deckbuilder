<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from './stores/counter'
import CollectionView from './components/CollectionView.vue'
import RunView from './components/RunView.vue'

const gameStore = useGameStore()
const view = computed(() => gameStore.view)

function getView(viewName) {
  switch (viewName[0]) {
    case 'collection':
      return CollectionView
    case 'run':
      return RunView
    default:
      return CollectionView
  }
}
</script>

<template>
  <div class="app">
    <h1 class="game-title">Deckbuilder</h1>
    <div class="main-content">
      <div class="main-panel">
        <div class="nav">
          Collection
          <div class="nav-divider"></div>
          Current Run
        </div>
        <component :is="getView(view)" />
      </div>
    </div>
  </div>
</template>
