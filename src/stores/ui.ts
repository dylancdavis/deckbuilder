import { defineStore } from 'pinia'
import type { UIState, ViewType } from '@/types/game'

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    currentView: ['collection'],
    collection: {
      selectedDeck: null
    }
  }),

  getters: {
    currentViewType: (state): ViewType => {
      return state.currentView[0] === 'collection' ? 'collection' : 'run'
    },

    isCollectionView: (state) => state.currentView[0] === 'collection',
    isRunView: (state) => state.currentView[0] === 'run',

    selectedDeckId: (state) => state.collection.selectedDeck
  },

  actions: {
    setView(viewType: ViewType) {
      if (viewType === 'collection') {
        this.currentView = ['collection']
      } else if (viewType === 'run') {
        this.currentView = ['run']
      }
    },

    selectDeck(deckId: string | null) {
      this.collection.selectedDeck = deckId
    },

    switchToCollection() {
      this.setView('collection')
    },

    switchToRun() {
      this.setView('run')
    }
  }
})