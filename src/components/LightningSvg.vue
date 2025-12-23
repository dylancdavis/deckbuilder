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

const gradientId = `lightning-gradient-${Math.random().toString(36).substr(2, 9)}`

const fillValue = computed(() => {
  if (props.fillGradient) {
    return `url(#${gradientId})`
  }
  return props.fillColor
})

const pathStyle = computed(() => ({
  stroke: props.borderColor,
  strokeWidth: props.borderWidth,
  strokeDasharray: 'none',
  strokeLinecap: 'butt' as const,
  strokeDashoffset: 0,
  strokeLinejoin: 'miter' as const,
  strokeMiterlimit: 4,
  fill: fillValue.value,
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
    <defs v-if="fillGradient">
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" :style="{ stopColor: fillGradient[0] }" />
        <stop offset="100%" :style="{ stopColor: fillGradient[1] }" />
      </linearGradient>
    </defs>
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
