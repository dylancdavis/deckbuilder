import type { Card } from '@/types/game'

export const score: Card = {
  name: 'Score',
  description: 'Gain 1 Point.',
  event: ['gain-resource', 'points', '1'],
  cost: 0
}

export const buyBasic: Card = {
  name: 'Buy Basic',
  description: 'Buy a Basic Card.',
  event: ['buy-basic'],
  cost: 2
}

export const starterRules: Card = {
  name: 'Starter Rules',
  type: 'rules',
  description: 'Basic game rules',
  cost: 0,
  deckLimits: { size: [0, 4] },
  turnStructure: {
    drawAmount: 2,
    playAmount: 'any',
    discardAmount: 'all'
  },
  endConditions: { rounds: 1 },
  effects: {
    gameStart: [['add-cards', 'draw-pile', JSON.stringify({ 'score': 7, 'buy-basic': 1 })]]
  },
  permanent: true
}

export const dualScore: Card = {
  name: 'Dual Score',
  description: 'Gain 2 Points. Deck Limit 2.',
  deckLimit: 2,
  event: ['gain-resource', 'points', '2'],
  cost: 4
}

export const saveReward: Card = {
  name: 'A Penny Saved',
  description: "If you haven't purchased a card this round, gain 2 points.",
  cost: 4
}

export const zeroReward: Card = {
  name: 'Starting Surge',
  description: 'If you have 0 points, gain 6 points.',
  cost: 4
}

export const pointReset: Card = {
  name: 'Point Reboot',
  description: 'Lose all points, then gain 4 points.',
  cost: 6
}

export const pointMultiply: Card = {
  name: 'Point Multiplication',
  description: 'If you have 4 or less points, double them.',
  cost: 0
}

export const scoreSurge: Card = {
  name: 'Score Surge',
  description: 'Gain 2 points for each "Score" played this round (up to 4).',
  cost: 10
}

export const scoreSynergy: Card = {
  name: 'Score Synergy',
  description: 'Gain 1 point for each "Score" in your deck (up to 6).',
  cost: 10
}

export const borrowPoints: Card = {
  name: 'Borrowed Points',
  description: 'Gain 6 points. In 2 turns, lose 6 points (down to zero)',
  cost: 10
}

export const lastResort: Card = {
  name: 'Last Resort',
  description: 'Gain 8 Points, then destroy this card',
  cost: 12
}

export const cardRegistry: Record<string, Card> = {
  score,
  'buy-basic': buyBasic,
  'starter-rules': starterRules,
  'dual-score': dualScore,
  'save-reward': saveReward,
  'zero-reward': zeroReward,
  'point-reset': pointReset,
  'point-multiply': pointMultiply,
  'score-surge': scoreSurge,
  'score-synergy': scoreSynergy,
  'borrow-points': borrowPoints,
  'last-resort': lastResort
}

export const basicCards = new Set(['score', 'buy-basic'])