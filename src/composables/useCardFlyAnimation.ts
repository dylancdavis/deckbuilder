import { nextTick } from 'vue'

interface AnimationOptions {
  /** Duration of the animation in milliseconds */
  duration?: number
  /** Easing function for the animation */
  easing?: string
  /** Scale factor during flight (default: 0.6) */
  scale?: number
}

interface FlyAnimationParams {
  /** The element being clicked (source) */
  sourceElement: HTMLElement
  /** The target element in the deck list */
  targetElement: HTMLElement | null
  /** The card element to clone and animate */
  cardElement: HTMLElement
  /** Animation options */
  options?: AnimationOptions
}

const DEFAULT_OPTIONS: Required<AnimationOptions> = {
  duration: 600,
  easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  scale: 0.15
}

/**
 * Creates a flying card animation from source to target position
 * Uses FLIP technique: First, Last, Invert, Play
 */
export function useCardFlyAnimation() {
  /**
   * Animates a card flying from source to target
   */
  async function flyCard({
    sourceElement,
    targetElement,
    cardElement,
    options = {}
  }: FlyAnimationParams): Promise<void> {
    const opts = { ...DEFAULT_OPTIONS, ...options }

    // Get the source position (use cardElement for accurate sizing)
    const sourceRect = cardElement.getBoundingClientRect()

    // Get or calculate the target position
    let targetRect: DOMRect
    if (targetElement) {
      targetRect = targetElement.getBoundingClientRect()
    } else {
      // If no target element exists yet, fly to a default position
      // This handles the case where the card isn't in the deck yet
      targetRect = new DOMRect(
        window.innerWidth * 0.15, // Approximate deck list position
        window.innerHeight * 0.3,
        100,
        50
      )
    }

    // Clone the card element for animation
    const clone = cardElement.cloneNode(true) as HTMLElement
    clone.style.position = 'fixed'
    clone.style.pointerEvents = 'none'
    clone.style.zIndex = '9999'
    clone.style.margin = '0'
    clone.style.transition = 'none' // Ensure no transition initially

    // Position clone at source
    clone.style.left = `${sourceRect.left}px`
    clone.style.top = `${sourceRect.top}px`
    clone.style.width = `${sourceRect.width}px`
    clone.style.height = `${sourceRect.height}px`
    clone.style.opacity = '1'

    // Add to DOM
    document.body.appendChild(clone)

    // Wait for next frame to ensure clone is rendered, then another frame to apply transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Calculate the center of the target element
        const targetCenterX = targetRect.left + targetRect.width / 2
        const targetCenterY = targetRect.top + targetRect.height / 2

        // Calculate the center of the source element
        const sourceCenterX = sourceRect.left + sourceRect.width / 2
        const sourceCenterY = sourceRect.top + sourceRect.height / 2

        // Calculate the translation needed to center on target
        const deltaX = targetCenterX - sourceCenterX
        const deltaY = targetCenterY - sourceCenterY

        // Apply transition
        clone.style.transition = `transform ${opts.duration}ms ${opts.easing}, opacity ${opts.duration}ms ${opts.easing}`
        clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${opts.scale})`
        clone.style.opacity = '0'

        // Remove clone after animation completes
        setTimeout(() => {
          clone.remove()
        }, opts.duration)
      })
    })
  }

  return {
    flyCard
  }
}
