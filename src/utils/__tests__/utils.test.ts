import { describe, it, expect } from 'vitest'

// Utility functions adapted from ClojureScript implementation
export function firstMissingNumber(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b)
  let expected = 1
  
  for (const num of sorted) {
    if (num === expected) {
      expected++
    } else if (num > expected) {
      break
    }
  }
  
  return expected
}

export function selectKeysByValue<T>(obj: Record<string, T>, predicate: (value: T) => boolean): Record<string, T> {
  const result: Record<string, T> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (predicate(value)) {
      result[key] = value
    }
  }
  return result
}

export function moveItems<T>(source: T[], destination: T[], count: number): [T[], T[]] {
  const itemsToMove = source.slice(0, count)
  const remainingSource = source.slice(count)
  const newDestination = [...destination, ...itemsToMove]
  
  return [remainingSource, newDestination]
}

describe('General Utilities', () => {
  describe('firstMissingNumber', () => {
    it('finds first missing number correctly', () => {
      expect(firstMissingNumber([])).toBe(1)
      expect(firstMissingNumber([1, 2, 3])).toBe(4)
      expect(firstMissingNumber([1, 3, 4])).toBe(2)
      expect(firstMissingNumber([1, 2, 3, 5, 7])).toBe(4)
      expect(firstMissingNumber([2, 3, 5])).toBe(1)
    })
  })

  describe('selectKeysByValue', () => {
    it('selects keys by value predicate correctly', () => {
      expect(selectKeysByValue({}, (x: number) => x % 2 === 1)).toEqual({})
      expect(selectKeysByValue({ a: 1, b: 3, c: 5 }, (x: number) => x % 2 === 0)).toEqual({})
      expect(selectKeysByValue({ a: 1, b: 3, c: 5 }, (x: number) => x % 2 === 1)).toEqual({ a: 1, b: 3, c: 5 })
      expect(selectKeysByValue({ a: 1, b: 2, c: 3 }, (x: number) => x % 2 === 1)).toEqual({ a: 1, c: 3 })
    })
  })

  describe('moveItems', () => {
    it('moves items between arrays correctly', () => {
      expect(moveItems([1, 2, 3, 4], [5, 6, 7, 8], 2)).toEqual([[3, 4], [5, 6, 7, 8, 1, 2]])
      expect(moveItems([1, 2, 3, 4], [5, 6, 7, 8], 4)).toEqual([[], [5, 6, 7, 8, 1, 2, 3, 4]])
      expect(moveItems([1, 2, 3, 4], [5, 6, 7, 8], 0)).toEqual([[1, 2, 3, 4], [5, 6, 7, 8]])
      expect(moveItems([1, 2, 3, 4], [], 4)).toEqual([[], [1, 2, 3, 4]])
    })
  })
})