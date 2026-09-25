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
    expect(store.collection).toEqual({
      cards: { 'starter-rules': 1 },
      decks: {
        startingDeck: { name: 'Starter Deck', rulesCardId: 'starter-rules', cards: {} },
      },
    })
  })

  it('loads the test save', () => {
    const store = freshStore()
    store.selectDeck('startingDeck')
    store.loadPresetSave('test')
    expect(store.collection.decks.attackTestDeck.name).toBe('Attack Test Deck')
    expect(store.collection.cards.score).toBe(4)
    expect(store.selectedDeckKey).toBeNull()
  })

  it('does not carry deck edits into a preset save', () => {
    const store = freshStore()
    store.loadPresetSave('test')
    store.addCardToDeck('startingDeck', 'score')
    store.loadPresetSave('test')
    expect(store.collection.decks.startingDeck.cards).toEqual({})
  })

  it('sets the quantity of a card in the collection', () => {
    const store = freshStore()
    store.setCardQuantity('score', 3)
    expect(store.collection.cards.score).toBe(3)
    store.setCardQuantity('score', 0)
    expect(store.collection.cards).not.toHaveProperty('score')
  })

  it('rejects a negative or fractional card quantity', () => {
    const store = freshStore()
    expect(() => store.setCardQuantity('score', -1)).toThrow()
    expect(() => store.setCardQuantity('score', 1.5)).toThrow()
  })

  it('restores decks saved by a previous session', async () => {
    const first = freshStore()
    first.setCardQuantity('score', 1)
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

  it('imports a save, replacing the collection', () => {
    const source = freshStore()
    const key = source.addDeck('Imported Deck')
    const save = source.exportSave()

    const target = freshStore()
    target.selectDeck('startingDeck')
    target.importSave(save)
    expect(target.collection.decks[key].name).toBe('Imported Deck')
    expect(target.selectedDeckKey).toBeNull()
  })

  it('rejects an invalid save without changing the collection', () => {
    const store = freshStore()
    const before = store.exportSave()
    expect(() => store.importSave('{"cards":{"no-such-card":1},"decks":{}}')).toThrow()
    expect(store.exportSave()).toBe(before)
  })
})
