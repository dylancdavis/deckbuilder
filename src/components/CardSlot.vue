<template>
  <div class="card-slot" aria-label="Empty card slot" role="img"></div>
</template>

<style scoped>
.card-slot {
  --card-width: var(--collection-card-width);
  --card-height: calc(var(--card-width) * 7 / 5);
  --slot-color: #cfcfcf;
  --slot-stroke-width: calc(var(--card-width) * 4 / 200);
  --slot-corner-radius: calc(var(--card-width) * 16 / 200);

  box-sizing: border-box;
  position: relative;
  display: grid;
  width: var(--card-width);
  height: var(--card-height);
  place-items: center;
  border: var(--slot-stroke-width) dashed var(--slot-color);
  border-radius: var(--slot-corner-radius);
}

.card-slot::before,
.card-slot::after {
  position: absolute;
  content: '';
  background-color: var(--slot-color);
}

.card-slot::before {
  width: 20%;
  height: var(--slot-stroke-width);
}

.card-slot::after {
  width: var(--slot-stroke-width);
  height: calc(var(--card-width) * 20 / 100);
}
</style>
