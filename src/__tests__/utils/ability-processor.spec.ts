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

/**
 * Helper to create a test card with the new ability format
 */
function createTestCard(overrides: Partial<PlayableCard> & { instanceId: string }): CardInstance {
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

/**
 * Helper to create a card-play event
 */
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

/**
 * Helper to create a card-draw event
 */
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

/**
 * Helper to create a turn-start event
 */
function createTurnStartEvent(turn: number = 1, round: number = 1): TurnStartEvent {
  return {
    type: 'turn-start',
    turn,
    round,
  }
}

/**
 * Helper to create a card-activate event
 */
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
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = { on: 'card-play', target: 'self' }
      const event = createCardPlayEvent('card-1')
      const run = createTestRun({
        cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
      })

      expect(matchesTrigger(event, card, 'hand', trigger, run)).toBe(true)
    })

    it('does not match when event type differs from trigger.on', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = { on: 'card-draw', target: 'self' }
      const event = createCardPlayEvent('card-1')
      const run = createTestRun({
        cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
      })

      expect(matchesTrigger(event, card, 'hand', trigger, run)).toBe(false)
    })
  })

  describe('target matching - self', () => {
    it('matches when target is self and event instanceId matches source card', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = { on: 'card-play', target: 'self' }
      const event = createCardPlayEvent('card-1')
      const run = createTestRun({
        cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
      })

      expect(matchesTrigger(event, card, 'hand', trigger, run)).toBe(true)
    })

    it('does not match when target is self but event instanceId differs', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = { on: 'card-play', target: 'self' }
      const event = createCardPlayEvent('card-2')
      const run = createTestRun({
        cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
      })

      expect(matchesTrigger(event, card, 'hand', trigger, run)).toBe(false)
    })
  })

  describe('target matching - other', () => {
    it('matches when target is other and event instanceId differs from source card', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = { on: 'card-play', target: 'other' }
      const event = createCardPlayEvent('card-2')
      const run = createTestRun({
        cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
      })

      expect(matchesTrigger(event, card, 'hand', trigger, run)).toBe(true)
    })

    it('does not match when target is other but event instanceId matches source card', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = { on: 'card-play', target: 'other' }
      const event = createCardPlayEvent('card-1')
      const run = createTestRun({
        cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
      })

      expect(matchesTrigger(event, card, 'hand', trigger, run)).toBe(false)
    })
  })

  describe('target matching - any', () => {
    it('matches when target is any regardless of instanceId', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = { on: 'card-play', target: 'any' }
      const event = createCardPlayEvent('card-2')
      const run = createTestRun({
        cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
      })

      expect(matchesTrigger(event, card, 'hand', trigger, run)).toBe(true)
    })

    it('matches when target is any even for same card', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = { on: 'card-play', target: 'any' }
      const event = createCardPlayEvent('card-1')
      const run = createTestRun({
        cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
      })

      expect(matchesTrigger(event, card, 'hand', trigger, run)).toBe(true)
    })
  })

  describe('target matching - CardMatcher', () => {
    it('matches when CardMatcher criteria are satisfied', () => {
      const sourceCard = createTestCard({ instanceId: 'source-card' })
      const targetCard = createTestCard({ instanceId: 'target-card', id: 'score', cost: 0 })
      const trigger: Trigger = { on: 'card-play', target: { cardId: 'score' } }
      const event = createCardPlayEvent('target-card', 'score')
      const run = createTestRun({
        cards: {
          drawPile: [],
          hand: [sourceCard, targetCard],
          board: [],
          stack: [],
          discardPile: [],
        },
      })

      expect(matchesTrigger(event, sourceCard, 'hand', trigger, run)).toBe(true)
    })

    it('does not match when CardMatcher criteria are not satisfied', () => {
      const sourceCard = createTestCard({ instanceId: 'source-card' })
      const targetCard = createTestCard({ instanceId: 'target-card', id: 'debt' })
      const trigger: Trigger = { on: 'card-play', target: { cardId: 'score' } }
      const event = createCardPlayEvent('target-card', 'debt')
      const run = createTestRun({
        cards: {
          drawPile: [],
          hand: [sourceCard, targetCard],
          board: [],
          stack: [],
          discardPile: [],
        },
      })

      expect(matchesTrigger(event, sourceCard, 'hand', trigger, run)).toBe(false)
    })

    it('does not match when target card cannot be found', () => {
      const sourceCard = createTestCard({ instanceId: 'source-card' })
      const trigger: Trigger = { on: 'card-play', target: { cardId: 'score' } }
      const event = createCardPlayEvent('nonexistent-card', 'score')
      const run = createTestRun({
        cards: { drawPile: [], hand: [sourceCard], board: [], stack: [], discardPile: [] },
      })

      expect(matchesTrigger(event, sourceCard, 'hand', trigger, run)).toBe(false)
    })
  })

  describe('location requirements', () => {
    it('matches when card is in required location', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = { on: 'turn-start', locations: ['board'] }
      const event = createTurnStartEvent()
      const run = createTestRun({
        cards: { drawPile: [], hand: [], board: [card], stack: [], discardPile: [] },
      })

      expect(matchesTrigger(event, card, 'board', trigger, run)).toBe(true)
    })

    it('does not match when card is not in required location', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = { on: 'turn-start', locations: ['board'] }
      const event = createTurnStartEvent()
      const run = createTestRun({
        cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
      })

      expect(matchesTrigger(event, card, 'hand', trigger, run)).toBe(false)
    })

    it('matches when card is in one of multiple required locations', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = { on: 'card-play', target: 'self', locations: ['hand', 'board'] }
      const event = createCardPlayEvent('card-1')
      const run = createTestRun({
        cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
      })

      expect(matchesTrigger(event, card, 'hand', trigger, run)).toBe(true)
    })

    it('does not match when card location cannot be found', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = { on: 'turn-start', locations: ['board'] }
      const event = createTurnStartEvent()
      // Card not in any location
      const run = createTestRun({
        cards: { drawPile: [], hand: [], board: [], stack: [], discardPile: [] },
      })

      expect(matchesTrigger(event, card, 'hand', trigger, run)).toBe(false)
    })
  })

  describe('custom when conditions', () => {
    it('matches when when() returns true', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = {
        on: 'card-play',
        target: 'self',
        when: (ctx) => ctx.run.resources.points === 0,
      }
      const event = createCardPlayEvent('card-1')
      const run = createTestRun({
        cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
        resources: { points: 0 },
      })

      expect(matchesTrigger(event, card, 'hand', trigger, run)).toBe(true)
    })

    it('does not match when when() returns false', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = {
        on: 'card-play',
        target: 'self',
        when: (ctx) => ctx.run.resources.points === 0,
      }
      const event = createCardPlayEvent('card-1')
      const run = createTestRun({
        cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
        resources: { points: 5 },
      })

      expect(matchesTrigger(event, card, 'hand', trigger, run)).toBe(false)
    })

    it('passes correct context to when()', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      let capturedContext: unknown = null
      const trigger: Trigger = {
        on: 'card-play',
        target: 'self',
        when: (ctx) => {
          capturedContext = ctx
          return true
        },
      }
      const event = createCardPlayEvent('card-1')
      const run = createTestRun({
        cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
      })

      matchesTrigger(event, card, 'hand', trigger, run)

      expect(capturedContext).toMatchObject({
        event,
        sourceCard: card,
        run,
      })
    })
  })

  describe('no target specified', () => {
    it('matches lifecycle events without target', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = { on: 'turn-start' }
      const event = createTurnStartEvent()
      const run = createTestRun({
        cards: { drawPile: [], hand: [], board: [card], stack: [], discardPile: [] },
      })

      expect(matchesTrigger(event, card, 'board', trigger, run)).toBe(true)
    })
  })

  describe('card-draw events', () => {
    it('matches card-draw event with self target', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = { on: 'card-draw', target: 'self' }
      const event = createCardDrawEvent('card-1')
      const run = createTestRun({
        cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
      })

      expect(matchesTrigger(event, card, 'hand', trigger, run)).toBe(true)
    })

    it('matches card-draw event watching other cards', () => {
      const watcherCard = createTestCard({ instanceId: 'watcher' })
      const drawnCard = createTestCard({ instanceId: 'drawn-card' })
      const trigger: Trigger = { on: 'card-draw', target: 'other' }
      const event = createCardDrawEvent('drawn-card')
      const run = createTestRun({
        cards: {
          drawPile: [],
          hand: [watcherCard, drawnCard],
          board: [],
          stack: [],
          discardPile: [],
        },
      })

      expect(matchesTrigger(event, watcherCard, 'hand', trigger, run)).toBe(true)
    })
  })
})

describe('canActivate', () => {
  describe('resource costs', () => {
    it('returns true when player has enough resources', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = {
        on: 'card-activate',
        target: 'self',
        costs: { [Resource.POINTS]: 5 },
      }
      const run = createTestRun({
        cards: { drawPile: [], hand: [], board: [card], stack: [], discardPile: [] },
        resources: { points: 10 },
      })

      expect(canActivate(trigger, card, run)).toBe(true)
    })

    it('returns true when player has exact resources', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = {
        on: 'card-activate',
        target: 'self',
        costs: { [Resource.POINTS]: 5 },
      }
      const run = createTestRun({
        cards: { drawPile: [], hand: [], board: [card], stack: [], discardPile: [] },
        resources: { points: 5 },
      })

      expect(canActivate(trigger, card, run)).toBe(true)
    })

    it('returns false when player lacks resources', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = {
        on: 'card-activate',
        target: 'self',
        costs: { [Resource.POINTS]: 5 },
      }
      const run = createTestRun({
        cards: { drawPile: [], hand: [], board: [card], stack: [], discardPile: [] },
        resources: { points: 3 },
      })

      expect(canActivate(trigger, card, run)).toBe(false)
    })

    it('returns true when no costs specified', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = { on: 'card-activate', target: 'self' }
      const run = createTestRun({
        cards: { drawPile: [], hand: [], board: [card], stack: [], discardPile: [] },
        resources: { points: 0 },
      })

      expect(canActivate(trigger, card, run)).toBe(true)
    })
  })

  describe('usage limits - perTurn', () => {
    it('returns true when under perTurn limit', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = {
        on: 'card-activate',
        target: 'self',
        limit: { perTurn: 2 },
      }
      const run = createTestRun({
        cards: { drawPile: [], hand: [], board: [card], stack: [], discardPile: [] },
        stats: { turns: 1, rounds: 1 },
        events: [createCardActivateEvent('card-1', 0, 'test-card', 1, 1)],
      })

      expect(canActivate(trigger, card, run)).toBe(true)
    })

    it('returns false when at perTurn limit', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = {
        on: 'card-activate',
        target: 'self',
        limit: { perTurn: 1 },
      }
      const run = createTestRun({
        cards: { drawPile: [], hand: [], board: [card], stack: [], discardPile: [] },
        stats: { turns: 1, rounds: 1 },
        events: [createCardActivateEvent('card-1', 0, 'test-card', 1, 1)],
      })

      expect(canActivate(trigger, card, run)).toBe(false)
    })

    it('resets count on new turn', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = {
        on: 'card-activate',
        target: 'self',
        limit: { perTurn: 1 },
      }
      const run = createTestRun({
        cards: { drawPile: [], hand: [], board: [card], stack: [], discardPile: [] },
        stats: { turns: 2, rounds: 1 },
        events: [createCardActivateEvent('card-1', 0, 'test-card', 1, 1)], // Previous turn
      })

      expect(canActivate(trigger, card, run)).toBe(true)
    })
  })

  describe('usage limits - perRound', () => {
    it('returns false when at perRound limit', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = {
        on: 'card-activate',
        target: 'self',
        limit: { perRound: 1 },
      }
      const run = createTestRun({
        cards: { drawPile: [], hand: [], board: [card], stack: [], discardPile: [] },
        stats: { turns: 2, rounds: 1 },
        events: [createCardActivateEvent('card-1', 0, 'test-card', 1, 1)],
      })

      expect(canActivate(trigger, card, run)).toBe(false)
    })

    it('resets count on new round', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = {
        on: 'card-activate',
        target: 'self',
        limit: { perRound: 1 },
      }
      const run = createTestRun({
        cards: { drawPile: [], hand: [], board: [card], stack: [], discardPile: [] },
        stats: { turns: 1, rounds: 2 },
        events: [createCardActivateEvent('card-1', 0, 'test-card', 1, 1)], // Previous round
      })

      expect(canActivate(trigger, card, run)).toBe(true)
    })
  })

  describe('usage limits - perRun', () => {
    it('returns false when at perRun limit', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = {
        on: 'card-activate',
        target: 'self',
        limit: { perRun: 2 },
      }
      const run = createTestRun({
        cards: { drawPile: [], hand: [], board: [card], stack: [], discardPile: [] },
        stats: { turns: 5, rounds: 3 },
        events: [
          createCardActivateEvent('card-1', 0, 'test-card', 1, 1),
          createCardActivateEvent('card-1', 0, 'test-card', 3, 2),
        ],
      })

      expect(canActivate(trigger, card, run)).toBe(false)
    })
  })

  describe('combined costs and limits', () => {
    it('returns false when resources ok but limit reached', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = {
        on: 'card-activate',
        target: 'self',
        costs: { [Resource.POINTS]: 5 },
        limit: { perTurn: 1 },
      }
      const run = createTestRun({
        cards: { drawPile: [], hand: [], board: [card], stack: [], discardPile: [] },
        resources: { points: 100 },
        stats: { turns: 1, rounds: 1 },
        events: [createCardActivateEvent('card-1', 0, 'test-card', 1, 1)],
      })

      expect(canActivate(trigger, card, run)).toBe(false)
    })

    it('returns false when limit ok but resources insufficient', () => {
      const card = createTestCard({ instanceId: 'card-1' })
      const trigger: Trigger = {
        on: 'card-activate',
        target: 'self',
        costs: { [Resource.POINTS]: 5 },
        limit: { perTurn: 3 },
      }
      const run = createTestRun({
        cards: { drawPile: [], hand: [], board: [card], stack: [], discardPile: [] },
        resources: { points: 2 },
        stats: { turns: 1, rounds: 1 },
        events: [],
      })

      expect(canActivate(trigger, card, run)).toBe(false)
    })
  })
})

describe('findMatchingAbilities', () => {
  it('finds abilities matching a card-play event', () => {
    const ability: Ability = {
      trigger: { on: 'card-play', target: 'self' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 1 } }],
    }
    const card = createTestCard({
      instanceId: 'card-1',
      abilities: [ability] as unknown as PlayableCard['abilities'],
    })
    const event = createCardPlayEvent('card-1')
    const run = createTestRun({
      cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
    })

    const matches = findMatchingAbilities(run, event)

    expect(matches).toHaveLength(1)
    expect(matches[0].card).toBe(card)
    expect(matches[0].ability).toBe(ability)
  })

  it('finds multiple abilities on the same card', () => {
    const ability1: Ability = {
      trigger: { on: 'card-play', target: 'self' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 1 } }],
    }
    const ability2: Ability = {
      trigger: { on: 'card-play', target: 'self' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 2 } }],
    }
    const card = createTestCard({
      instanceId: 'card-1',
      abilities: [ability1, ability2] as unknown as PlayableCard['abilities'],
    })
    const event = createCardPlayEvent('card-1')
    const run = createTestRun({
      cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
    })

    const matches = findMatchingAbilities(run, event)

    expect(matches).toHaveLength(2)
  })

  it('finds abilities from multiple cards', () => {
    const ability1: Ability = {
      trigger: { on: 'card-play', target: 'any' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 1 } }],
    }
    const ability2: Ability = {
      trigger: { on: 'card-play', target: 'any' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 2 } }],
    }
    const card1 = createTestCard({
      instanceId: 'card-1',
      abilities: [ability1] as unknown as PlayableCard['abilities'],
    })
    const card2 = createTestCard({
      instanceId: 'card-2',
      abilities: [ability2] as unknown as PlayableCard['abilities'],
    })
    const event = createCardPlayEvent('card-3')
    const run = createTestRun({
      cards: { drawPile: [], hand: [card1, card2], board: [], stack: [], discardPile: [] },
    })

    const matches = findMatchingAbilities(run, event)

    expect(matches).toHaveLength(2)
  })

  it('checks all locations for lifecycle events', () => {
    const handAbility: Ability = {
      trigger: { on: 'turn-start' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 1 } }],
    }
    const boardAbility: Ability = {
      trigger: { on: 'turn-start' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 2 } }],
    }
    const handCard = createTestCard({
      instanceId: 'hand-card',
      abilities: [handAbility] as unknown as PlayableCard['abilities'],
    })
    const boardCard = createTestCard({
      instanceId: 'board-card',
      abilities: [boardAbility] as unknown as PlayableCard['abilities'],
    })
    const event = createTurnStartEvent()
    const run = createTestRun({
      cards: { drawPile: [], hand: [handCard], board: [boardCard], stack: [], discardPile: [] },
    })

    const matches = findMatchingAbilities(run, event)

    // Both hand and board cards can respond to lifecycle events
    // Location filtering is done via trigger.locations, not event type
    expect(matches).toHaveLength(2)
  })

  it('respects trigger.locations for lifecycle events', () => {
    const handAbility: Ability = {
      trigger: { on: 'turn-start', locations: ['board'] }, // Only triggers when on board
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 1 } }],
    }
    const handCard = createTestCard({
      instanceId: 'hand-card',
      abilities: [handAbility] as unknown as PlayableCard['abilities'],
    })
    const event = createTurnStartEvent()
    const run = createTestRun({
      cards: { drawPile: [], hand: [handCard], board: [], stack: [], discardPile: [] },
    })

    const matches = findMatchingAbilities(run, event)

    // Hand card has ability that requires board location, so it doesn't match
    expect(matches).toHaveLength(0)
  })

  it('checks hand and board cards for card events', () => {
    const ability: Ability = {
      trigger: { on: 'card-play', target: 'any' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 1 } }],
    }
    const handCard = createTestCard({
      instanceId: 'hand-card',
      abilities: [ability] as unknown as PlayableCard['abilities'],
    })
    const boardCard = createTestCard({
      instanceId: 'board-card',
      abilities: [ability] as unknown as PlayableCard['abilities'],
    })
    const event = createCardPlayEvent('some-other-card')
    const run = createTestRun({
      cards: { drawPile: [], hand: [handCard], board: [boardCard], stack: [], discardPile: [] },
    })

    const matches = findMatchingAbilities(run, event)

    expect(matches).toHaveLength(2)
  })

  it('returns empty array when no abilities match', () => {
    const ability: Ability = {
      trigger: { on: 'card-draw', target: 'self' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 1 } }],
    }
    const card = createTestCard({
      instanceId: 'card-1',
      abilities: [ability] as unknown as PlayableCard['abilities'],
    })
    const event = createCardPlayEvent('card-1')
    const run = createTestRun({
      cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
    })

    const matches = findMatchingAbilities(run, event)

    expect(matches).toHaveLength(0)
  })
})

describe('handleEvent', () => {
  it('returns unchanged state when no run exists', () => {
    const gameState = createTestGameState()
    gameState.game.run = null
    const event = createCardPlayEvent('card-1')

    const result = handleEvent(gameState, event)

    expect(result).toBe(gameState)
  })

  it('applies update-resource effects', () => {
    const ability: Ability = {
      trigger: { on: 'card-play', target: 'self' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 5 } }],
    }
    const card = createTestCard({
      instanceId: 'card-1',
      abilities: [ability] as unknown as PlayableCard['abilities'],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
      resources: { points: 10 },
    })
    const event = createCardPlayEvent('card-1')

    const result = handleEvent(gameState, event)

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
    const card = createTestCard({
      instanceId: 'card-1',
      abilities: [ability] as unknown as PlayableCard['abilities'],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
      resources: { points: 0 },
    })
    const event = createCardPlayEvent('card-1')

    const result = handleEvent(gameState, event)

    expect(result.game.run!.resources.points).toBe(8)
  })

  it('processes abilities from multiple cards', () => {
    const ability1: Ability = {
      trigger: { on: 'card-play', target: 'any' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 1 } }],
    }
    const ability2: Ability = {
      trigger: { on: 'card-play', target: 'any' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 2 } }],
    }
    const card1 = createTestCard({
      instanceId: 'card-1',
      abilities: [ability1] as unknown as PlayableCard['abilities'],
    })
    const card2 = createTestCard({
      instanceId: 'card-2',
      abilities: [ability2] as unknown as PlayableCard['abilities'],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [card1, card2], board: [], stack: [], discardPile: [] },
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
    const card = createTestCard({
      instanceId: 'card-1',
      abilities: [ability] as unknown as PlayableCard['abilities'],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
    })
    const event = createCardPlayEvent('card-1')

    const result = handleEvent(gameState, event)

    expect(result.viewData.modalView).toBe('card-choice')
    expect(result.viewData.resolver).not.toBeNull()
  })

  it('resolves self references in remove-card effects', () => {
    const ability: Ability = {
      trigger: { on: 'card-play', target: 'self' },
      effects: [{ type: 'remove-card', params: { instanceId: 'self' } }],
    }
    const card = createTestCard({
      instanceId: 'card-1',
      abilities: [ability] as unknown as PlayableCard['abilities'],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [card], board: [], stack: [], discardPile: [] },
    })
    const event = createCardPlayEvent('card-1')

    const result = handleEvent(gameState, event)

    // Card should be removed
    expect(result.game.run!.cards.hand).toHaveLength(0)
  })
})

describe('isAsset', () => {
  it('returns true when card has ability with board location', () => {
    const ability: Ability = {
      trigger: { on: 'turn-start', locations: ['board'] },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 1 } }],
    }
    const card = createTestCard({
      instanceId: 'card-1',
      abilities: [ability] as unknown as PlayableCard['abilities'],
    })

    expect(isAsset(card)).toBe(true)
  })

  it('returns true when any ability has board location', () => {
    const ability1: Ability = {
      trigger: { on: 'card-play', target: 'self' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 1 } }],
    }
    const ability2: Ability = {
      trigger: { on: 'turn-start', locations: ['board'] },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 2 } }],
    }
    const card = createTestCard({
      instanceId: 'card-1',
      abilities: [ability1, ability2] as unknown as PlayableCard['abilities'],
    })

    expect(isAsset(card)).toBe(true)
  })

  it('returns false when no ability has board location', () => {
    const ability: Ability = {
      trigger: { on: 'card-play', target: 'self' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 1 } }],
    }
    const card = createTestCard({
      instanceId: 'card-1',
      abilities: [ability] as unknown as PlayableCard['abilities'],
    })

    expect(isAsset(card)).toBe(false)
  })

  it('returns false when card has no abilities', () => {
    const card = createTestCard({
      instanceId: 'card-1',
      abilities: [] as unknown as PlayableCard['abilities'],
    })

    expect(isAsset(card)).toBe(false)
  })

  it('returns true when location includes board among others', () => {
    const ability: Ability = {
      trigger: { on: 'card-play', target: 'any', locations: ['hand', 'board'] },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 1 } }],
    }
    const card = createTestCard({
      instanceId: 'card-1',
      abilities: [ability] as unknown as PlayableCard['abilities'],
    })

    expect(isAsset(card)).toBe(true)
  })
})
