<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import LightningSvg from './LightningSvg.vue'
import ScarabSvg from './ScarabSvg.vue'
import type { Card, CardArtId, PlayableCard, RulesCard } from '@/utils/cards'
import { useTilt, type TiltOptions } from '@/composables/useTilt'

interface Props {
  /** The card to display - can be either a playable card or rules card */
  card: Card
  /** Tilt effect options - pass a TiltOptions object to enable tilt */
  tilt?: TiltOptions
}

const props = defineProps<Props>()

const cardRef = ref<HTMLElement | null>(null)

// Initialize tilt if options are provided
if (props.tilt) {
  useTilt(cardRef, props.tilt)
}

// Type guards to safely access card-type-specific properties
function isRulesCard(card: Card): card is RulesCard {
  return card.type === 'rules'
}

function isPlayableCard(card: Card): card is PlayableCard {
  return card.type === 'playable'
}

const defaultGradient: [string, string] = ['#093153ff', '#1077d2']
const defaultImage: CardArtId = 'scarab'

const cardImages: Record<CardArtId, Component> = {
  lightning: LightningSvg,
  scarab: ScarabSvg,
}

const cardStyle = computed(() => {
  const gradient = props.card.art?.gradient ?? defaultGradient
  return {
    '--card-gradient-start': gradient[0],
    '--card-gradient-end': gradient[1],
  }
})

const cardImageComponent = computed(() => {
  const imageId = props.card.art?.image ?? defaultImage
  return cardImages[imageId] ?? ScarabSvg
})

const svgProps = computed(() => ({
  fillColor: props.card.art?.fillColor ?? '#fff',
  fillGradient: props.card.art?.fillGradient,
  borderColor: props.card.art?.borderColor ?? '#000',
  borderWidth: props.card.art?.borderWidth ?? 2,
  shadow: props.card.art?.shadow ?? true,
}))
</script>

<template>
  <div ref="cardRef" class="card-container" :style="cardStyle">
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
              <span>Draw 2, Play 1</span>
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
            <component :is="cardImageComponent" v-bind="svgProps" />
          </div>
          <div v-if="isPlayableCard(card)" class="card-description">{{ card.description }}</div>
        </template>
      </div>
    </div>
  </div>
</template>
