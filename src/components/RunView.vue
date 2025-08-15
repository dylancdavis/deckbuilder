<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import CardItem from './CardItem.vue'
import type { Card } from '@/utils/cards'
import { entries } from '@/utils/utils'

const gameStore = useGameStore()
const run = computed(() => {
  if (!gameStore.run)
    throw new Error('Called RunView when Run is null.')
  return gameStore.run
})

const MAX_DRAW_PILE_SIZE = 3

function drawPile(cards: Card[]) {
  const pileSize = Math.min(cards.length, MAX_DRAW_PILE_SIZE)
  return {
    pileSize,
  }
}

function discardPile(cards: Card[]) {
  const pileSize = Math.min(cards.length, MAX_DRAW_PILE_SIZE)
  return {
    pileSize,
    cards: cards.slice(0, pileSize)
  }
}

const drawPileData = computed(() =>
  drawPile(run.value.cards.drawPile)
)

const discardPileData = computed(() =>
  discardPile(run.value.cards.discardPile)
)

const resourceItems = computed(() => {
  return entries(run.value.resources).map(([key, value]) => ({
    display: key,
    value: value
  }))
})
</script>

<template>
  <div v-if="run" class="run-view">
    <!-- Rules Draw Panel -->
    <div class="panel rules-draw">
      <CardItem v-if="run.deck.rulesCard" :card="run.deck.rulesCard" />

      <!-- Draw Pile -->
      <div v-if="drawPileData.pileSize === 0" class="empty-pile">draw</div>
      <div v-else class="draw-pile">
        <div
          v-for="i in drawPileData.pileSize"
          :key="i"
          class="card-container card-back"
        />
      </div>
    </div>

    <!-- Board Hand Panel -->
    <div class="panel board-hand">
      <!-- Board Display -->
      <div class="hand-group">
        <div class="empty-pile">
          <CardItem
            v-for="card in (run.cards.board)"
            :key="card.name"
            :card="card"
          />
        </div>
      </div>

      <!-- Hand Display -->
      <div class="hand-group">
        <div class="empty-pile">
          <div
            v-for="card in (run.cards.hand)"
            :key="card.name"
            class="flip-card"
          >
            <div class="flip-card-inner">
              <div class="flip-card-front">
                <CardItem :card="card" />
              </div>
              <div class="flip-card-back">
                <div class="card-container card-back" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Resource Panel -->
      <div class="resource-list">
        <h2>Resources</h2>
        <div
          v-for="resource in resourceItems"
          :key="resource.display"
          class="resource"
        >
          • {{ resource.display }}: {{ resource.value }}
        </div>
      </div>
    </div>

    <!-- Discard Stats Panel -->
    <div class="panel discard-stats">
      <!-- Discard Pile -->
      <div v-if="discardPileData.pileSize === 0" class="empty-pile">discard</div>
      <div v-else>
        <CardItem
          v-for="card in discardPileData.cards"
          :key="card.name"
          :card="card"
        />
      </div>

      <!-- Stats -->
      <div v-if="run.stats">
        <div
          v-for="[name, value] in entries(run.stats)"
          :key="name"
          class="resource"
        >
          • {{ name }}: {{ value }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.panel.board-hand {
  flex: 1
}

</style>
