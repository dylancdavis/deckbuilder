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

  describe('resolveAttack', () => {
    it('reduces target defense by attacker.attack', () => {
      const attacker = makeInstance({ ...basicEntity, attack: 3 }, 'atk-1')
      const target = makeInstance({ ...targetDummy, defense: 5 }, 'tgt-1')
      const store = setupRunWithBoard([attacker, target])

      store.resolveAttack('atk-1', 'tgt-1')

      const board = store.run!.cards.board
      expect(board.find((c) => c.instanceId === 'tgt-1')!.defense).toBe(2)
    })

    it('logs a card-attack event identifying the attacker before the damage event', () => {
      const attacker = makeInstance({ ...basicEntity, attack: 3 }, 'atk-1')
      const target = makeInstance({ ...targetDummy, defense: 5 }, 'tgt-1')
      const store = setupRunWithBoard([attacker, target])

      store.resolveAttack('atk-1', 'tgt-1')

      expect(store.run!.events.map((e) => e.type)).toEqual(['card-attack', 'card-damage'])
      expect(store.run!.events[0]).toMatchObject({
        type: 'card-attack',
        cardId: 'basic-entity',
        instanceId: 'atk-1',
        targetCardId: 'target-dummy',
        targetInstanceId: 'tgt-1',
        amount: 3,
      })
    })

    it('discards the target via core rule when defense reaches 0', () => {
      const attacker = makeInstance({ ...basicEntity, attack: 1 }, 'atk-1')
      const target = makeInstance({ ...targetDummy, defense: 1 }, 'tgt-1')
      const store = setupRunWithBoard([attacker, target])

      store.resolveAttack('atk-1', 'tgt-1')

      expect(store.run!.cards.board.map((c) => c.instanceId)).toEqual(['atk-1'])
      expect(store.run!.cards.discardPile.map((c) => c.instanceId)).toEqual(['tgt-1'])
    })
  })
})
