/**
 * Counter utility functions for managing counts of items
 */

import { entries, push, values } from './utils'

export type Counter<T extends string = string> = Partial<Record<T, number>>

/**
 * Adds `n` to the value of `key` in `counter`. If `key` doesn't exist, it is added with value `n`.
 */
export function add<T extends string>(counter: Counter<T>, key: T, n = 1): Counter<T> {
  return {
    ...counter,
    [key]: (counter[key] || 0) + n,
  }
}

/**
 * Creates a counter from a sequence of items.
 */
export function makeCounter<T extends string>(items: Array<T>): Counter<T> {
  return items.reduce((acc, item) => add(acc, item), {} as Counter<T>)
}

/**
 * Subtracts `n` from the count of `key` in `counter`. If the count reaches 0, the key is removed.
 */
export function sub<T extends string>(counter: Counter<T>, key: T, n = 1): Counter<T> {
  const currentCount = counter[key] || 0
  if (currentCount <= n) {
    const { [key]: _, ...rest } = counter
    return rest as Counter<T>
  }
  return {
    ...counter,
    [key]: currentCount - n,
  }
}

/**
 * Returns the total of all count values in `counter`.
 */
export function total<T extends string>(counter: Counter<T>) {
  return values(counter).reduce((sum: number, count) => sum + (count ?? 0), 0)
}

/**
 * Converts a counter to an array, where each key is repeated according to its count.
 * For example, { a: 2, b: 1 } becomes ['a', 'a', 'b'].
 */
export function toArray<T extends string>(counter: Counter<T>): T[] {
  const result: T[] = []
  for (const [key, count] of entries(counter)) {
    push(result, key, count ?? 0)
  }
  return result
}

/**
 * Merges two counters by adding their values together.
 */
export function mergeCounters<T extends string>(
  counter1: Counter<T>,
  counter2: Counter<T>,
): Counter<T> {
  const result = { ...counter1 }
  for (const [key, value] of entries(counter2)) {
    result[key] = (result[key] ?? 0) + (value ?? 0)
  }
  return result
}

/**
 * Subtracts counter2 from counter1, removing keys that reach 0 or below.
 */
export function subtractCounters<T extends string>(
  counter1: Counter<T>,
  counter2: Counter<T>,
): Counter<T> {
  const result = { ...counter1 }
  for (const [key, value] of entries(counter2)) {
    const newValue = (result[key] ?? 0) - (value ?? 0)
    if (newValue <= 0) {
      delete result[key]
    } else {
      result[key] = newValue
    }
  }
  return result
}

/**
 * Returns a counter tracking for each key the value within `counter1` minus the value within `counter2`,
 * with non-positive values omitted.
 */
export function missingCounts<T extends string>(c1: Counter<T>, c2: Counter<T>) {
  const result = {} as Counter<T>
  for (const [key, value1] of entries(c1)) {
    const value2 = c2[key] ?? 0
    const diff = (value1 ?? 0) - value2
    if (diff > 0) {
      result[key] = diff
    }
  }
  return result
}
