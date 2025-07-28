export const score = {
  name: "Score",
  description: "Gain 1 Point.",
  event: ["gain-resource", "points", 1],
  cost: 0
}

export const buyBasic = {
  name: "Buy Basic",
  description: "Buy a Basic Card.",
  event: ["buy-basic"],
  cost: 2
}

export const starterRules = {
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

export const dualScore = {
  name: "Dual Score",
  description: "Gain 2 Points. Deck Limit 2.",
  deckLimit: 2,
  event: ["gain-resource", "points", 2],
  cost: 4
}

export const saveReward = {
  name: "A Penny Saved",
  description: "If you haven't purchased a card this round, gain 2 points.",
  cost: 4
}

export const zeroReward = {
  name: "Starting Surge",
  description: "If you have 0 points, gain 6 points.",
  cost: 4
}

export const pointReset = {
  name: "Point Reboot",
  description: "Lose all points, then gain 4 points.",
  cost: 6
}

export const pointMultiply = {
  name: "Point Multiplication",
  description: "If you have 4 or less points, double them."
}

export const scoreSurge = {
  name: "Score Surge",
  description: "Gain 2 points for each \"Score\" played this round (up to 4).",
  cost: 10
}

export const scoreSynergy = {
  name: "Score Synergy",
  description: "Gain 1 point for each \"Score\" in your deck (up to 6).",
  cost: 10
}

export const borrowPoints = {
  name: "Borrowed Points",
  description: "Gain 6 points. In 2 turns, lose 6 points (down to zero)",
  cost: 10
}

export const lastResort = {
  name: "Last Resort",
  description: "Gain 8 Points, then destroy this card",
  cost: 12
}

export const cards = {
  score,
  buyBasic,
  starterRules,
  dualScore,
  saveReward,
  zeroReward,
  pointReset,
  pointMultiply,
  scoreSurge,
  scoreSynergy,
  borrowPoints,
  lastResort
}

export const basicCards = new Set(['score', 'buyBasic'])