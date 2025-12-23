<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    fillColor?: string
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

const groupStyle = computed(() => ({
  fill: props.fillColor,
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
    viewBox="0 0 128 128"
    role="img"
    aria-labelledby="scarab-title scarab-desc"
    :style="svgStyle"
  >
    <title id="scarab-title">Scarab currency symbol</title>
    <desc id="scarab-desc">A circle with four extended arms at 45-degree angles.</desc>

    <g :style="groupStyle">
      <!-- Circle -->
      <circle cx="64" cy="64" r="40" />
      <!-- Arms (25% of diameter ≈ 20 units long beyond the circle edge) -->
      <line x1="92.3" y1="92.3" x2="106.5" y2="106.5" />
      <line x1="35.7" y1="92.3" x2="21.5" y2="106.5" />
      <line x1="35.7" y1="35.7" x2="21.5" y2="21.5" />
      <line x1="92.3" y1="35.7" x2="106.5" y2="21.5" />
    </g>
  </svg>
</template>
