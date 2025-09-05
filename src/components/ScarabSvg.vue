<template>
  <svg class="card-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img"
    aria-labelledby="scarab-title scarab-desc">
    <title id="scarab-title">Scarab currency symbol</title>
    <desc id="scarab-desc">A circle with four extended arms at 45-degree angles.</desc>

    <!-- Outer black stroke -->
    <g fill="none" stroke="currentColor" stroke-width="24" stroke-linecap="round" stroke-linejoin="round">
      <!-- Circle -->
      <circle cx="64" cy="64" r="40" />
      <!-- Arms (25% of diameter ≈ 20 units long beyond the circle edge) -->
      <line x1="92.3" y1="92.3" x2="106.5" y2="106.5" />
      <line x1="35.7" y1="92.3" x2="21.5" y2="106.5" />
      <line x1="35.7" y1="35.7" x2="21.5" y2="21.5" />
      <line x1="92.3" y1="35.7" x2="106.5" y2="21.5" />
    </g>

    <!-- Inner white stroke -->
    <g fill="none" stroke="#fff" stroke-width="20" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="64" cy="64" r="40" />
      <line x1="92.3" y1="92.3" x2="106.5" y2="106.5" />
      <line x1="35.7" y1="92.3" x2="21.5" y2="106.5" />
      <line x1="35.7" y1="35.7" x2="21.5" y2="21.5" />
      <line x1="92.3" y1="35.7" x2="106.5" y2="21.5" />
    </g>
  </svg>
</template>
