import { describe, it, expect } from 'vitest'

// Counter utility functions adapted from ClojureScript implementation
export function addToCounter(counter: Record<string, number>, key: string, amount: number = 1): Record<string, number> {
  return {
    ...counter,
    [key]: (counter[key] || 0) + amount
  }
}

export function makeCounter(items: string[]): Record<string, number> {
  const counter: Record<string, number> = {}
  for (const item of items) {
    counter[item] = (counter[item] || 0) + 1
  }
  return counter
}

export function subtractFromCounter(counter: Record<string, number>, key: string, amount: number = 1): Record<string, number> {
  const newValue = (counter[key] || 0) - amount
  if (newValue <= 0) {
    const result = { ...counter }
    delete result[key]
    return result
  }
  return {
    ...counter,
    [key]: newValue
  }
}

export function totalCounter(counter: Record<string, number>): number {
  return Object.values(counter).reduce((sum, count) => sum + count, 0)
}

export function missingCounts(needed: Record<string, number>, available: Record<string, number>): Record<string, number> {
  const missing: Record<string, number> = {}
  for (const [key, neededCount] of Object.entries(needed)) {
    const availableCount = available[key] || 0
    const deficit = neededCount - availableCount
    if (deficit > 0) {
      missing[key] = deficit
    }
  }
  return missing
}

export function mergeCounters(counter1: Record<string, number>, counter2: Record<string, number>): Record<string, number> {
  const result = { ...counter1 }
  for (const [key, count] of Object.entries(counter2)) {
    result[key] = (result[key] || 0) + count
  }
  return result
}

describe('Counter Utilities', () => {
  describe('addToCounter', () => {
    it('adds correctly', () => {
      expect(addToCounter({}, 'a')).toEqual({ a: 1 })
      expect(addToCounter({ a: 1 }, 'a')).toEqual({ a: 2 })
      expect(addToCounter({ a: 1 }, 'b')).toEqual({ a: 1, b: 1 })
    })
  })

  describe('makeCounter', () => {
    it('initializes correctly', () => {
      expect(makeCounter([])).toEqual({})
      expect(makeCounter(['a', 'b', 'a'])).toEqual({ a: 2, b: 1 })
      expect(makeCounter(['a', 'b', 'c'])).toEqual({ a: 1, b: 1, c: 1 })
    })
  })

  describe('subtractFromCounter', () => {
    it('subtracts correctly', () => {
      expect(subtractFromCounter({ a: 1 }, 'a')).toEqual({})
      expect(subtractFromCounter({ a: 2 }, 'a')).toEqual({ a: 1 })
      expect(subtractFromCounter({ a: 2 }, 'b')).toEqual({ a: 2 })
      expect(subtractFromCounter({ a: 2 }, 'a', 3)).toEqual({})
    })
  })

  describe('totalCounter', () => {
    it('totals correctly', () => {
      expect(totalCounter({})).toBe(0)
      expect(totalCounter({ a: 1 })).toBe(1)
      expect(totalCounter({ a: 1, b: 2, c: 3 })).toBe(6)
    })
  })

  describe('missingCounts', () => {
    it('counts missing correctly', () => {
      expect(missingCounts({ a: 1 }, {})).toEqual({ a: 1 })
      expect(missingCounts({ a: 1 }, { a: 1 })).toEqual({})
      expect(missingCounts({ a: 3 }, { a: 1 })).toEqual({ a: 2 })
      expect(missingCounts({ a: 1 }, { a: 3 })).toEqual({})
      expect(missingCounts({ a: 3 }, { b: 3 })).toEqual({ a: 3 })
      expect(missingCounts({ a: 3, b: 3, c: 3 }, { a: 1, b: 5, d: 3 })).toEqual({ a: 2, c: 3 })
    })
  })

  describe('mergeCounters', () => {
    it('merges correctly', () => {
      expect(mergeCounters({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 })
      expect(mergeCounters({ a: 1 }, { a: 2 })).toEqual({ a: 3 })
    })
  })
})