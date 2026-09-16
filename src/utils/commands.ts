import type { Counter } from './counter'
import { add, sub } from './counter'
import {
  playableCards,
  isAsset,
  type CardID,
  type CardInstance,
  type PlayableCardID,
} from './cards'
import { Resource } from './resource'
import { type Run, type Location, locations } from './run'
import { shuffle, placeItems } from './utils'
import type { GameState } from './game'
import type { CardMatcher } from './card-matchers'
import type {
  CardAddEvent,
  CardAttackEvent,
  CardCollectEvent,
  CardDamageEvent,
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

export type AddCardsCommand = {
  type: 'add-cards'
  params: {
    location: Location
    cards: Counter<PlayableCardID>
    mode: PlacementMode
  }
}

export type UpdateResourceCommand = {
  type: 'update-resource'
  params: {
    resource: Resource
  } & (
    | { delta: number }
    | { set: number }
    | { update: (currentAmount: number, run: Run) => number }
  )
}

export type CollectCardCommand = {
  type: 'collect-card'
  params: {
    cards: Counter<CardID>
  }
}

export type DestroyCardCommand = {
  type: 'destroy-card'
  params: {
    cards: Counter<CardID>
  }
}

export type CardChoiceCommand = {
  type: 'card-choice'
  params: {
    options: number
    tags: string[]
    choiceHandler: (chosenCard: CardID) => Command[]
  }
}

/**
 * Symbolic card references resolved by the ability processor before apply.
 * - 'self': the card owning the triggered ability
 * - 'target': the card the triggering event is about
 */
export type CardRef = string | 'self' | 'target'

export type RemoveCardCommand = {
  type: 'remove-card'
  params: { instanceId: CardRef } | { matching: CardMatcher }
}

export type DrawCardsCommand = {
  type: 'draw-cards'
  params: { amount: number }
}

export type DiscardCardsCommand = {
  type: 'discard-cards'
  params:
    | { instanceIds: CardRef[] }
    | { from: Location; amount: number | 'all' }
    | { from: Location; matching: CardMatcher }
}

export type MoveCardCommand = {
  type: 'move-card'
  params: (
    | { instanceIds: CardRef[] }
    | { from: Location; amount: number | 'all' }
    | { from: Location; matching: CardMatcher }
  ) & {
    to: Location
    position?: 'top' | 'bottom' | 'shuffle'
  }
}

export type PlayCardCommand = {
  type: 'play-card'
  params: {
    instanceId: string
  }
}

export type RetriggerCardCommand = {
  type: 'retrigger-card'
  params: {
    instanceId: CardRef
  }
}

export type DamageCommand = {
  type: 'damage'
  params: {
    instanceId: CardRef
    amount: number
  }
}

export type AttackCommand = {
  type: 'attack'
  params: {
    /** The attacking card */
    instanceId: CardRef
    targetInstanceId: CardRef
  }
}

// Lifecycle commands
export type TurnStartCommand = {
  type: 'turn-start'
  params: Record<string, never>
}

export type TurnEndCommand = {
  type: 'turn-end'
  params: Record<string, never>
}

export type RoundStartCommand = {
  type: 'round-start'
  params: Record<string, never>
}

export type RoundEndCommand = {
  type: 'round-end'
  params: Record<string, never>
}

export type RunStartCommand = {
  type: 'run-start'
  params: Record<string, never>
}

export type RunEndCommand = {
  type: 'run-end'
  params: Record<string, never>
}

export type RefreshDeckCommand = {
  type: 'refresh-deck'
  params: Record<string, never>
}

export type Command =
  | AddCardsCommand
  | UpdateResourceCommand
  | CollectCardCommand
  | CardChoiceCommand
  | DestroyCardCommand
  | RemoveCardCommand
  | DrawCardsCommand
  | DiscardCardsCommand
  | MoveCardCommand
  | PlayCardCommand
  | RetriggerCardCommand
  | DamageCommand
  | AttackCommand
  | TurnStartCommand
  | TurnEndCommand
  | RoundStartCommand
  | RoundEndCommand
  | RunStartCommand
  | RunEndCommand
  | RefreshDeckCommand

/**
 * The type string of a command, used in command triggers to specify which command an interrupt intercepts.
 */
export type CommandType = Command['type']

type CommandResult = { game: GameState; event: Event | null }

function handleUpdateResource(gameState: GameState, command: UpdateResourceCommand): CommandResult {
  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const resource = command.params.resource
  const oldValue = run.resources[resource]
  let newValue: number

  if ('delta' in command.params) {
    newValue = oldValue + command.params.delta
  } else if ('set' in command.params) {
    newValue = command.params.set
  } else {
    newValue = command.params.update(oldValue, run)
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
            [command.params.resource]: newValue,
          },
        },
      },
    },
    event,
  }
}

/**
 * Adds a single card to a location. The decomposition layer breaks
 * multi-card counters into individual add-cards commands.
 */
function handleAddCards(gameState: GameState, command: AddCardsCommand): CommandResult {
  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { location, cards, mode } = command.params

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
 * breaks multi-card counters into individual collect-card commands.
 */
function handleCollectCard(gameState: GameState, command: CollectCardCommand): CommandResult {
  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { cards } = command.params

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
 * breaks multi-card counters into individual destroy-card commands.
 */
function handleDestroyCard(gameState: GameState, command: DestroyCardCommand): CommandResult {
  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { cards } = command.params

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
function handleRemoveCard(gameState: GameState, command: RemoveCardCommand): CommandResult {
  if ('matching' in command.params) throw new Error('Card matcher removal must be decomposed first')
  if (command.params.instanceId === 'self')
    throw new Error('Self reference must be decomposed first')

  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { instanceId } = command.params
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

function handleTurnStart(gameState: GameState): CommandResult {
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

function handleTurnEnd(gameState: GameState): CommandResult {
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

function handleRoundStart(gameState: GameState): CommandResult {
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

function handleRoundEnd(gameState: GameState): CommandResult {
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

function handleRunStart(gameState: GameState): CommandResult {
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

function handleRunEnd(gameState: GameState): CommandResult {
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

function handleRefreshDeck(gameState: GameState): CommandResult {
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

function handlePlayCard(gameState: GameState, command: PlayCardCommand): CommandResult {
  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { instanceId } = command.params

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

  const destination = isAsset(card) ? 'board' : 'discardPile'

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
function handleDrawCard(gameState: GameState): CommandResult {
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
 * into individual discard-cards commands with a single instanceId.
 */
function handleDiscardCard(gameState: GameState, command: DiscardCardsCommand): CommandResult {
  if (!('instanceIds' in command.params) || command.params.instanceIds.length !== 1) {
    throw new Error('Discard command must be decomposed to single instanceId before applying')
  }

  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const instanceId = command.params.instanceIds[0]
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
 * into individual move-card commands with a single instanceId.
 */
function handleMoveCard(gameState: GameState, command: MoveCardCommand): CommandResult {
  if (!('instanceIds' in command.params) || command.params.instanceIds.length !== 1) {
    throw new Error('Move command must be decomposed to single instanceId before applying')
  }

  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { to, position } = command.params
  const instanceId = command.params.instanceIds[0] as string
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
 * Damages a card by reducing its defense.
 * No-op if the card has no defense property.
 */
function handleDamage(gameState: GameState, command: DamageCommand): CommandResult {
  const run = gameState.game.run!
  const round = run.stats.rounds
  const turn = run.stats.turns
  const { instanceId, amount } = command.params

  // Find the card in any location
  for (const location of locations) {
    const idx = run.cards[location].findIndex((c) => c.instanceId === instanceId)
    if (idx !== -1) {
      const card = run.cards[location][idx]

      // No defense property = no-op
      if (card.defense === undefined) {
        return { game: gameState, event: null }
      }

      const oldDefense = card.defense
      const newDefense = Math.max(0, oldDefense - amount)

      const updatedCard = { ...card, defense: newDefense }
      const updatedLocation = [
        ...run.cards[location].slice(0, idx),
        updatedCard,
        ...run.cards[location].slice(idx + 1),
      ]

      const event: CardDamageEvent = {
        type: 'card-damage',
        cardId: card.id,
        instanceId,
        damage: amount,
        oldDefense,
        newDefense,
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
                [location]: updatedLocation,
              },
            },
          },
        },
        event,
      }
    }
  }

  // Card not found — skip
  return { game: gameState, event: null }
}

/**
 * Declares an attack: emits a card-attack event without changing state.
 * The decomposition layer follows this with a damage command on the target,
 * so abilities can react to the attack itself, separately from the damage
 * it causes.
 */
function handleAttack(gameState: GameState, command: AttackCommand): CommandResult {
  const run = gameState.game.run!
  const { instanceId, targetInstanceId } = command.params

  const cardsInPlay = locations.flatMap((location) => run.cards[location])
  const attacker = cardsInPlay.find((c) => c.instanceId === instanceId)
  const target = cardsInPlay.find((c) => c.instanceId === targetInstanceId)

  // Attacker or target not found, or attacker cannot attack — skip
  if (!attacker || attacker.attack === undefined || !target) {
    return { game: gameState, event: null }
  }

  const event: CardAttackEvent = {
    type: 'card-attack',
    cardId: attacker.id,
    instanceId: attacker.instanceId,
    targetCardId: target.id,
    targetInstanceId: target.instanceId,
    amount: attacker.attack,
    round: run.stats.rounds,
    turn: run.stats.turns,
  }

  return { game: gameState, event }
}

/**
 * Applies a single atomic command to the game state.
 * Returns the updated state and at most one event.
 *
 * Compound commands (multi-card, matching, self-references) must be decomposed
 * by the orchestrator before reaching this function.
 */
export function applyCommand(gameState: GameState, command: Command): CommandResult {
  if (!gameState.game.run) throw new Error('No active run in game state')

  switch (command.type) {
    case 'update-resource':
      return handleUpdateResource(gameState, command)
    case 'add-cards':
      return handleAddCards(gameState, command)
    case 'collect-card':
      return handleCollectCard(gameState, command)
    case 'destroy-card':
      return handleDestroyCard(gameState, command)
    case 'remove-card':
      return handleRemoveCard(gameState, command)
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
      return handleDiscardCard(gameState, command)
    case 'move-card':
      return handleMoveCard(gameState, command)
    case 'play-card':
      return handlePlayCard(gameState, command)
    case 'damage':
      return handleDamage(gameState, command)
    case 'attack':
      return handleAttack(gameState, command)
    case 'retrigger-card':
    case 'card-choice':
      throw new Error(`${command.type} must be handled by the orchestrator, not applyCommand`)
  }
}
