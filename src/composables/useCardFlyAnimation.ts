const DURATION = 600
const EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
const SCALE = 0.15

/**
 * Generic flying element animation composable
 * Clones an element and animates it from source to target position with fade out
 */
export function useFlyAnimation() {
  /**
   * Animates an element flying from source to target position
   */
  async function flyElement(source: HTMLElement, target: HTMLElement): Promise<void> {

    const sourceRect = source.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()

    // Clone the source element for animation
    const clone = source.cloneNode(true) as HTMLElement
    clone.style.position = 'fixed'
    clone.style.pointerEvents = 'none'
    clone.style.zIndex = '9999'
    clone.style.margin = '0'
    clone.style.transition = 'none'

    // Position clone at source
    clone.style.left = `${sourceRect.left}px`
    clone.style.top = `${sourceRect.top}px`
    clone.style.width = `${sourceRect.width}px`
    clone.style.height = `${sourceRect.height}px`
    clone.style.opacity = '1'

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
        clone.style.transition = `transform ${DURATION}ms ${EASING}, opacity ${DURATION}ms ${EASING}`
        clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${SCALE})`
        clone.style.opacity = '0'

        // Remove clone after animation completes
        setTimeout(() => {
          clone.remove()
        }, DURATION)
      })
    })
  }

  return {
    flyElement
  }
}
