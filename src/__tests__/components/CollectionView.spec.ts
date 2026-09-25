import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { mount } from '@vue/test-utils'
import CollectionView from '../../components/CollectionView.vue'
import { useGameStore } from '../../stores/game'
import { cards, type Card } from '../../utils/cards'
import { entries, keys } from '../../utils/utils'

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

  function collectionNames(...types: Card['type'][]) {
    return keys(useGameStore().collection.cards)
      .map((id) => cards[id])
      .filter((card) => types.includes(card.type))
      .map((card) => card.name)
      .sort()
  }

  it('shows every card with both filters on by default', () => {
    const wrapper = mountCollection()
    expect(filterButton(wrapper, 'Rules').classes()).toContain('active')
    expect(filterButton(wrapper, 'Playables').classes()).toContain('active')
    expect(shownCardNames(wrapper)).toEqual(collectionNames('rules', 'playable'))
  })

  it('labels each filter with the quantity of that card type in the collection', () => {
    const quantityOf = (type: Card['type']) =>
      entries(useGameStore().collection.cards)
        .filter(([id]) => cards[id].type === type)
        .reduce((sum, [, amount]) => sum + (amount ?? 0), 0)
    const wrapper = mountCollection()
    expect(filterButton(wrapper, 'Rules').text()).toBe(`Rules (x${quantityOf('rules')})`)
    expect(filterButton(wrapper, 'Playables').text()).toBe(`Playables (x${quantityOf('playable')})`)
  })

  it('hides rules cards when the rules filter is toggled off', async () => {
    const wrapper = mountCollection()
    await filterButton(wrapper, 'Rules').trigger('click')
    expect(filterButton(wrapper, 'Rules').classes()).not.toContain('active')
    expect(shownCardNames(wrapper)).toEqual(collectionNames('playable'))
  })

  it('hides playable cards when the playables filter is toggled off', async () => {
    const wrapper = mountCollection()
    await filterButton(wrapper, 'Playables').trigger('click')
    expect(shownCardNames(wrapper)).toEqual(collectionNames('rules'))
  })

  it('shows no cards when both filters are toggled off', async () => {
    const wrapper = mountCollection()
    await filterButton(wrapper, 'Rules').trigger('click')
    await filterButton(wrapper, 'Playables').trigger('click')
    expect(shownCardNames(wrapper)).toEqual([])
  })

  it('shows a filter type again when toggled back on', async () => {
    const wrapper = mountCollection()
    await filterButton(wrapper, 'Rules').trigger('click')
    await filterButton(wrapper, 'Rules').trigger('click')
    expect(shownCardNames(wrapper)).toEqual(collectionNames('rules', 'playable'))
  })
})
