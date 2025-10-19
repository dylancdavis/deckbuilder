<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from './stores/game'
import CollectionView from './components/CollectionView.vue'
import RunView from './components/RunView.vue'
import CardChoiceModal from './components/CardChoiceModal.vue'

const gameStore = useGameStore()
const view = computed(() => gameStore.view)
const modalView = computed(() => gameStore.modalView)

function getView(viewName: string[]) {
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

  <!-- Modals -->
  <CardChoiceModal v-if="modalView === 'collect-basic'" />
</template>
