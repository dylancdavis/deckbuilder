<script setup lang="ts">
import { ref } from 'vue'
import { useTilt, type TiltOptions } from '@/composables/useTilt'

interface Props {
  /** Tilt effect options - pass a TiltOptions object to enable tilt */
  tilt?: TiltOptions
}

const props = defineProps<Props>()

const cardRef = ref<HTMLElement | null>(null)

// Initialize tilt if options are provided
if (props.tilt) {
  useTilt(cardRef, props.tilt)
}
</script>

<template>
  <div ref="cardRef" class="card-container card-back">
    <!-- Deckbuilder Card Icon.svg, cropped to its content: two dark cards and the light mark between them -->
    <svg class="card-back-icon" viewBox="48 10.7 190.4 228.6" aria-hidden="true">
      <path
        class="icon-dark"
        d="m48.0 23.378935c0 -6.99325 5.6691513 -12.662399 12.662399 -12.662399l134.6752 0c3.3582764 0 6.57901 1.3340702 8.953674 3.7087307c2.374649 2.3746605 3.708725 5.595392 3.708725 8.953669l0 171.96654c0 6.9932556 -5.6691437 12.662399 -12.662399 12.662399l-134.6752 0c-6.993248 0 -12.662399 -5.6691437 -12.662399 -12.662399z"
      />
      <path
        class="icon-dark"
        d="m78.614174 53.993107c0 -6.993248 5.6691513 -12.662399 12.662399 -12.662399l134.6752 0c3.3582764 0 6.57901 1.3340721 8.953674 3.7087326c2.3746643 2.3746605 3.708725 5.5953903 3.708725 8.953667l0 171.96654c0 6.9932556 -5.6691437 12.662399 -12.662399 12.662399l-134.6752 0c-6.993248 0 -12.662399 -5.6691437 -12.662399 -12.662399z"
      />
      <path class="icon-dark" d="m67.3114 32.483482l79.37009 0l0 66.99213l-79.37009 0z" />
      <path
        class="icon-light"
        d="m143.30708 41.330708l64.69292 0c2.89917E-4 0 5.645752E-4 1.1444092E-4 7.6293945E-4 3.1661987E-4c1.9836426E-4 2.0217896E-4 3.2043457E-4 4.7683716E-4 3.2043457E-4 7.6293945E-4l-0.001083374 101.98317c0 35.728912 -28.964005 64.69292 -64.69292 64.69292l-64.69291 0c-5.950928E-4 0 -0.0010757446 -4.8828125E-4 -0.0010757446 -0.001083374l0.0010757446 -101.98317c0 -35.728905 28.964005 -64.69292 64.69291 -64.69292z"
      />
    </svg>
  </div>
</template>
