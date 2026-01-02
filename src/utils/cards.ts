import { Resource } from './resource'
import { keys, selectRandom, values } from './utils'
import type { Effect } from './effects'
import type { Run } from './run'

export type CardArtId = 'lightning' | 'scarab-thick'

export interface CardArt {
  gradient: [string, string]
  image: CardArtId
  fillColor?: string
  fillGradient?: [string, string]
  borderColor?: string
  borderWidth?: number
  shadow?: boolean
}

export interface Card {
  id: CardID
  name: string
  type: 'rules' | 'playable'
  tags?: string[]
  art: CardArt
}

export interface PlayableCard extends Card {
  id: PlayableCardID
  type: 'playable'
  description: string
  cost: number
  effects: Effect[]
  deckLimit?: number
  instanceId?: string
}

export interface RulesCard extends Card {
  id: RulesCardID
  type: 'rules'
  deckLimits: {
    size: [number, number]
  }
  turnStructure: {
    drawAmount: number
    playAmount: number | 'any'
    discardAmount: number | 'all'
  }
  endConditions: {
    rounds: number
  }
  effects: {
    gameStart: Effect[]
  }
}

export const score: PlayableCard = {
  type: 'playable',
  id: 'score',
  name: 'Score',
  description: 'Gain 1 Point.',
  effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 1 } }],
  cost: 0,
  tags: ['basic'],
  art: {
    gradient: ['#093153ff', '#1077d2'],
    image: 'scarab-thick',
  },
}

export const collectBasic: PlayableCard = {
  type: 'playable',
  id: 'collect-basic',
  name: 'Collect Basic',
  description: 'Collect a Basic Card.',
  effects: [
    {
      type: 'card-choice',
      params: {
        options: 3,
        tags: ['basic'],
        then: (chosenCard) => ({
          type: 'collect-card',
          params: { cards: { [chosenCard]: 1 } },
        }),
      },
    },
  ],
  cost: 2,
  tags: ['basic'],
  art: {
    gradient: ['#3d1472', '#ff6ec7'],
    image: 'scarab-thick',
  },
}

export const starterRules: RulesCard = {
  type: 'rules',
  id: 'starter-rules',
  name: 'Starter Rules',
  art: {
    gradient: ['#4b4b4b', '#9e9e9e'],
    image: 'scarab-thick',
  },
  deckLimits: { size: [0, 4] },
  turnStructure: {
    drawAmount: 2,
    playAmount: 1,
    discardAmount: 'all',
  },
  endConditions: { rounds: 1 },
  effects: {
    gameStart: [
      {
        type: 'add-cards',
        params: { location: 'drawPile', cards: { score: 7, 'collect-basic': 1 } },
      },
    ],
  },
}

export const dualScore: PlayableCard = {
  type: 'playable',
  id: 'dual-score',
  name: 'Dual Score',
  description: 'Gain 2 Points. Deck Limit 2.',
  deckLimit: 2,
  effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 2 } }],
  cost: 4,
  tags: ['basic'],
  art: {
    gradient: ['#1e3c72', '#2a5298'],
    image: 'lightning',
  },
}

export const saveReward: PlayableCard = {
  type: 'playable',
  id: 'save-reward',
  name: 'A Penny Saved',
  description: "If you haven't collected a card this round, gain 2 points.",
  effects: [
    {
      type: 'update-resource',
      params: {
        resource: Resource.POINTS,
        update: (current, run: Run) => {
          // Check if any collect-card events occurred this round
          const roundCardPlayEvents = run.events.filter(
            (e) => e.type === 'card-play' && e.round === run.stats.rounds,
          )
          const cardCollectEvents = roundCardPlayEvents.some((e) => {
            const card = playableCards[e.cardId]
            return card.effects.some((eff) => eff.type === 'collect-card')
          })
          return cardCollectEvents ? current : current + 2
        },
      },
    },
  ],
  cost: 4,
  tags: ['basic'],
  art: {
    gradient: ['#355c7d', '#6c5b7b'],
    image: 'scarab-thick',
  },
}

export const zeroReward: PlayableCard = {
  type: 'playable',
  id: 'zero-reward',
  name: 'Starting Surge',
  description: 'If you have 0 points, gain 6 points.',
  effects: [
    {
      type: 'update-resource',
      params: {
        resource: Resource.POINTS,
        update: (current) => (current === 0 ? 6 : current),
      },
    },
  ],
  cost: 4,
  tags: ['basic'],
  art: {
    gradient: ['#42275a', '#734b6d'],
    image: 'scarab-thick',
  },
}

export const pointReset: PlayableCard = {
  type: 'playable',
  id: 'point-reset',
  name: 'Point Reboot',
  description: 'Set your point total to 4.',
  effects: [
    {
      type: 'update-resource',
      params: {
        resource: Resource.POINTS,
        set: 4,
      },
    },
  ],
  cost: 6,
  tags: ['basic'],
  art: {
    gradient: ['#134e5e', '#71b280'],
    image: 'scarab-thick',
  },
}

export const pointMultiply: PlayableCard = {
  type: 'playable',
  id: 'point-multiply',
  name: 'Point Multiplication',
  description: 'If you have 4 or less points, double them.',
  effects: [
    {
      type: 'update-resource',
      params: {
        resource: Resource.POINTS,
        update: (current) => (current <= 4 ? current * 2 : current),
      },
    },
  ],
  cost: 0,
  tags: ['basic'],
  art: {
    gradient: ['#de6262', '#ffb88c'],
    image: 'lightning',
  },
}

export const scoreSurge: PlayableCard = {
  type: 'playable',
  id: 'score-surge',
  name: 'Score Surge',
  description: 'Gain 2 points (max 8) for each "Score" played this round.',
  effects: [
    {
      type: 'update-resource',
      params: {
        resource: Resource.POINTS,
        update: (current, run) => {
          const currentRound = run.stats.rounds
          const scoreCardsPlayedThisRound = run.events.filter(
            (event) => event.type === 'card-play' && event.cardId === 'score' && event.round === currentRound
          ).length
          const pointsToGain = Math.min(scoreCardsPlayedThisRound * 2, 8)
          return current + pointsToGain
        },
      },
    },
  ],
  cost: 10,
  tags: ['basic'],
  art: {
    gradient: ['#4568dc', '#b06ab3'],
    image: 'lightning',
  },
}

export const scoreSynergy: PlayableCard = {
  type: 'playable',
  id: 'score-synergy',
  name: 'Score Synergy',
  description: 'Gain 1 point (max 6) for each "Score" in your deck.',
  effects: [
    {
      type: 'update-resource',
      params: {
        resource: Resource.POINTS,
        update: (current, run) => {
          const scoreCardsInDeck = run.deck.cards['score'] || 0
          const pointsToGain = Math.min(scoreCardsInDeck, 6)
          return current + pointsToGain
        },
      },
    },
  ],
  cost: 10,
  tags: ['basic'],
  art: {
    gradient: ['#a83279', '#d38312'],
    image: 'scarab-thick',
  },
}

export const pointLoan: PlayableCard = {
  type: 'playable',
  id: 'point-loan',
  name: 'Point Loan',
  description: 'Gain 6 points. Add a "Debt" card to your draw pile.',
  effects: [
    {
      type: 'update-resource',
      params: {
        resource: Resource.POINTS,
        delta: 6,
      },
    },
    {
      type: 'add-cards',
      params: {
        location: 'drawPile',
        cards: { debt: 1 },
        mode: 'shuffle',
      },
    },
  ],
  cost: 10,
  tags: ['basic'],
  art: {
    gradient: ['#f7b733', '#fc4a1a'],
    image: 'scarab-thick',
  },
}

export const debt: PlayableCard = {
  type: 'playable',
  id: 'debt',
  name: 'Debt',
  description: 'When you draw this, lose 6 points.',
  effects: [],
  cost: 0,
  tags: [],
  art: {
    gradient: ['#757f9a', '#d7dde8'],
    image: 'scarab-thick',
  },
}

export const lastResort: PlayableCard = {
  type: 'playable',
  id: 'last-resort',
  name: 'Last Resort',
  description: 'Gain 8 Points. Destroy this card.',
  effects: [
    { type: 'update-resource', params: { resource: Resource.POINTS, delta: 8 } },
    { type: 'remove-card', params: { instanceId: 'self' } },
    { type: 'destroy-card', params: { cards: { 'last-resort': 1 } } },
  ],
  cost: 12,
  tags: ['basic'],
  art: {
    gradient: ['#141e30', '#243b55'],
    image: 'lightning',
  },
}

export const rulesCards = {
  'starter-rules': starterRules,
} as const

export const playableCards = {
  score: score,
  'collect-basic': collectBasic,
  'dual-score': dualScore,
  'save-reward': saveReward,
  'zero-reward': zeroReward,
  'point-reset': pointReset,
  'point-multiply': pointMultiply,
  'score-surge': scoreSurge,
  'score-synergy': scoreSynergy,
  'point-loan': pointLoan,
  debt: debt,
  'last-resort': lastResort,
} as const

export const cards = { ...rulesCards, ...playableCards }

export function getCardChoices(numChoices: number, tags: string[]): CardID[] {
  const filteredIDs = values(cards)
    .filter((card) => tags.every((tag) => card.tags?.includes(tag)))
    .map((c) => c.id)
  return selectRandom(filteredIDs, numChoices)
}

export type RulesCardID = keyof typeof rulesCards
export type PlayableCardID = keyof typeof playableCards
export type CardID = RulesCardID | PlayableCardID

export const cardIds: CardID[] = keys(cards)
export const rulesCardIds: RulesCardID[] = keys(rulesCards)
export const playableCardIds: PlayableCardID[] = keys(playableCards)

export const cardType = (id: CardID) => cards[id].type
