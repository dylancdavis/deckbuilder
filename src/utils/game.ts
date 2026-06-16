import type { Collection } from './collection.ts'
import type { Run } from './run.ts'
import type { CardID } from './cards.ts'
import type { Event } from './event.ts'
import type { CardChoiceEffect } from './effects.ts'
import type { EffectContext, EffectStackItem } from './ability-processor.ts'

/**
 * A paused card-choice interaction: the remaining stack, the choice effect that
 * paused it, and the context to resume under. The choice effect carries the
 * `choiceHandler` closure, so this isn't fully serializable, but the stack and
 * control state are plain data instead of a stored resolver.
 */
export type PendingChoice = {
  cardOptions: CardID[]
  tags: string[]
  choiceEffect: CardChoiceEffect
  context: EffectContext
  remainingStack: EffectStackItem[]
}

export type PendingAttack = {
  attackerInstanceId: string
}

export type GameState = {
  game: {
    collection: Collection
    run: Run | null
  }
  ui: {
    currentView: string[]
    collection: {
      selectedDeck: string | null
    }
  }
  viewData: {
    modalView: 'card-choice' | 'attack-target' | null
    cardOptions: CardID[]
    pendingChoice: PendingChoice | null
    pendingAttack: PendingAttack | null
  }
}

export function logEvent(gameState: GameState, event: Event) {
  return {
    ...gameState,
    game: {
      ...gameState.game,
      run: {
        ...gameState.game.run!,
        events: gameState.game.run!.events.concat(event),
      },
    },
  }
}
