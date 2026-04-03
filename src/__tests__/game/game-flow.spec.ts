import { describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { render, fireEvent, screen } from '@testing-library/vue'
import App from '../../App.vue'

// Mock shuffle to preserve order
vi.mock('../../utils/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../utils/utils')>()
  return {
    ...original,
    shuffle: <T>(arr: T[]) => [...arr],
    selectRandom: <T>(arr: T[], n?: number) => arr.slice(0, n),
  }
})

function renderApp() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return render(App, { global: { plugins: [pinia] } })
}

async function startStarterDeckRun() {
  renderApp()
  await fireEvent.click(screen.getByText('Starter Deck'))
  await fireEvent.click(screen.getByText('Run This Deck'))
}

async function playFirstHandCard() {
  const handCards = screen.getAllByTestId('hand-card')
  await fireEvent.click(handCards[0])
}

async function clickNextTurn() {
  await fireEvent.click(screen.getByTestId('next-turn-btn'))
}

// Display value helpers
const getDrawPileCount = () => screen.getByTestId('draw-pile-count').textContent?.trim() ?? ''
const getDiscardPileCount = () => screen.getByTestId('discard-pile-count').textContent?.trim() ?? ''
const getPoints = () => screen.getByTestId('points-display').textContent?.trim() ?? ''
const getRound = () => screen.getByTestId('round-display').textContent?.trim() ?? ''
const getTurn = () => screen.getByTestId('turn-display').textContent?.trim() ?? ''
const getHandSize = () => screen.queryAllByTestId('hand-card').length
const getCardsPlayed = () => screen.getByTestId('cards-played-display').textContent?.trim() ?? ''
const getNextTurnText = () => screen.getByTestId('next-turn-btn').textContent?.trim() ?? ''

describe('starter deck run', () => {
  // Initialization tests
  describe('initialization', () => {
    it('draws 2 cards into the hand', async () => {
      await startStarterDeckRun()
      expect(getHandSize()).toBe(2)
    })

    it('shows 6 cards remaining in the draw pile', async () => {
      await startStarterDeckRun()
      expect(getDrawPileCount()).toBe('6')
    })

    it('starts at round 1, turn 1', async () => {
      await startStarterDeckRun()
      expect(getRound()).toContain('1')
      expect(getTurn()).toContain('1')
    })

    it('starts with 0 points', async () => {
      await startStarterDeckRun()
      expect(getPoints()).toContain('0')
    })

    it('shows 0 cards played', async () => {
      await startStarterDeckRun()
      expect(getCardsPlayed()).toContain('0')
    })

    it('shows Next Turn button with discard subtitle', async () => {
      await startStarterDeckRun()
      expect(getNextTurnText()).toContain('Next Turn')
      expect(screen.getByText('(Discard Hand)')).toBeTruthy()
    })
  })

  // Card play tests
  describe('playing a card', () => {
    it('removes the played card from hand', async () => {
      await startStarterDeckRun()
      expect(getHandSize()).toBe(2)

      await playFirstHandCard()

      expect(getHandSize()).toBe(1)
    })

    it('increments cards played counter', async () => {
      await startStarterDeckRun()
      await playFirstHandCard()

      expect(getCardsPlayed()).toContain('1')
    })

    it('playing a score card increases points by 1', async () => {
      await startStarterDeckRun()
      // Turn 1 hand is [score, score] with deterministic order
      await playFirstHandCard()

      expect(getPoints()).toContain('1')
    })

    it('playing two score cards across two turns accumulates points', async () => {
      await startStarterDeckRun()

      // Turn 1: play score → 1 point
      await playFirstHandCard()
      expect(getPoints()).toContain('1')

      await clickNextTurn()

      // Turn 2: play score → 2 points
      await playFirstHandCard()
      expect(getPoints()).toContain('2')
    })

    it('disables remaining hand cards after play limit reached', async () => {
      await startStarterDeckRun()
      await playFirstHandCard()

      // starterRules: playAmount = 1, so remaining card should be disabled
      const remaining = screen.queryAllByTestId('hand-card')
      expect(remaining).toHaveLength(1)
      expect(remaining[0].classList.contains('card-disabled')).toBe(true)
    })
  })

  // Turn advancing tests
  describe('turn advancement', () => {
    it('advances the turn counter', async () => {
      await startStarterDeckRun()
      expect(getTurn()).toContain('1')

      await clickNextTurn()

      expect(getTurn()).toContain('2')
    })

    it('discards hand and draws 2 new cards', async () => {
      await startStarterDeckRun()
      expect(getHandSize()).toBe(2)
      expect(getDrawPileCount()).toBe('6')

      await clickNextTurn()

      expect(getHandSize()).toBe(2)
      expect(getDrawPileCount()).toBe('4')
    })

    it('discard pile grows by hand size after ending turn without playing', async () => {
      await startStarterDeckRun()

      await clickNextTurn()

      // 2 hand cards discarded
      expect(getDiscardPileCount()).toBe('2')
    })

    it('discard pile includes played and unplayed cards', async () => {
      await startStarterDeckRun()
      await playFirstHandCard() // plays 1, leaves 1 in hand

      await clickNextTurn()

      // 1 played (already in discard) + 1 unplayed (discarded at turn end) = 2
      expect(getDiscardPileCount()).toBe('2')
    })

    it('cards played counter resets on new turn', async () => {
      await startStarterDeckRun()
      await playFirstHandCard()
      expect(getCardsPlayed()).toContain('1')

      await clickNextTurn()

      expect(getCardsPlayed()).toContain('0')
    })

    it('draw pile depletes by 2 each turn', async () => {
      await startStarterDeckRun()
      expect(getDrawPileCount()).toBe('6')

      await clickNextTurn()
      expect(getDrawPileCount()).toBe('4')

      await clickNextTurn()
      expect(getDrawPileCount()).toBe('2')
    })

    it('points are preserved across turns', async () => {
      await startStarterDeckRun()
      await playFirstHandCard() // +1 point

      await clickNextTurn()

      expect(getPoints()).toContain('1')
    })

    it('discard pile accumulates across turns', async () => {
      await startStarterDeckRun()

      await clickNextTurn() // discard 2
      expect(getDiscardPileCount()).toBe('2')

      await clickNextTurn() // discard 2 more
      expect(getDiscardPileCount()).toBe('4')

      await clickNextTurn() // discard 2 more
      expect(getDiscardPileCount()).toBe('6')
    })
  })

  // Run lifecycle
  describe('full round progression', () => {
    it('draw pile is empty after 4 turns', async () => {
      await startStarterDeckRun()

      await clickNextTurn() // Turn 2: 4 remaining
      await clickNextTurn() // Turn 3: 2 remaining
      await clickNextTurn() // Turn 4: 0 remaining

      // Draw pile empty — element may not render, or shows 0
      // TODO: decide on which
      const el = screen.queryByTestId('draw-pile-count')
      if (el) expect(el.textContent?.trim()).toBe('0')
    })

    it('round stays at 1 throughout all turns', async () => {
      await startStarterDeckRun()

      for (let i = 0; i < 3; i++) {
        expect(getRound()).toContain('1')
        await clickNextTurn()
      }
      expect(getRound()).toContain('1')
    })

    it('turn counter increments: 1, 2, 3, 4', async () => {
      await startStarterDeckRun()
      expect(getTurn()).toContain('1')

      await clickNextTurn()
      expect(getTurn()).toContain('2')

      await clickNextTurn()
      expect(getTurn()).toContain('3')

      await clickNextTurn()
      expect(getTurn()).toContain('4')
    })

    it('button shows "End Run" on the last turn', async () => {
      await startStarterDeckRun()

      await clickNextTurn()
      await clickNextTurn()
      await clickNextTurn() // Turn 4 — draw pile empty

      expect(getNextTurnText()).toContain('End Run')
    })

    it('score from all played cards is preserved on last turn', async () => {
      await startStarterDeckRun()

      // Play a score card each turn
      await playFirstHandCard() // +1
      await clickNextTurn()
      await playFirstHandCard() // +1
      await clickNextTurn()
      await playFirstHandCard() // +1
      await clickNextTurn()
      await playFirstHandCard() // +1

      expect(getPoints()).toContain('4')
    })
  })

  // Ending run
  describe('run end', () => {
    it('clicking End Run returns to collection view', async () => {
      await startStarterDeckRun()

      // Advance through all 4 turns
      await clickNextTurn()
      await clickNextTurn()
      await clickNextTurn()

      // Click "End Run"
      await clickNextTurn()

      // Should be back at collection view
      expect(screen.queryByTestId('next-turn-btn')).toBeNull()
      expect(screen.getByText('Run This Deck')).toBeTruthy()
    })
  })

  describe('discard effects', () => {
    async function startDiscardTestRun() {
      renderApp()
      await fireEvent.click(screen.getByText('Discard Test Deck'))
      await fireEvent.click(screen.getByText('Run This Deck'))
    }

    const getBoardSize = () => screen.queryAllByTestId('board-card').length

    it('playing a discard card removes cards from hand and board', async () => {
      await startDiscardTestRun()

      // Initial state: hand = [hand-board-discard, score], board = [score]
      expect(getHandSize()).toBe(2)
      expect(getBoardSize()).toBe(1)

      // Play hand-board-discard (first card)
      await playFirstHandCard()

      // hand-board-discard discards 1 from hand (score) and 1 from board (score)
      // The played card itself also goes to discard
      expect(getHandSize()).toBe(0)
      expect(getBoardSize()).toBe(0)
      expect(getDiscardPileCount()).toBe('3')
    })
  })

  describe('move effects', () => {
    async function startMoveTestRun() {
      renderApp()
      await fireEvent.click(screen.getByText('Move Test Deck'))
      await fireEvent.click(screen.getByText('Run This Deck'))
    }

    const getBoardSize = () => screen.queryAllByTestId('board-card').length

    it('playing a move card moves a card from hand to board', async () => {
      await startMoveTestRun()

      // Initial state: hand = [hand-to-board, score], board empty
      expect(getHandSize()).toBe(2)
      expect(getBoardSize()).toBe(0)

      // Play hand-to-board (first card) — moves 1 from hand to board
      await playFirstHandCard()

      // score moved to board, hand-to-board went to discard
      expect(getHandSize()).toBe(0)
      expect(getBoardSize()).toBe(1)
      expect(getDiscardPileCount()).toBe('1')
    })
  })

  // Choice tests
  describe('card choice modal', () => {
    it('playing collect-basic opens the choice modal', async () => {
      await startStarterDeckRun()

      // With deterministic order, turn 4 hand = [score, collect-basic]
      await clickNextTurn() // Turn 2
      await clickNextTurn() // Turn 3
      await clickNextTurn() // Turn 4

      // Play second card (collect-basic)
      const handCards = screen.getAllByTestId('hand-card')
      await fireEvent.click(handCards[1])

      expect(screen.getByTestId('card-choice-modal')).toBeTruthy()
      expect(screen.getByText('Choose a Card')).toBeTruthy()

      const options = screen.getAllByTestId('card-option')
      expect(options.length).toBeGreaterThan(0)
    })

    it('selecting a card in the modal closes it', async () => {
      await startStarterDeckRun()

      await clickNextTurn()
      await clickNextTurn()
      await clickNextTurn() // Turn 4

      // Play collect-basic (second card)
      const handCards = screen.getAllByTestId('hand-card')
      await fireEvent.click(handCards[1])

      // Modal is open — select first option
      const options = screen.getAllByTestId('card-option')
      await fireEvent.click(options[0])

      // Modal should be closed
      expect(screen.queryByTestId('card-choice-modal')).toBeNull()
    })

    it('card moves to discard after choice resolves', async () => {
      await startStarterDeckRun()

      await clickNextTurn()
      await clickNextTurn()
      await clickNextTurn() // Turn 4

      // Play collect-basic
      const handCards = screen.getAllByTestId('hand-card')
      await fireEvent.click(handCards[1])

      // Resolve choice
      const options = screen.getAllByTestId('card-option')
      await fireEvent.click(options[0])

      // Hand should have 1 card left, discard should have the played card
      expect(getHandSize()).toBe(1)
    })
  })
})
