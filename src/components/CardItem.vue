<script setup lang="ts">
import { ref } from 'vue'
import ScarabSvg from './ScarabSvg.vue'
import type { Card, PlayableCard, RulesCard } from '@/utils/cards'
import { useTilt } from '@/composables/useTilt'

interface Props {
  /** The card to display - can be either a playable card or rules card */
  card: Card
  /** Whether to enable tilt effect */
  tilt?: boolean
}

const props = defineProps<Props>()

const cardRef = ref<HTMLElement | null>(null)

// Initialize tilt if prop is present
if (props.tilt) {
  useTilt(cardRef, {
    reverse: true, // Reverse tilt direction for more natural feel
    max: 12, // Subtle rotation (vs default 35°)
    scale: 1.05, // Slight lift on hover
    speed: 400, // Smooth transition
    glare: true, // Add glare effect for polish
    'max-glare': 0.2, // Subtle glare
  })
}

// Type guards to safely access card-type-specific properties
function isRulesCard(card: Card): card is RulesCard {
  return card.type === 'rules'
}

function isPlayableCard(card: Card): card is PlayableCard {
  return card.type === 'playable'
}
</script>

<template>
  <div ref="cardRef" class="card-container">
    <div class="card-background">
      <div class="card-name">{{ card.name }}</div>
      <div class="card-content">
        <div v-if="isRulesCard(card)" class="rules-info">
          <div class="section deck-limit">
            <div class="deck-size">
              <span>Deck Size:</span>
              <span
                >{{
                  card.deckLimits.size[0] === card.deckLimits.size[1]
                    ? card.deckLimits.size[0]
                    : `${card.deckLimits.size[0]}-${card.deckLimits.size[1]}`
                }}
                Cards</span
              >
            </div>
          </div>
          <div class="section turn-structure">
            <div class="turn-structure">
              <span>Turn:</span>
              <span>Draw 1, Play 1</span>
            </div>
          </div>
          <div class="section end-conditions">
            <div class="end-conditions">
              <span>Game End:</span>
              <span>1 Round</span>
            </div>
          </div>
        </div>
        <template v-else>
          <div class="card-image">
            <ScarabSvg />
          </div>
          <div v-if="isPlayableCard(card)" class="card-description">{{ card.description }}</div>
        </template>
      </div>
    </div>
  </div>
</template>
