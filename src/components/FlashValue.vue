<script setup lang="ts">
import { ref, watch, toRef } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number | string
    flashColor?: string
    baseColor?: string
    duration?: number
  }>(),
  {
    flashColor: 'var(--standard-orange)',
    baseColor: '#fff',
    duration: 600,
  },
)

const isFlashing = ref(false)
const valueRef = toRef(props, 'value')

watch(valueRef, () => {
  isFlashing.value = true
  setTimeout(() => {
    isFlashing.value = false
  }, props.duration)
})
</script>

<template>
  <span
    class="flash-value"
    :class="{ 'is-flashing': isFlashing }"
    :style="{
      '--flash-color': flashColor,
      '--base-color': baseColor,
      '--duration': `${duration}ms`,
    }"
  >
    {{ value }}
  </span>
</template>

<style scoped>
@keyframes flash {
  0% {
    color: var(--flash-color);
  }
  100% {
    color: var(--base-color);
  }
}

.flash-value.is-flashing {
  animation: flash var(--duration) ease-out;
}
</style>
