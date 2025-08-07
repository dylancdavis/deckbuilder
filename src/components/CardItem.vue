<script setup lang="ts">
import LightningSvg from './LightningSvg.vue'

defineProps({
  card: {
    type: Object,
    required: true
  }
})

</script>

<template>
  <div class="card-container">
    <div class="card-background">
      <div class="card-name">{{ card.name }}</div>
      <div class="card-content">
        <div v-if="card.type === 'rules'" class="rules-info">
          <div class="section deck-limit">
            <div class="deck-size">
              <span>Deck Size:</span>
              <span>{{ card.deckLimits?.size?.[0] === card.deckLimits?.size?.[1] ? card.deckLimits.size[0] : `${card.deckLimits?.size?.[0]}-${card.deckLimits?.size?.[1]}` }} Cards</span>
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
            <LightningSvg />
          </div>
          <div class="card-description">{{ card.description }}</div>
        </template>
      </div>
    </div>
  </div>
</template>
