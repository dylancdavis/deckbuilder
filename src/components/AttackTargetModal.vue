<script setup lang="ts">
import CardItem from './CardItem.vue'
import type { CardInstance } from '@/utils/cards'
import { TILT_PRESETS } from '@/composables/useTilt'

interface Props {
  targets: CardInstance[]
  handleSelect: (instanceId: string) => void
  handleCancel: () => void
}

const props = defineProps<Props>()

function selectTarget(instanceId: string) {
  props.handleSelect(instanceId)
}
</script>

<template>
  <div class="modal-overlay" data-testid="attack-target-modal" @click="props.handleCancel()">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Choose Target</h2>
        <button class="close-button" data-testid="attack-cancel" @click="props.handleCancel()">
          &times;
        </button>
      </div>
      <div class="target-options">
        <div
          v-for="target in props.targets"
          :key="target.instanceId"
          class="target-option"
          data-testid="attack-target-option"
          @click="selectTarget(target.instanceId)"
        >
          <CardItem :card="target" :tilt="TILT_PRESETS.collection" />
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

.target-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

.target-options > * {
  flex: 1 1 200px;
  max-width: 250px;
}

.target-option {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.target-option:hover {
  transform: scale(1.05);
}
</style>
