<script setup lang="ts">
import { computed } from 'vue'

export interface Point {
  x: number
  y: number
}

interface Props {
  /** Centre of the circle, in viewport pixels. Nothing renders when null. */
  origin: Point | null
  /** Where the arrow tip should land. Null renders the circle on its own. */
  target?: Point | null
  /** Circle radius in pixels. Every other dimension is derived from it. */
  radius: number
}

const props = defineProps<Props>()

/** Tail width equals the radius, i.e. half the circle's height. */
const tailWidth = computed(() => props.radius)
/** Head is twice the tail so the barbs stay readable at any circle size. */
const headWidth = computed(() => props.radius * 2)
/** Fixed for a given radius, so lengthening stretches the tail alone. */
const headLength = computed(() => props.radius * 1.25)
/** Below this reach the tail would invert, so the circle is drawn alone. */
const minReach = computed(() => props.radius + headLength.value + 4)
/** Outline scales with the circle so it reads the same at any size. */
const strokeWidth = computed(() => Math.max(2, props.radius * 0.06))

/**
 * Where the tail's edges meet the circle. The edges run along y = ±tailWidth/2,
 * so they cross the circle at x = sqrt(r² - (tailWidth/2)²). Clamped because a
 * tail wider than the circle has no intersection and would yield NaN.
 */
const junction = computed(() => {
  const halfTail = Math.min(tailWidth.value / 2, props.radius)
  return { x: Math.sqrt(props.radius * props.radius - halfTail * halfTail), y: halfTail }
})

/** The bare circle, as a path so both states render through one element. */
function circlePath(): string {
  const r = props.radius
  return [`M ${r} 0`, `A ${r} ${r} 0 1 1 ${-r} 0`, `A ${r} ${r} 0 1 1 ${r} 0`, 'Z'].join(' ')
}

/**
 * Circle and arrow as one closed silhouette, drawn pointing along +X from the
 * circle's centre. Tracing the tail out to the head and back leaves the two
 * junction points on the circle, which a single arc round the far side rejoins —
 * so the near arc is never drawn and the shape carries one continuous outline
 * rather than two abutting ones.
 *
 * Only `length` varies between targets: the head always occupies the final
 * `headLength` units, so lengthening stretches the tail alone and never
 * distorts the head. The caller rotates this into place.
 */
function arrowPath(length: number): string {
  const r = props.radius
  const tip = length
  const base = length - headLength.value
  const head = headWidth.value / 2
  const { x: jx, y: tail } = junction.value

  return [
    `M ${jx} ${-tail}`,
    `L ${base} ${-tail}`,
    `L ${base} ${-head}`,
    `L ${tip} 0`,
    `L ${base} ${head}`,
    `L ${base} ${tail}`,
    `L ${jx} ${tail}`,
    // Large-arc, clockwise: the long way round, skipping the tail's own mouth.
    `A ${r} ${r} 0 1 1 ${jx} ${-tail}`,
    'Z',
  ].join(' ')
}

/** Offset from origin to target, or null when there is nothing to point at. */
const delta = computed(() => {
  const { origin, target } = props
  if (!origin || !target) return null
  return { x: target.x - origin.x, y: target.y - origin.y }
})

const angle = computed(() => {
  if (!delta.value) return 0
  return (Math.atan2(delta.value.y, delta.value.x) * 180) / Math.PI
})

const path = computed(() => {
  if (!delta.value) return circlePath()
  const length = Math.hypot(delta.value.x, delta.value.y)
  if (length < minReach.value) return circlePath()
  return arrowPath(length)
})
</script>

<template>
  <Teleport to="body">
    <svg v-if="props.origin" class="attack-arrow-overlay" data-testid="attack-arrow">
      <!--
        Opacity sits on the group, not the shape: SVG applies group opacity as a
        post-processing step on the composited result, so the fill and stroke
        fade together instead of the stroke darkening where it overlaps.

        Rotation is applied to the path rather than the group because the path is
        authored pointing along +X. The circle arc is centred on the rotation
        origin, so spinning it leaves the circle unchanged.
      -->
      <g
        class="attack-arrow"
        :stroke-width="strokeWidth"
        :transform="`translate(${props.origin.x} ${props.origin.y})`"
      >
        <path :d="path" :transform="`rotate(${angle})`" />
      </g>
    </svg>
  </Teleport>
</template>

<style scoped>
/*
 * No viewBox: SVG user units then equal CSS pixels, so viewport coordinates
 * from getBoundingClientRect() can be used directly as path coordinates.
 * Sits above the cards (which top out at z-index 10) and below modals (1000).
 */
.attack-arrow-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  overflow: visible;
  z-index: 500;
}

.attack-arrow {
  opacity: 0.75;
}

.attack-arrow path {
  fill: #fff;
  stroke: #000;
  stroke-linejoin: round;
}
</style>
