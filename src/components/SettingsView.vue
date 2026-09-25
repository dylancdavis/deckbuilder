<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../stores/game'
import { cardIds, cards, type CardID } from '@/utils/cards'
import type { PresetSave } from '@/constants'

const gameStore = useGameStore()

const saveText = ref('')
const saveStatus = ref<{ kind: 'success' | 'error'; message: string } | null>(null)

function importSave(json: string) {
  if (!confirm('Replace your collection and decks with this save?')) return

  try {
    gameStore.importSave(json)
    saveStatus.value = { kind: 'success', message: 'Save imported.' }
  } catch (error) {
    saveStatus.value = { kind: 'error', message: `Could not import save: ${error}` }
  }
}

function onExportFile() {
  const blob = new Blob([gameStore.exportSave()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'deckbuilder-save.json'
  link.click()
  URL.revokeObjectURL(url)
}

async function onImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Clear the input so choosing the same file again still fires a change
  input.value = ''
  if (!file) return

  importSave(await file.text())
}

function onLoadPresetSave(preset: PresetSave, message: string) {
  if (!confirm(message)) return
  gameStore.loadPresetSave(preset)
}

function onSetCardQuantity(cardId: CardID, event: Event) {
  const input = event.target as HTMLInputElement
  const quantity = Math.max(0, Math.floor(Number(input.value) || 0))
  gameStore.setCardQuantity(cardId, quantity)
  // Show the clamped value when the input was out of range
  input.value = String(quantity)
}

async function onCopySave() {
  saveText.value = gameStore.exportSave()

  try {
    await navigator.clipboard.writeText(saveText.value)
    saveStatus.value = { kind: 'success', message: 'Save copied to clipboard.' }
  } catch {
    saveStatus.value = { kind: 'error', message: 'Could not copy; copy it from the text box.' }
  }
}
</script>

<template>
  <div class="settings-view">
    <section class="settings-section">
      <h2>Save</h2>
      <p class="settings-note">Your collection and decks. Runs are not saved.</p>

      <div class="settings-row">
        <button class="settings-button" @click="onExportFile">Export to file</button>
        <label class="settings-button">
          Import from file
          <input type="file" accept=".json,application/json" hidden @change="onImportFile" />
        </label>
      </div>

      <textarea
        v-model="saveText"
        class="save-text"
        placeholder="Paste a save here to import it"
        spellcheck="false"
      />

      <div class="settings-row">
        <button class="settings-button" @click="onCopySave">Copy save</button>
        <button class="settings-button" :disabled="!saveText.trim()" @click="importSave(saveText)">
          Import pasted save
        </button>
      </div>

      <div v-if="saveStatus" class="settings-status" :class="saveStatus.kind">
        {{ saveStatus.message }}
      </div>
    </section>

    <section class="settings-section">
      <h2>Dev Tools</h2>

      <div class="settings-row">
        <button
          class="settings-button"
          @click="
            onLoadPresetSave('default', 'Replace your collection and decks with the default save?')
          "
        >
          Reset to default save
        </button>
        <button
          class="settings-button"
          @click="onLoadPresetSave('test', 'Replace your collection and decks with the test save?')"
        >
          Load test save
        </button>
      </div>

      <h3>Card Quantities</h3>
      <ul class="card-quantities">
        <li v-for="id in cardIds" :key="id" class="card-quantity" :data-card-quantity="id">
          <span class="card-quantity-name">{{ cards[id].name }}</span>
          <span class="card-quantity-type">{{ cards[id].type }}</span>
          <input
            type="number"
            min="0"
            step="1"
            :value="gameStore.collection.cards[id] ?? 0"
            @change="onSetCardQuantity(id, $event)"
          />
        </li>
      </ul>
    </section>
  </div>
</template>
