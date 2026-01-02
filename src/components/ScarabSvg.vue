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

const pathStyle = computed(() => ({
  fill: fillValue.value,
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
    viewBox="8 8 134 134"
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
    <desc id="scarab-desc">
      A filled scarab beetle shape with a central circle and four extended arms at 45-degree
      angles.
    </desc>

    <path
      :style="pathStyle"
      d="M 30.498047 17.986328 C 27.302808 17.986328 24.10656 19.209846 21.658203 21.658203 C 16.761489 26.554918 16.761489 34.439222 21.658203 39.335938 L 31.921875 49.599609 C 27.523269 57.043516 25 65.72741 25 75 C 25 84.272591 27.523269 92.956484 31.921875 100.40039 L 21.658203 110.66406 C 16.761489 115.56078 16.761489 123.44508 21.658203 128.3418 C 26.554918 133.23851 34.439223 133.23851 39.335938 128.3418 L 49.599609 118.07812 C 57.043516 122.47673 65.727409 125 75 125 C 84.272591 125 92.956484 122.47673 100.40039 118.07812 L 110.66406 128.3418 C 115.56078 133.23851 123.44508 133.23851 128.3418 128.3418 C 133.23851 123.44508 133.23851 115.56078 128.3418 110.66406 L 118.07812 100.40039 C 122.47673 92.956484 125 84.272591 125 75 C 125 65.727409 122.47673 57.043516 118.07812 49.599609 L 128.3418 39.335938 C 133.23851 34.439223 133.23851 26.554918 128.3418 21.658203 C 125.89344 19.209846 122.69719 17.986328 119.50195 17.986328 C 116.30671 17.986328 113.11242 19.209846 110.66406 21.658203 L 100.40039 31.921875 C 92.956484 27.523269 84.272591 25 75 25 C 65.727409 25 57.043516 27.523269 49.599609 31.921875 L 39.335938 21.658203 C 36.88758 19.209846 33.693286 17.986328 30.498047 17.986328 z M 75 50 C 88.807119 50 100 61.192881 100 75 C 100 88.807119 88.807119 100 75 100 C 61.192881 100 50 88.807119 50 75 C 50 61.192881 61.192881 50 75 50 z "
    />
  </svg>
</template>
