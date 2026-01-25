import { describe, it, expect } from 'vitest'
import { handleEvent, findMatchingAbilities } from '../utils/ability-processor'
import type { GameState } from '../utils/game'
import type { Run } from '../utils/run'
import type { CardPlayEvent } from '../utils/event'
import { doubleChoice } from '../utils/cards'

function createTestRun(cards: Partial<Run['cards']> = {}): Run {
  return {
    deck: {
      name: 'Test Deck',
      rulesCard: null,
      cards: {},
      editable: false,
    },
    cards: {
      drawPile: [],
      hand: [],
      board: [],
      stack: [],
      discardPile: [],
      ...cards,
    },
    resources: { points: 0 },
    events: [],
    stats: { rounds: 1, turns: 1 },
  }
}

function createTestGameState(run: Run): GameState {
  return {
    game: {
      collection: { cards: {}, decks: {} },
      run,
    },
    ui: {
      currentView: ['run'],
      collection: { selectedDeck: null },
    },
    viewData: {
      modalView: null,
      cardOptions: [],
      resolver: null,
    },
  }
}

describe('ability-processor', () => {
  describe('double choice card', () => {
    it('should open first modal when card with two choices is played', () => {
      const cardInstance = {
        ...doubleChoice,
        instanceId: 'test-instance-1',
      }

      const run = createTestRun({
        stack: [cardInstance],
      })
      const gameState = createTestGameState(run)

      const playEvent: CardPlayEvent = {
        type: 'card-play',
        cardId: 'double-choice',
        instanceId: 'test-instance-1',
        round: 1,
        turn: 1,
      }

      const result = handleEvent(gameState, playEvent)

      // First modal should be open
      expect(result.viewData.modalView).toBe('card-choice')
      expect(result.viewData.resolver).not.toBeNull()
      expect(result.viewData.cardOptions.length).toBeGreaterThan(0)
    })

    it('should open second modal after first choice is made', () => {
      const cardInstance = {
        ...doubleChoice,
        instanceId: 'test-instance-1',
      }

      const run = createTestRun({
        stack: [cardInstance],
      })
      const gameState = createTestGameState(run)

      const playEvent: CardPlayEvent = {
        type: 'card-play',
        cardId: 'double-choice',
        instanceId: 'test-instance-1',
        round: 1,
        turn: 1,
      }

      // Step 1: Play the card - first modal should open
      const afterFirstModal = handleEvent(gameState, playEvent)
      expect(afterFirstModal.viewData.modalView).toBe('card-choice')
      expect(afterFirstModal.viewData.resolver).not.toBeNull()

      // Step 2: Simulate clearing the modal and making a choice
      const resolver = afterFirstModal.viewData.resolver!
      const stateWithModalCleared: GameState = {
        ...afterFirstModal,
        viewData: {
          ...afterFirstModal.viewData,
          modalView: null,
          resolver: null,
          cardOptions: [],
        },
      }

      // Pick any card from the options
      const firstChoice = afterFirstModal.viewData.cardOptions[0]
      const afterFirstChoice = resolver(stateWithModalCleared, firstChoice)

      // Step 3: Second modal should be open
      expect(afterFirstChoice.viewData.modalView).toBe('card-choice')
      expect(afterFirstChoice.viewData.resolver).not.toBeNull()
      expect(afterFirstChoice.viewData.cardOptions.length).toBeGreaterThan(0)
    })

    it('should complete after second choice is made', () => {
      const cardInstance = {
        ...doubleChoice,
        instanceId: 'test-instance-1',
      }

      const run = createTestRun({
        stack: [cardInstance],
      })
      const gameState = createTestGameState(run)

      const playEvent: CardPlayEvent = {
        type: 'card-play',
        cardId: 'double-choice',
        instanceId: 'test-instance-1',
        round: 1,
        turn: 1,
      }

      // Step 1: Play the card
      const afterFirstModal = handleEvent(gameState, playEvent)
      const resolver1 = afterFirstModal.viewData.resolver!
      const clearedState1: GameState = {
        ...afterFirstModal,
        viewData: { modalView: null, resolver: null, cardOptions: [] },
      }
      const firstChoice = afterFirstModal.viewData.cardOptions[0]

      // Step 2: Make first choice
      const afterFirstChoice = resolver1(clearedState1, firstChoice)
      expect(afterFirstChoice.viewData.modalView).toBe('card-choice')

      const resolver2 = afterFirstChoice.viewData.resolver!
      const clearedState2: GameState = {
        ...afterFirstChoice,
        viewData: { modalView: null, resolver: null, cardOptions: [] },
      }
      const secondChoice = afterFirstChoice.viewData.cardOptions[0]

      // Step 3: Make second choice
      const afterSecondChoice = resolver2(clearedState2, secondChoice)

      // Should be done - no modal open
      expect(afterSecondChoice.viewData.modalView).toBeNull()
      expect(afterSecondChoice.viewData.resolver).toBeNull()

      // Both cards should be collected
      expect(afterSecondChoice.game.collection.cards[firstChoice]).toBe(1)
      expect(afterSecondChoice.game.collection.cards[secondChoice]).toBe(
        firstChoice === secondChoice ? 2 : 1,
      )
    })
  })
})
