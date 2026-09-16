import { describe, it, expect } from 'vitest'
import { handleCommand } from '../../utils/ability-processor'
import type { Command } from '../../utils/commands'
import { basicEntity, targetDummy, score } from '../../utils/cards'
import type { CardInstance, PlayableCard } from '../../utils/cards'
import type { CommandTrigger, InterruptAbility } from '../../utils/ability'
import { Resource } from '../../utils/resource'
import { createTestGameState } from './commands/shared'

function makeInstance(
  card: PlayableCard,
  instanceId: string,
  overrides: Partial<PlayableCard> = {},
): CardInstance {
  return { ...card, ...overrides, instanceId }
}

const ADD_POINT_COMMAND = {
  type: 'update-resource' as const,
  params: { resource: Resource.POINTS, delta: 1 },
}

/** "When this card would be discarded, move it to your hand instead." */
const SAVE_FROM_DISCARD: InterruptAbility = {
  type: 'interrupt',
  trigger: { on: 'discard-cards', target: 'self' },
  commands: [{ type: 'move-card', params: { instanceIds: ['self'], to: 'hand' } }],
}

function discardCommand(instanceId: string): Command {
  return { type: 'discard-cards', params: { instanceIds: [instanceId] } }
}

describe('interrupt abilities', () => {
  it('substitutes a static command list for the intercepted command', () => {
    const saver = makeInstance(basicEntity, 'e-1', { abilities: [SAVE_FROM_DISCARD] })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [saver], discardPile: [] },
    })

    const result = handleCommand(gameState, discardCommand('e-1'), { kind: 'player' })

    const run = result.game.run!
    expect(run.cards.hand.map((c) => c.instanceId)).toEqual(['e-1'])
    expect(run.cards.discardPile).toEqual([])
    expect(run.events.map((e) => e.type)).toEqual(['command-replace', 'card-move'])
  })

  it('emits a command-replace event carrying the original and substitute commands', () => {
    const saver = makeInstance(basicEntity, 'e-1', { abilities: [SAVE_FROM_DISCARD] })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [saver], discardPile: [] },
    })

    const result = handleCommand(gameState, discardCommand('e-1'), { kind: 'player' })

    const replaceEvent = result.game.run!.events[0]
    expect(replaceEvent).toMatchObject({
      type: 'command-replace',
      sourceCardId: 'basic-entity',
      cardId: 'basic-entity',
      instanceId: 'e-1',
      originalCommand: { type: 'discard-cards' },
      newCommands: [{ type: 'move-card' }],
    })
  })

  it('transforms a command via the function form, keeping the original source context', () => {
    // "All Score cards gain +1 point": bump the delta of any update-resource
    // produced by a Score card's own ability.
    const aura = makeInstance(basicEntity, 'aura-1', {
      abilities: [
        {
          type: 'interrupt',
          trigger: {
            on: 'update-resource',
            when: ({ commandContext }) =>
              commandContext.kind === 'ability' && commandContext.sourceCard.id === 'score',
          },
          commands: ({ command }) => {
            const params = command.params as { resource: Resource; delta: number }
            return [{ ...command, params: { ...params, delta: params.delta + 1 } } as Command]
          },
        },
      ],
    })
    const scoreCard = makeInstance(score, 'score-1')
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [scoreCard], board: [aura], discardPile: [] },
    })

    const result = handleCommand(
      gameState,
      { type: 'play-card', params: { instanceId: 'score-1' } },
      { kind: 'player' },
    )

    const run = result.game.run!
    expect(run.resources.points).toBe(2)
    const resourceEvent = run.events.find((e) => e.type === 'resource-change')
    expect(resourceEvent).toMatchObject({ delta: 2, newValue: 2 })
  })

  it('prevents the command entirely when the substitute list is empty', () => {
    const immovable = makeInstance(basicEntity, 'e-1', {
      abilities: [
        {
          type: 'interrupt',
          trigger: { on: 'discard-cards', target: 'self' },
          commands: [],
        },
      ],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [immovable], discardPile: [] },
    })

    const result = handleCommand(gameState, discardCommand('e-1'), { kind: 'player' })

    const run = result.game.run!
    expect(run.cards.board.map((c) => c.instanceId)).toEqual(['e-1'])
    expect(run.cards.discardPile).toEqual([])
    expect(run.events.map((e) => e.type)).toEqual(['command-replace'])
    expect(run.events[0]).toMatchObject({ type: 'command-replace', newCommands: [] })
  })

  it('prevents the damage when an empty substitute list intercepts an attack', () => {
    const attacker = makeInstance(basicEntity, 'atk-1', { attack: 3 })
    const shielded = makeInstance(targetDummy, 'tgt-1', {
      defense: 5,
      abilities: [{ type: 'interrupt', trigger: { on: 'attack', target: 'self' }, commands: [] }],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [attacker, shielded], discardPile: [] },
    })

    const result = handleCommand(
      gameState,
      { type: 'attack', params: { instanceId: 'atk-1', targetInstanceId: 'tgt-1' } },
      { kind: 'player' },
    )

    const run = result.game.run!
    expect(run.events.map((e) => e.type)).toEqual(['command-replace'])
    expect(run.cards.board.find((c) => c.instanceId === 'tgt-1')!.defense).toBe(5)
  })

  it('does not re-apply an interrupt to its own substitute commands', () => {
    // Substitutes another discard of itself: without once-per-ability
    // protection this would recurse forever.
    const looper = makeInstance(basicEntity, 'e-1', {
      abilities: [
        {
          type: 'interrupt',
          trigger: { on: 'discard-cards', target: 'self' },
          commands: [{ type: 'discard-cards', params: { instanceIds: ['self'] } }],
        },
      ],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [looper], discardPile: [] },
    })

    const result = handleCommand(gameState, discardCommand('e-1'), { kind: 'player' })

    const run = result.game.run!
    expect(run.cards.discardPile.map((c) => c.instanceId)).toEqual(['e-1'])
    expect(run.events.map((e) => e.type)).toEqual(['command-replace', 'card-discard'])
  })

  it('cascades reactive abilities listening on command-replace before the substitutes resolve', () => {
    const saver = makeInstance(basicEntity, 'e-1', { abilities: [SAVE_FROM_DISCARD] })
    const observer = makeInstance(targetDummy, 'obs-1', {
      abilities: [
        {
          type: 'reactive',
          trigger: { on: 'command-replace' },
          commands: [ADD_POINT_COMMAND],
        },
      ],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [saver, observer], discardPile: [] },
    })

    const result = handleCommand(gameState, discardCommand('e-1'), { kind: 'player' })

    const run = result.game.run!
    expect(run.resources.points).toBe(1)
    expect(run.events.map((e) => e.type)).toEqual([
      'command-replace',
      'resource-change',
      'card-move',
    ])
  })

  it('does not fire for commands acting on other cards when target is self', () => {
    const saver = makeInstance(basicEntity, 'e-1', { abilities: [SAVE_FROM_DISCARD] })
    const bystander = makeInstance(targetDummy, 'e-2')
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [saver, bystander], discardPile: [] },
    })

    const result = handleCommand(gameState, discardCommand('e-2'), { kind: 'player' })

    const run = result.game.run!
    expect(run.cards.discardPile.map((c) => c.instanceId)).toEqual(['e-2'])
    expect(run.events.map((e) => e.type)).toEqual(['card-discard'])
  })

  it('intercepts per card within a decomposed multi-card command', () => {
    const saver = makeInstance(basicEntity, 'e-1', { abilities: [SAVE_FROM_DISCARD] })
    const bystander = makeInstance(targetDummy, 'e-2')
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [saver, bystander], discardPile: [] },
    })

    const result = handleCommand(
      gameState,
      { type: 'discard-cards', params: { from: 'board', amount: 'all' } },
      { kind: 'player' },
    )

    const run = result.game.run!
    expect(run.cards.hand.map((c) => c.instanceId)).toEqual(['e-1'])
    expect(run.cards.discardPile.map((c) => c.instanceId)).toEqual(['e-2'])
  })

  it('reduces incoming damage by substituting a smaller damage command', () => {
    const attacker = makeInstance(basicEntity, 'atk-1', { attack: 4 })
    const armored = makeInstance(targetDummy, 'tgt-1', {
      defense: 5,
      abilities: [
        {
          type: 'interrupt',
          trigger: { on: 'damage', target: 'self' },
          commands: ({ command }) => {
            const params = command.params as { instanceId: string; amount: number }
            return [
              {
                ...command,
                params: { ...params, amount: Math.max(0, params.amount - 2) },
              } as Command,
            ]
          },
        },
      ],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [attacker, armored], discardPile: [] },
    })

    const result = handleCommand(
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
      abilities: [{ type: 'interrupt', trigger: { on: 'damage', target: 'self' }, commands: [] }],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [attacker, shielded], discardPile: [] },
    })

    const result = handleCommand(
      gameState,
      { type: 'attack', params: { instanceId: 'atk-1', targetInstanceId: 'tgt-1' } },
      { kind: 'player' },
    )

    const run = result.game.run!
    expect(run.cards.board.find((c) => c.instanceId === 'tgt-1')!.defense).toBe(3)
    expect(run.cards.discardPile).toEqual([])
    // Attack event fires, then the damage is replaced (never applied)
    expect(run.events.map((e) => e.type)).toEqual(['card-attack', 'command-replace'])
  })

  it('only intercepts damage to self, letting other cards take full damage', () => {
    const attacker = makeInstance(basicEntity, 'atk-1', { attack: 3 })
    const armored = makeInstance(basicEntity, 'arm-1', {
      defense: 5,
      abilities: [{ type: 'interrupt', trigger: { on: 'damage', target: 'self' }, commands: [] }],
    })
    const bystander = makeInstance(targetDummy, 'tgt-1', { defense: 5 })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [attacker, armored, bystander], discardPile: [] },
    })

    const result = handleCommand(
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

  it('intercepts only attack-sourced damage when the trigger checks commandContext', () => {
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
            when: ({ commandContext }) =>
              commandContext.kind === 'ability' && commandContext.event.type === 'card-attack',
          },
          commands: [],
        },
      ],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [], board: [attacker, antiAttack], discardPile: [] },
    })

    // Attack-sourced damage is blocked
    const attacked = handleCommand(
      gameState,
      { type: 'attack', params: { instanceId: 'atk-1', targetInstanceId: 'tgt-1' } },
      { kind: 'player' },
    )
    expect(attacked.game.run!.cards.board.find((c) => c.instanceId === 'tgt-1')!.defense).toBe(5)

    // Direct damage goes through
    const directDamage = handleCommand(
      gameState,
      { type: 'damage', params: { instanceId: 'tgt-1', amount: 2 } },
      { kind: 'player' },
    )
    expect(directDamage.game.run!.cards.board.find((c) => c.instanceId === 'tgt-1')!.defense).toBe(
      3,
    )
  })

  it('respects the locations gate on the command trigger', () => {
    const saver = makeInstance(basicEntity, 'e-1', {
      abilities: [
        {
          type: 'interrupt',
          trigger: { on: 'discard-cards', target: 'self', locations: ['board'] },
          commands: [{ type: 'move-card', params: { instanceIds: ['self'], to: 'hand' } }],
        },
      ],
    })
    const gameState = createTestGameState({
      cards: { drawPile: [], hand: [saver], board: [], discardPile: [] },
    })

    const result = handleCommand(gameState, discardCommand('e-1'), { kind: 'player' })

    const run = result.game.run!
    expect(run.cards.discardPile.map((c) => c.instanceId)).toEqual(['e-1'])
    expect(run.events.map((e) => e.type)).toEqual(['card-discard'])
  })
})

describe('interrupts and commands with no work to do', () => {
  /** An untargeted interrupt on `on`, observable through the point it grants. */
  function watchCommand(on: CommandTrigger['on']): InterruptAbility {
    return { type: 'interrupt', trigger: { on }, commands: [ADD_POINT_COMMAND] }
  }

  function watcherOnBoard(on: CommandTrigger['on']) {
    const watcher = makeInstance(basicEntity, 'w-1', { abilities: [watchCommand(on)] })
    return createTestGameState({
      cards: { drawPile: [], hand: [], board: [watcher], discardPile: [] },
    })
  }

  function expectNothingHappened(result: ReturnType<typeof handleCommand>) {
    const run = result.game.run!
    expect(run.events).toEqual([])
    expect(run.resources.points).toBe(0)
  }

  it('does not interrupt a discard from an empty pile', () => {
    const gameState = watcherOnBoard('discard-cards')

    expectNothingHappened(
      handleCommand(
        gameState,
        { type: 'discard-cards', params: { from: 'hand', amount: 'all' } },
        { kind: 'player' },
      ),
    )
  })

  it('does not interrupt a discard whose matcher selects no cards', () => {
    const gameState = watcherOnBoard('discard-cards')

    expectNothingHappened(
      handleCommand(
        gameState,
        { type: 'discard-cards', params: { from: 'board', matching: { tags: ['nonexistent'] } } },
        { kind: 'player' },
      ),
    )
  })

  it('does not interrupt a move from an empty pile', () => {
    const gameState = watcherOnBoard('move-card')

    expectNothingHappened(
      handleCommand(
        gameState,
        { type: 'move-card', params: { from: 'hand', amount: 'all', to: 'board' } },
        { kind: 'player' },
      ),
    )
  })

  it('does not interrupt a draw from an empty draw pile', () => {
    const gameState = watcherOnBoard('draw-cards')

    expectNothingHappened(
      handleCommand(gameState, { type: 'draw-cards', params: { amount: 1 } }, { kind: 'player' }),
    )
  })

  it('does not draw or interrupt when the requested draw amount is zero', () => {
    const drawn = makeInstance(score, 'score-1')
    const watcher = makeInstance(basicEntity, 'w-1', { abilities: [watchCommand('draw-cards')] })
    const gameState = createTestGameState({
      cards: { drawPile: [drawn], hand: [], board: [watcher], discardPile: [] },
    })

    const result = handleCommand(
      gameState,
      { type: 'draw-cards', params: { amount: 0 } },
      { kind: 'player' },
    )

    expect(result.game.run!.cards.hand).toEqual([])
    expectNothingHappened(result)
  })

  it('does not interrupt an add-cards command with an empty card counter', () => {
    const gameState = watcherOnBoard('add-cards')

    expectNothingHappened(
      handleCommand(
        gameState,
        { type: 'add-cards', params: { location: 'hand', cards: {}, mode: 'top' } },
        { kind: 'player' },
      ),
    )
  })

  it('does not interrupt a collect-card command with an empty card counter', () => {
    const gameState = watcherOnBoard('collect-card')

    expectNothingHappened(
      handleCommand(gameState, { type: 'collect-card', params: { cards: {} } }, { kind: 'player' }),
    )
  })

  it('does not interrupt a destroy-card command with an empty card counter', () => {
    const gameState = watcherOnBoard('destroy-card')

    expectNothingHappened(
      handleCommand(gameState, { type: 'destroy-card', params: { cards: {} } }, { kind: 'player' }),
    )
  })
})
