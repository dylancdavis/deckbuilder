import { describe, it, expect } from 'vitest'
import { newDeckName } from '../../utils/collection.js'

describe('newDeckName', () => {
  it('creates "New Deck 1" from empty list', () => {
    expect(newDeckName([])).toBe('New Deck 1')
  })

  it('increments deck name', () => {
    expect(newDeckName(['New Deck 1'])).toBe('New Deck 2')
  })

  it('reuses missing deck number', () => {
    expect(newDeckName(['New Deck 1', 'New Deck 3'])).toBe('New Deck 2')
  })

  it('returns "New Deck 1" with non-new name in list', () => {
    expect(newDeckName(['NewDeck1'])).toBe('New Deck 1')
  })
})