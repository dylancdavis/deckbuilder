import type { Counter } from './counter'
import { toArray, mergeCounters, subtractCounters } from './counter'
import { playableCards, type CardID, type CardInstance, type PlayableCardID } from './cards'
import { Resource } from './resource'
import { type Run, type Location, locations } from './run'
import { shuffle, placeItems } from './utils'
import type { GameState } from './game'
import type { CardMatcher } from './card-matchers'
import { matchesCard } from './card-matchers'
import type {
  CardAddEvent,
  CardCollectEvent,
  CardDestroyEvent,
  CardDiscardEvent,
  CardDrawEvent,
  CardMoveEvent,
  CardRemoveEvent,
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
  | RetriggerCardEffect
  | TurnStartEffect
  | TurnEndEffect
  | RoundStartEffect
  | RoundEndEffect
  | RunStartEffect
  | RunEndEffect
  | RefreshDeckEffect

type EffectResult = { game: GameState; events: Event[] }

/** No-op handler — returns game state unchanged with no events. */
function handleIdentity(gameState: GameState): EffectResult {
  return { game: gameState, events: [] }
}

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
    events: [event],
  }
}

function handleAddCards(gameState: GameState, effect: AddCardsEffect): EffectResult {
  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { location, cards, mode } = effect.params
  const shuffledIDs = shuffle(toArray(cards))
  const cardsToAdd = shuffledIDs.map((id) => ({
    ...playableCards[id],
    instanceId: crypto.randomUUID(),
  }))
  const existingCards = run.cards[location]
  let newCardArr: CardInstance[]
  if (mode === 'top') {
    newCardArr = [...cardsToAdd, ...existingCards]
  } else if (mode === 'bottom') {
    newCardArr = [...existingCards, ...cardsToAdd]
  } else {
    newCardArr = shuffle([...existingCards, ...cardsToAdd])
  }

  const events: CardAddEvent[] = cardsToAdd.map((card) => ({
    type: 'card-add',
    cardId: card.id,
    instanceId: card.instanceId,
    toLocation: location,
    round,
    turn,
  }))

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
    events,
  }
}

function handleCollectCard(gameState: GameState, effect: CollectCardEffect): EffectResult {
  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { cards } = effect.params

  const events: CardCollectEvent[] = toArray(cards).map((cardId) => ({
    type: 'card-collect',
    cardId,
    round,
    turn,
  }))

  return {
    game: {
      ...gameState,
      game: {
        ...gameState.game,
        collection: {
          ...gameState.game.collection,
          cards: mergeCounters(gameState.game.collection.cards, cards),
        },
      },
    },
    events,
  }
}

function handleDestroyCard(gameState: GameState, effect: DestroyCardEffect): EffectResult {
  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { cards } = effect.params

  const events: CardDestroyEvent[] = toArray(cards).map((cardId) => ({
    type: 'card-destroy',
    cardId,
    round,
    turn,
  }))

  return {
    game: {
      ...gameState,
      game: {
        ...gameState.game,
        collection: {
          ...gameState.game.collection,
          cards: subtractCounters(gameState.game.collection.cards, cards),
        },
      },
    },
    events,
  }
}

function handleRemoveCard(gameState: GameState, effect: RemoveCardEffect): EffectResult {
  if ('matching' in effect.params) throw new Error('Card matcher removal not yet implemented')

  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { instanceId } = effect.params

  const updatedCards = { ...run.cards }
  let removedCard: CardRemoveEvent | null = null

  for (const location of locations) {
    const cardIndex = updatedCards[location].findIndex((card) => card.instanceId === instanceId)
    if (cardIndex !== -1) {
      const card = updatedCards[location][cardIndex]

      removedCard = {
        type: 'card-remove',
        cardId: card.id,
        instanceId: card.instanceId,
        fromLocation: location,
        round,
        turn,
      }

      updatedCards[location] = [
        ...updatedCards[location].slice(0, cardIndex),
        ...updatedCards[location].slice(cardIndex + 1),
      ]
      break
    }
  }

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
    events: removedCard ? [removedCard] : [],
  }
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
    events: [event],
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
    events: [event],
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
    events: [event],
  }
}

function handleRoundEnd(gameState: GameState): EffectResult {
  const run = gameState.game.run!
  const event: Event = {
    type: 'round-end',
    round: run.stats.rounds,
    turn: run.stats.turns,
  }

  return {
    game: gameState,
    events: [event],
  }
}

function handleRunStart(gameState: GameState): EffectResult {
  const run = gameState.game.run!
  const event: Event = {
    type: 'run-start',
    round: run.stats.rounds,
    turn: run.stats.turns,
  }

  return {
    game: gameState,
    events: [event],
  }
}

function handleRunEnd(gameState: GameState): EffectResult {
  const run = gameState.game.run!
  const event: Event = {
    type: 'run-end',
    round: run.stats.rounds,
    turn: run.stats.turns,
  }

  return {
    game: gameState,
    events: [event],
  }
}

function handleRefreshDeck(gameState: GameState): EffectResult {
  const run = gameState.game.run!
  const allCards = [
    ...run.cards.drawPile,
    ...run.cards.hand,
    ...run.cards.stack,
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
    events: [event],
  }
}

function handleDrawCards(gameState: GameState, effect: DrawCardsEffect): EffectResult {
  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { amount } = effect.params
  const drawPile = run.cards.drawPile
  const cardsToDraw = drawPile.slice(0, amount)
  const remainingDrawPile = drawPile.slice(amount)

  const events: CardDrawEvent[] = cardsToDraw.map((card) => ({
    type: 'card-draw',
    cardId: card.id,
    instanceId: card.instanceId,
    round,
    turn,
  }))

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
            hand: [...run.cards.hand, ...cardsToDraw],
          },
        },
      },
    },
    events,
  }
}

function handleDiscardCards(gameState: GameState, effect: DiscardCardsEffect): EffectResult {
  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const events: CardDiscardEvent[] = []
  const updatedCards = { ...run.cards }

  if ('instanceIds' in effect.params) {
    for (const instanceId of effect.params.instanceIds) {
      for (const location of locations) {
        const idx = updatedCards[location].findIndex((c) => c.instanceId === instanceId)
        if (idx !== -1) {
          const card = updatedCards[location][idx]
          updatedCards[location] = [
            ...updatedCards[location].slice(0, idx),
            ...updatedCards[location].slice(idx + 1),
          ]
          updatedCards.discardPile = [...updatedCards.discardPile, card]
          events.push({
            type: 'card-discard',
            cardId: card.id,
            instanceId: card.instanceId,
            fromLocation: location,
            round,
            turn,
          })
          break
        }
      }
    }
  } else {
    const { from } = effect.params
    let cardsToDiscard: CardInstance[]
    let remaining: CardInstance[]

    if ('matching' in effect.params) {
      const { matching } = effect.params
      cardsToDiscard = updatedCards[from].filter((c) => matchesCard(c, matching))
      remaining = updatedCards[from].filter((c) => !matchesCard(c, matching))
    } else {
      const count =
        effect.params.amount === 'all' ? updatedCards[from].length : effect.params.amount
      cardsToDiscard = updatedCards[from].slice(0, count)
      remaining = updatedCards[from].slice(count)
    }

    updatedCards[from] = remaining
    updatedCards.discardPile = [...updatedCards.discardPile, ...cardsToDiscard]

    for (const card of cardsToDiscard) {
      events.push({
        type: 'card-discard',
        cardId: card.id,
        instanceId: card.instanceId,
        fromLocation: from,
        round,
        turn,
      })
    }
  }

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
    events,
  }
}

function handleMoveCard(gameState: GameState, effect: MoveCardEffect): EffectResult {
  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { to, position } = effect.params
  const events: CardMoveEvent[] = []
  const updatedCards = { ...run.cards }
  let cardsToMove: CardInstance[] = []

  if ('instanceIds' in effect.params) {
    for (const instanceId of effect.params.instanceIds) {
      for (const location of locations) {
        const idx = updatedCards[location].findIndex((c) => c.instanceId === instanceId)
        if (idx !== -1) {
          const card = updatedCards[location][idx]
          updatedCards[location] = [
            ...updatedCards[location].slice(0, idx),
            ...updatedCards[location].slice(idx + 1),
          ]
          cardsToMove.push(card)
          events.push({
            type: 'card-move',
            cardId: card.id,
            instanceId: card.instanceId,
            fromLocation: location,
            toLocation: to,
            round,
            turn,
          })
          break
        }
      }
    }
  } else {
    const { from } = effect.params
    let remaining: CardInstance[]

    if ('matching' in effect.params) {
      const { matching } = effect.params
      cardsToMove = updatedCards[from].filter((c) => matchesCard(c, matching))
      remaining = updatedCards[from].filter((c) => !matchesCard(c, matching))
    } else {
      const count =
        effect.params.amount === 'all' ? updatedCards[from].length : effect.params.amount
      cardsToMove = updatedCards[from].slice(0, count)
      remaining = updatedCards[from].slice(count)
    }

    updatedCards[from] = remaining

    for (const card of cardsToMove) {
      events.push({
        type: 'card-move',
        cardId: card.id,
        instanceId: card.instanceId,
        fromLocation: from,
        toLocation: to,
        round,
        turn,
      })
    }
  }

  updatedCards[to] = placeItems(updatedCards[to], cardsToMove, position)

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
    events,
  }
}

/**
 * Handles a given effect and updates the event log if the effect successfully generated events.
 * Returns the new GameState and any generated events.
 */
export function handleEffect(gameState: GameState, effect: Effect): EffectResult {
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
      return handleDrawCards(gameState, effect)
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
      return handleDiscardCards(gameState, effect)
    case 'move-card':
      return handleMoveCard(gameState, effect)
    // TODO: implement these effect handlers
    case 'retrigger-card':
    case 'card-choice':
      console.warn('unimplemented effect handle; falling back to no-op')
      return handleIdentity(gameState)
  }
}

/**
 * Applies multiple effects to a game state sequentially, returning the final game state.
 */
export function handleEffects(gameState: GameState, effects: Effect[]): GameState {
  return effects.reduce(
    (currentState, effect) => handleEffect(currentState, effect).game,
    gameState,
  )
}
