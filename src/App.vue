<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from './stores/game'
import CollectionView from './components/CollectionView.vue'
import RunView from './components/RunView.vue'
import CardChoiceModal from './components/CardChoiceModal.vue'
import AttackTargetModal from './components/AttackTargetModal.vue'
import type { CardID } from './utils/cards'
import { resolveChoice } from './utils/ability-processor'
import { useCardFlip } from './composables/useCardFlip'

const { animateCardMove } = useCardFlip()

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
  // resolveChoice clears the modal internally and may move cards between zones
  await animateCardMove(() => {
    gameStore.gameState = resolveChoice(gameStore.gameState, cardId)
  })
}

async function handleAttackTarget(targetInstanceId: string) {
  // Resolving an attack can move board cards to the discard pile
  await animateCardMove(() => gameStore.resolveAttack(targetInstanceId))
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
  <AttackTargetModal
    v-if="modalView === 'attack-target'"
    :targets="gameStore.attackTargets"
    :handle-select="handleAttackTarget"
    :handle-cancel="gameStore.cancelAttack"
  />
</template>
