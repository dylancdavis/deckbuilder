import { describe, it, expect } from 'vitest'
import { describeEvent, buildLogRows } from '../../utils/event-log.js'
import type { Event } from '../../utils/event.js'
import { Resource } from '../../utils/resource.js'

const base = { round: 1, turn: 2 }

describe('describeEvent', () => {
  it('describes card-draw with the card name', () => {
    const event: Event = { ...base, type: 'card-draw', cardId: 'score', instanceId: 'i1' }
    expect(describeEvent(event)).toBe('Drew Score')
  })

  it('describes card-play', () => {
    const event: Event = { ...base, type: 'card-play', cardId: 'striker', instanceId: 'i1' }
    expect(describeEvent(event)).toBe('Played Striker')
  })

  it('describes card-discard with a readable location', () => {
    const event: Event = {
      ...base,
      type: 'card-discard',
      cardId: 'score',
      instanceId: 'i1',
      fromLocation: 'hand',
    }
    expect(describeEvent(event)).toBe('Discarded Score from hand')
  })

  it('describes card-move with readable locations', () => {
    const event: Event = {
      ...base,
      type: 'card-move',
      cardId: 'score',
      instanceId: 'i1',
      fromLocation: 'hand',
      toLocation: 'board',
    }
    expect(describeEvent(event)).toBe('Moved Score from hand to board')
  })

  it('describes card-attack with attacker, target, and amount', () => {
    const event: Event = {
      ...base,
      type: 'card-attack',
      cardId: 'striker',
      instanceId: 'i1',
      targetCardId: 'target-dummy',
      targetInstanceId: 'i2',
      amount: 2,
    }
    expect(describeEvent(event)).toBe('Striker attacked Target Dummy for 2')
  })

  it('describes card-damage with old and new defense', () => {
    const event: Event = {
      ...base,
      type: 'card-damage',
      cardId: 'target-dummy',
      instanceId: 'i2',
      damage: 2,
      oldDefense: 3,
      newDefense: 1,
    }
    expect(describeEvent(event)).toBe('Target Dummy took 2 damage (3 → 1)')
  })

  it('describes resource-change with signed delta', () => {
    const gain: Event = {
      ...base,
      type: 'resource-change',
      resource: Resource.POINTS,
      oldValue: 3,
      newValue: 5,
      delta: 2,
    }
    expect(describeEvent(gain)).toBe('Points +2 (3 → 5)')

    const loss: Event = {
      ...base,
      type: 'resource-change',
      resource: Resource.POINTS,
      oldValue: 5,
      newValue: 3,
      delta: -2,
    }
    expect(describeEvent(loss)).toBe('Points -2 (5 → 3)')
  })

  it('describes turn and round markers using the event round/turn', () => {
    expect(describeEvent({ ...base, type: 'turn-start' })).toBe('Turn 2 started')
    expect(describeEvent({ ...base, type: 'turn-end' })).toBe('Turn 2 ended')
    expect(describeEvent({ ...base, type: 'round-start' })).toBe('Round 1 started')
    expect(describeEvent({ ...base, type: 'round-end' })).toBe('Round 1 ended')
    expect(describeEvent({ ...base, type: 'run-start' })).toBe('Run started')
    expect(describeEvent({ ...base, type: 'run-end' })).toBe('Run ended')
    expect(describeEvent({ ...base, type: 'deck-refresh' })).toBe('Deck refreshed')
  })

  it('describes remaining card events', () => {
    expect(describeEvent({ ...base, type: 'card-collect', cardId: 'score' })).toBe(
      'Collected Score',
    )
    expect(describeEvent({ ...base, type: 'card-destroy', cardId: 'score' })).toBe(
      'Destroyed Score',
    )
    expect(
      describeEvent({
        ...base,
        type: 'card-remove',
        cardId: 'score',
        instanceId: 'i1',
        fromLocation: 'discardPile',
      }),
    ).toBe('Removed Score from discard pile')
    expect(
      describeEvent({
        ...base,
        type: 'card-add',
        cardId: 'score',
        instanceId: 'i1',
        toLocation: 'drawPile',
      }),
    ).toBe('Added Score to draw pile')
    expect(
      describeEvent({
        ...base,
        type: 'card-activate',
        cardId: 'striker',
        instanceId: 'i1',
        abilityIndex: 0,
      }),
    ).toBe('Activated Striker')
  })
})

describe('buildLogRows', () => {
  const draw = (round: number, turn: number, cardId: 'score' | 'striker' = 'score'): Event => ({
    type: 'card-draw',
    cardId,
    instanceId: `${cardId}-${round}-${turn}`,
    round,
    turn,
  })

  it('produces one flat row per event, in order, marking round/turn-start rows', () => {
    const events: Event[] = [
      { type: 'run-start', round: 0, turn: 0 },
      { type: 'round-start', round: 1, turn: 0 },
      { type: 'turn-start', round: 1, turn: 1 },
      draw(1, 1),
      { type: 'turn-end', round: 1, turn: 1 },
    ]

    const rows = buildLogRows(events)
    expect(rows).toEqual([
      { kind: 'round-start', round: 0, turn: 0, text: 'Run started', count: 1 },
      { kind: 'round-start', round: 1, turn: 0, text: 'Round 1 started', count: 1 },
      { kind: 'turn-start', round: 1, turn: 1, text: 'Turn 1 started', count: 1 },
      { kind: 'event', round: 1, turn: 1, text: 'Drew Score', count: 1 },
      { kind: 'event', round: 1, turn: 1, text: 'Turn 1 ended', count: 1 },
    ])
  })

  it('condenses consecutive identical event rows into one row with a count', () => {
    const events: Event[] = [
      draw(1, 1),
      draw(1, 1),
      draw(1, 1),
      draw(1, 1, 'striker'),
      draw(1, 1),
    ]

    expect(buildLogRows(events).map((r) => [r.text, r.count])).toEqual([
      ['Drew Score', 3],
      ['Drew Striker', 1],
      ['Drew Score', 1],
    ])
  })

  it('does not condense identical events across a turn boundary', () => {
    const events: Event[] = [draw(1, 1), { type: 'turn-start', round: 1, turn: 2 }, draw(1, 2)]

    expect(buildLogRows(events).map((r) => [r.text, r.count])).toEqual([
      ['Drew Score', 1],
      ['Turn 2 started', 1],
      ['Drew Score', 1],
    ])
  })
})
