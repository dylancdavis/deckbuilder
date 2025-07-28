import { describe, it, expect } from 'vitest'
import { firstMissingNum, selectKeysBy, moveItems } from '../../utils/utils.js'

describe('firstMissingNum', () => {
  it('returns 1 when given empty list', () => {
    expect(firstMissingNum([])).toBe(1)
  })

  it('returns next number for a standard sequence', () => {
    expect(firstMissingNum([1, 2, 3])).toBe(4)
  })

  it('returns a skipped number in the middle of the sequence', () => {
    expect(firstMissingNum([1, 3, 4])).toBe(2)
  })

  it('returns the first missing number when multiple are missing', () => {
    expect(firstMissingNum([1, 2, 3, 5, 7])).toBe(4)
  })

  it('returns 1 if it\'s missing from the sequence', () => {
    expect(firstMissingNum([2, 3, 5])).toBe(1)
  })
})

describe('selectKeysBy', () => {
  it('returns an empty object in base case', () => {
    expect(selectKeysBy({}, n => n % 2 === 1)).toEqual({})
  })

  it('returns empty object when no values match', () => {
    expect(selectKeysBy({ a: 1, b: 3, c: 5 }, n => n % 2 === 0)).toEqual({})
  })

  it('returns the same object when all values match', () => {
    expect(selectKeysBy({ a: 1, b: 3, c: 5 }, n => n % 2 === 1)).toEqual({ a: 1, b: 3, c: 5 })
  })

  it('filters to only keys according to predicate', () => {
    expect(selectKeysBy({ a: 1, b: 2, c: 3 }, n => n % 2 === 1)).toEqual({ a: 1, c: 3 })
  })
})

describe('moveItems', () => {
  it('moves 2 items from first to second', () => {
    expect(moveItems([1, 2, 3, 4], [5, 6, 7, 8], 2)).toEqual([[3, 4], [5, 6, 7, 8, 1, 2]])
  })

  it('moves all items from first to second', () => {
    expect(moveItems([1, 2, 3, 4], [5, 6, 7, 8], 4)).toEqual([[], [5, 6, 7, 8, 1, 2, 3, 4]])
  })

  it('moves 0 items from first to second', () => {
    expect(moveItems([1, 2, 3, 4], [5, 6, 7, 8], 0)).toEqual([[1, 2, 3, 4], [5, 6, 7, 8]])
  })

  it('moves items into an empty array', () => {
    expect(moveItems([1, 2, 3, 4], [], 4)).toEqual([[], [1, 2, 3, 4]])
  })
})