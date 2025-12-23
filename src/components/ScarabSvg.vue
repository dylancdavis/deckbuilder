<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    fillColor?: string
    fillGradient?: [string, string]
    borderColor?: string
    borderWidth?: number
    shadow?: boolean
  }>(),
  {
    fillColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
    shadow: true,
  },
)

const gradientId = `scarab-gradient-${Math.random().toString(36).substr(2, 9)}`

const fillValue = computed(() => {
  if (props.fillGradient) {
    return `url(#${gradientId})`
  }
  return props.fillColor
})

const groupStyle = computed(() => ({
  fill: fillValue.value,
  stroke: props.borderColor,
  strokeWidth: props.borderWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}))

const svgStyle = computed(() => ({
  filter: props.shadow ? 'drop-shadow(-4px 4px 0px rgba(0, 0, 0, 0.25))' : 'none',
}))
</script>

<template>
  <svg
    class="card-svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 105.83333 105.83333"
    role="img"
    aria-labelledby="scarab-title scarab-desc"
    :style="svgStyle"
  >
    <defs v-if="fillGradient">
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" :style="{ stopColor: fillGradient[0] }" />
        <stop offset="100%" :style="{ stopColor: fillGradient[1] }" />
      </linearGradient>
    </defs>
    <title id="scarab-title">Scarab currency symbol</title>
    <desc id="scarab-desc">A scarab beetle with circular body and corner decorations.</desc>

    <path
      :style="groupStyle"
      d="M 9.2604164 0 A 9.260416 9.260416 0 0 0 2.7124958 2.7124958 A 9.260416 9.260416 0 0 0 2.7124958 15.808337 L 13.335103 26.431461 A 47.625 47.625 0 0 0 5.2916665 52.916665 A 47.625 47.625 0 0 0 13.255521 79.28198 L 2.7124958 89.825522 A 9.260416 9.260416 0 0 0 2.7124958 102.92136 A 9.260416 9.260416 0 0 0 15.808337 102.92136 L 26.312605 92.417612 A 47.625 47.625 0 0 0 52.916665 100.54166 A 47.625 47.625 0 0 0 79.401352 92.49771 L 79.401869 92.49771 L 89.825522 102.92136 A 9.260416 9.260416 0 0 0 102.92136 102.92136 A 9.260416 9.260416 0 0 0 102.92136 89.825522 L 92.49771 79.401869 A 47.625 47.625 0 0 0 92.49771 79.401352 A 47.625 47.625 0 0 0 100.54166 52.916665 A 47.625 47.625 0 0 0 92.417612 26.312605 A 47.625 47.625 0 0 0 92.417612 26.312088 L 102.92136 15.808337 A 9.260416 9.260416 0 0 0 102.92136 2.7124958 A 9.260416 9.260416 0 0 0 96.373443 0 A 9.260416 9.260416 0 0 0 89.825522 2.7124958 L 79.28198 13.255521 A 47.625 47.625 0 0 0 52.916665 5.2916665 A 47.625 47.625 0 0 0 26.431461 13.335103 L 15.808337 2.7124958 A 9.260416 9.260416 0 0 0 9.2604164 0 z M 52.916665 23.812499 A 29.104166 29.104166 0 0 1 82.020831 52.916665 A 29.104166 29.104166 0 0 1 52.916665 82.020831 A 29.104166 29.104166 0 0 1 23.812499 52.916665 A 29.104166 29.104166 0 0 1 52.916665 23.812499 z "
    />
  </svg>
</template>
