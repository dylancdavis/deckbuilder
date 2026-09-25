import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useGameStore } from '../../stores/game.js'
import { COLLECTION_STORAGE_KEY } from '../../utils/persistence.js'

function freshStore() {
  setActivePinia(createPinia())
  return useGameStore()
}

describe('collection persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts from the default collection when nothing is saved', () => {
    const store = freshStore()
    expect(store.collection.decks.startingDeck.name).toBe('Starter Deck')
  })

  it('does not carry deck edits into a fresh default collection', () => {
    const first = freshStore()
    first.addCardToDeck('startingDeck', 'score')
    localStorage.clear()

    const second = freshStore()
    expect(second.collection.decks.startingDeck.cards).toEqual({})
  })

  it('restores decks saved by a previous session', async () => {
    const first = freshStore()
    const key = first.addDeck('Saved Deck')
    first.addCardToDeck(key, 'score')
    first.setDeckRulesCard(key, 'starter-rules')
    await nextTick()

    const second = freshStore()
    expect(second.collection.decks[key]).toEqual({
      name: 'Saved Deck',
      rulesCardId: 'starter-rules',
      cards: { score: 1 },
    })
  })

  it('does not persist the run', async () => {
    const first = freshStore()
    first.selectDeck('startingDeck')
    first.startRun()
    await nextTick()

    const second = freshStore()
    expect(second.run).toBeNull()
  })

  it('falls back to the default collection when saved data is invalid', () => {
    localStorage.setItem(COLLECTION_STORAGE_KEY, '{"cards":{"no-such-card":1},"decks":{}}')
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const store = freshStore()
    expect(store.collection.decks.startingDeck.name).toBe('Starter Deck')
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })
})
