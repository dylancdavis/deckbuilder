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
  const potentialMissing = new Set([1, ...numbers.map((n) => n + 1)])

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
 * Transfers the item at `index` from `fromArray` to `toArray`, returning the updated arrays.
 * If `toIndex` is provided, inserts at that position; otherwise appends to the end.
 */
export function moveItem<T>(fromArray: T[], toArray: T[], index: number, toIndex?: number) {
  const itemToMove = fromArray[index]
  const remainingItems = [...fromArray.slice(0, index), ...fromArray.slice(index + 1)]

  let updatedToArray: T[]
  if (toIndex !== undefined) {
    updatedToArray = [...toArray.slice(0, toIndex), itemToMove, ...toArray.slice(toIndex)]
  } else {
    updatedToArray = [...toArray, itemToMove]
  }

  return [remainingItems, updatedToArray]
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

/**
 * Pushes an item onto an array `n` times.
 */
export function push<T>(array: T[], item: T, n: number = 1) {
  for (let i = 0; i < n; i++) {
    array.push(item)
  }
}

/**
 * Returns a new shuffled copy of an array using Fisher-Yates.
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Returns an array of `n` random items from an array at random
 */
export function selectRandom<T>(arr: T[], n?: number) {
  return shuffle(arr).slice(0, n)
}

/**
 * Places `incoming` items into `existing` array at the given position.
 * 'top' prepends, 'bottom' / undefined appends, 'shuffle' merges and shuffles.
 */
export function placeItems<T>(
  existing: T[],
  incoming: T[],
  position?: 'top' | 'bottom' | 'shuffle',
): T[] {
  if (position === 'top') return [...incoming, ...existing]
  if (position === 'shuffle') return shuffle([...existing, ...incoming])
  return [...existing, ...incoming]
}
