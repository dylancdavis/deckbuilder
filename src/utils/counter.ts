/**
 * Counter utility functions for managing counts of items
 */

type Counter = Record<string, number>

/**
 * Adds `n` to the value of `key` in `counter`. If `key` doesn't exist, it is added with value `n`.
 */
export function add(counter: Counter, key: keyof Counter, n = 1) {
  return {
    ...counter,
    [key]: (counter[key] || 0) + n
  }
}

/**
 * Creates a counter from a sequence of items.
 */
export function makeCounter(items: Array<keyof Counter>): Counter {
  return items.reduce((acc, item) => add(acc, item), {})
}

/**
 * Subtracts `n` from the count of `key` in `counter`. If the count reaches 0, the key is removed.
 */
export function sub(counter: Counter, key: keyof Counter, n = 1) {
  const currentCount = counter[key] || 0
  if (currentCount <= n) {
    const { [key]: _, ...rest } = counter
    return rest
  }
  return {
    ...counter,
    [key]: currentCount - n
  }
}

/**
 * Returns the total of all count values in `counter`.
 */
export function total(counter: Counter) {
  return Object.values(counter).reduce((sum, count) => sum + count, 0)
}

/**
 * Merges two counters by adding their values together.
 */
export function mergeCounters(counter1: Counter, counter2: Counter) {
  const result = { ...counter1 }
  for (const [key, value] of Object.entries(counter2)) {
    result[key] = (result[key] || 0) + value
  }
  return result
}

/**
 * Returns a counter tracking for each key the value within `counter1` minus the value within `counter2`,
 * with non-positive values omitted.
 */
export function missingCounts(counter1: Counter, counter2: Counter): Counter {
  const result: Counter = {}
  for (const [key, value1] of Object.entries(counter1)) {
    const value2 = counter2[key] || 0
    const diff = value1 - value2
    if (diff > 0) {
      result[key] = diff
    }
  }
  return result
}
