<script setup lang="ts">
import { ref } from 'vue'
import { useTilt, type TiltOptions } from '@/composables/useTilt'

interface Props {
  /** Tilt effect options - pass a TiltOptions object to enable tilt */
  tilt?: TiltOptions
}

const props = defineProps<Props>()

const cardRef = ref<HTMLElement | null>(null)

// Initialize tilt if options are provided
if (props.tilt) {
  useTilt(cardRef, props.tilt)
}
</script>

<template>
  <div ref="cardRef" class="card-container card-back" />
</template>
