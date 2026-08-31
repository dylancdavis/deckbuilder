<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useGameStore } from '../stores/game'
import CardItem from './CardItem.vue'
import CardBack from './CardBack.vue'
import CardCount from './CardCount.vue'
import FlashValue from './FlashValue.vue'
import type { CardInstance } from '@/utils/cards'
import { TILT_PRESETS } from '@/composables/useTilt'
import { useCardFlip } from '@/composables/useCardFlip'

const { animateCardMove } = useCardFlip()

const gameStore = useGameStore()
const run = computed(() => {
  if (!gameStore.run) throw new Error('Called RunView when Run is null.')
  return gameStore.run
})

const isEndOfRun = computed(() => {
  return run.value.cards.drawPile.length === 0
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

function drawPile(cards: CardInstance[]) {
  const visibleCount = Math.min(cards.length, MAX_DRAW_PILE_SIZE)
  // Show the top cards from the draw pile (the ones that would be drawn next)
  const visibleCards = cards.slice(0, visibleCount).reverse()
  return {
    pileSize: cards.length,
    cards: visibleCards,
  }
}

function discardPile(cards: CardInstance[]) {
  const visibleCount = Math.min(cards.length, MAX_DRAW_PILE_SIZE)
  return {
    pileSize: cards.length,
    cards: cards.slice(-visibleCount).reverse(),
  }
}

async function nextTurn() {
  // Discards the hand, then draws a new hand (hand→discard, draw→hand)
  await animateCardMove(() => gameStore.nextTurn(), { ease: 'power2.inOut' })
}

function canAttackWith(card: CardInstance): boolean {
  if (card.attack === undefined || card.attack <= 0) return false
  return run.value.cards.board.some(
    (c) => c.defense !== undefined && c.instanceId !== card.instanceId,
  )
}

const selectedAttackerId = ref<string | null>(null)

/** Determines whether the given `attackerId` can attack the given `card`. */
function isAttackTarget(card: CardInstance, attackerId: string | null): boolean {
  if (!attackerId) return false
  return card.defense !== undefined && card.instanceId !== attackerId
}

async function onBoardCardClick(card: CardInstance) {
  const attackerInstanceId = selectedAttackerId.value

  // Set clicked card to selected attacker
  if (!attackerInstanceId) {
    if (canAttackWith(card)) selectedAttackerId.value = card.instanceId
    return
  }

  // Otherwise, try to attack with current selected attacker
  // Clear regardless of whether it's a valid target
  selectedAttackerId.value = null
  if (isAttackTarget(card, attackerInstanceId)) {
    await animateCardMove(() => gameStore.resolveAttack(attackerInstanceId, card.instanceId))
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') selectedAttackerId.value = null
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

async function playCard(instanceId: string) {
  // Plays a card from hand: asset→board or non-asset→discard, plus any
  // board→discard moves triggered by its abilities.
  await animateCardMove(() => gameStore.tryPlayCard(instanceId))
}

const drawPileData = computed(() => drawPile(run.value.cards.drawPile))

const discardPileData = computed(() => discardPile(run.value.cards.discardPile))
</script>

<template>
  <div v-if="run" class="run-view" @click="selectedAttackerId = null">
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
        <CardCount :count="drawPileData.pileSize" data-testid="draw-pile-count" />
      </div>
    </div>

    <!-- Board Hand Panel -->
    <div class="panel board-hand">
      <!-- Board Display -->
      <div class="hand-group">
        <div class="empty-pile">
          <div
            v-for="card in run.cards.board"
            :key="card.instanceId || card.name"
            :data-flip-id="card.instanceId"
            class="board-card-wrapper"
            :class="{
              'board-card-attacker': !selectedAttackerId && canAttackWith(card),
              'board-card-selected': card.instanceId === selectedAttackerId,
              'board-card-target': isAttackTarget(card, selectedAttackerId),
            }"
            data-testid="board-card"
            @click.stop="onBoardCardClick(card)"
          >
            <CardItem :card="card" :tilt="TILT_PRESETS.minimal" />
          </div>
        </div>
      </div>

      <!-- Hand Display -->
      <div class="hand-group">
        <div class="empty-pile">
          <div
            v-for="card in run.cards.hand"
            :key="card.instanceId || card.name"
            :data-flip-id="card.instanceId"
            data-testid="hand-card"
            class="flip-card"
            :class="{ 'card-disabled': !canPlayCard }"
            @click="canPlayCard && card.instanceId && playCard(card.instanceId)"
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
        <CardCount :count="discardPileData.pileSize" data-testid="discard-pile-count" />
      </div>

      <!-- Round Info Panel -->
      <div class="round-info-panel">
        <div class="stats-chips">
          <div class="chip chip-counter chip-wide">
            <span data-testid="round-display">Round <FlashValue :value="run.stats.rounds" /></span>
            <span data-testid="turn-display">Turn <FlashValue :value="run.stats.turns" /></span>
          </div>
          <div
            class="chip chip-counter chip-wide chip-cards-played"
            data-testid="cards-played-display"
          >
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
            <div class="chip chip-resource chip-wide" data-testid="points-display">
              <span>Points</span>
              <FlashValue
                :value="run.resources.points"
                flash-color="var(--standard-blue)"
                base-color="#666"
              />
            </div>
          </div>
        </div>
        <div class="panel-buttons">
          <button data-testid="event-log-btn" class="event-log-btn" @click="gameStore.openEventLog">
            Event Log
          </button>
          <button
            data-testid="next-turn-btn"
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

.panel-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  width: 100%;
}

/* Event log button styling - quieter sibling of the next turn button */
.event-log-btn {
  padding: 0.5em 1.5em;
  font-size: 14px;
  color: #444;
  background-color: #ddd;
  border: 0px;
  border-radius: 12px;
  border-bottom: 4px solid #bbb;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.1s ease;
  width: 100%;
}

.event-log-btn:hover {
  filter: brightness(1.05);
}

.event-log-btn:active {
  border-bottom-width: 0px;
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

.board-card-wrapper {
  display: inline-block;
}

.board-card-attacker {
  cursor: pointer;
  transition: transform 0.15s ease;
}

.board-card-attacker:hover {
  transform: translateY(-4px);
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
}

/*
 * Targeting feedback: red on the armed attacker, blue on each card it may
 * legally hit. A doubled glow — a tight bright core plus a wider halo — so it
 * reads clearly stronger than the plain hand-card hover in run.css.
 *
 * Glow only, no transform: vanilla-tilt owns the transform on these cards.
 *
 * The board lives inside a .hand-group wrapper, so `.hand-group
 * .card-container:hover` applies here too and ties these on specificity. The
 * extra .board-card-wrapper class in each compound is what keeps a targeting
 * state visible while the card is hovered.
 */
.board-card-wrapper .card-container {
  transition: 0.15s box-shadow ease;
}

.board-card-wrapper.board-card-selected .card-container {
  box-shadow:
    0 0 12px rgba(255, 107, 107, 0.95),
    0 0 30px rgba(255, 107, 107, 0.75),
    0px 0px 8px rgba(0, 0, 0, 0.7);
}

.board-card-target {
  cursor: pointer;
}

.board-card-wrapper.board-card-target .card-container {
  box-shadow:
    0 0 12px rgba(135, 206, 250, 0.95),
    0 0 30px rgba(135, 206, 250, 0.75),
    0px 0px 8px rgba(0, 0, 0, 0.7);
}
</style>
