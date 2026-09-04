import { describe, expect, it } from 'vitest'
import type { PlayableCard, PlayableCardID } from '../../../utils/cards'
import { score } from '../../../utils/cards'
import { resolveCard } from '../../../utils/game'
import type { GameState } from '../../../utils/game'
import { createTestGameState } from '../effects/shared'

const makeTestCard = (
  overrides: Partial<PlayableCard> & { id: PlayableCardID; effects: PlayableCard['effects'] },
): PlayableCard => ({
  type: 'playable',
  name: 'Test Card',
  description: 'Test',
  cost: 0,
  ...overrides,
})

describe('resolveCard indexing edge cases', () => {
  const baseGameState = (): GameState =>
    createTestGameState({
      cards: {
        drawPile: [],
        hand: [],
        board: [],
        discardPile: [],
      },
    })

  it('removes the originally played card even if new cards are added to the top of the hand', () => {
    const playedCard: PlayableCard = makeTestCard({
      id: 'test-add-top' as PlayableCardID,
      instanceId: 'played-card',
      effects: [
        {
          type: 'add-cards',
          params: {
            location: 'hand',
            cards: { score: 1 },
            mode: 'top',
          },
        },
      ],
    })

    const gameState = baseGameState()
    gameState.game.run!.cards.hand = [
      playedCard,
      { ...score, instanceId: 'other-card' },
    ]

    const updated = resolveCard(gameState, 0)
    const run = updated.game.run!
    const handIds = run.cards.hand.map((card) => card.instanceId)
    const discardIds = run.cards.discardPile.map((card) => card.instanceId)

    expect(handIds).not.toContain('played-card')
    expect(discardIds).toContain('played-card')
  })

  it('removes the correct card after resolving a card-choice effect that adds to the top of the hand', () => {
    const choiceCard: PlayableCard = makeTestCard({
      id: 'test-choice-add-top' as PlayableCardID,
      instanceId: 'choice-card',
      effects: [
        {
          type: 'card-choice',
          params: {
            options: 1,
            tags: [],
            then: () => ({
              type: 'add-cards',
              params: {
                location: 'hand',
                cards: { score: 1 },
                mode: 'top',
              },
            }),
          },
        },
      ],
    })

    const gameState = baseGameState()
    gameState.game.run!.cards.hand = [
      choiceCard,
      { ...score, instanceId: 'other-card' },
    ]

    const withModal = resolveCard(gameState, 0)
    const resolver = withModal.viewData.resolver
    expect(resolver).toBeTruthy()

    const resolved = resolver!(withModal, 'score')
    const run = resolved.game.run!
    const handIds = run.cards.hand.map((card) => card.instanceId)
    const discardIds = run.cards.discardPile.map((card) => card.instanceId)

    expect(handIds).not.toContain('choice-card')
    expect(discardIds).toContain('choice-card')
  })
})
