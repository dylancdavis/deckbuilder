<script setup lang="ts">
import { useGameStore } from '@/stores/game'
import { cards, type PlayableCardID } from '@/utils/cards'
import CardItem from './CardItem.vue'
import { TILT_PRESETS } from '@/composables/useTilt'

interface Props {
  cardOptions: PlayableCardID[]
  handleSelect: (cardId: PlayableCardID) => void
}

const props = defineProps<Props>()

const gameStore = useGameStore()

function selectCard(cardId: PlayableCardID) {
  props.handleSelect(cardId)
  gameStore.closeModal()
}

function closeModal() {
  gameStore.closeModal()
}
</script>

<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Choose a Card</h2>
        <button class="close-button" @click="closeModal">×</button>
      </div>
      <div class="card-options">
        <div
          v-for="cardId in props.cardOptions"
          :key="cardId"
          class="card-option"
          @click="selectCard(cardId)"
        >
          <CardItem :card="cards[cardId]" :tilt="TILT_PRESETS.collection" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: #333;
}

.card-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

.card-options > * {
  flex: 1 1 200px;
  max-width: 250px;
}

.card-option {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.card-option:hover {
  transform: scale(1.05);
}
</style>
