import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../../utils/ability-processor'
import type { AttackEffect } from '../../../utils/effects'
import { basicEntity, targetDummy } from '../../../utils/cards'
import type { CardInstance, PlayableCard } from '../../../utils/cards'
import { Resource } from '../../../utils/resource'
import { createTestGameState } from './shared'

function makeInstance(
  card: PlayableCard,
  instanceId: string,
  overrides: Partial<PlayableCard> = {},
): CardInstance {
  return { ...card, ...overrides, instanceId }
}

function stateWithBoard(board: CardInstance[]) {
  return createTestGameState({
    cards: { drawPile: [], hand: [], board, discardPile: [] },
  })
}

function attackEffect(instanceId: string, targetInstanceId: string): AttackEffect {
  return { type: 'attack', params: { instanceId, targetInstanceId } }
}

const ADD_POINT_EFFECT = {
  type: 'update-resource' as const,
  params: { resource: Resource.POINTS, delta: 1 },
}

describe('AttackEffect', () => {
  it('reduces target defense by the attacker attack stat', () => {
    const attacker = makeInstance(basicEntity, 'atk-1', { attack: 3 })
    const target = makeInstance(targetDummy, 'tgt-1', { defense: 5 })
    const gameState = stateWithBoard([attacker, target])

    const result = handleEffect(gameState, attackEffect('atk-1', 'tgt-1'), { kind: 'player' })

    const board = result.game.run!.cards.board
    expect(board.find((c) => c.instanceId === 'tgt-1')!.defense).toBe(2)
  })

  it('emits a card-attack event before the card-damage event', () => {
    const attacker = makeInstance(basicEntity, 'atk-1', { attack: 3 })
    const target = makeInstance(targetDummy, 'tgt-1', { defense: 5 })
    const gameState = stateWithBoard([attacker, target])

    const result = handleEffect(gameState, attackEffect('atk-1', 'tgt-1'), { kind: 'player' })

    const events = result.game.run!.events
    expect(events.map((e) => e.type)).toEqual(['card-attack', 'card-damage'])
    expect(events[0]).toMatchObject({
      type: 'card-attack',
      cardId: 'basic-entity',
      instanceId: 'atk-1',
      targetCardId: 'target-dummy',
      targetInstanceId: 'tgt-1',
      amount: 3,
    })
  })

  it('emits card-attack even when the target has no defense (whiff)', () => {
    const attacker = makeInstance(basicEntity, 'atk-1')
    const target = makeInstance(basicEntity, 'tgt-1', { defense: undefined })
    const gameState = stateWithBoard([attacker, target])

    const result = handleEffect(gameState, attackEffect('atk-1', 'tgt-1'), { kind: 'player' })

    expect(result.game.run!.events.map((e) => e.type)).toEqual(['card-attack'])
  })

  it('does nothing when the attacker has no attack stat', () => {
    const attacker = makeInstance(basicEntity, 'atk-1', { attack: undefined })
    const target = makeInstance(targetDummy, 'tgt-1', { defense: 5 })
    const gameState = stateWithBoard([attacker, target])

    const result = handleEffect(gameState, attackEffect('atk-1', 'tgt-1'), { kind: 'player' })

    expect(result.game.run!.events).toEqual([])
    expect(result.game.run!.cards.board.find((c) => c.instanceId === 'tgt-1')!.defense).toBe(5)
  })

  it('triggers "when this card attacks" abilities before the damage lands', () => {
    const attacker = makeInstance(basicEntity, 'atk-1', {
      attack: 3,
      abilities: [
        {
          trigger: { on: 'card-attack', target: 'self' },
          effects: [ADD_POINT_EFFECT],
        },
      ],
    })
    const target = makeInstance(targetDummy, 'tgt-1', { defense: 5 })
    const gameState = stateWithBoard([attacker, target])

    const result = handleEffect(gameState, attackEffect('atk-1', 'tgt-1'), { kind: 'player' })

    expect(result.game.run!.resources.points).toBe(1)
    expect(result.game.run!.events.map((e) => e.type)).toEqual([
      'card-attack',
      'resource-change',
      'card-damage',
    ])
  })

  it('lets a card respond to being attacked, distinctly from being damaged', () => {
    const attacker = makeInstance(basicEntity, 'atk-1', { attack: 1 })
    const target = makeInstance(targetDummy, 'tgt-1', {
      defense: 5,
      abilities: [
        {
          trigger: {
            on: 'card-attack',
            when: (ctx) =>
              ctx.event.type === 'card-attack' &&
              ctx.sourceCard.type === 'playable' &&
              ctx.event.targetInstanceId === ctx.sourceCard.instanceId,
          },
          effects: [ADD_POINT_EFFECT],
        },
      ],
    })

    const attacked = handleEffect(
      stateWithBoard([attacker, target]),
      attackEffect('atk-1', 'tgt-1'),
      { kind: 'player' },
    )
    expect(attacked.game.run!.resources.points).toBe(1)

    // Plain damage is not an attack: the ability must not fire
    const damaged = handleEffect(
      stateWithBoard([attacker, target]),
      { type: 'damage', params: { instanceId: 'tgt-1', amount: 1 } },
      { kind: 'player' },
    )
    expect(damaged.game.run!.resources.points).toBe(0)
  })

  it('resolves the "target" ref to the attacker for retaliation abilities', () => {
    const attacker = makeInstance(basicEntity, 'atk-1', { attack: 1, defense: 5 })
    const target = makeInstance(targetDummy, 'tgt-1', {
      defense: 5,
      abilities: [
        {
          trigger: {
            on: 'card-attack',
            when: (ctx) =>
              ctx.event.type === 'card-attack' &&
              ctx.sourceCard.type === 'playable' &&
              ctx.event.targetInstanceId === ctx.sourceCard.instanceId,
          },
          effects: [{ type: 'damage', params: { instanceId: 'target', amount: 1 } }],
        },
      ],
    })
    const gameState = stateWithBoard([attacker, target])

    const result = handleEffect(gameState, attackEffect('atk-1', 'tgt-1'), { kind: 'player' })

    const board = result.game.run!.cards.board
    expect(board.find((c) => c.instanceId === 'atk-1')!.defense).toBe(4)
    expect(board.find((c) => c.instanceId === 'tgt-1')!.defense).toBe(4)
  })

  it('resolves a symbolic "self" attacker in ability-authored attacks', () => {
    const attacker = makeInstance(basicEntity, 'atk-1', {
      attack: 2,
      abilities: [
        {
          trigger: { on: 'turn-start' },
          effects: [{ type: 'attack', params: { instanceId: 'self', targetInstanceId: 'tgt-1' } }],
        },
      ],
    })
    const target = makeInstance(targetDummy, 'tgt-1', { defense: 5 })
    const gameState = stateWithBoard([attacker, target])

    const result = handleEffect(gameState, { type: 'turn-start', params: {} }, { kind: 'player' })

    const board = result.game.run!.cards.board
    expect(board.find((c) => c.instanceId === 'tgt-1')!.defense).toBe(3)
    const attackEvents = result.game.run!.events.filter((e) => e.type === 'card-attack')
    expect(attackEvents).toHaveLength(1)
    expect(attackEvents[0]).toMatchObject({ instanceId: 'atk-1', targetInstanceId: 'tgt-1' })
  })
})
