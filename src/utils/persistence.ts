/**
 * Saving and loading player data. Only the collection (cards and decks) is
 * persisted; runs are discarded between sessions.
 */

import { cardIds, rulesCardIds } from './cards.ts'
import type { Collection } from './collection.ts'
import { keys, values } from './utils.ts'

export const COLLECTION_STORAGE_KEY = 'deckbuilder:collection'

function assertCardIds(ids: string[], known: string[]) {
  for (const id of ids) {
    if (!known.includes(id)) throw new Error(`Unknown card id in saved collection: ${id}`)
  }
}

/**
 * Parses a serialized collection, throwing if it references cards that no longer exist.
 */
export function parseCollection(json: string): Collection {
  const collection: Collection = JSON.parse(json)

  assertCardIds(keys(collection.cards), cardIds)
  for (const deck of values(collection.decks)) {
    assertCardIds(keys(deck.cards), cardIds)
    if (deck.rulesCardId) assertCardIds([deck.rulesCardId], rulesCardIds)
  }

  return collection
}

/**
 * Returns the saved collection, or null if none is saved. Throws if the saved data is invalid.
 */
export function loadCollection(storage: Storage): Collection | null {
  const json = storage.getItem(COLLECTION_STORAGE_KEY)
  return json === null ? null : parseCollection(json)
}

export function serializeCollection(collection: Collection) {
  return JSON.stringify(collection, null, 2)
}

export function saveCollection(storage: Storage, collection: Collection) {
  storage.setItem(COLLECTION_STORAGE_KEY, serializeCollection(collection))
}
