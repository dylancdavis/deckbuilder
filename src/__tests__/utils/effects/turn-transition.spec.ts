import { describe, it, expect } from 'vitest'
import { handleEffect } from '../../../utils/ability-processor'
import { score } from '../../../utils/cards'
import type { Ability } from '../../../utils/ability'
import type { CardInstance } from '../../../utils/cards'
import type { Effect } from '../../../utils/effects'
import type { GameState } from '../../../utils/game'
import { Resource } from '../../../utils/resource'
import { createTestGameState } from './shared'

function marker(delta: number): Effect[] {
  return [{ type: 'update-resource', params: { resource: Resource.POINTS, delta } }]
}

function makeCard(instanceId: string, abilities: Ability[]): CardInstance {
  return { ...score, abilities, instanceId }
}

/** The turn boundary plus each card ability that fired, in resolution order. */
function resolutionOrder(state: GameState): string[] {
  return state.game
    .run!.events.filter(
      (e) => e.type === 'turn-end' || e.type === 'turn-start' || e.type === 'resource-change',
    )
    .map((e) => (e.type === 'resource-change' ? `points+${e.delta}` : e.type))
}

describe('turn transition ability ordering', () => {
  it('resolves board turn-end abilities before the turn advances', () => {
    const ender = makeCard('ender', [
      { type: 'reactive', trigger: { on: 'turn-end' }, effects: marker(1) },
    ])
    const starter = makeCard('starter', [
      { type: 'reactive', trigger: { on: 'turn-start' }, effects: marker(2) },
    ])
    const gameState = createTestGameState({
      cards: {
        drawPile: [makeCard('draw-1', []), makeCard('draw-2', [])],
        hand: [],
        board: [ender, starter],
        discardPile: [],
      },
    })

    const result = handleEffect(gameState, { type: 'turn-end', params: {} }, { kind: 'player' })

    expect(resolutionOrder(result)).toEqual(['turn-end', 'points+1', 'turn-start', 'points+2'])
  })

  it('resolves multiple board turn-end abilities in board order', () => {
    const first = makeCard('first', [
      { type: 'reactive', trigger: { on: 'turn-end' }, effects: marker(1) },
    ])
    const second = makeCard('second', [
      { type: 'reactive', trigger: { on: 'turn-end' }, effects: marker(2) },
    ])
    const gameState = createTestGameState({
      cards: {
        drawPile: [makeCard('draw-1', []), makeCard('draw-2', [])],
        hand: [],
        board: [first, second],
        discardPile: [],
      },
    })

    const result = handleEffect(gameState, { type: 'turn-end', params: {} }, { kind: 'player' })

    expect(resolutionOrder(result)).toEqual(['turn-end', 'points+1', 'points+2', 'turn-start'])
  })
})
