import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import App from '../../App.vue'

describe('App Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders correctly', () => {
    const wrapper = mount(App)
    
    expect(wrapper.find('.game-title').text()).toBe('Deckbuilder')
    expect(wrapper.find('.nav').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'CollectionView' })).toBeDefined()
  })

  it('shows collection view by default', () => {
    const wrapper = mount(App)
    
    expect(wrapper.findComponent({ name: 'CollectionView' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'RunView' }).exists()).toBe(false)
  })
})