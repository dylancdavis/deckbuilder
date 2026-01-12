<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { useGameStore } from './stores/game'
import CollectionView from './components/CollectionView.vue'
import RunView from './components/RunView.vue'
import CardChoiceModal from './components/CardChoiceModal.vue'
import type { CardID } from './utils/cards'
import type { GameState } from './utils/game'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'

gsap.registerPlugin(Flip)

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

async function handleSelect(cardId: CardID) {
  // Capture state of cards in hand and discard pile before resolving the choice
  const state = Flip.getState('.flip-card, .discard-pile [data-flip-id]')

  // Get the resolver and clear the modal before calling it
  // (resolver may open a new modal, so we need clean state)
  const resolver = gameStore.gameState.viewData.resolver!
  const stateWithModalCleared: GameState = {
    ...gameStore.gameState,
    viewData: {
      ...gameStore.gameState.viewData,
      modalView: null,
      resolver: null,
      cardOptions: [],
    },
  }

  // Resolve the choice effect (moves card to discard and applies chosen effect)
  gameStore.gameState = resolver(stateWithModalCleared, cardId)

  // Wait for Vue to re-render
  await nextTick()

  // Animate card movement from hand to discard pile
  Flip.from(state, {
    targets: '.flip-card, .discard-pile [data-flip-id]',
    duration: 0.2,
    ease: 'power2',
  })
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
  <CardChoiceModal
    v-if="modalView === 'card-choice'"
    :card-options="gameStore.cardOptions"
    :handle-select="handleSelect"
  />
</template>
