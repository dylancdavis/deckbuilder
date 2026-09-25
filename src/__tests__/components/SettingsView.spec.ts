import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { mount } from '@vue/test-utils'
import SettingsView from '../../components/SettingsView.vue'
import { useGameStore } from '../../stores/game'

describe('SettingsView', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  function mountSettings() {
    return mount(SettingsView, { global: { plugins: [pinia] } })
  }

  function button(wrapper: ReturnType<typeof mountSettings>, label: string) {
    const found = wrapper.findAll('button').find((b) => b.text() === label)
    if (!found) throw new Error(`No button labelled ${label}`)
    return found
  }

  function saveWithDeck(name: string) {
    const store = useGameStore()
    const key = store.addDeck(name)
    const save = store.exportSave()
    store.importSave(saveWithout(save, key))
    return { key, save }
  }

  function saveWithout(save: string, deckKey: string) {
    const parsed = JSON.parse(save)
    delete parsed.decks[deckKey]
    return JSON.stringify(parsed)
  }

  it('copies the save into the text box', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const wrapper = mountSettings()

    await button(wrapper, 'Copy save').trigger('click')
    const save = useGameStore().exportSave()
    expect(writeText).toHaveBeenCalledWith(save)
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe(save)
    vi.unstubAllGlobals()
  })

  it('imports a pasted save', async () => {
    const { key, save } = saveWithDeck('Pasted Deck')
    const wrapper = mountSettings()

    await wrapper.find('textarea').setValue(save)
    await button(wrapper, 'Import pasted save').trigger('click')
    expect(useGameStore().collection.decks[key].name).toBe('Pasted Deck')
    expect(wrapper.find('.settings-status.success').exists()).toBe(true)
  })

  it('does not import when the player cancels', async () => {
    vi.mocked(window.confirm).mockReturnValue(false)
    const { key, save } = saveWithDeck('Cancelled Deck')
    const wrapper = mountSettings()

    await wrapper.find('textarea').setValue(save)
    await button(wrapper, 'Import pasted save').trigger('click')
    expect(useGameStore().collection.decks[key]).toBeUndefined()
  })

  it('shows an error for an invalid pasted save', async () => {
    const wrapper = mountSettings()

    await wrapper.find('textarea').setValue('not a save')
    await button(wrapper, 'Import pasted save').trigger('click')
    expect(wrapper.find('.settings-status.error').exists()).toBe(true)
  })

  it('imports a save file', async () => {
    const { key, save } = saveWithDeck('File Deck')
    const wrapper = mountSettings()

    const input = wrapper.find('input[type="file"]')
    const file = new File([save], 'save.json', { type: 'application/json' })
    // jsdom's File lacks Blob.text()
    Object.defineProperty(file, 'text', { value: async () => save })
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    await vi.waitFor(() => expect(useGameStore().collection.decks[key]?.name).toBe('File Deck'))
  })
})
