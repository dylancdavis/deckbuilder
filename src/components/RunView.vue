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

const nextTurnButtonText = computed(() => {
  if (!run.value.deck.rulesCard) return 'Next Turn'

  const { rounds: maxRounds } = run.value.deck.rulesCard.endConditions
  const currentRound = run.value.stats.rounds
  const isLastRound = currentRound >= maxRounds
  const deckIsEmpty = run.value.cards.drawPile.length === 0
  const hasCardsInHand = run.value.cards.hand.length > 0

  let text = isLastRound && deckIsEmpty
    ? 'End Run'
    : 'Next Turn'

  if (hasCardsInHand)
    text += ' (Discard Hand)'

  return text
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
  // Capture state of all cards before next turn (hand, discard, draw pile)
  const state = Flip.getState('.flip-card, .discard-pile [data-flip-id], .draw-pile [data-flip-id]')

  // Execute next turn logic (discards hand cards, then draws new cards)
  gameStore.nextTurn()

  // Wait for Vue to re-render
  await nextTick()

  // Animate all card movements (hand to discard, draw pile to hand)
  Flip.from(state, {
    targets: '.flip-card, .discard-pile [data-flip-id], .draw-pile [data-flip-id]',
    duration: 0.2,
    ease: "power2.inOut"
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

      <!-- Round Info Panel -->
      <div class="round-info-panel">
        <div class="stats-chips">
          <div class="chip chip-counter chip-wide">
            <span>Round {{ run.stats.rounds }}</span>
            <span>Turn {{ run.stats.turns }}</span>
          </div>
          <div class="resources-grid">
            <div class="chip chip-resource chip-wide">
              <span>Points</span>
              <span>{{ run.resources.points }}</span>
            </div>
          </div>
        </div>
        <button class="next-turn-btn" @click="nextTurn">
          {{ nextTurnButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>

.panel.board-hand {
  flex: 1
}

/* Round info panel styling - match empty pile background */
.round-info-panel {
  background-color: #eee;
  border: 4px solid var(--card-grey);
  box-shadow: inset 0px 1px 0px 1px grey;
  border-radius: 8px;
  padding: 1em;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  flex: 1;
  max-width: var(--collection-card-width);
}

/* Chip styling */
.chip {
  display: inline-flex;
  align-items: center;
  padding: 0.25em 0.75em;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
}

.chip-counter {
  background-color: #444;
  color: #fff;
  border: 1px solid #666;
}

.chip-wide {
  width: 100%;
  justify-content: space-between;
}

.chip-resource {
  background-color: #ddd;
  color: #666;
  border: 1px solid #bbb;
}

.stats-chips {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  width: 100%;
}

.resources-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5em;
  width: 100%;
}

/* Next turn button styling - match start run button */
.next-turn-btn {
  padding: 0.5em 1.5em;
  font-size: 16px;
  color: white;
  background-color: rgb(46, 46, 46);
  border: 0px;
  border-radius: 4px;
  border-bottom: 4px solid #272727;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.1s ease;
}

.next-turn-btn:hover {
  filter: brightness(1.1);
  transform: scale(1.01);
}

.next-turn-btn:active {
  transform: translateY(2px);
  border-bottom-width: 2px;
}

</style>
