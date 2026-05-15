import type { Counter } from './counter'
import { add, sub } from './counter'
import { playableCards, type CardID, type CardInstance, type PlayableCardID } from './cards'
import { Resource } from './resource'
import { type Run, type Location, locations } from './run'
import { shuffle, placeItems } from './utils'
import type { GameState } from './game'
import type { CardMatcher } from './card-matchers'
import type {
  CardAddEvent,
  CardCollectEvent,
  CardDestroyEvent,
  CardDrawEvent,
  CardPlayEvent,
  DeckRefreshEvent,
  Event,
  ResourceChangeEvent,
  TurnEndEvent,
  TurnStartEvent,
} from './event'

// Card placement modes when adding cards to locations
export type PlacementMode = 'top' | 'bottom' | 'shuffle'

export type AddCardsEffect = {
  type: 'add-cards'
  params: {
    location: Location
    cards: Counter<PlayableCardID>
    mode: PlacementMode
  }
}

export type UpdateResourceEffect = {
  type: 'update-resource'
  params: {
    resource: Resource
  } & (
    | { delta: number }
    | { set: number }
    | { update: (currentAmount: number, run: Run) => number }
  )
}

export type CollectCardEffect = {
  type: 'collect-card'
  params: {
    cards: Counter<CardID>
  }
}

export type DestroyCardEffect = {
  type: 'destroy-card'
  params: {
    cards: Counter<CardID>
  }
}

export type CardChoiceEffect = {
  type: 'card-choice'
  params: {
    options: number
    tags: string[]
    choiceHandler: (chosenCard: CardID) => Effect[]
  }
}

export type RemoveCardEffect = {
  type: 'remove-card'
  params: { instanceId: string | 'self' } | { matching: CardMatcher }
}

export type DrawCardsEffect = {
  type: 'draw-cards'
  params: { amount: number }
}

export type DiscardCardsEffect = {
  type: 'discard-cards'
  params:
    | { instanceIds: string[] }
    | { from: Location; amount: number | 'all' }
    | { from: Location; matching: CardMatcher }
}

export type MoveCardEffect = {
  type: 'move-card'
  params: (
    | { instanceIds: (string | 'self')[] }
    | { from: Location; amount: number | 'all' }
    | { from: Location; matching: CardMatcher }
  ) & {
    to: Location
    position?: 'top' | 'bottom' | 'shuffle'
  }
}

export type PlayCardEffect = {
  type: 'play-card'
  params: {
    instanceId: string
  }
}

export type RetriggerCardEffect = {
  type: 'retrigger-card'
  params: {
    instanceId: string | 'self'
  }
}

// Lifecycle effects
export type TurnStartEffect = {
  type: 'turn-start'
  params: Record<string, never>
}

export type TurnEndEffect = {
  type: 'turn-end'
  params: Record<string, never>
}

export type RoundStartEffect = {
  type: 'round-start'
  params: Record<string, never>
}

export type RoundEndEffect = {
  type: 'round-end'
  params: Record<string, never>
}

export type RunStartEffect = {
  type: 'run-start'
  params: Record<string, never>
}

export type RunEndEffect = {
  type: 'run-end'
  params: Record<string, never>
}

export type RefreshDeckEffect = {
  type: 'refresh-deck'
  params: Record<string, never>
}

export type Effect =
  | AddCardsEffect
  | UpdateResourceEffect
  | CollectCardEffect
  | CardChoiceEffect
  | DestroyCardEffect
  | RemoveCardEffect
  | DrawCardsEffect
  | DiscardCardsEffect
  | MoveCardEffect
  | PlayCardEffect
  | RetriggerCardEffect
  | TurnStartEffect
  | TurnEndEffect
  | RoundStartEffect
  | RoundEndEffect
  | RunStartEffect
  | RunEndEffect
  | RefreshDeckEffect

type EffectResult = { game: GameState; event: Event | null }

function handleUpdateResource(gameState: GameState, effect: UpdateResourceEffect): EffectResult {
  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const resource = effect.params.resource
  const oldValue = run.resources[resource]
  let newValue: number

  if ('delta' in effect.params) {
    newValue = oldValue + effect.params.delta
  } else if ('set' in effect.params) {
    newValue = effect.params.set
  } else {
    newValue = effect.params.update(oldValue, run)
  }

  const event: ResourceChangeEvent = {
    type: 'resource-change',
    resource,
    oldValue,
    newValue,
    delta: newValue - oldValue,
    round,
    turn,
  }

  return {
    game: {
      ...gameState,
      game: {
        ...gameState.game,
        run: {
          ...run,
          resources: {
            ...run.resources,
            [effect.params.resource]: newValue,
          },
        },
      },
    },
    event,
  }
}

/**
 * Adds a single card to a location. The decomposition layer breaks
 * multi-card counters into individual add-cards effects.
 */
function handleAddCards(gameState: GameState, effect: AddCardsEffect): EffectResult {
  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { location, cards, mode } = effect.params

  // Pick one card from the counter (decomposition ensures single-card counters)
  const cardId = Object.keys(cards)[0] as PlayableCardID | undefined
  if (!cardId) return { game: gameState, event: null }

  const card: CardInstance = {
    ...playableCards[cardId],
    instanceId: crypto.randomUUID(),
  }

  const existingCards = run.cards[location]
  const newCardArr = placeItems(existingCards, [card], mode === 'shuffle' ? 'shuffle' : mode)

  const event: CardAddEvent = {
    type: 'card-add',
    cardId: card.id,
    instanceId: card.instanceId,
    toLocation: location,
    round,
    turn,
  }

  return {
    game: {
      ...gameState,
      game: {
        ...gameState.game,
        run: {
          ...run,
          cards: {
            ...run.cards,
            [location]: newCardArr,
          },
        },
      },
    },
    event,
  }
}

/**
 * Collects a single card into the collection. The decomposition layer
 * breaks multi-card counters into individual collect-card effects.
 */
function handleCollectCard(gameState: GameState, effect: CollectCardEffect): EffectResult {
  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { cards } = effect.params

  const cardId = Object.keys(cards)[0] as CardID | undefined
  if (!cardId) return { game: gameState, event: null }

  const event: CardCollectEvent = {
    type: 'card-collect',
    cardId,
    round,
    turn,
  }

  return {
    game: {
      ...gameState,
      game: {
        ...gameState.game,
        collection: {
          ...gameState.game.collection,
          cards: add(gameState.game.collection.cards, cardId, cards[cardId] ?? 1),
        },
      },
    },
    event,
  }
}

/**
 * Destroys a single card from the collection. The decomposition layer
 * breaks multi-card counters into individual destroy-card effects.
 */
function handleDestroyCard(gameState: GameState, effect: DestroyCardEffect): EffectResult {
  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { cards } = effect.params

  const cardId = Object.keys(cards)[0] as CardID | undefined
  if (!cardId) return { game: gameState, event: null }

  const event: CardDestroyEvent = {
    type: 'card-destroy',
    cardId,
    round,
    turn,
  }

  return {
    game: {
      ...gameState,
      game: {
        ...gameState.game,
        collection: {
          ...gameState.game.collection,
          cards: sub(gameState.game.collection.cards, cardId, cards[cardId] ?? 1),
        },
      },
    },
    event,
  }
}

/**
 * Removes a single card by instanceId from any location.
 * Self-references and matchers must be resolved by the decomposition layer.
 */
function handleRemoveCard(gameState: GameState, effect: RemoveCardEffect): EffectResult {
  if ('matching' in effect.params) throw new Error('Card matcher removal must be decomposed first')
  if (effect.params.instanceId === 'self') throw new Error('Self reference must be decomposed first')

  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { instanceId } = effect.params
  const updatedCards = { ...run.cards }

  for (const location of locations) {
    const cardIndex = updatedCards[location].findIndex((card) => card.instanceId === instanceId)
    if (cardIndex !== -1) {
      const card = updatedCards[location][cardIndex]

      updatedCards[location] = [
        ...updatedCards[location].slice(0, cardIndex),
        ...updatedCards[location].slice(cardIndex + 1),
      ]

      return {
        game: {
          ...gameState,
          game: {
            ...gameState.game,
            run: {
              ...run,
              cards: updatedCards,
            },
          },
        },
        event: {
          type: 'card-remove',
          cardId: card.id,
          instanceId: card.instanceId,
          fromLocation: location,
          round,
          turn,
        },
      }
    }
  }

  // Card not found — skip
  return { game: gameState, event: null }
}

function handleTurnStart(gameState: GameState): EffectResult {
  const run = gameState.game.run!
  const newTurn = run.stats.turns + 1
  const event: TurnStartEvent = {
    type: 'turn-start',
    round: run.stats.rounds,
    turn: newTurn,
  }

  return {
    game: {
      ...gameState,
      game: {
        ...gameState.game,
        run: {
          ...run,
          stats: {
            ...run.stats,
            turns: newTurn,
          },
        },
      },
    },
    event,
  }
}

function handleTurnEnd(gameState: GameState): EffectResult {
  const run = gameState.game.run!
  const event: TurnEndEvent = {
    type: 'turn-end',
    round: run.stats.rounds,
    turn: run.stats.turns,
  }

  return {
    game: gameState,
    event,
  }
}

function handleRoundStart(gameState: GameState): EffectResult {
  const run = gameState.game.run!
  const newRound = run.stats.rounds + 1
  const event: Event = {
    type: 'round-start',
    round: newRound,
    turn: 0,
  }

  return {
    game: {
      ...gameState,
      game: {
        ...gameState.game,
        run: {
          ...run,
          stats: {
            ...run.stats,
            rounds: newRound,
            turns: 0,
          },
        },
      },
    },
    event,
  }
}

function handleRoundEnd(gameState: GameState): EffectResult {
  const run = gameState.game.run!

  return {
    game: gameState,
    event: {
      type: 'round-end',
      round: run.stats.rounds,
      turn: run.stats.turns,
    },
  }
}

function handleRunStart(gameState: GameState): EffectResult {
  const run = gameState.game.run!

  return {
    game: gameState,
    event: {
      type: 'run-start',
      round: run.stats.rounds,
      turn: run.stats.turns,
    },
  }
}

function handleRunEnd(gameState: GameState): EffectResult {
  const run = gameState.game.run!

  return {
    game: gameState,
    event: {
      type: 'run-end',
      round: run.stats.rounds,
      turn: run.stats.turns,
    },
  }
}

function handleRefreshDeck(gameState: GameState): EffectResult {
  const run = gameState.game.run!
  const allCards = [
    ...run.cards.drawPile,
    ...run.cards.hand,
    ...run.cards.board,
    ...run.cards.discardPile,
  ]

  const event: DeckRefreshEvent = {
    type: 'deck-refresh',
    round: run.stats.rounds,
    turn: run.stats.turns,
  }

  return {
    game: {
      ...gameState,
      game: {
        ...gameState.game,
        run: {
          ...run,
          cards: {
            ...run.cards,
            drawPile: shuffle(allCards),
            hand: [],
            board: [],
            discardPile: [],
          },
        },
      },
    },
    event,
  }
}

function handlePlayCard(gameState: GameState, effect: PlayCardEffect): EffectResult {
  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { instanceId } = effect.params

  // Find card in hand
  const cardIndex = run.cards.hand.findIndex((c) => c.instanceId === instanceId)
  if (cardIndex === -1) {
    throw new Error(`Cannot play card: no card with instanceId ${instanceId} found in hand`)
  }

  // Check playAmount limit
  const rulesCard = run.deck.rulesCard
  if (rulesCard) {
    const playAmount = rulesCard.turnStructure.playAmount
    if (typeof playAmount === 'number') {
      const cardsPlayedThisTurn = run.events.filter(
        (e) => e.type === 'card-play' && e.round === round && e.turn === turn,
      ).length
      if (cardsPlayedThisTurn >= playAmount) {
        throw new Error(
          `Cannot play card: playAmount limit of ${playAmount} reached (${cardsPlayedThisTurn} cards played this turn)`,
        )
      }
    }
  }

  const card = run.cards.hand[cardIndex]

  // Determine destination: board if asset (has board-location abilities), otherwise discard
  const isAsset = card.abilities.some((a) => a.trigger.locations?.includes('board'))
  const destination = isAsset ? 'board' : 'discardPile'

  // Move card from hand to destination
  const newHand = [...run.cards.hand.slice(0, cardIndex), ...run.cards.hand.slice(cardIndex + 1)]
  const newDestination = [...run.cards[destination], card]

  const event: CardPlayEvent = {
    type: 'card-play',
    cardId: card.id,
    instanceId,
    round,
    turn,
  }

  return {
    game: {
      ...gameState,
      game: {
        ...gameState.game,
        run: {
          ...run,
          cards: {
            ...run.cards,
            hand: newHand,
            [destination]: newDestination,
          },
        },
      },
    },
    event,
  }
}

/**
 * Draws a single card from the top of the draw pile.
 * The decomposition layer breaks draw-cards { amount: N } into N individual calls.
 */
function handleDrawCard(gameState: GameState): EffectResult {
  const run = gameState.game.run!
  const drawPile = run.cards.drawPile

  if (drawPile.length === 0) return { game: gameState, event: null }

  const card = drawPile[0]
  const remainingDrawPile = drawPile.slice(1)

  const event: CardDrawEvent = {
    type: 'card-draw',
    cardId: card.id,
    instanceId: card.instanceId,
    round: run.stats.rounds,
    turn: run.stats.turns,
  }

  return {
    game: {
      ...gameState,
      game: {
        ...gameState.game,
        run: {
          ...run,
          cards: {
            ...run.cards,
            drawPile: remainingDrawPile,
            hand: [...run.cards.hand, card],
          },
        },
      },
    },
    event,
  }
}

/**
 * Discards a single card by instanceId.
 * The decomposition layer resolves instanceIds[], amount, and matching variants
 * into individual discard-cards effects with a single instanceId.
 */
function handleDiscardCard(gameState: GameState, effect: DiscardCardsEffect): EffectResult {
  if (!('instanceIds' in effect.params) || effect.params.instanceIds.length !== 1) {
    throw new Error('Discard effect must be decomposed to single instanceId before applying')
  }

  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const instanceId = effect.params.instanceIds[0]
  const updatedCards = { ...run.cards }

  for (const location of locations) {
    const idx = updatedCards[location].findIndex((c) => c.instanceId === instanceId)
    if (idx !== -1) {
      const card = updatedCards[location][idx]
      updatedCards[location] = [
        ...updatedCards[location].slice(0, idx),
        ...updatedCards[location].slice(idx + 1),
      ]
      updatedCards.discardPile = [...updatedCards.discardPile, card]

      return {
        game: {
          ...gameState,
          game: {
            ...gameState.game,
            run: {
              ...run,
              cards: updatedCards,
            },
          },
        },
        event: {
          type: 'card-discard',
          cardId: card.id,
          instanceId: card.instanceId,
          fromLocation: location,
          round,
          turn,
        },
      }
    }
  }

  // Card not found — skip
  return { game: gameState, event: null }
}

/**
 * Moves a single card by instanceId to a destination.
 * The decomposition layer resolves instanceIds[], amount, and matching variants
 * into individual move-card effects with a single instanceId.
 */
function handleMoveCard(gameState: GameState, effect: MoveCardEffect): EffectResult {
  if (!('instanceIds' in effect.params) || effect.params.instanceIds.length !== 1) {
    throw new Error('Move effect must be decomposed to single instanceId before applying')
  }

  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { to, position } = effect.params
  const instanceId = effect.params.instanceIds[0] as string
  const updatedCards = { ...run.cards }

  for (const location of locations) {
    const idx = updatedCards[location].findIndex((c) => c.instanceId === instanceId)
    if (idx !== -1) {
      const card = updatedCards[location][idx]
      updatedCards[location] = [
        ...updatedCards[location].slice(0, idx),
        ...updatedCards[location].slice(idx + 1),
      ]
      updatedCards[to] = placeItems(updatedCards[to], [card], position)

      return {
        game: {
          ...gameState,
          game: {
            ...gameState.game,
            run: {
              ...run,
              cards: updatedCards,
            },
          },
        },
        event: {
          type: 'card-move',
          cardId: card.id,
          instanceId: card.instanceId,
          fromLocation: location,
          toLocation: to,
          round,
          turn,
        },
      }
    }
  }

  // Card not found — skip
  return { game: gameState, event: null }
}

/**
 * Applies a single atomic effect to the game state.
 * Returns the updated state and at most one event.
 *
 * Compound effects (multi-card, matching, self-references) must be decomposed
 * by the orchestrator before reaching this function.
 */
export function applyEffect(gameState: GameState, effect: Effect): EffectResult {
  if (!gameState.game.run) throw new Error('No active run in game state')

  switch (effect.type) {
    case 'update-resource':
      return handleUpdateResource(gameState, effect)
    case 'add-cards':
      return handleAddCards(gameState, effect)
    case 'collect-card':
      return handleCollectCard(gameState, effect)
    case 'destroy-card':
      return handleDestroyCard(gameState, effect)
    case 'remove-card':
      return handleRemoveCard(gameState, effect)
    case 'draw-cards':
      return handleDrawCard(gameState)
    case 'turn-start':
      return handleTurnStart(gameState)
    case 'turn-end':
      return handleTurnEnd(gameState)
    case 'round-start':
      return handleRoundStart(gameState)
    case 'round-end':
      return handleRoundEnd(gameState)
    case 'run-start':
      return handleRunStart(gameState)
    case 'run-end':
      return handleRunEnd(gameState)
    case 'refresh-deck':
      return handleRefreshDeck(gameState)
    case 'discard-cards':
      return handleDiscardCard(gameState, effect)
    case 'move-card':
      return handleMoveCard(gameState, effect)
    case 'play-card':
      return handlePlayCard(gameState, effect)
    case 'retrigger-card':
    case 'card-choice':
      throw new Error(`${effect.type} must be handled by the orchestrator, not applyEffect`)
  }
}
