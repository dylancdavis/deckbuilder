<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { useGameStore } from '../stores/game'
import CardItem from './CardItem.vue'
import type { PlayableCard } from '@/utils/cards'
import { entries } from '@/utils/utils'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'

gsap.registerPlugin(Flip)

const gameStore = useGameStore()
const run = computed(() => {
  if (!gameStore.run)
    throw new Error('Called RunView when Run is null.')
  return gameStore.run
})

const MAX_DRAW_PILE_SIZE = 3

function drawPile(cards: PlayableCard[]) {
  const pileSize = Math.min(cards.length, MAX_DRAW_PILE_SIZE)
  // Show the top cards from the draw pile (the ones that would be drawn next)
  const visibleCards = cards.slice(-pileSize).reverse()
  return {
    pileSize,
    cards: visibleCards
  }
}

function discardPile(cards: PlayableCard[]) {
  const pileSize = Math.min(cards.length, MAX_DRAW_PILE_SIZE)
  return {
    pileSize,
    cards: cards.slice(-pileSize).reverse()
  }
}

async function nextTurn() {
  // Capture state of draw pile and hand cards before next turn
  const state = Flip.getState('.draw-pile [data-flip-id], .flip-card')

  // Execute next turn logic (which includes drawing cards)
  gameStore.nextTurn()

  // Wait for Vue to re-render
  await nextTick()

  // Animate cards from draw pile to hand
  Flip.from(state, {
    targets: '.draw-pile [data-flip-id], .flip-card',
    duration: 0.2,
    ease: "power2.inOut",
  })
}

async function playCard(cardIndex: number) {
  // Capture state of all cards in hand and discard pile
  const state = Flip.getState('.flip-card, .discard-pile [data-flip-id]')

  // Make the state change
  gameStore.playCard(cardIndex)

  // Wait for Vue to re-render
  await nextTick()

  // Animate from previous state to current state
  Flip.from(state, {
    targets: '.flip-card, .discard-pile [data-flip-id]',
    duration: 0.2,
    ease: "power2",
  })
}

const drawPileData = computed(() =>
  drawPile(run.value.cards.drawPile)
)

const discardPileData = computed(() =>
  discardPile(run.value.cards.discardPile)
)
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
          v-for="card in drawPileData.cards"
          :key="card.instanceId || card.name"
          :data-flip-id="card.instanceId"
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
            v-for="(card, index) in (run.cards.hand)"
            :key="card.instanceId || card.name"
            :data-flip-id="card.instanceId"
            class="flip-card"
            @click="playCard(index)"
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
    </div>

    <!-- Discard Stats Panel -->
    <div class="panel discard-stats">
      <!-- Discard Pile -->
      <div v-if="discardPileData.pileSize === 0" class="empty-pile">discard</div>
      <div v-else class="discard-pile">
        <CardItem
          v-for="card in discardPileData.cards"
          :key="card.instanceId || card.name"
          :data-flip-id="card.instanceId"
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
            <div
          class="resource"
        >
          • points: {{ run.resources.points }}
        </div>
        <div @click="nextTurn">Next Turn</div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.panel.board-hand {
  flex: 1
}

</style>
