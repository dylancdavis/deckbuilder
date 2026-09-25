import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { mount } from '@vue/test-utils'
import App from '../App.vue'
import { useGameStore } from '../stores/game'

describe('App', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountApp() {
    return mount(App, { global: { plugins: [pinia] } })
  }

  function navButton(wrapper: ReturnType<typeof mountApp>, label: string) {
    const button = wrapper.findAll('.nav button').find((b) => b.text() === label)
    if (!button) throw new Error(`No nav button labelled ${label}`)
    return button
  }

  it('mounts renders properly', () => {
    expect(mountApp().text()).toContain('Deckbuilder')
  })

  it('disables the run nav button when there is no run', () => {
    const wrapper = mountApp()
    expect(navButton(wrapper, 'Current Run').attributes('disabled')).toBeDefined()
  })

  it('switches between the collection and run views during a run', async () => {
    const store = useGameStore()
    store.selectDeck('startingDeck')
    store.startRun()
    const wrapper = mountApp()
    expect(wrapper.find('.run-view').exists()).toBe(true)

    await navButton(wrapper, 'Collection').trigger('click')
    expect(store.view).toEqual(['collection'])
    expect(wrapper.find('.collection-view').exists()).toBe(true)
    expect(store.run).not.toBeNull()

    await navButton(wrapper, 'Current Run').trigger('click')
    expect(store.view).toEqual(['run'])
    expect(wrapper.find('.run-view').exists()).toBe(true)
  })
})
