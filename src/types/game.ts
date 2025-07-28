export interface Card {
  name: string
  description: string
  cost: number
  event?: string[]
  type?: 'rules'
  deckLimit?: number
  deckLimits?: {
    size: [number, number]
  }
  turnStructure?: {
    drawAmount: number
    playAmount: number | 'any'
    discardAmount: number | 'all'
  }
  endConditions?: {
    rounds: number
  }
  effects?: {
    gameStart: string[][]
  }
  permanent?: boolean
}

export interface Deck {
  name: string
  cards: Record<string, number>
  rulesCard: string
  editable: boolean
}

export interface Resources {
  points: {
    display: string
    value: number
  }
}

export interface CardZones {
  drawPile: string[]
  hand: string[]
  board: string[]
  discardPile: string[]
}

export interface RunStats {
  turn: Record<string, unknown>
  round: Record<string, unknown>
  drawnCards: Record<string, unknown>
}

export interface RunState {
  resources: Resources
  cards: CardZones
  deckInfo: {
    cards: Record<string, number>
    rulesCard: string
  }
  stats: RunStats
  effects: unknown[]
  outcomes: unknown[]
}

export interface GameState {
  collection: {
    cards: Record<string, number>
    decklists: Record<string, Deck>
  }
  run: RunState | null
}

export interface UIState {
  currentView: ['collection'] | ['run']
  collection: {
    selectedDeck: string | null
  }
}

export type ViewType = 'collection' | 'run'