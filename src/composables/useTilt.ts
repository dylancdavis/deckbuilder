import { onMounted, onBeforeUnmount, type Ref } from 'vue'
import VanillaTilt from 'vanilla-tilt'

// Extend HTMLElement to include vanillaTilt property
interface HTMLElementWithTilt extends HTMLElement {
  vanillaTilt?: VanillaTilt
}

export interface TiltOptions {
  /** Reverse the tilt direction */
  reverse?: boolean
  /** Maximum tilt rotation (degrees) */
  max?: number
  /** Starting X tilt rotation (degrees) */
  startX?: number
  /** Starting Y tilt rotation (degrees) */
  startY?: number
  /** Transform perspective */
  perspective?: number
  /** Scale on tilt */
  scale?: number
  /** Speed of the transition */
  speed?: number
  /** Transition timing function */
  transition?: boolean
  /** Axis (null = both, 'x', 'y') */
  axis?: null | 'x' | 'y'
  /** Reset tilt on mouse leave */
  reset?: boolean
  /** Enable glare effect */
  glare?: boolean
  /** Max glare opacity */
  'max-glare'?: number
  /** Enable mouse events on the whole document */
  'full-page-listening'?: boolean
}

// Predefined tilt option presets
export const TILT_PRESETS = {
  /** Default tilt for collection view - full effect with scale */
  collection: {
    reverse: true,
    max: 8,
    scale: 1.05,
    speed: 400,
    glare: true,
    'max-glare': 0.2,
  } as TiltOptions,
  /** Subtle tilt for hand cards - less dramatic rotation */
  hand: {
    reverse: true,
    max: 4,
    scale: 1.05,
    speed: 400,
    glare: true,
    'max-glare': 0.2,
  } as TiltOptions,
  /** Minimal tilt for rules card, discard, and draw pile - no scale */
  minimal: {
    reverse: true,
    max: 2,
    scale: 1.0,
    speed: 400,
    glare: true,
    'max-glare': 0.2,
  } as TiltOptions,
} as const

/**
 * Vue composable for vanilla-tilt integration
 * Handles lifecycle-aware initialization and cleanup
 */
export function useTilt(elementRef: Ref<HTMLElement | null>, options?: TiltOptions) {
  let tiltInstance: VanillaTilt | null = null

  onMounted(() => {
    if (elementRef.value) {
      VanillaTilt.init(elementRef.value, options)
      tiltInstance = (elementRef.value as HTMLElementWithTilt).vanillaTilt || null
    }
  })

  onBeforeUnmount(() => {
    if (tiltInstance && elementRef.value) {
      tiltInstance.destroy()
    }
  })
}
