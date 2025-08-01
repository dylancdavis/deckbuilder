/**
 * General utility functions
 */

/**
 * Returns Object.keys with correct type information.
 */
export const keys = <T extends object>(obj: T): (keyof T)[] => {
  return Object.keys(obj) as (keyof T)[]
}

/**
 * Returns Object.values with correct type information.
 */
export const values = <T extends object>(obj: T): T[keyof T][] => {
  return Object.values(obj) as T[keyof T][]
}

/**
 * Returns Object.entries with correct type information.
 */
export const entries = <T extends object>(obj: T): [keyof T, T[keyof T]][] => {
  return Object.entries(obj) as [keyof T, T[keyof T]][]
}

/**
 * Given an array of integers, return the smallest positive integer not in the array.
 */
export function firstMissingNum(numbers: number[]) {
  if (numbers.length === 0) return 1

  const numSet = new Set(numbers)
  const potentialMissing = new Set([1, ...numbers.map(n => n + 1)])

  for (const num of potentialMissing) {
    if (!numSet.has(num)) {
      return num
    }
  }

  return Math.max(...numbers) + 1
}

/**
 * Returns an object containing only those entries whose value satisfies the predicate
 */
export function selectKeysBy<T extends object>(obj: T, predicate: (value: T[keyof T]) => boolean) {
  const result: Partial<T> = {}
  for (const [key, value] of entries(obj)) {
    if (predicate(value)) {
      result[key] = value
    }
  }
  return result
}

/**
 * Transfers the first `amount` items from the first array to the second, returning the updated arrays.
 */
export function moveItems<T>(fromArray: T[], toArray: T[], amount: number) {
  const itemsToMove = fromArray.slice(0, amount)
  const remainingItems = fromArray.slice(amount)
  const updatedToArray = [...toArray, ...itemsToMove]

  return [remainingItems, updatedToArray]
}
