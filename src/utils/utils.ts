/**
 * General utility functions
 */

/**
 * Given an array of integers, return the smallest positive integer not in the array.
 */
export function firstMissingNum(numbers) {
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
export function selectKeysBy(obj, predicate) {
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    if (predicate(value)) {
      result[key] = value
    }
  }
  return result
}

/**
 * Transfers the first `amount` items from the first array to the second, returning the updated arrays.
 */
export function moveItems(fromArray, toArray, amount) {
  const itemsToMove = fromArray.slice(0, amount)
  const remainingItems = fromArray.slice(amount)
  const updatedToArray = [...toArray, ...itemsToMove]

  return [remainingItems, updatedToArray]
}
