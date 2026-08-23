<script setup lang="ts">
import { computed } from 'vue'

/*
 * "Crossed swords" icon by Lorc — https://game-icons.net/1x1/lorc/crossed-swords.html
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

const gradientId = `crossed-swords-gradient-${props.cardId}`
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
    viewBox="3 1 143 143"
    role="img"
    aria-labelledby="crossed-swords-title crossed-swords-desc"
    :style="svgStyle"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" :style="{ stopColor: effectiveGradient[0] }" />
        <stop offset="100%" :style="{ stopColor: effectiveGradient[1] }" />
      </linearGradient>
    </defs>
    <title id="crossed-swords-title">Crossed swords symbol</title>
    <desc id="crossed-swords-desc">
      Two swords crossed in an X, hilts at the bottom and blades meeting near the top.
    </desc>

    <path
      :style="pathStyle"
      d="M 5.786 4.23c 17.443 32.897 41.751 59.282 68.051 85.757l 1.062 1.099 0.018-0.018c 6.395 6.425 12.902 12.868 19.455 19.409-5.524 4.34-11.418 8.262-17.56 11.81l 8.359 8.358 20.132-20.132c 12.403 8.096 22.349 18.646 30.496 30.999l 8.222-8.221c-12.442-8.055-23.361-17.638-31.063-30.432l 20.196-20.197-8.358-8.358c-3.256 6.402-7.152 12.309-11.563 17.752-12.847-12.832-25.331-25.149-38.123-36.759-0.066-0.059-0.127-0.124-0.192-0.183C 53.796 35.962 31.792 18.724 5.786 4.23zm 138.245 0c-24.328 13.559-45.153 29.525-65.03 47.214l 6.684 6.317 16.644-16.644 3.873 3.863-16.535 16.535 7.205 6.793c 18.106-19.605 34.453-40.113 47.159-64.078zm-96.542 36.887 58.758 58.749a 118.056 118.056 0 0 1-3.927 3.818L 43.616 44.979l 3.873-3.863zm-22.468 33.188-8.35 8.359 20.188 20.187c-7.702 12.795-18.612 22.387-31.055 30.442l 8.222 8.221c 8.147-12.353 18.093-22.903 30.496-30.999l 20.132 20.132 8.358-8.358c-6.141-3.549-12.035-7.471-17.56-11.81 5.234-5.224 10.433-10.381 15.573-15.519l-7.278-7.516-16.251 16.25c-1.337-1.242-2.641-2.525-3.918-3.827l 16.361-16.361-7.187-7.434c-5.355 5.231-10.723 10.564-16.16 15.994-4.414-5.445-8.314-11.355-11.572-17.761z"
    />
  </svg>
</template>
