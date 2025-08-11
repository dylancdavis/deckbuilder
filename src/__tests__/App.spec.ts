import { describe, it, expect } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('mounts renders properly', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    
    const wrapper = mount(App, {
      global: {
        plugins: [pinia]
      }
    })
    expect(wrapper.text()).toContain('Deckbuilder')
  })
})
