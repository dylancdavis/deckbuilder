import { describe, it, expect } from 'vitest'
import {
  matchesTrigger,
  findMatchingAbilities,
  canActivate,
  handleEvent,
  isAsset,
} from '../../utils/ability-processor'
import type { Ability, Trigger } from '../../utils/ability'
import type { CardInstance, PlayableCard } from '../../utils/cards'
import type {
  CardPlayEvent,
  CardDrawEvent,
  TurnStartEvent,
  CardActivateEvent,
} from '../../utils/event'
import { Resource } from '../../utils/resource'
import { createTestRun, createTestGameState } from './effects/shared'

const ADD_POINT_EFFECT = {
  type: 'update-resource' as const,
  params: { resource: Resource.POINTS, delta: 1 },
}

const EMPTY_PILES = { drawPile: [], hand: [], board: [], discardPile: [] }

const CARD: CardInstance = {
  type: 'playable',
  id: 'score',
  name: 'Test Card',
  description: 'A test card',
  cost: 0,
  abilities: [],
  art: { gradient: ['#000', '#fff'], image: 'scarab' },
  instanceId: 'card-1',
}

const PLAY_EVENT: CardPlayEvent = {
  type: 'card-play',
  cardId: 'score',
  instanceId: 'card-1',
  turn: 1,
  round: 1,
}

const TURN_START_EVENT: TurnStartEvent = {
  type: 'turn-start',
  turn: 1,
  round: 1,
}

const ACTIVATE_EVENT: CardActivateEvent = {
  type: 'card-activate',
  cardId: 'score',
  instanceId: 'card-1',
  abilityIndex: 0,
  turn: 1,
  round: 1,
}

function createCard(overrides: Partial<PlayableCard> & { instanceId: string }): CardInstance {
  return {
    type: 'playable',
    id: 'test-card',
    name: 'Test Card',
    description: 'A test card',
    cost: 0,
    abilities: [],
    art: { gradient: ['#000', '#fff'], image: 'scarab' },
    ...overrides,
  } as CardInstance
}

function createCardPlayEvent(
  instanceId: string,
  cardId: string = 'test-card',
  turn: number = 1,
  round: number = 1,
): CardPlayEvent {
  return {
    type: 'card-play',
    cardId: cardId as CardPlayEvent['cardId'],
    instanceId,
    turn,
    round,
  }
}

function createCardDrawEvent(
  instanceId: string,
  cardId: string = 'test-card',
  turn: number = 1,
  round: number = 1,
): CardDrawEvent {
  return {
    type: 'card-draw',
    cardId: cardId as CardDrawEvent['cardId'],
    instanceId,
    turn,
    round,
  }
}

function createCardActivateEvent(
  instanceId: string,
  abilityIndex: number = 0,
  cardId: string = 'test-card',
  turn: number = 1,
  round: number = 1,
): CardActivateEvent {
  return {
    type: 'card-activate',
    cardId: cardId as CardActivateEvent['cardId'],
    instanceId,
    abilityIndex,
    turn,
    round,
  }
}

describe('matchesTrigger', () => {
  describe('event type matching', () => {
    it('matches when event type equals trigger.on', () => {
      const trigger: Trigger = { on: 'card-play', target: 'self' }
      const run = createTestRun({ cards: { ...EMPTY_PILES, hand: [CARD] } })

      expect(matchesTrigger(PLAY_EVENT, CARD, 'hand', trigger, run)).toBe(true)
    })

    it('does not match when event type differs from trigger.on', () => {
      const trigger: Trigger = { on: 'card-draw', target: 'self' }
      const run = createTestRun({ cards: { ...EMPTY_PILES, hand: [CARD] } })

      expect(matchesTrigger(PLAY_EVENT, CARD, 'hand', trigger, run)).toBe(false)
    })
  })

  describe('target matching - self', () => {
    it('matches when target is self and event instanceId matches source card', () => {
      const trigger: Trigger = { on: 'card-play', target: 'self' }
      const run = createTestRun({ cards: { ...EMPTY_PILES, hand: [CARD] } })

      expect(matchesTrigger(PLAY_EVENT, CARD, 'hand', trigger, run)).toBe(true)
    })

    it('does not match when target is self but event instanceId differs', () => {
      const trigger: Trigger = { on: 'card-play', target: 'self' }
      const event = createCardPlayEvent('card-2')
      const run = createTestRun({ cards: { ...EMPTY_PILES, hand: [CARD] } })

      expect(matchesTrigger(event, CARD, 'hand', trigger, run)).toBe(false)
    })
  })

  describe('target matching - other', () => {
    it('matches when target is other and event instanceId differs from source card', () => {
      const trigger: Trigger = { on: 'card-play', target: 'other' }
      const event = createCardPlayEvent('card-2')
      const run = createTestRun({ cards: { ...EMPTY_PILES, hand: [CARD] } })

      expect(matchesTrigger(event, CARD, 'hand', trigger, run)).toBe(true)
    })

    it('does not match when target is other but event instanceId matches source card', () => {
      const trigger: Trigger = { on: 'card-play', target: 'other' }
      const run = createTestRun({ cards: { ...EMPTY_PILES, hand: [CARD] } })

      expect(matchesTrigger(PLAY_EVENT, CARD, 'hand', trigger, run)).toBe(false)
    })
  })

  describe('target matching - any', () => {
    it('matches when target is any regardless of instanceId', () => {
      const trigger: Trigger = { on: 'card-play', target: 'any' }
      const event = createCardPlayEvent('card-2')
      const run = createTestRun({ cards: { ...EMPTY_PILES, hand: [CARD] } })

      expect(matchesTrigger(event, CARD, 'hand', trigger, run)).toBe(true)
    })

    it('matches when target is any even for same card', () => {
      const trigger: Trigger = { on: 'card-play', target: 'any' }
      const run = createTestRun({ cards: { ...EMPTY_PILES, hand: [CARD] } })

      expect(matchesTrigger(PLAY_EVENT, CARD, 'hand', trigger, run)).toBe(true)
    })
  })

  describe('target matching - CardMatcher', () => {
    it('matches when CardMatcher criteria are satisfied', () => {
      const sourceCard = createCard({ instanceId: 'source-card' })
      const targetCard = createCard({ instanceId: 'target-card', id: 'score', cost: 0 })
      const trigger: Trigger = { on: 'card-play', target: { cardId: 'score' } }
      const event = createCardPlayEvent('target-card', 'score')
      const run = createTestRun({
        cards: { ...EMPTY_PILES, hand: [sourceCard, targetCard] },
      })

      expect(matchesTrigger(event, sourceCard, 'hand', trigger, run)).toBe(true)
    })

    it('does not match when CardMatcher criteria are not satisfied', () => {
      const sourceCard = createCard({ instanceId: 'source-card' })
      const targetCard = createCard({ instanceId: 'target-card', id: 'debt' })
      const trigger: Trigger = { on: 'card-play', target: { cardId: 'score' } }
      const event = createCardPlayEvent('target-card', 'debt')
      const run = createTestRun({
        cards: { ...EMPTY_PILES, hand: [sourceCard, targetCard] },
      })

      expect(matchesTrigger(event, sourceCard, 'hand', trigger, run)).toBe(false)
    })

    it('does not match when target card cannot be found', () => {
      const sourceCard = createCard({ instanceId: 'source-card' })
      const trigger: Trigger = { on: 'card-play', target: { cardId: 'score' } }
      const event = createCardPlayEvent('nonexistent-card', 'score')
      const run = createTestRun({ cards: { ...EMPTY_PILES, hand: [sourceCard] } })

      expect(matchesTrigger(event, sourceCard, 'hand', trigger, run)).toBe(false)
    })
  })

  describe('location requirements', () => {
    it('matches when card is in required location', () => {
      const trigger: Trigger = { on: 'turn-start', locations: ['board'] }
      const run = createTestRun({ cards: { ...EMPTY_PILES, board: [CARD] } })

      expect(matchesTrigger(TURN_START_EVENT, CARD, 'board', trigger, run)).toBe(true)
    })

    it('does not match when card is not in required location', () => {
      const trigger: Trigger = { on: 'turn-start', locations: ['board'] }
      const run = createTestRun({ cards: { ...EMPTY_PILES, hand: [CARD] } })

      expect(matchesTrigger(TURN_START_EVENT, CARD, 'hand', trigger, run)).toBe(false)
    })

    it('matches when card is in one of multiple required locations', () => {
      const trigger: Trigger = { on: 'card-play', target: 'self', locations: ['hand', 'board'] }
      const run = createTestRun({ cards: { ...EMPTY_PILES, hand: [CARD] } })

      expect(matchesTrigger(PLAY_EVENT, CARD, 'hand', trigger, run)).toBe(true)
    })

    it('does not match when card location cannot be found', () => {
      const trigger: Trigger = { on: 'turn-start', locations: ['board'] }
      const run = createTestRun({ cards: EMPTY_PILES })

      expect(matchesTrigger(TURN_START_EVENT, CARD, 'hand', trigger, run)).toBe(false)
    })
  })

  describe('custom when conditions', () => {
    it('matches when when() returns true', () => {
      const trigger: Trigger = {
        on: 'card-play',
        target: 'self',
        when: (ctx) => ctx.run.resources.points === 0,
      }
      const run = createTestRun({
        cards: { ...EMPTY_PILES, hand: [CARD] },
        resources: { points: 0 },
      })

      expect(matchesTrigger(PLAY_EVENT, CARD, 'hand', trigger, run)).toBe(true)
    })

    it('does not match when when() returns false', () => {
      const trigger: Trigger = {
        on: 'card-play',
        target: 'self',
        when: (ctx) => ctx.run.resources.points === 0,
      }
      const run = createTestRun({
        cards: { ...EMPTY_PILES, hand: [CARD] },
        resources: { points: 5 },
      })

      expect(matchesTrigger(PLAY_EVENT, CARD, 'hand', trigger, run)).toBe(false)
    })

    it('passes correct context to when()', () => {
      let capturedContext: unknown = null
      const trigger: Trigger = {
        on: 'card-play',
        target: 'self',
        when: (ctx) => {
          capturedContext = ctx
          return true
        },
      }
      const run = createTestRun({ cards: { ...EMPTY_PILES, hand: [CARD] } })

      matchesTrigger(PLAY_EVENT, CARD, 'hand', trigger, run)

      expect(capturedContext).toMatchObject({
        event: PLAY_EVENT,
        sourceCard: CARD,
        run,
      })
    })
  })

  describe('no target specified', () => {
    it('matches lifecycle events without target', () => {
      const trigger: Trigger = { on: 'turn-start' }
      const run = createTestRun({ cards: { ...EMPTY_PILES, board: [CARD] } })

      expect(matchesTrigger(TURN_START_EVENT, CARD, 'board', trigger, run)).toBe(true)
    })
  })

  describe('card-draw events', () => {
    it('matches card-draw event with self target', () => {
      const trigger: Trigger = { on: 'card-draw', target: 'self' }
      const event = createCardDrawEvent('card-1')
      const run = createTestRun({ cards: { ...EMPTY_PILES, hand: [CARD] } })

      expect(matchesTrigger(event, CARD, 'hand', trigger, run)).toBe(true)
    })

    it('matches card-draw event watching other cards', () => {
      const watcherCard = createCard({ instanceId: 'watcher' })
      const drawnCard = createCard({ instanceId: 'drawn-card' })
      const trigger: Trigger = { on: 'card-draw', target: 'other' }
      const event = createCardDrawEvent('drawn-card')
      const run = createTestRun({
        cards: { ...EMPTY_PILES, hand: [watcherCard, drawnCard] },
      })

      expect(matchesTrigger(event, watcherCard, 'hand', trigger, run)).toBe(true)
    })
  })
})

describe('canActivate', () => {
  describe('resource costs', () => {
    it('returns true when player has enough resources', () => {
      const trigger: Trigger = {
        on: 'card-activate',
        target: 'self',
        costs: { [Resource.POINTS]: 5 },
      }
      const run = createTestRun({
        cards: { ...EMPTY_PILES, board: [CARD] },
        resources: { points: 10 },
      })

      expect(canActivate(trigger, CARD, run)).toBe(true)
    })

    it('returns true when player has exact resources', () => {
      const trigger: Trigger = {
        on: 'card-activate',
        target: 'self',
        costs: { [Resource.POINTS]: 5 },
      }
      const run = createTestRun({
        cards: { ...EMPTY_PILES, board: [CARD] },
        resources: { points: 5 },
      })

      expect(canActivate(trigger, CARD, run)).toBe(true)
    })

    it('returns false when player lacks resources', () => {
      const trigger: Trigger = {
        on: 'card-activate',
        target: 'self',
        costs: { [Resource.POINTS]: 5 },
      }
      const run = createTestRun({
        cards: { ...EMPTY_PILES, board: [CARD] },
        resources: { points: 3 },
      })

      expect(canActivate(trigger, CARD, run)).toBe(false)
    })

    it('returns true when no costs specified', () => {
      const trigger: Trigger = { on: 'card-activate', target: 'self' }
      const run = createTestRun({
        cards: { ...EMPTY_PILES, board: [CARD] },
        resources: { points: 0 },
      })

      expect(canActivate(trigger, CARD, run)).toBe(true)
    })
  })

  describe('usage limits - perTurn', () => {
    it('returns true when under perTurn limit', () => {
      const trigger: Trigger = { on: 'card-activate', target: 'self', limit: { perTurn: 2 } }
      const run = createTestRun({
        cards: { ...EMPTY_PILES, board: [CARD] },
        stats: { turns: 1, rounds: 1 },
        events: [ACTIVATE_EVENT],
      })

      expect(canActivate(trigger, CARD, run)).toBe(true)
    })

    it('returns false when at perTurn limit', () => {
      const trigger: Trigger = { on: 'card-activate', target: 'self', limit: { perTurn: 1 } }
      const run = createTestRun({
        cards: { ...EMPTY_PILES, board: [CARD] },
        stats: { turns: 1, rounds: 1 },
        events: [ACTIVATE_EVENT],
      })

      expect(canActivate(trigger, CARD, run)).toBe(false)
    })

    it('resets count on new turn', () => {
      const trigger: Trigger = { on: 'card-activate', target: 'self', limit: { perTurn: 1 } }
      const run = createTestRun({
        cards: { ...EMPTY_PILES, board: [CARD] },
        stats: { turns: 2, rounds: 1 },
        events: [ACTIVATE_EVENT], // Previous turn
      })

      expect(canActivate(trigger, CARD, run)).toBe(true)
    })
  })

  describe('usage limits - perRound', () => {
    it('returns false when at perRound limit', () => {
      const trigger: Trigger = { on: 'card-activate', target: 'self', limit: { perRound: 1 } }
      const run = createTestRun({
        cards: { ...EMPTY_PILES, board: [CARD] },
        stats: { turns: 2, rounds: 1 },
        events: [ACTIVATE_EVENT],
      })

      expect(canActivate(trigger, CARD, run)).toBe(false)
    })

    it('resets count on new round', () => {
      const trigger: Trigger = { on: 'card-activate', target: 'self', limit: { perRound: 1 } }
      const run = createTestRun({
        cards: { ...EMPTY_PILES, board: [CARD] },
        stats: { turns: 1, rounds: 2 },
        events: [ACTIVATE_EVENT], // Previous round
      })

      expect(canActivate(trigger, CARD, run)).toBe(true)
    })
  })

  describe('usage limits - perRun', () => {
    it('returns false when at perRun limit', () => {
      const trigger: Trigger = { on: 'card-activate', target: 'self', limit: { perRun: 2 } }
      const run = createTestRun({
        cards: { ...EMPTY_PILES, board: [CARD] },
        stats: { turns: 5, rounds: 3 },
        events: [ACTIVATE_EVENT, createCardActivateEvent('card-1', 0, 'test-card', 3, 2)],
      })

      expect(canActivate(trigger, CARD, run)).toBe(false)
    })
  })

  describe('combined costs and limits', () => {
    it('returns false when resources ok but limit reached', () => {
      const trigger: Trigger = {
        on: 'card-activate',
        target: 'self',
        costs: { [Resource.POINTS]: 5 },
        limit: { perTurn: 1 },
      }
      const run = createTestRun({
        cards: { ...EMPTY_PILES, board: [CARD] },
        resources: { points: 100 },
        stats: { turns: 1, rounds: 1 },
        events: [ACTIVATE_EVENT],
      })

      expect(canActivate(trigger, CARD, run)).toBe(false)
    })

    it('returns false when limit ok but resources insufficient', () => {
      const trigger: Trigger = {
        on: 'card-activate',
        target: 'self',
        costs: { [Resource.POINTS]: 5 },
        limit: { perTurn: 3 },
      }
      const run = createTestRun({
        cards: { ...EMPTY_PILES, board: [CARD] },
        resources: { points: 2 },
        stats: { turns: 1, rounds: 1 },
        events: [],
      })

      expect(canActivate(trigger, CARD, run)).toBe(false)
    })
  })
})

describe('findMatchingAbilities', () => {
  it('finds abilities matching a card-play event', () => {
    const ability: Ability = {
      trigger: { on: 'card-play', target: 'self' },
      effects: [ADD_POINT_EFFECT],
    }
    const card = createCard({ instanceId: 'card-1', abilities: [ability] })
    const event = createCardPlayEvent('card-1')
    const run = createTestRun({
      cards: { ...EMPTY_PILES, hand: [card] },
    })

    const matches = findMatchingAbilities(run, event)

    expect(matches).toHaveLength(1)
    expect(matches[0].card).toBe(card)
    expect(matches[0].ability).toBe(ability)
  })

  it('finds multiple abilities on the same card', () => {
    const ability1: Ability = {
      trigger: { on: 'card-play', target: 'self' },
      effects: [ADD_POINT_EFFECT],
    }
    const ability2: Ability = {
      trigger: { on: 'card-play', target: 'self' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 2 } }],
    }
    const card = createCard({ instanceId: 'card-1', abilities: [ability1, ability2] })
    const event = createCardPlayEvent('card-1')
    const run = createTestRun({
      cards: { ...EMPTY_PILES, hand: [card] },
    })

    const matches = findMatchingAbilities(run, event)

    expect(matches).toHaveLength(2)
  })

  it('finds abilities from multiple cards', () => {
    const ability1: Ability = {
      trigger: { on: 'card-play', target: 'any' },
      effects: [ADD_POINT_EFFECT],
    }
    const ability2: Ability = {
      trigger: { on: 'card-play', target: 'any' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 2 } }],
    }
    const card1 = createCard({ instanceId: 'card-1', abilities: [ability1] })
    const card2 = createCard({ instanceId: 'card-2', abilities: [ability2] })
    const event = createCardPlayEvent('card-3')
    const run = createTestRun({
      cards: { ...EMPTY_PILES, hand: [card1, card2] },
    })

    const matches = findMatchingAbilities(run, event)

    expect(matches).toHaveLength(2)
  })

  it('checks all locations for lifecycle events', () => {
    const ability: Ability = {
      trigger: { on: 'turn-start' },
      effects: [ADD_POINT_EFFECT],
    }
    const handCard = createCard({ instanceId: 'hand-card', abilities: [ability] })
    const boardCard = createCard({ instanceId: 'board-card', abilities: [ability] })
    const run = createTestRun({
      cards: { ...EMPTY_PILES, hand: [handCard], board: [boardCard] },
    })

    const matches = findMatchingAbilities(run, TURN_START_EVENT)

    // Board card, hand card, rules card
    expect(matches).toHaveLength(3)
  })

  it('respects trigger.locations for lifecycle events', () => {
    const ability: Ability = {
      trigger: { on: 'turn-start', locations: ['board'] }, // Only triggers when on board
      effects: [ADD_POINT_EFFECT],
    }
    const handCard = createCard({ instanceId: 'hand-card', abilities: [ability] })
    const run = createTestRun({
      cards: { ...EMPTY_PILES, hand: [handCard] },
    })

    const matches = findMatchingAbilities(run, TURN_START_EVENT)

    // Only match rules card. Card in hand only has a board-specific trigger
    expect(matches).toHaveLength(1)
  })

  it('checks hand and board cards for card events', () => {
    const ability: Ability = {
      trigger: { on: 'card-play', target: 'any' },
      effects: [ADD_POINT_EFFECT],
    }
    const handCard = createCard({ instanceId: 'hand-card', abilities: [ability] })
    const boardCard = createCard({ instanceId: 'board-card', abilities: [ability] })
    const event = createCardPlayEvent('some-other-card')
    const run = createTestRun({
      cards: { ...EMPTY_PILES, hand: [handCard], board: [boardCard] },
    })

    const matches = findMatchingAbilities(run, event)

    expect(matches).toHaveLength(2)
  })

  it('returns empty array when no abilities match', () => {
    const ability: Ability = {
      trigger: { on: 'card-draw', target: 'self' },
      effects: [ADD_POINT_EFFECT],
    }
    const card = createCard({ instanceId: 'card-1', abilities: [ability] })
    const event = createCardPlayEvent('card-1')
    const run = createTestRun({
      cards: { ...EMPTY_PILES, hand: [card] },
    })

    const matches = findMatchingAbilities(run, event)

    expect(matches).toHaveLength(0)
  })
})

describe('handleEvent', () => {
  it('throws when no run exists', () => {
    const gameState = createTestGameState()
    gameState.game.run = null

    expect(() => handleEvent(gameState, PLAY_EVENT)).toThrow('Cannot handle event with no run')
  })

  it('applies update-resource effects', () => {
    const ability: Ability = {
      trigger: { on: 'card-play', target: 'self' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 5 } }],
    }
    const card = createCard({ instanceId: 'card-1', abilities: [ability] })
    const gameState = createTestGameState({
      cards: { ...EMPTY_PILES, hand: [card] },
      resources: { points: 10 },
    })

    const result = handleEvent(gameState, PLAY_EVENT)

    expect(result.game.run!.resources.points).toBe(15)
  })

  it('applies multiple effects in order', () => {
    const ability: Ability = {
      trigger: { on: 'card-play', target: 'self' },
      effects: [
        { type: 'update-resource', params: { resource: Resource.POINTS, delta: 5 } },
        { type: 'update-resource', params: { resource: Resource.POINTS, delta: 3 } },
      ],
    }
    const card = createCard({ instanceId: 'card-1', abilities: [ability] })
    const gameState = createTestGameState({
      cards: { ...EMPTY_PILES, hand: [card] },
      resources: { points: 0 },
    })

    const result = handleEvent(gameState, PLAY_EVENT)

    expect(result.game.run!.resources.points).toBe(8)
  })

  it('processes abilities from multiple cards', () => {
    const ability1: Ability = {
      trigger: { on: 'card-play', target: 'any' },
      effects: [ADD_POINT_EFFECT],
    }
    const ability2: Ability = {
      trigger: { on: 'card-play', target: 'any' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 2 } }],
    }
    const card1 = createCard({ instanceId: 'card-1', abilities: [ability1] })
    const card2 = createCard({ instanceId: 'card-2', abilities: [ability2] })
    const gameState = createTestGameState({
      cards: { ...EMPTY_PILES, hand: [card1, card2] },
      resources: { points: 0 },
    })
    const event = createCardPlayEvent('card-3')

    const result = handleEvent(gameState, event)

    expect(result.game.run!.resources.points).toBe(3)
  })

  it('opens card choice modal and stores resolver', () => {
    const ability: Ability = {
      trigger: { on: 'card-play', target: 'self' },
      effects: [
        {
          type: 'card-choice',
          params: {
            options: 3,
            tags: ['basic'],
            choiceHandler: (cardId) => [
              { type: 'collect-card', params: { cards: { [cardId]: 1 } } },
            ],
          },
        },
      ],
    }
    const card = createCard({ instanceId: 'card-1', abilities: [ability] })
    const gameState = createTestGameState({
      cards: { ...EMPTY_PILES, hand: [card] },
    })

    const result = handleEvent(gameState, PLAY_EVENT)

    expect(result.viewData.modalView).toBe('card-choice')
    expect(result.viewData.resolver).not.toBeNull()
  })

  it('resolves self references in remove-card effects', () => {
    const ability: Ability = {
      trigger: { on: 'card-play', target: 'self' },
      effects: [{ type: 'remove-card', params: { instanceId: 'self' } }],
    }
    const card = createCard({ instanceId: 'card-1', abilities: [ability] })
    const gameState = createTestGameState({
      cards: { ...EMPTY_PILES, hand: [card] },
    })

    const result = handleEvent(gameState, PLAY_EVENT)

    // Card should be removed
    expect(result.game.run!.cards.hand).toHaveLength(0)
  })
})

describe('isAsset', () => {
  it('returns true when card has ability with board location', () => {
    const ability: Ability = {
      trigger: { on: 'turn-start', locations: ['board'] },
      effects: [ADD_POINT_EFFECT],
    }
    const card = createCard({ instanceId: 'card-1', abilities: [ability] })

    expect(isAsset(card)).toBe(true)
  })

  it('returns true when any ability has board location', () => {
    const ability1: Ability = {
      trigger: { on: 'card-play', target: 'self' },
      effects: [ADD_POINT_EFFECT],
    }
    const ability2: Ability = {
      trigger: { on: 'turn-start', locations: ['board'] },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 2 } }],
    }
    const card = createCard({ instanceId: 'card-1', abilities: [ability1, ability2] })

    expect(isAsset(card)).toBe(true)
  })

  it('returns false when no ability has board location', () => {
    const ability: Ability = {
      trigger: { on: 'card-play', target: 'self' },
      effects: [ADD_POINT_EFFECT],
    }
    const card = createCard({ instanceId: 'card-1', abilities: [ability] })

    expect(isAsset(card)).toBe(false)
  })

  it('returns false when card has no abilities', () => {
    const card = createCard({ instanceId: 'card-1', abilities: [] })

    expect(isAsset(card)).toBe(false)
  })

  it('returns true when location includes board among others', () => {
    const ability: Ability = {
      trigger: { on: 'card-play', target: 'any', locations: ['hand', 'board'] },
      effects: [ADD_POINT_EFFECT],
    }
    const card = createCard({ instanceId: 'card-1', abilities: [ability] })

    expect(isAsset(card)).toBe(true)
  })
})
