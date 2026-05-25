import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGameStore } from '../../stores/game'
import { basicEntity, targetDummy, starterRules } from '../../utils/cards'
import type { CardInstance } from '../../utils/cards'

function makeInstance(card: typeof basicEntity, instanceId: string): CardInstance {
  return { ...card, instanceId }
}

function setupRunWithBoard(board: CardInstance[]) {
  setActivePinia(createPinia())
  const store = useGameStore()
  store.gameState.game.run = {
    deck: { name: 'Test', cards: {}, rulesCard: starterRules },
    cards: { drawPile: [], hand: [], board, discardPile: [] },
    resources: { points: 0 },
    stats: { turns: 1, rounds: 1 },
    events: [],
  }
  return store
}

describe('attack flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('startAttack', () => {
    it('opens attack-target modal when attacker has attack and there is a target', () => {
      const attacker = makeInstance(basicEntity, 'atk-1')
      const target = makeInstance(targetDummy, 'tgt-1')
      const store = setupRunWithBoard([attacker, target])

      store.startAttack('atk-1')

      expect(store.modalView).toBe('attack-target')
      expect(store.pendingAttack).toEqual({ attackerInstanceId: 'atk-1' })
    })

    it('does nothing when no other defender is on the board', () => {
      const attacker = makeInstance(basicEntity, 'atk-1')
      const store = setupRunWithBoard([attacker])

      store.startAttack('atk-1')

      expect(store.modalView).toBe(null)
      expect(store.pendingAttack).toBe(null)
    })

    it('does nothing when the clicked card has zero attack', () => {
      const dummy = makeInstance(targetDummy, 'tgt-1')
      const other = makeInstance(basicEntity, 'atk-1')
      const store = setupRunWithBoard([dummy, other])

      store.startAttack('tgt-1')

      expect(store.modalView).toBe(null)
    })
  })

  describe('attackTargets', () => {
    it('excludes the attacker itself', () => {
      const attacker = makeInstance(basicEntity, 'atk-1')
      const target = makeInstance(targetDummy, 'tgt-1')
      const store = setupRunWithBoard([attacker, target])

      store.startAttack('atk-1')

      expect(store.attackTargets.map((c) => c.instanceId)).toEqual(['tgt-1'])
    })

    it('only includes board cards with defense defined', () => {
      const attacker = makeInstance(basicEntity, 'atk-1')
      const target = makeInstance(targetDummy, 'tgt-1')
      const noDef = makeInstance({ ...basicEntity, defense: undefined }, 'tgt-2')
      const store = setupRunWithBoard([attacker, target, noDef])

      store.startAttack('atk-1')

      expect(store.attackTargets.map((c) => c.instanceId)).toEqual(['tgt-1'])
    })
  })

  describe('resolveAttack', () => {
    it('reduces target defense by attacker.attack and clears modal', () => {
      const attacker = makeInstance({ ...basicEntity, attack: 3 }, 'atk-1')
      const target = makeInstance({ ...targetDummy, defense: 5 }, 'tgt-1')
      const store = setupRunWithBoard([attacker, target])

      store.startAttack('atk-1')
      store.resolveAttack('tgt-1')

      const board = store.run!.cards.board
      expect(board.find((c) => c.instanceId === 'tgt-1')!.defense).toBe(2)
      expect(store.modalView).toBe(null)
      expect(store.pendingAttack).toBe(null)
    })
  })

  describe('cancelAttack', () => {
    it('closes the modal without applying damage', () => {
      const attacker = makeInstance(basicEntity, 'atk-1')
      const target = makeInstance({ ...targetDummy, defense: 1 }, 'tgt-1')
      const store = setupRunWithBoard([attacker, target])

      store.startAttack('atk-1')
      store.cancelAttack()

      const board = store.run!.cards.board
      expect(board.find((c) => c.instanceId === 'tgt-1')!.defense).toBe(1)
      expect(store.modalView).toBe(null)
      expect(store.pendingAttack).toBe(null)
    })
  })
})
