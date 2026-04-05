import { describe, it, expect } from 'vitest'
import { moveCardByIndex, moveCards, populateDrawPile, type Run } from '../../utils/run.js'
import { pileToIdCounter } from '../../utils/deck.ts'
import {
  playableCards,
  coreGameFlowAbilities,
  type CardInstance,
  type RulesCard,
  type PlayableCardID,
} from '../../utils/cards.ts'
import type { GameState } from '../../utils/game.ts'
import { handleEvent } from '../../utils/ability-processor.ts'
import type { RunStartEvent } from '../../utils/event.ts'

// Helper to wrap a Run in a minimal GameState for testing
const wrapInGameState = (run: Run): GameState => ({
  game: {
    collection: { cards: {}, decks: {} },
    run,
  },
  ui: { currentView: ['run'], collection: { selectedDeck: null } },
  viewData: { modalView: null, cardOptions: [], resolver: null },
})

const baseRules: RulesCard = {
  id: 'starter-rules',
  name: 'Example Rules',
  type: 'rules',
  art: {
    gradient: ['#4b4b4b', '#9e9e9e'],
    image: 'scarab',
  },
  deckLimits: { size: [0, 0] },
  turnStructure: { playAmount: 1 },
  abilities: [
    {
      trigger: { on: 'turn-end' },
      effects: [{ type: 'discard-cards', params: { from: 'hand', amount: 'all' } }],
    },
    { trigger: { on: 'round-end' }, effects: [{ type: 'run-end', params: {} }] },
    ...coreGameFlowAbilities,
    { trigger: { on: 'turn-start' }, effects: [{ type: 'draw-cards', params: { amount: 1 } }] },
  ],
}

const rulesWithAddedCards: RulesCard = {
  id: 'starter-rules',
  name: 'Example Rules',
  type: 'rules',
  art: {
    gradient: ['#4b4b4b', '#9e9e9e'],
    image: 'scarab',
  },
  deckLimits: { size: [0, 0] },
  turnStructure: { playAmount: 1 },
  abilities: [
    {
      trigger: { on: 'run-start' },
      effects: [
        {
          type: 'add-cards',
          params: { location: 'drawPile', cards: { score: 3 }, mode: 'shuffle' },
        },
      ],
    },
    {
      trigger: { on: 'turn-end' },
      effects: [{ type: 'discard-cards', params: { from: 'hand', amount: 'all' } }],
    },
    { trigger: { on: 'round-end' }, effects: [{ type: 'run-end', params: {} }] },
    ...coreGameFlowAbilities,
    { trigger: { on: 'turn-start' }, effects: [{ type: 'draw-cards', params: { amount: 1 } }] },
  ],
}

const card = (id: PlayableCardID, instanceId: string): CardInstance => ({
  ...playableCards[id],
  instanceId,
})

const cA = card('score', 'a')
const cB = card('score', 'b')
const cC = card('score', 'c')
const cD = card('score', 'd')
const cE = card('score', 'e')
const cF = card('score', 'f')
const cG = card('score', 'g')
const cH = card('score', 'h')
const cI = card('score', 'i')

const preMoveRun: Run = {
  cards: {
    drawPile: [cA, cB, cC, cD, cE],
    hand: [cF, cG, cH, cI],
    discardPile: [],
    board: [],
  },
  deck: { name: '', cards: {}, rulesCard: baseRules },
  resources: { points: 0 },
  stats: { turns: 1, rounds: 1 },
  events: [],
}

describe('moveCardByIndex', () => {
  it('moves card from hand to discard when toIndex is not specified', () => {
    const result = moveCardByIndex(preMoveRun, 'hand', 'discardPile', 1)
    expect(result).toMatchObject({
      cards: {
        drawPile: [cA, cB, cC, cD, cE],
        hand: [cF, cH, cI],
        discardPile: [cG],
        board: [],
      },
    })
  })

  it('moves card from hand to specific index in board when toIndex is specified', () => {
    const result = moveCardByIndex(preMoveRun, 'hand', 'board', 2, 0)
    expect(result).toMatchObject({
      cards: {
        drawPile: [cA, cB, cC, cD, cE],
        hand: [cF, cG, cI],
        discardPile: [],
        board: [cH],
      },
    })
  })
})

describe('moveCards', () => {
  it('moves top 3 cards from draw-pile to hand', () => {
    const result = moveCards(preMoveRun, 'drawPile', 'hand', 3)
    expect(result).toMatchObject({
      cards: {
        drawPile: [cD, cE],
        hand: [cF, cG, cH, cI, cA, cB, cC],
        discardPile: [],
        board: [],
      },
    })
  })

  it('moves top 3 cards from draw-pile to discard', () => {
    const result = moveCards(preMoveRun, 'drawPile', 'discardPile', 3)
    expect(result).toMatchObject({
      cards: {
        drawPile: [cD, cE],
        hand: [cF, cG, cH, cI],
        discardPile: [cA, cB, cC],
        board: [],
      },
    })
  })
})

const exampleCounter = { score: 4 }

const emptyHandRun: Run = {
  resources: { points: 0 },
  cards: { drawPile: [], hand: [], discardPile: [], board: [] },
  deck: { name: '', cards: exampleCounter, rulesCard: rulesWithAddedCards },
  stats: { turns: 1, rounds: 1 },
  events: [],
}

describe('populateDrawPile', () => {
  it('adds cards to draw-pile from deck', () => {
    const result = populateDrawPile(emptyHandRun)
    const idCounter = pileToIdCounter(result.cards.drawPile)
    expect(idCounter).toEqual(exampleCounter)
  })
})

const pileA = card('score', 'p1')
const pileB = card('collect-basic', 'p2')
const pileC = card('dual-score', 'p3')
const examplePile = [pileA, pileA, pileA, pileB, pileB, pileC]

const populatedHandRun: Run = {
  resources: { points: 0 },
  cards: { drawPile: examplePile, hand: [], discardPile: [], board: [] },
  deck: { name: '', cards: exampleCounter, rulesCard: rulesWithAddedCards },
  stats: { turns: 1, rounds: 1 },
  events: [],
}

const populatedHandRunNoAdded: Run = {
  resources: { points: 0 },
  cards: { drawPile: examplePile, hand: [], discardPile: [], board: [] },
  deck: { name: '', cards: exampleCounter, rulesCard: baseRules },
  stats: { turns: 1, rounds: 1 },
  events: [],
}

describe('run-start event', () => {
  it("doesn't modify cards in draw-pile when no run-start add-cards ability", () => {
    const gameState = wrapInGameState(populatedHandRunNoAdded)
    const event: RunStartEvent = { type: 'run-start', round: 0, turn: 0 }
    const result = handleEvent(gameState, event)
    // Draw pile should contain original cards plus any drawn to hand via the ability chain
    const allCards = [
      ...result.game.run!.cards.drawPile,
      ...result.game.run!.cards.hand,
      ...result.game.run!.cards.discardPile,
    ]
    const idCounter = pileToIdCounter(allCards)
    expect(idCounter).toEqual(pileToIdCounter(populatedHandRunNoAdded.cards.drawPile))
  })

  it('adds cards to draw-pile from rules card run-start ability', () => {
    const gameState = wrapInGameState(populatedHandRun)
    const event: RunStartEvent = { type: 'run-start', round: 0, turn: 0 }
    const result = handleEvent(gameState, event)
    // All cards should be accounted for across locations
    const allCards = [
      ...result.game.run!.cards.drawPile,
      ...result.game.run!.cards.hand,
      ...result.game.run!.cards.discardPile,
    ]
    const idCounter = pileToIdCounter(allCards)
    expect(idCounter).toEqual({ score: 6, 'collect-basic': 2, 'dual-score': 1 })
  })
})
