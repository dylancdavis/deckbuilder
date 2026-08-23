<script setup lang="ts">
import { computed } from 'vue'

/*
 * "Split arrows" icon by Delapouite — https://game-icons.net/1x1/delapouite/split-arrows.html
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

const gradientId = `split-arrows-gradient-${props.cardId}`
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
    viewBox="5 5 139 139"
    role="img"
    aria-labelledby="split-arrows-title split-arrows-desc"
    :style="svgStyle"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" :style="{ stopColor: effectiveGradient[0] }" />
        <stop offset="100%" :style="{ stopColor: effectiveGradient[1] }" />
      </linearGradient>
    </defs>
    <title id="split-arrows-title">Split arrows symbol</title>
    <desc id="split-arrows-desc">
      A single path branching into two arrows that point away from each other.
    </desc>

    <path
      :style="pathStyle"
      d="M 39.639 11.391 7.389 21.659l 21.894 25.772 3.735-13.037c 13.154 4.395 21.621 10.4 26.836 17.08 6.035 7.676 8.057 16.465 7.529 26.045-1.055 19.16-13.389 40.928-24.551 54.346l 8.086 6.738c 9.287-11.104 19.219-26.836 24.082-43.799 4.863 16.963 14.795 32.695 24.082 43.799l 8.086-6.738C 96.006 118.447 83.672 96.68 82.617 77.52c-0.527-9.58 1.494-18.369 7.529-26.045 5.215-6.68 13.682-12.686 26.807-17.08l 3.75 13.037 21.914-25.772-32.256-10.269 3.691 12.873c-14.883 4.922-25.4 12.006-32.227 20.707-3.018 3.867-5.244 7.969-6.826 12.275-1.582-4.307-3.809-8.408-6.826-12.275-6.826-8.701-17.344-15.785-32.227-20.707z"
    />
  </svg>
</template>
