<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, watch } from 'vue'
import { gsap } from 'gsap'

export interface Point {
  x: number
  y: number
}

interface Props {
  /** Centre of the circle, in viewport pixels. Nothing renders when null. */
  origin: Point | null
  /** Where the arrow tip should land. Null retracts to the bare circle. */
  target?: Point | null
  /** Circle radius in pixels. Every other dimension is derived from it. */
  radius: number
}

const props = defineProps<Props>()

/*
 * Arrow proportions, as multiples of the circle's radius, at full extension.
 * `extension` below scales all three together, which is what lets one path
 * serve as both the arrow and the bare circle.
 */
const TAIL_WIDTH_RATIO = 1
const HEAD_WIDTH_RATIO = 2
const HEAD_LENGTH_RATIO = 1.25

/**
 * Extension can approach zero but must never reach it. At exactly zero the
 * arc's start and end points coincide, and an arc with identical endpoints
 * renders as nothing at all — the circle would blink out on the final frame.
 * At this value the residual stub is a fraction of a pixel wide.
 */
const MIN_EXTENSION = 0.005

const EXTEND_DURATION = 0.22
const RETRACT_DURATION = 0.16

/**
 * Animated geometry, in polar terms. Deliberately not the target point: a swing
 * between two cards on opposite sides of the origin would, in cartesian terms,
 * pass close to the origin and briefly collapse the arrow. Interpolating the
 * reach directly keeps it monotonic between the two endpoints, and sweeping the
 * angle reads as the arrow swinging across rather than the tip sliding.
 *
 * GSAP mutates these in place; the reactive proxy turns each frame's write into
 * a re-render.
 */
const anim = reactive({ reach: 0, angle: 0, extension: MIN_EXTENSION })

/** Current scale of the arrow's appendage, clamped away from the vanishing arc. */
const extension = computed(() => Math.min(1, Math.max(MIN_EXTENSION, anim.extension)))

/** Outline scales with the circle so it reads the same at any size. */
const strokeWidth = computed(() => Math.max(2, props.radius * 0.06))

/**
 * Every dimension the path needs at a given extension. Single source for the
 * shape, so the ratios above can be retuned without algebra elsewhere.
 *
 * `junctionX` is where the tail's edges meet the circle: the edges run along
 * y = +/-halfTail, so they cross it at sqrt(r^2 - halfTail^2). The half-tail is
 * clamped because a tail wider than the circle has no intersection and would
 * yield NaN. As extension approaches zero the half-tail does too, so junctionX
 * converges on r — the point the whole appendage collapses onto.
 */
function geometryAt(e: number) {
  const r = props.radius
  const halfTail = Math.min((r * TAIL_WIDTH_RATIO * e) / 2, r)
  return {
    halfTail,
    junctionX: Math.sqrt(r * r - halfTail * halfTail),
    headLength: r * HEAD_LENGTH_RATIO * e,
    headHalfWidth: (r * HEAD_WIDTH_RATIO * e) / 2,
  }
}

/**
 * Shortest reach that still renders cleanly at this extension: any less and the
 * head would overrun the junction, inverting the tail. Rises monotonically with
 * extension, from r at nothing to about 2.12r at full size.
 */
function minReachAt(e: number): number {
  const g = geometryAt(e)
  return g.junctionX + g.headLength
}

/**
 * Largest extension that still fits inside `reach`, so the tip lands on the
 * target instead of overshooting it. A near target therefore gets a
 * proportionally stubbier arrow, shrinking continuously to a bare circle rather
 * than snapping to one. Bisection rather than algebra so the ratios above stay
 * freely tunable; this runs once per target, not per frame.
 */
function fittingExtension(reach: number): number {
  if (reach >= minReachAt(1)) return 1
  let lo = MIN_EXTENSION
  let hi = 1
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (minReachAt(mid) <= reach) lo = mid
    else hi = mid
  }
  return lo
}

const geometry = computed(() => geometryAt(extension.value))

/**
 * Circle and arrow as one closed silhouette, drawn pointing along +X from the
 * circle's centre. Tracing the tail out to the head and back leaves the two
 * junction points on the circle, which a single arc round the far side rejoins —
 * so the near arc is never drawn and the shape carries one continuous outline
 * rather than two abutting ones.
 *
 * The command sequence is fixed: one moveto, six linetos, one arc, one close.
 * Only the numbers vary, at every extension and every reach, which is what makes
 * the whole range linearly interpolatable — including the collapse to a circle.
 */
const path = computed(() => {
  const r = props.radius
  const { junctionX, halfTail, headLength, headHalfWidth } = geometry.value
  const tip = Math.max(anim.reach, minReachAt(extension.value))
  const base = tip - headLength

  return [
    `M ${junctionX} ${-halfTail}`,
    `L ${base} ${-halfTail}`,
    `L ${base} ${-headHalfWidth}`,
    `L ${tip} 0`,
    `L ${base} ${headHalfWidth}`,
    `L ${base} ${halfTail}`,
    `L ${junctionX} ${halfTail}`,
    // Large-arc, clockwise: the long way round, skipping the tail's own mouth.
    `A ${r} ${r} 0 1 1 ${junctionX} ${-halfTail}`,
    'Z',
  ].join(' ')
})

/** Where the arrow should be pointing, or null when there is nothing to point at. */
const aim = computed(() => {
  const { origin, target } = props
  if (!origin || !target) return null
  const dx = target.x - origin.x
  const dy = target.y - origin.y
  return {
    reach: Math.hypot(dx, dy),
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
  }
})

/**
 * Rebases `from` so that tweening it to `to` takes the short way round. atan2
 * reports -180..180, so without this a swing across that seam (170° to -170°,
 * a 20° nudge) would instead spin 340° the other way.
 */
function shortestApproach(from: number, to: number): number {
  let delta = (to - from) % 360
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return to - delta
}

/** Suppresses re-tweening to a destination the arrow is already headed for. */
let committed: { reach: number; angle: number } | null = null

function retract() {
  committed = null
  gsap.to(anim, {
    extension: MIN_EXTENSION,
    reach: props.radius,
    duration: RETRACT_DURATION,
    ease: 'power2.in',
    overwrite: true,
  })
}

watch(aim, (next) => {
  if (!next) {
    if (committed) retract()
    return
  }

  const settled =
    committed &&
    Math.abs(next.reach - committed.reach) < 0.5 &&
    Math.abs(next.angle - committed.angle) < 0.5
  if (settled) return

  // Coming out of the circle there is no meaningful previous direction, so adopt
  // the new angle outright rather than sweeping from a stale one. Arrow to arrow
  // does sweep, taking the short way round.
  if (!committed) {
    anim.angle = next.angle
  } else {
    anim.angle = shortestApproach(anim.angle, next.angle)
  }

  committed = next
  gsap.to(anim, {
    extension: fittingExtension(next.reach),
    reach: next.reach,
    angle: next.angle,
    duration: EXTEND_DURATION,
    ease: 'power3.out',
    overwrite: true,
  })
})

// A fresh attacker starts from a bare circle rather than inheriting the last
// one's pose.
watch(
  () => props.origin,
  (origin) => {
    if (origin) return
    gsap.killTweensOf(anim)
    committed = null
    anim.extension = MIN_EXTENSION
    anim.reach = props.radius
  },
)

onBeforeUnmount(() => gsap.killTweensOf(anim))
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
        <path :d="path" :transform="`rotate(${anim.angle})`" />
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
