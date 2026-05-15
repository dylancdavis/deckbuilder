import type { Collection } from './collection.ts'
import type { Run } from './run.ts'
import type { CardID } from './cards.ts'
import type { Event } from './event.ts'
import type { CardChoiceEffect } from './effects.ts'
import type { EffectContext, EffectQueueItem } from './ability-processor.ts'

/**
 * Data representing a paused card-choice interaction.
 * Stored on game state so the pending work is inspectable data, not closures.
 */
export type PendingChoice = {
  cardOptions: CardID[]
  tags: string[]
  choiceEffect: CardChoiceEffect
  context: EffectContext
  remainingQueue: EffectQueueItem[]
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
    modalView: 'card-choice' | null
    cardOptions: CardID[]
    pendingChoice: PendingChoice | null
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
