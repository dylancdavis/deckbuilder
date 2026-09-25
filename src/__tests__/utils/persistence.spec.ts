import { describe, it, expect, beforeEach } from 'vitest'
import {
  COLLECTION_STORAGE_KEY,
  loadCollection,
  parseCollection,
  saveCollection,
} from '../../utils/persistence.js'
import type { Collection } from '../../utils/collection.js'

const collection: Collection = {
  cards: { score: 3, 'starter-rules': 1 },
  decks: {
    a: { name: 'Deck A', rulesCardId: 'starter-rules', cards: { score: 2 } },
    b: { name: 'Deck B', rulesCardId: null, cards: {} },
  },
}

describe('parseCollection', () => {
  it('parses a serialized collection', () => {
    expect(parseCollection(JSON.stringify(collection))).toEqual(collection)
  })

  it('throws on an unknown collection card id', () => {
    const json = JSON.stringify({ cards: { 'no-such-card': 1 }, decks: {} })
    expect(() => parseCollection(json)).toThrow('no-such-card')
  })

  it('throws on an unknown deck card id', () => {
    const json = JSON.stringify({
      cards: {},
      decks: { a: { name: 'A', rulesCardId: null, cards: { 'no-such-card': 1 } } },
    })
    expect(() => parseCollection(json)).toThrow('no-such-card')
  })

  it('throws on an unknown rules card id', () => {
    const json = JSON.stringify({
      cards: {},
      decks: { a: { name: 'A', rulesCardId: 'no-such-rules', cards: {} } },
    })
    expect(() => parseCollection(json)).toThrow('no-such-rules')
  })

  it('throws on a playable card used as a rules card', () => {
    const json = JSON.stringify({
      cards: {},
      decks: { a: { name: 'A', rulesCardId: 'score', cards: {} } },
    })
    expect(() => parseCollection(json)).toThrow('score')
  })
})

describe('loadCollection', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing is saved', () => {
    expect(loadCollection(localStorage)).toBeNull()
  })

  it('returns the saved collection', () => {
    saveCollection(localStorage, collection)
    expect(loadCollection(localStorage)).toEqual(collection)
  })

  it('reads from the collection storage key', () => {
    localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(collection))
    expect(loadCollection(localStorage)).toEqual(collection)
  })
})
