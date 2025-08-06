/**
 * Counter utility functions for managing counts of items
 */

import { entries, values } from './utils'

export type Counter<T extends string = string> = Record<T, number>

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
export function total<T extends string>(counter: Counter<T>): number {
  return values(counter).reduce((sum, count) => sum + count, 0)
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
    result[key] = (result[key] || 0) + value
  }
  return result
}

/**
 * Returns a counter tracking for each key the value within `counter1` minus the value within `counter2`,
 * with non-positive values omitted.
 */
export function missingCounts<T extends string>(
  counter1: Counter<T>,
  counter2: Counter<T>,
): Counter<T> {
  const result: Counter<T> = {} as Counter<T>
  for (const [key, value1] of entries(counter1)) {
    const value2 = counter2[key] || 0
    const diff = value1 - value2
    if (diff > 0) {
      result[key] = diff
    }
  }
  return result
}
