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

const pathStyle = computed(() => ({
  stroke: props.borderColor,
  strokeWidth: props.borderWidth,
  strokeDasharray: 'none',
  strokeLinecap: 'butt' as const,
  strokeDashoffset: 0,
  strokeLinejoin: 'miter' as const,
  strokeMiterlimit: 4,
  fill: props.fillColor,
  fillRule: 'nonzero' as const,
  opacity: 1,
}))

const svgStyle = computed(() => ({
  filter: props.shadow ? 'drop-shadow(-4px 4px 0px rgba(0, 0, 0, 0.25))' : 'none',
}))
</script>

<template>
  <svg
    class="card-svg"
    xmlns="http://www.w3.org/2000/svg"
    xml:space="preserve"
    viewBox="-1 -1.4 127 177.8"
    role="img"
    aria-labelledby="lightning-title lightning-desc"
    :style="svgStyle"
  >
    <title id="lightning-title">Lightning currency symbol</title>
    <desc id="lightning-desc">A lightning bolt icon.</desc>
    <path
      stroke-linecap="round"
      d="M32.903-86.129h-69.677L-61.29 4.194h49.032L-27.74 86.129 61.29-20.323H9.032z"
      :style="pathStyle"
      transform="matrix(1.01974 0 0 1.01592 62.5 87.5)"
    />
  </svg>
</template>
