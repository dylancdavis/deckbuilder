import type { Event } from './event'
import type { CardID } from './cards'
import type { Location } from './run'
import { cards } from './cards'

const locationLabels: Record<Location, string> = {
  drawPile: 'draw pile',
  hand: 'hand',
  board: 'board',
  discardPile: 'discard pile',
}

function cardName(cardId: CardID): string {
  return cards[cardId]?.name ?? cardId
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Human-readable, one-line description of a run event for the event log.
 */
export function describeEvent(event: Event): string {
  switch (event.type) {
    case 'card-draw':
      return `Drew ${cardName(event.cardId)}`
    case 'card-play':
      return `Played ${cardName(event.cardId)}`
    case 'card-discard':
      return `Discarded ${cardName(event.cardId)} from ${locationLabels[event.fromLocation]}`
    case 'card-collect':
      return `Collected ${cardName(event.cardId)}`
    case 'card-remove':
      return `Removed ${cardName(event.cardId)} from ${locationLabels[event.fromLocation]}`
    case 'card-add':
      return `Added ${cardName(event.cardId)} to ${locationLabels[event.toLocation]}`
    case 'card-destroy':
      return `Destroyed ${cardName(event.cardId)}`
    case 'card-move':
      return `Moved ${cardName(event.cardId)} from ${locationLabels[event.fromLocation]} to ${locationLabels[event.toLocation]}`
    case 'card-activate':
      return `Activated ${cardName(event.cardId)}`
    case 'card-damage':
      return `${cardName(event.cardId)} took ${event.damage} damage (${event.oldDefense} → ${event.newDefense})`
    case 'card-attack':
      return `${cardName(event.cardId)} attacked ${cardName(event.targetCardId)} for ${event.amount}`
    case 'turn-start':
      return `Turn ${event.turn} started`
    case 'turn-end':
      return `Turn ${event.turn} ended`
    case 'round-start':
      return `Round ${event.round} started`
    case 'round-end':
      return `Round ${event.round} ended`
    case 'run-start':
      return 'Run started'
    case 'run-end':
      return 'Run ended'
    case 'deck-refresh':
      return 'Deck refreshed'
    case 'resource-change': {
      const sign = event.delta >= 0 ? '+' : ''
      return `${capitalize(event.resource)} ${sign}${event.delta} (${event.oldValue} → ${event.newValue})`
    }
    case 'effect-replace': {
      const subject =
        event.cardId !== undefined
          ? `${event.originalEffect.type} on ${cardName(event.cardId)}`
          : event.originalEffect.type
      return event.newEffects.length === 0
        ? `${cardName(event.sourceCardId)} prevented ${subject}`
        : `${cardName(event.sourceCardId)} replaced ${subject} with ${event.newEffects.map((e) => e.type).join(', ')}`
    }
  }
}

/**
 * One line of the event log. Rows stay in event order (a flat list, not a
 * hierarchy); `kind` marks the round/turn-start rows that carry collapse
 * toggles in the UI. Consecutive identical event rows within the same
 * round/turn are condensed into one row with a count.
 */
export type LogRow = {
  kind: 'round-start' | 'turn-start' | 'event'
  round: number
  turn: number
  text: string
  count: number
}

export function buildLogRows(events: Event[]): LogRow[] {
  const rows: LogRow[] = []

  for (const event of events) {
    // run-start is the round 0 equivalent of round-start: everything before
    // the first real round-start is setup stamped R0, and this row is its
    // collapse header.
    const kind =
      event.type === 'round-start' || event.type === 'run-start'
        ? 'round-start'
        : event.type === 'turn-start'
          ? 'turn-start'
          : 'event'
    const text = describeEvent(event)
    const last = rows[rows.length - 1]

    if (
      kind === 'event' &&
      last &&
      last.kind === 'event' &&
      last.text === text &&
      last.round === event.round &&
      last.turn === event.turn
    ) {
      last.count++
      continue
    }

    rows.push({ kind, round: event.round, turn: event.turn, text, count: 1 })
  }

  return rows
}
