import { describe, it, expect } from 'vitest'
import { add, makeCounter, sub, total, missingCounts, mergeCounters } from '../../utils/counter.js'

describe('Counter', () => {
  describe('add', () => {
    it('adds to empty counter', () => {
      expect(add({}, 'a')).toEqual({ a: 1 })
    })

    it('adds to existing key', () => {
      expect(add({ a: 1 }, 'a')).toEqual({ a: 2 })
    })

    it('adds new key to existing counter', () => {
      expect(add({ a: 1 }, 'b')).toEqual({ a: 1, b: 1 })
    })
  })

  describe('makeCounter', () => {
    it('creates counter from empty sequence', () => {
      expect(makeCounter([])).toEqual({})
    })

    it('creates counter from sequence with duplicates', () => {
      expect(makeCounter(['a', 'b', 'a'])).toEqual({ a: 2, b: 1 })
    })

    it('creates counter from sequence with unique elements', () => {
      expect(makeCounter(['a', 'b', 'c'])).toEqual({ a: 1, b: 1, c: 1 })
    })
  })

  describe('sub', () => {
    it('subtracts to zero removes key', () => {
      expect(sub({ a: 1 }, 'a')).toEqual({})
    })

    it('subtracts from existing key', () => {
      expect(sub({ a: 2 }, 'a')).toEqual({ a: 1 })
    })

    it('subtracts non-existing key does nothing', () => {
      expect(sub({ a: 2 }, 'b')).toEqual({ a: 2 })
    })

    it('subtracts more than available removes key', () => {
      expect(sub({ a: 2 }, 'a', 3)).toEqual({})
    })
  })

  describe('total', () => {
    it('totals empty counter', () => {
      expect(total({})).toBe(0)
    })

    it('totals one key', () => {
      expect(total({ a: 1 })).toBe(1)
    })

    it('totals multiple keys', () => {
      expect(total({ a: 1, b: 2, c: 3 })).toBe(6)
    })
  })

  describe('missingCounts', () => {
    it('correctly subtracts empty counter', () => {
      expect(missingCounts({ a: 1 }, {})).toEqual({ a: 1 })
    })

    it('correctly returns empty counter when counters are equal', () => {
      expect(missingCounts({ a: 1 }, { a: 1 })).toEqual({})
    })

    it('correctly subtracts a single key', () => {
      expect(missingCounts({ a: 3 }, { a: 1 })).toEqual({ a: 2 })
    })

    it('returns empty counter when second is greater', () => {
      expect(missingCounts({ a: 1 }, { a: 3 })).toEqual({})
    })

    it('ignores keys not in first counter', () => {
      expect(missingCounts({ a: 3 }, { b: 3 })).toEqual({ a: 3 })
    })

    it('counts multiple keys correctly', () => {
      expect(missingCounts({ a: 3, b: 3, c: 3 }, { a: 1, b: 5, d: 3 })).toEqual({ a: 2, c: 3 })
    })
  })

  describe('mergeCounters', () => {
    it('merges two counters', () => {
      expect(mergeCounters({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 })
    })

    it('merges two counters with same key', () => {
      expect(mergeCounters({ a: 1 }, { a: 2 })).toEqual({ a: 3 })
    })
  })
})
