<script setup lang="ts">
import { computed } from 'vue'

/*
 * "Spikes" icon by sbed — https://game-icons.net/1x1/sbed/spikes.html
 * Licensed under CC BY 3.0 — https://creativecommons.org/licenses/by/3.0/
 * Path data scaled from the original 512x512 viewBox to a 150-unit space to
 * match the stroke weights of the other card icons.
 */

const props = withDefaults(
  defineProps<{
    cardId: string
    fillGradient?: [string, string]
    borderColor?: string
    borderWidth?: number
    shadow?: boolean
  }>(),
  {
    borderColor: '#000',
    borderWidth: 2,
    shadow: true,
  },
)

const gradientId = `spikes-gradient-${props.cardId}`
const defaultGradient: [string, string] = ['#ffffff', '#c8d4dc']
const effectiveGradient = computed<[string, string]>(() => props.fillGradient ?? defaultGradient)

const pathStyle = computed(() => ({
  fill: `url(#${gradientId})`,
  stroke: props.borderColor,
  strokeWidth: props.borderWidth,
  strokeOpacity: 1,
}))

const svgStyle = computed(() => ({
  filter: props.shadow ? 'drop-shadow(-4px 4px 0px rgba(0, 0, 0, 0.25))' : 'none',
}))
</script>

<template>
  <svg
    class="card-svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="3 3 144 144"
    role="img"
    aria-labelledby="spikes-title spikes-desc"
    :style="svgStyle"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" :style="{ stopColor: effectiveGradient[0] }" />
        <stop offset="100%" :style="{ stopColor: effectiveGradient[1] }" />
      </linearGradient>
    </defs>
    <title id="spikes-title">Spikes symbol</title>
    <desc id="spikes-desc">
      A radial burst of eight tapered spikes around a hollow circular center.
    </desc>

    <path
      :style="pathStyle"
      d="M 75 4.688 c -1.675 15.078 -7.091 27.538 -9.613 36.529 -2.606 0.74 -5.094 1.734 -7.416 3.021 -8.145 -4.583 -20.839 -9.475 -32.684 -18.952 9.477 11.846 14.368 24.539 18.952 32.684 -1.288 2.322 -2.282 4.809 -3.021 7.416 C 32.226 67.909 19.766 73.325 4.688 75 c 15.078 1.675 27.538 7.091 36.529 9.613 0.74 2.607 1.734 5.094 3.021 7.416 -4.583 8.145 -9.475 20.838 -18.952 32.684 11.846 -9.477 24.539 -14.368 32.684 -18.951 2.322 1.288 4.809 2.282 7.416 3.021 2.522 8.991 7.938 21.451 9.613 36.53 1.675 -15.078 7.091 -27.538 9.613 -36.53 2.607 -0.739 5.094 -1.733 7.416 -3.021 8.145 4.583 20.838 9.475 32.684 18.951 -9.477 -11.846 -14.368 -24.539 -18.951 -32.684 1.288 -2.322 2.282 -4.809 3.021 -7.416 8.991 -2.522 21.451 -7.938 36.53 -9.613 -15.078 -1.675 -27.538 -7.091 -36.53 -9.613 -0.739 -2.606 -1.733 -5.094 -3.021 -7.416 4.583 -8.145 9.475 -20.839 18.951 -32.684 -11.846 9.477 -24.539 14.368 -32.684 18.952 -2.322 -1.288 -4.809 -2.282 -7.416 -3.021 C 82.091 32.226 76.675 19.766 75 4.688 z m 0 52.734 c 4.854 0 9.316 1.9 12.497 5.081 C 90.678 65.684 92.578 70.146 92.578 75 c 0 4.854 -1.9 9.316 -5.081 12.497 C 84.316 90.678 79.854 92.578 75 92.578 c -4.854 0 -9.316 -1.9 -12.497 -5.081 C 59.321 84.316 57.422 79.854 57.422 75 c 0 -4.854 1.9 -9.316 5.081 -12.497 C 65.684 59.321 70.146 57.422 75 57.422 z"
    />
  </svg>
</template>
