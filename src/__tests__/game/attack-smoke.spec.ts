import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGameStore } from '../../stores/game'

/**
 * High-level smoke tests: play the attack test deck through the store the way
 * the UI does (start run → play entities → attack), exercising card-attack
 * triggers, retaliation, and the zero-defense discard rule in actual play.
 */
describe('attack test deck smoke test', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function startAttackRun() {
    const store = useGameStore()
    store.selectDeck('attackTestDeck')
    store.startRun()

    // Both deck cards are drawn on the first turn and played to the board
    expect(store.run!.cards.hand.map((c) => c.id).sort()).toEqual(['striker', 'thorn-dummy'])
    for (const card of [...store.run!.cards.hand]) {
      store.tryPlayCard(card.instanceId)
    }
    expect(store.run!.cards.hand).toEqual([])
    expect(store.run!.cards.board).toHaveLength(2)

    const striker = store.run!.cards.board.find((c) => c.id === 'striker')!
    const thorn = store.run!.cards.board.find((c) => c.id === 'thorn-dummy')!
    return { store, striker, thorn }
  }

  function attack(store: ReturnType<typeof useGameStore>, attackerId: string, targetId: string) {
    store.startAttack(attackerId)
    expect(store.modalView).toBe('attack-target')
    store.resolveAttack(targetId)
  }

  it('resolves an attack with on-attack and retaliation triggers', () => {
    const { store, striker, thorn } = startAttackRun()

    attack(store, striker.instanceId, thorn.instanceId)

    const board = store.run!.cards.board
    // Thorn Dummy took Striker's 2 attack
    expect(board.find((c) => c.id === 'thorn-dummy')!.defense).toBe(2)
    // Striker took 1 retaliation damage from Thorn Dummy
    expect(board.find((c) => c.id === 'striker')!.defense).toBe(2)
    // Striker's "when this card attacks" ability granted a point
    expect(store.resources!.points).toBe(1)
    expect(store.run!.events.filter((e) => e.type === 'card-attack')).toHaveLength(1)
  })

  it('discards the defender once repeated attacks reduce its defense to zero', () => {
    const { store, striker, thorn } = startAttackRun()

    attack(store, striker.instanceId, thorn.instanceId)
    attack(store, striker.instanceId, thorn.instanceId)

    expect(store.run!.cards.board.map((c) => c.id)).toEqual(['striker'])
    expect(store.run!.cards.discardPile.map((c) => c.id)).toEqual(['thorn-dummy'])
    // Striker survived two retaliations and earned a point per attack
    expect(store.run!.cards.board[0].defense).toBe(1)
    expect(store.resources!.points).toBe(2)
  })
})
