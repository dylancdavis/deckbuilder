<script setup lang="ts">
import { computed } from 'vue'

/*
 * "Card draw" icon by Faithtoken — https://game-icons.net/1x1/faithtoken/card-draw.html
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

const gradientId = `card-draw-gradient-${props.cardId}`
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
    viewBox="4 4 142 142"
    role="img"
    aria-labelledby="card-draw-title card-draw-desc"
    :style="svgStyle"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" :style="{ stopColor: effectiveGradient[0] }" />
        <stop offset="100%" :style="{ stopColor: effectiveGradient[1] }" />
      </linearGradient>
    </defs>
    <title id="card-draw-title">Card draw symbol</title>
    <desc id="card-draw-desc">A hand drawing a playing card up out of a stack.</desc>

    <path
      :style="pathStyle"
      d="m 61.51 143.028-35.52-13.658c-3.313-1.271-3.411-3.541-0.231-5.065L 60 137.471c 4.402 1.692 10.907 1.441 15.168-0.574l 47.321-22.441c 2.934 1.3 2.89 3.462-0.196 4.921L 73.368 142.579c-3.218 1.522-8.534 1.729-11.858 0.449zm 0-9.483L 25.99 119.886c-2.819-1.081-3.311-2.886-1.436-4.339l 35.446 13.628c 4.402 1.692 10.907 1.441 15.168-0.574l 48.455-22.978c 1.715 1.294 1.283 3.035-1.331 4.271l-48.924 23.201c-3.218 1.522-8.534 1.729-11.858 0.449zm 0-8.295L 25.99 111.589c-2.82-1.081-3.311-2.886-1.436-4.34l 35.446 13.63c 4.402 1.69 10.907 1.44 15.168-0.574l 48.455-22.98c 1.715 1.294 1.283 3.035-1.331 4.271l-48.924 23.203c-3.218 1.522-8.534 1.727-11.858 0.449zm 0-8.297L 25.99 103.293c-2.82-1.081-3.311-2.886-1.436-4.339l 35.446 13.63c 4.402 1.692 10.907 1.441 15.168-0.574l 48.455-22.98c 1.715 1.296 1.283 3.038-1.331 4.273l-48.924 23.201c-3.218 1.522-8.534 1.728-11.858 0.449zm 0-8.297L 25.99 94.998c-3.325-1.276-3.411-3.56-0.193-5.084l 25.557-12.122 10.203 5.368c 4.501 2.37 11.114 2.068 15.381-0.7l 19.26-12.502 25.9 9.963c 3.323 1.276 3.413 3.562 0.195 5.084l-48.924 23.202c-3.218 1.522-8.534 1.729-11.858 0.449zm 2.007-29.218L 27.375 60.416c-3.154-1.661-3.286-4.584-0.298-6.524l 30.794-19.989h 7.572l 0.004 19.032h 17.187v-19.032H 97.324l-8.053-12.126 34.837 18.335c 3.153 1.661 3.285 4.584 0.297 6.524L 74.649 78.931c-2.988 1.939-7.978 2.168-11.132 0.507zm 6.339-30.915V 29.493h-10.208l 14.394-23.361 14.391 23.361H 78.223v 19.03h-8.367z"
    />
  </svg>
</template>
