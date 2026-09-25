import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { mount } from '@vue/test-utils'
import CollectionView from '../../components/CollectionView.vue'
import { useGameStore } from '../../stores/game'
import { cardCategory, cards, type CardCategory } from '../../utils/cards'
import { keys } from '../../utils/utils'

describe('CollectionView filters', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    useGameStore().loadPresetSave('test')
  })

  function mountCollection() {
    return mount(CollectionView, { global: { plugins: [pinia] } })
  }

  type Wrapper = ReturnType<typeof mountCollection>

  function filterButton(wrapper: Wrapper, label: string) {
    const found = wrapper
      .findAll('.collection-filter')
      .find((b) => b.text().startsWith(`${label} (`))
    if (!found) throw new Error(`No filter labelled ${label}`)
    return found
  }

  function shownCardNames(wrapper: Wrapper) {
    return wrapper
      .findAll('.card-collection-item .card-name')
      .map((name) => name.text())
      .sort()
  }

  function collectionNames(...categories: CardCategory[]) {
    return keys(useGameStore().collection.cards)
      .map((id) => cards[id])
      .filter((card) => categories.includes(cardCategory(card)))
      .map((card) => card.name)
      .sort()
  }

  it('has every category in the test collection', () => {
    expect(collectionNames('rules')).not.toEqual([])
    expect(collectionNames('entity')).not.toEqual([])
    expect(collectionNames('aura')).not.toEqual([])
    expect(collectionNames('action')).not.toEqual([])
  })

  it('shows every card with all filters on by default', () => {
    const wrapper = mountCollection()
    for (const label of ['Rules', 'Entities', 'Auras', 'Actions']) {
      expect(filterButton(wrapper, label).classes()).toContain('active')
    }
    expect(shownCardNames(wrapper)).toEqual(collectionNames('rules', 'entity', 'aura', 'action'))
  })

  it('labels each filter with the number of unique cards in that category', () => {
    const wrapper = mountCollection()
    expect(filterButton(wrapper, 'Rules').text()).toBe(
      `Rules (x${collectionNames('rules').length})`,
    )
    expect(filterButton(wrapper, 'Entities').text()).toBe(
      `Entities (x${collectionNames('entity').length})`,
    )
    expect(filterButton(wrapper, 'Auras').text()).toBe(`Auras (x${collectionNames('aura').length})`)
    expect(filterButton(wrapper, 'Actions').text()).toBe(
      `Actions (x${collectionNames('action').length})`,
    )
  })

  it('hides rules cards when the rules filter is toggled off', async () => {
    const wrapper = mountCollection()
    await filterButton(wrapper, 'Rules').trigger('click')
    expect(filterButton(wrapper, 'Rules').classes()).not.toContain('active')
    expect(shownCardNames(wrapper)).toEqual(collectionNames('entity', 'aura', 'action'))
  })

  it('hides entity cards when the entities filter is toggled off', async () => {
    const wrapper = mountCollection()
    await filterButton(wrapper, 'Entities').trigger('click')
    expect(shownCardNames(wrapper)).toEqual(collectionNames('rules', 'aura', 'action'))
  })

  it('hides aura cards when the auras filter is toggled off', async () => {
    const wrapper = mountCollection()
    await filterButton(wrapper, 'Auras').trigger('click')
    expect(shownCardNames(wrapper)).toEqual(collectionNames('rules', 'entity', 'action'))
  })

  it('hides action cards when the actions filter is toggled off', async () => {
    const wrapper = mountCollection()
    await filterButton(wrapper, 'Actions').trigger('click')
    expect(shownCardNames(wrapper)).toEqual(collectionNames('rules', 'entity', 'aura'))
  })

  it('shows no cards when every filter is toggled off', async () => {
    const wrapper = mountCollection()
    for (const label of ['Rules', 'Entities', 'Auras', 'Actions']) {
      await filterButton(wrapper, label).trigger('click')
    }
    expect(shownCardNames(wrapper)).toEqual([])
  })

  it('shows a category again when toggled back on', async () => {
    const wrapper = mountCollection()
    await filterButton(wrapper, 'Auras').trigger('click')
    await filterButton(wrapper, 'Auras').trigger('click')
    expect(shownCardNames(wrapper)).toEqual(collectionNames('rules', 'entity', 'aura', 'action'))
  })
})
