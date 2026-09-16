import { describe, it, expect } from 'vitest'
import { applyCommand } from '../../../utils/commands'
import type { DamageCommand } from '../../../utils/commands'
import { score } from '../../../utils/cards'
import { createTestGameState } from './shared'

describe('DamageCommand', () => {
  it('subtracts damage from card defense', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [],
        board: [{ ...score, instanceId: 'card-1', defense: 5 }],
        discardPile: [],
      },
    })
    const command: DamageCommand = {
      type: 'damage',
      params: { instanceId: 'card-1', amount: 3 },
    }

    const result = applyCommand(gameState, command)

    expect(result.game.game.run!.cards.board[0].defense).toBe(2)
  })

  it('clamps defense at zero when damage exceeds remaining defense', () => {
    const gameState = createTestGameState({
      cards: {
        drawPile: [],
        hand: [],
        board: [{ ...score, instanceId: 'card-1', defense: 2 }],
        discardPile: [],
      },
    })
    const command: DamageCommand = {
      type: 'damage',
      params: { instanceId: 'card-1', amount: 10 },
    }

    const result = applyCommand(gameState, command)

    expect(result.game.game.run!.cards.board[0].defense).toBe(0)
  })
})
