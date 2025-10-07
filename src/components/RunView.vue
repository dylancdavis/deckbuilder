<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { useGameStore } from '../stores/game'
import CardItem from './CardItem.vue'
import CardBack from './CardBack.vue'
import FlashValue from './FlashValue.vue'
import type { PlayableCard } from '@/utils/cards'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import { TILT_PRESETS } from '@/composables/useTilt'

gsap.registerPlugin(Flip)

const gameStore = useGameStore()
const run = computed(() => {
  if (!gameStore.run) throw new Error('Called RunView when Run is null.')
  return gameStore.run
})

const isEndOfRun = computed(() => {
  if (!run.value.deck.rulesCard) return false

  const { rounds: maxRounds } = run.value.deck.rulesCard.endConditions
  const currentRound = run.value.stats.rounds
  const isLastRound = currentRound >= maxRounds
  const deckIsEmpty = run.value.cards.drawPile.length === 0

  return isLastRound && deckIsEmpty
})

const noActionsLeft = computed(() => {
  return run.value.cards.hand.length === 0
})

const cardsPlayedThisTurn = computed(() => {
  return run.value.events.filter(
    (e) =>
      e.type === 'card-play' &&
      e.round === run.value.stats.rounds &&
      e.turn === run.value.stats.turns,
  ).length
})

const canPlayCard = computed(() => {
  if (!run.value.deck.rulesCard) return false

  const playAmount = run.value.deck.rulesCard.turnStructure.playAmount
  // If playAmount is 'any', can always play
  if (playAmount === 'any') return true

  // Otherwise check if we haven't reached the numeric limit
  return cardsPlayedThisTurn.value < playAmount
})

const nextTurnButtonText = computed(() => {
  if (!run.value.deck.rulesCard) return { main: 'Next Turn', subtitle: null }

  const hasCardsInHand = run.value.cards.hand.length > 0

  const main = isEndOfRun.value ? 'End Run' : 'Next Turn'

  const subtitle = hasCardsInHand ? '(Discard Hand)' : null

  return { main, subtitle }
})

const MAX_DRAW_PILE_SIZE = 3

function drawPile(cards: PlayableCard[]) {
  const pileSize = Math.min(cards.length, MAX_DRAW_PILE_SIZE)
  // Show the top cards from the draw pile (the ones that would be drawn next)
  const visibleCards = cards.slice(-pileSize).reverse()
  return {
    pileSize,
    cards: visibleCards,
  }
}

function discardPile(cards: PlayableCard[]) {
  const pileSize = Math.min(cards.length, MAX_DRAW_PILE_SIZE)
  return {
    pileSize,
    cards: cards.slice(-pileSize).reverse(),
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
    ease: 'power2.inOut',
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
    ease: 'power2',
  })
}

const drawPileData = computed(() => drawPile(run.value.cards.drawPile))

const discardPileData = computed(() => discardPile(run.value.cards.discardPile))
</script>

<template>
  <div v-if="run" class="run-view">
    <!-- Rules Draw Panel -->
    <div class="panel rules-draw">
      <CardItem v-if="run.deck.rulesCard" :card="run.deck.rulesCard" :tilt="TILT_PRESETS.minimal" />

      <!-- Draw Pile -->
      <div v-if="drawPileData.pileSize === 0" class="empty-pile">draw</div>
      <div v-else class="draw-pile">
        <CardBack
          v-for="card in drawPileData.cards"
          :key="card.instanceId || card.name"
          :data-flip-id="card.instanceId"
          :tilt="TILT_PRESETS.minimal"
        />
      </div>
    </div>

    <!-- Board Hand Panel -->
    <div class="panel board-hand">
      <!-- Board Display -->
      <div class="hand-group">
        <div class="empty-pile">
          <CardItem v-for="card in run.cards.board" :key="card.name" :card="card" />
        </div>
      </div>

      <!-- Hand Display -->
      <div class="hand-group">
        <div class="empty-pile">
          <div
            v-for="(card, index) in run.cards.hand"
            :key="card.instanceId || card.name"
            :data-flip-id="card.instanceId"
            class="flip-card"
            :class="{ 'card-disabled': !canPlayCard }"
            @click="canPlayCard && playCard(index)"
          >
            <div class="flip-card-inner">
              <div class="flip-card-front">
                <CardItem :card="card" :tilt="TILT_PRESETS.hand" />
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
        <div
          v-for="card in discardPileData.cards"
          :key="card.instanceId || card.name"
          :data-flip-id="card.instanceId"
        >
          <CardItem :card="card" :tilt="TILT_PRESETS.minimal" />
        </div>
      </div>

      <!-- Round Info Panel -->
      <div class="round-info-panel">
        <div class="stats-chips">
          <div class="chip chip-counter chip-wide">
            <span>Round <FlashValue :value="run.stats.rounds" /></span>
            <span>Turn <FlashValue :value="run.stats.turns" /></span>
          </div>
          <div class="chip chip-counter chip-wide chip-cards-played">
            <span>Cards Played</span>
            <span v-if="run.deck.rulesCard?.turnStructure.playAmount === 'any'">
              <FlashValue :value="cardsPlayedThisTurn" />
            </span>
            <span v-else>
              <FlashValue :value="cardsPlayedThisTurn" /> /
              <FlashValue :value="run.deck.rulesCard?.turnStructure.playAmount || 0" />
            </span>
          </div>
          <div class="resources-grid">
            <div class="chip chip-resource chip-wide">
              <span>Points</span>
              <FlashValue
                :value="run.resources.points"
                flash-color="var(--standard-blue)"
                base-color="#666"
              />
            </div>
          </div>
        </div>
        <button
          class="next-turn-btn"
          :class="{
            'next-turn-btn--highlighted': noActionsLeft && !isEndOfRun,
            'next-turn-btn--end-run': isEndOfRun,
          }"
          @click="nextTurn"
        >
          <div class="button-text-main">{{ nextTurnButtonText.main }}</div>
          <div v-if="nextTurnButtonText.subtitle" class="button-text-subtitle">
            {{ nextTurnButtonText.subtitle }}
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel.board-hand {
  flex: 1;
}

/* Round info panel styling - match empty pile background */
.round-info-panel {
  background-color: #e8e8e8;
  background-image:
    linear-gradient(135deg, rgba(250, 250, 250, 0.8) 0%, rgba(224, 224, 224, 0.3) 100%),
    url(http://www.transparenttextures.com/patterns/axiom-pattern.png);
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
  border-radius: 12px;
  border-bottom: 6px solid #272727;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.1s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25em;
  width: 100%;
}

.next-turn-btn:hover {
  filter: brightness(1.1);
}

.next-turn-btn:active {
  border-bottom-width: 0px;
}

.button-text-main {
  font-size: 16px;
  font-weight: bold;
}

.button-text-subtitle {
  font-size: 12px;
  font-weight: normal;
  color: rgba(255, 255, 255, 0.7);
}

.next-turn-btn--highlighted {
  background-color: var(--standard-blue);
  border-bottom-color: #003350;
}

.next-turn-btn--end-run {
  background-color: var(--standard-orange);
  border-bottom-color: #cc4400;
}

.card-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.chip-cards-played {
  background-color: #555;
  border-color: #777;
}
</style>
