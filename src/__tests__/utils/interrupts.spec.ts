import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../utils/ability-processor'
import type { Effect } from '../../utils/effects'
import { basicEntity, targetDummy, score } from '../../utils/cards'
import type { CardInstance, PlayableCard } from '../../utils/cards'
import type { InterruptAbility } from '../../utils/ability'
import { Resource } from '../../utils/resource'
import { createTestGameState } from './effects/shared'

function makeInstance(
  card: PlayableCard,
  instanceId: string,
  overrides: Partial<PlayableCard> = {},
): CardInstance {
  return { ...card, ...overrides, instanceId }
}

const ADD_POINT_EFFECT = {
  type: 'update-resource' as const,
  params: { resource: Resource.POINTS, delta: 1 },
}

/** "When this card would be discarded, move it to your hand instead." */
const SAVE_FROM_DISCARD: InterruptAbility = {
  type: 'interrupt',
  trigger: { on: 'discard-cards', target: 'self' },
  effects: [{ type: 'move-card', params: { instanceIds: ['self'], to: 'hand' } }],
}

function discardEffect(instanceId: string): Effect {
  return { type: 'discard-cards', params: { instanceIds: [instanceId] } }
}

describe('interrupt abilities', () => {
  it('substitutes a static effect list for the intercepted effect', () => {
    const saver = makeInstance(basicEntity, 'e-1', { abilities: [SAVE_FROM_DISCARD] })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [saver], discardPile: [] },
    })

    const result = handleEffect(gameState, discardEffect('e-1'), { kind: 'player' })

    const run = result.game.run!
    expect(run.cards.hand.map((c) => c.instanceId)).toEqual(['e-1'])
    expect(run.cards.discardPile).toEqual([])
    expect(run.events.map((e) => e.type)).toEqual(['effect-replace', 'card-move'])
  })

  it('emits an effect-replace event carrying the original and substitute effects', () => {
    const saver = makeInstance(basicEntity, 'e-1', { abilities: [SAVE_FROM_DISCARD] })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [saver], discardPile: [] },
    })

    const result = handleEffect(gameState, discardEffect('e-1'), { kind: 'player' })

    const replaceEvent = result.game.run!.events[0]
    expect(replaceEvent).toMatchObject({
      type: 'effect-replace',
      sourceCardId: 'basic-entity',
      cardId: 'basic-entity',
      instanceId: 'e-1',
      originalEffect: { type: 'discard-cards' },
      newEffects: [{ type: 'move-card' }],
    })
  })

  it('transforms an effect via the function form, keeping the original source context', () => {
    // "All Score cards gain +1 point": bump the delta of any update-resource
    // produced by a Score card's own ability.
    const aura = makeInstance(basicEntity, 'aura-1', {
      abilities: [
        {
          type: 'interrupt',
          trigger: {
            on: 'update-resource',
            when: ({ effectContext }) =>
              effectContext.kind === 'ability' && effectContext.sourceCard.id === 'score',
          },
          effects: ({ effect }) => {
            const params = effect.params as { resource: Resource; delta: number }
            return [{ ...effect, params: { ...params, delta: params.delta + 1 } } as Effect]
          },
        },
      ],
    })
    const scoreCard = makeInstance(score, 'score-1')
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [scoreCard], board: [aura], discardPile: [] },
    })

    const result = handleEffect(
      gameState,
      { type: 'play-card', params: { instanceId: 'score-1' } },
      { kind: 'player' },
    )

    const run = result.game.run!
    expect(run.resources.points).toBe(2)
    const resourceEvent = run.events.find((e) => e.type === 'resource-change')
    expect(resourceEvent).toMatchObject({ delta: 2, newValue: 2 })
  })

  it('prevents the effect entirely when the substitute list is empty', () => {
    const immovable = makeInstance(basicEntity, 'e-1', {
      abilities: [
        {
          type: 'interrupt',
          trigger: { on: 'discard-cards', target: 'self' },
          effects: [],
        },
      ],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [immovable], discardPile: [] },
    })

    const result = handleEffect(gameState, discardEffect('e-1'), { kind: 'player' })

    const run = result.game.run!
    expect(run.cards.board.map((c) => c.instanceId)).toEqual(['e-1'])
    expect(run.cards.discardPile).toEqual([])
    expect(run.events.map((e) => e.type)).toEqual(['effect-replace'])
    expect(run.events[0]).toMatchObject({ type: 'effect-replace', newEffects: [] })
  })

  it('prevents the damage when an empty substitute list intercepts an attack', () => {
    const attacker = makeInstance(basicEntity, 'atk-1', { attack: 3 })
    const shielded = makeInstance(targetDummy, 'tgt-1', {
      defense: 5,
      abilities: [{ type: 'interrupt', trigger: { on: 'attack', target: 'self' }, effects: [] }],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [attacker, shielded], discardPile: [] },
    })

    const result = handleEffect(
      gameState,
      { type: 'attack', params: { instanceId: 'atk-1', targetInstanceId: 'tgt-1' } },
      { kind: 'player' },
    )

    const run = result.game.run!
    expect(run.events.map((e) => e.type)).toEqual(['effect-replace'])
    expect(run.cards.board.find((c) => c.instanceId === 'tgt-1')!.defense).toBe(5)
  })

  it('does not re-apply an interrupt to its own substitute effects', () => {
    // Substitutes another discard of itself: without once-per-ability
    // protection this would recurse forever.
    const looper = makeInstance(basicEntity, 'e-1', {
      abilities: [
        {
          type: 'interrupt',
          trigger: { on: 'discard-cards', target: 'self' },
          effects: [{ type: 'discard-cards', params: { instanceIds: ['self'] } }],
        },
      ],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [looper], discardPile: [] },
    })

    const result = handleEffect(gameState, discardEffect('e-1'), { kind: 'player' })

    const run = result.game.run!
    expect(run.cards.discardPile.map((c) => c.instanceId)).toEqual(['e-1'])
    expect(run.events.map((e) => e.type)).toEqual(['effect-replace', 'card-discard'])
  })

  it('cascades reactive abilities listening on effect-replace before the substitutes resolve', () => {
    const saver = makeInstance(basicEntity, 'e-1', { abilities: [SAVE_FROM_DISCARD] })
    const observer = makeInstance(targetDummy, 'obs-1', {
      abilities: [
        {
          type: 'reactive',
          trigger: { on: 'effect-replace' },
          effects: [ADD_POINT_EFFECT],
        },
      ],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [saver, observer], discardPile: [] },
    })

    const result = handleEffect(gameState, discardEffect('e-1'), { kind: 'player' })

    const run = result.game.run!
    expect(run.resources.points).toBe(1)
    expect(run.events.map((e) => e.type)).toEqual([
      'effect-replace',
      'resource-change',
      'card-move',
    ])
  })

  it('does not fire for effects acting on other cards when target is self', () => {
    const saver = makeInstance(basicEntity, 'e-1', { abilities: [SAVE_FROM_DISCARD] })
    const bystander = makeInstance(targetDummy, 'e-2')
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [saver, bystander], discardPile: [] },
    })

    const result = handleEffect(gameState, discardEffect('e-2'), { kind: 'player' })

    const run = result.game.run!
    expect(run.cards.discardPile.map((c) => c.instanceId)).toEqual(['e-2'])
    expect(run.events.map((e) => e.type)).toEqual(['card-discard'])
  })

  it('intercepts per card within a decomposed multi-card effect', () => {
    const saver = makeInstance(basicEntity, 'e-1', { abilities: [SAVE_FROM_DISCARD] })
    const bystander = makeInstance(targetDummy, 'e-2')
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [saver, bystander], discardPile: [] },
    })

    const result = handleEffect(
      gameState,
      { type: 'discard-cards', params: { from: 'board', amount: 'all' } },
      { kind: 'player' },
    )

    const run = result.game.run!
    expect(run.cards.hand.map((c) => c.instanceId)).toEqual(['e-1'])
    expect(run.cards.discardPile.map((c) => c.instanceId)).toEqual(['e-2'])
  })

  it('reduces incoming damage by substituting a smaller damage effect', () => {
    const attacker = makeInstance(basicEntity, 'atk-1', { attack: 4 })
    const armored = makeInstance(targetDummy, 'tgt-1', {
      defense: 5,
      abilities: [
        {
          type: 'interrupt',
          trigger: { on: 'damage', target: 'self' },
          effects: ({ effect }) => {
            const params = effect.params as { instanceId: string; amount: number }
            return [{ ...effect, params: { ...params, amount: Math.max(0, params.amount - 2) } } as Effect]
          },
        },
      ],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [attacker, armored], discardPile: [] },
    })

    const result = handleEffect(
      gameState,
      { type: 'attack', params: { instanceId: 'atk-1', targetInstanceId: 'tgt-1' } },
      { kind: 'player' },
    )

    const run = result.game.run!
    // 4 attack - 2 armor = 2 actual damage, so 5 - 2 = 3
    expect(run.cards.board.find((c) => c.instanceId === 'tgt-1')!.defense).toBe(3)
  })

  it('blocks lethal damage entirely, preventing the zero-defense discard', () => {
    const attacker = makeInstance(basicEntity, 'atk-1', { attack: 5 })
    const shielded = makeInstance(targetDummy, 'tgt-1', {
      defense: 3,
      abilities: [
        { type: 'interrupt', trigger: { on: 'damage', target: 'self' }, effects: [] },
      ],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [attacker, shielded], discardPile: [] },
    })

    const result = handleEffect(
      gameState,
      { type: 'attack', params: { instanceId: 'atk-1', targetInstanceId: 'tgt-1' } },
      { kind: 'player' },
    )

    const run = result.game.run!
    expect(run.cards.board.find((c) => c.instanceId === 'tgt-1')!.defense).toBe(3)
    expect(run.cards.discardPile).toEqual([])
    // Attack event fires, then the damage is replaced (never applied)
    expect(run.events.map((e) => e.type)).toEqual(['card-attack', 'effect-replace'])
  })

  it('only intercepts damage to self, letting other cards take full damage', () => {
    const attacker = makeInstance(basicEntity, 'atk-1', { attack: 3 })
    const armored = makeInstance(basicEntity, 'arm-1', {
      defense: 5,
      abilities: [
        { type: 'interrupt', trigger: { on: 'damage', target: 'self' }, effects: [] },
      ],
    })
    const bystander = makeInstance(targetDummy, 'tgt-1', { defense: 5 })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [attacker, armored, bystander], discardPile: [] },
    })

    const result = handleEffect(
      gameState,
      { type: 'damage', params: { instanceId: 'tgt-1', amount: 3 } },
      { kind: 'player' },
    )

    const run = result.game.run!
    // Bystander takes full damage, armored card untouched
    expect(run.cards.board.find((c) => c.instanceId === 'tgt-1')!.defense).toBe(2)
    expect(run.cards.board.find((c) => c.instanceId === 'arm-1')!.defense).toBe(5)
    expect(run.events.map((e) => e.type)).toEqual(['card-damage'])
  })

  it('intercepts only attack-sourced damage when the trigger checks effectContext', () => {
    const attacker = makeInstance(basicEntity, 'atk-1', { attack: 2 })
    // Only blocks damage that was produced by the core card-attack → damage ability
    const antiAttack = makeInstance(targetDummy, 'tgt-1', {
      defense: 5,
      abilities: [
        {
          type: 'interrupt',
          trigger: {
            on: 'damage',
            target: 'self',
            when: ({ effectContext }) =>
              effectContext.kind === 'ability' &&
              effectContext.event.type === 'card-attack',
          },
          effects: [],
        },
      ],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [attacker, antiAttack], discardPile: [] },
    })

    // Attack-sourced damage is blocked
    const attacked = handleEffect(
      gameState,
      { type: 'attack', params: { instanceId: 'atk-1', targetInstanceId: 'tgt-1' } },
      { kind: 'player' },
    )
    expect(attacked.game.run!.cards.board.find((c) => c.instanceId === 'tgt-1')!.defense).toBe(5)

    // Direct damage goes through
    const directDamage = handleEffect(
      gameState,
      { type: 'damage', params: { instanceId: 'tgt-1', amount: 2 } },
      { kind: 'player' },
    )
    expect(directDamage.game.run!.cards.board.find((c) => c.instanceId === 'tgt-1')!.defense).toBe(3)
  })

  it('respects the locations gate on the effect trigger', () => {
    const saver = makeInstance(basicEntity, 'e-1', {
      abilities: [
        {
          type: 'interrupt',
          trigger: { on: 'discard-cards', target: 'self', locations: ['board'] },
          effects: [{ type: 'move-card', params: { instanceIds: ['self'], to: 'hand' } }],
        },
      ],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [saver], board: [], discardPile: [] },
    })

    const result = handleEffect(gameState, discardEffect('e-1'), { kind: 'player' })

    const run = result.game.run!
    expect(run.cards.discardPile.map((c) => c.instanceId)).toEqual(['e-1'])
    expect(run.events.map((e) => e.type)).toEqual(['card-discard'])
  })
})
