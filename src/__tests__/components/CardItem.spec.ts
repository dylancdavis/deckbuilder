import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CardItem from '../../components/CardItem.vue'
import { score } from '../../utils/cards'

describe('CardItem', () => {
  it('does not render attack/defense when undefined', () => {
    const { attack: _a, defense: _d, ...cardWithoutStats } = score
    const wrapper = mount(CardItem, { props: { card: cardWithoutStats } })
    expect(wrapper.find('.card-attack').exists()).toBe(false)
    expect(wrapper.find('.card-defense').exists()).toBe(false)
  })

  it('renders attack when defined', () => {
    const wrapper = mount(CardItem, {
      props: { card: { ...score, attack: 3 } },
    })
    expect(wrapper.find('.card-attack').text()).toBe('3')
  })

  it('renders defense when defined', () => {
    const wrapper = mount(CardItem, {
      props: { card: { ...score, defense: 5 } },
    })
    expect(wrapper.find('.card-defense').text()).toBe('5')
  })

  it('renders zero values (not hidden by falsiness)', () => {
    const wrapper = mount(CardItem, {
      props: { card: { ...score, attack: 0, defense: 0 } },
    })
    expect(wrapper.find('.card-attack').text()).toBe('0')
    expect(wrapper.find('.card-defense').text()).toBe('0')
  })
})
