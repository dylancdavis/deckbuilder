<script setup lang="ts">
import FlashValue from './FlashValue.vue'

defineProps<{
  /** The number of cards this counter represents */
  count: number
}>()
</script>

<template>
  <span class="card-count">x <FlashValue :value="count" base-color="white" /></span>
</template>

<style scoped>
.card-count {
  color: white;
  background-color: #111;
  padding: 0.5em;
  /* Extra top padding: the counter tucks under the card it counts */
  padding-top: 1em;
  border: 2px solid black;
  border-radius: 8px;
}
</style>
