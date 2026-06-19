import { nextTick } from 'vue'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'

gsap.registerPlugin(Flip)

// Every card element in every zone (draw pile, hand, board, discard) carries a
// `data-flip-id` set to its instanceId, so this single selector captures any
// card wherever it currently lives.
const CARD_SELECTOR = '[data-flip-id]'

/**
 * Animates cards between zones using GSAP FLIP. Captures the position of every
 * card, applies the state mutation, waits for Vue to re-render, then tweens each
 * card from its previous position to its new one. Because cards are matched by
 * `data-flip-id`, any card that changes zone (hand→board, board→discard,
 * draw→hand, …) animates correctly.
 */
export function useCardFlip() {
  async function animateCardMove(mutate: () => void, vars?: Flip.FromToVars) {
    const state = Flip.getState(CARD_SELECTOR)

    mutate()
    await nextTick()

    Flip.from(state, {
      targets: CARD_SELECTOR,
      duration: 0.2,
      ease: 'power2',
      ...vars,
    })
  }

  return { animateCardMove }
}
