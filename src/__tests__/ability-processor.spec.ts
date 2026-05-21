import { describe, it, expect } from 'vitest'
import { handleEffect, resolveChoice } from '../utils/ability-processor'
import type { GameState } from '../utils/game'
import type { Run } from '../utils/run'
import { doubleChoice, starterRules } from '../utils/cards'

function createTestRun(cards: Partial<Run['cards']> = {}): Run {
  return {
    deck: {
      name: 'Test Deck',
      rulesCard: starterRules,
      cards: {},
    },
    cards: {
      drawPile: [],
      hand: [],
      board: [],
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
      pendingChoice: null,
    },
  }
}

function playCard(gameState: GameState, instanceId: string): GameState {
  return handleEffect(
    gameState,
    { type: 'play-card', params: { instanceId } },
    { kind: 'player' },
  )
}

describe('ability-processor', () => {
  describe('double choice card', () => {
    it('should open first modal when card with two choices is played', () => {
      const cardInstance = {
        ...doubleChoice,
        instanceId: 'test-instance-1',
      }

      const run = createTestRun({
        hand: [cardInstance],
      })
      const gameState = createTestGameState(run)

      const result = playCard(gameState, 'test-instance-1')

      expect(result.viewData.modalView).toBe('card-choice')
      expect(result.viewData.pendingChoice).not.toBeNull()
      expect(result.viewData.cardOptions.length).toBeGreaterThan(0)
    })

    it('should open second modal after first choice is made', () => {
      const cardInstance = {
        ...doubleChoice,
        instanceId: 'test-instance-1',
      }

      const run = createTestRun({
        hand: [cardInstance],
      })
      const gameState = createTestGameState(run)

      const afterFirstModal = playCard(gameState, 'test-instance-1')
      expect(afterFirstModal.viewData.modalView).toBe('card-choice')
      expect(afterFirstModal.viewData.pendingChoice).not.toBeNull()

      const firstChoice = afterFirstModal.viewData.cardOptions[0]
      const afterFirstChoice = resolveChoice(afterFirstModal, firstChoice)

      expect(afterFirstChoice.viewData.modalView).toBe('card-choice')
      expect(afterFirstChoice.viewData.pendingChoice).not.toBeNull()
      expect(afterFirstChoice.viewData.cardOptions.length).toBeGreaterThan(0)
    })

    it('should complete after second choice is made', () => {
      const cardInstance = {
        ...doubleChoice,
        instanceId: 'test-instance-1',
      }

      const run = createTestRun({
        hand: [cardInstance],
      })
      const gameState = createTestGameState(run)

      const afterFirstModal = playCard(gameState, 'test-instance-1')
      const firstChoice = afterFirstModal.viewData.cardOptions[0]

      const afterFirstChoice = resolveChoice(afterFirstModal, firstChoice)
      expect(afterFirstChoice.viewData.modalView).toBe('card-choice')

      const secondChoice = afterFirstChoice.viewData.cardOptions[0]
      const afterSecondChoice = resolveChoice(afterFirstChoice, secondChoice)

      expect(afterSecondChoice.viewData.modalView).toBeNull()
      expect(afterSecondChoice.viewData.pendingChoice).toBeNull()

      expect(afterSecondChoice.game.collection.cards[firstChoice]).toBe(1)
      expect(afterSecondChoice.game.collection.cards[secondChoice]).toBe(
        firstChoice === secondChoice ? 2 : 1,
      )
    })
  })
})
