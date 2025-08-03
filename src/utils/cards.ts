interface Card {
  id: string
  name: string
}

interface PlayableCard extends Card {
  description: string,
  cost: number,
  effects: any[],
  deckLimit?: number
}

interface RulesCard extends Card {
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
    gameStart: any[][]
  }
}


export const score: PlayableCard = {
  id: "score",
  name: "Score",
  description: "Gain 1 Point.",
  effects: ["gain-resource", "points", 1],
  cost: 0
}

export const buyBasic: PlayableCard = {
  id: "buy-basic",
  name: "Buy Basic",
  description: "Buy a Basic Card.",
  effects: ["buy-basic"],
  cost: 2
}

export const starterRules: RulesCard = {
  id: "starter-rules",
  name: "Starter Rules",
  type: "rules",
  deckLimits: { size: [0, 4] },
  turnStructure: {
    drawAmount: 2,
    playAmount: "any",
    discardAmount: "all"
  },
  endConditions: { rounds: 1 },
  effects: {
    gameStart: [["add-cards", "draw-pile", { score: 7, buyBasic: 1 }]]
  },
  permanent: true
}

export const dualScore: PlayableCard = {
  id: "dual-score",
  name: "Dual Score",
  description: "Gain 2 Points. Deck Limit 2.",
  deckLimit: 2,
  effects: ["gain-resource", "points", 2],
  cost: 4
}

export const saveReward: PlayableCard = {
  id: "save-reward",
  name: "A Penny Saved",
  description: "If you haven't purchased a card this round, gain 2 points.",
  effects: [],
  cost: 4
}

export const zeroReward: PlayableCard = {
  id: "zero-reward",
  name: "Starting Surge",
  description: "If you have 0 points, gain 6 points.",
  effects: [],
  cost: 4
}

export const pointReset: PlayableCard = {
  id: "point-reset",
  name: "Point Reboot",
  description: "Lose all points, then gain 4 points.",
  effects: [],
  cost: 6
}

export const pointMultiply: PlayableCard = {
  id: "point-multiply",
  name: "Point Multiplication",
  description: "If you have 4 or less points, double them.",
  effects: [],
  cost: 0
}

export const scoreSurge: PlayableCard = {
  id: "score-surge",
  name: "Score Surge",
  description: "Gain 2 points for each \"Score\" played this round (up to 4).",
  effects: [],
  cost: 10
}

export const scoreSynergy: PlayableCard = {
  id: "score-synergy",
  name: "Score Synergy",
  description: "Gain 1 point for each \"Score\" in your deck (up to 6).",
  effects: [],
  cost: 10
}

export const borrowPoints: PlayableCard = {
  id: "borrow-points",
  name: "Borrowed Points",
  description: "Gain 6 points. In 2 turns, lose 6 points (down to zero)",
  effects: [],
  cost: 10
}

export const lastResort: PlayableCard = {
  id: "last-resort",
  name: "Last Resort",
  description: "Gain 8 Points, then destroy this card",
  effects: [],
  cost: 12
}

export const cards: Record<string, Card> = {
  'score': score,
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
