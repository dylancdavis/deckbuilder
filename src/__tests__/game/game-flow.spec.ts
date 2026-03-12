import { describe, it, expect } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { render, fireEvent, screen } from '@testing-library/vue'
import App from '../../App.vue'

function renderApp() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return render(App, { global: { plugins: [pinia] } })
}

async function startStarterDeckRun() {
  renderApp()
  await fireEvent.click(screen.getByText('Starter Deck'))
  await fireEvent.click(screen.getByText('Run This Deck'))
}

describe('starter deck run', () => {
  it('draws 2 cards into the hand at the start of the run', async () => {
    await startStarterDeckRun()

    const handCards = screen.getAllByTestId('hand-card')
    expect(handCards).toHaveLength(2)
  })

  it('shows 6 cards remaining in the draw pile on the first turn', async () => {
    await startStarterDeckRun()

    // Starter rules adds 8 cards (7 score + 1 collect-basic), then draws 2
    const drawPileCount = screen.getByTestId('draw-pile-count')
    expect(drawPileCount.textContent).toBe('6')
  })

  it('shows the Next Turn button with discard subtitle', async () => {
    await startStarterDeckRun()

    expect(screen.getByRole('button', { name: /Next Turn/ })).toBeTruthy()
    expect(screen.getByText('(Discard Hand)')).toBeTruthy()
  })
})
