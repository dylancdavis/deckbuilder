import { Resource } from './resource'
import { keys, selectRandom, values } from './utils'
import type { Run } from './run'
import type { Ability } from './ability'

/**
 * Core game flow abilities that handle implicit turn/round transitions.
 * These can be added to any rules card to implement standard game flow.
 */
export const coreGameFlowAbilities: Ability[] = [
  // Attack events cause damage equal to attacking card's attack
  {
    type: 'reactive',
    trigger: { on: 'card-attack' },
    order: 'after-cards',
    effects: ({ event }) => {
      if (event.type !== 'card-attack') throw new Error('Expected a card-attack event')
      return [
        { type: 'damage', params: { instanceId: event.targetInstanceId, amount: event.amount } },
      ]
    },
  },
  // Cards reduced to 0 defense by damage are discarded.
  {
    type: 'reactive',
    trigger: {
      on: 'card-damage',
      when: (ctx) => ctx.event.type === 'card-damage' && ctx.event.newDefense === 0,
    },
    order: 'after-cards',
    effects: [{ type: 'discard-cards', params: { instanceIds: ['target'] } }],
  },
  // On run-start -> start first round
  {
    type: 'reactive',
    trigger: { on: 'run-start' },
    order: 'after-cards',
    effects: [{ type: 'round-start', params: {} }],
  },
  // On turn-end with cards in draw pile -> start new turn
  {
    type: 'reactive',
    trigger: {
      on: 'turn-end',
      when: (ctx) => ctx.run.cards.drawPile.length > 0,
    },
    order: 'after-cards',
    effects: [{ type: 'turn-start', params: {} }],
  },
  // On turn-end with empty draw pile -> end round
  {
    type: 'reactive',
    trigger: {
      on: 'turn-end',
      when: (ctx) => ctx.run.cards.drawPile.length === 0,
    },
    order: 'after-cards',
    effects: [{ type: 'round-end', params: {} }],
  },
  // On round-end -> refresh deck (reshuffle all cards)
  {
    type: 'reactive',
    trigger: { on: 'round-end' },
    order: 'after-cards',
    effects: [{ type: 'refresh-deck', params: {} }],
  },
  // On round-end (after refresh) -> start new round
  {
    type: 'reactive',
    trigger: { on: 'round-end' },
    order: 'after-cards',
    effects: [{ type: 'round-start', params: {} }],
  },
  // On round-start -> start new turn
  {
    type: 'reactive',
    trigger: { on: 'round-start' },
    order: 'after-cards',
    effects: [{ type: 'turn-start', params: {} }],
  },
]

export type CardArtId = 'crossed-swords' | 'lightning' | 'scarab' | 'spikes'

export interface CardArt {
  /** Card background gradient, ordered [top-left, bottom-right]. */
  gradient: [string, string]
  image: CardArtId
  /** Icon fill gradient, ordered [top, bottom]. */
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
  attack?: number
  defense?: number
}

export interface PlayableCard extends Card {
  id: PlayableCardID
  type: 'playable'
  description: string
  cost: number
  abilities: Ability[]
  deckLimit?: number
}

export interface CardInstance extends PlayableCard {
  instanceId: string
}

/**
 * Determines if a card should go to the board (asset) or discard pile (action).
 * A card is an asset if any ability requires a board location, or if it has
 * attack/defense stats (entities live on the board to be attacked/targeted).
 */
export function isAsset(card: PlayableCard): boolean {
  if (card.attack !== undefined || card.defense !== undefined) return true
  return card.abilities.some((ability) => ability.trigger.locations?.includes('board'))
}

export interface RulesCard extends Card {
  id: RulesCardID
  type: 'rules'
  deckLimits: {
    size: [number, number]
  }
  turnStructure: {
    playAmount: number | 'any'
  }
  abilities: Ability[]
}

export const score: PlayableCard = {
  type: 'playable',
  id: 'score',
  name: 'Score',
  description: 'Gain 1 Point.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-play', target: 'self' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 1 } }],
    },
  ],
  cost: 0,
  tags: ['basic'],
  art: {
    gradient: ['#1077d2', '#093153ff'],
    image: 'scarab',
  },
}

export const collectBasic: PlayableCard = {
  type: 'playable',
  id: 'collect-basic',
  name: 'Collect Basic',
  description: 'Collect a Basic Card.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-play', target: 'self' },
      effects: [
        {
          type: 'card-choice',
          params: {
            options: 3,
            tags: ['basic'],
            choiceHandler: (chosenCard) => [
              {
                type: 'collect-card',
                params: { cards: { [chosenCard]: 1 } },
              },
            ],
          },
        },
      ],
    },
  ],
  cost: 2,
  tags: ['basic'],
  art: {
    gradient: ['#ff6ec7', '#3d1472'],
    image: 'scarab',
  },
}

export const starterRules: RulesCard = {
  type: 'rules',
  id: 'starter-rules',
  name: 'Starter Rules',
  art: {
    gradient: ['#9e9e9e', '#4b4b4b'],
    image: 'scarab',
  },
  deckLimits: { size: [0, 4] },
  turnStructure: { playAmount: 1 },
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'run-start' },
      effects: [
        {
          type: 'add-cards',
          params: {
            location: 'drawPile',
            cards: { score: 7, 'collect-basic': 1 },
            mode: 'shuffle',
          },
        },
      ],
    },
    {
      type: 'reactive',
      trigger: { on: 'turn-start' },
      order: 'before-cards',
      effects: [{ type: 'draw-cards', params: { amount: 2 } }],
    },
    {
      type: 'reactive',
      trigger: { on: 'turn-end' },
      order: 'after-cards',
      effects: [{ type: 'discard-cards', params: { from: 'hand', amount: 'all' } }],
    },
    {
      type: 'reactive',
      trigger: { on: 'round-end' },
      order: 'after-cards',
      effects: [{ type: 'run-end', params: {} }],
    },
    ...coreGameFlowAbilities,
  ],
}

export const dualScore: PlayableCard = {
  type: 'playable',
  id: 'dual-score',
  name: 'Dual Score',
  description: 'Gain 2 Points. Deck Limit 2.',
  deckLimit: 2,
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-play', target: 'self' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 2 } }],
    },
  ],
  cost: 4,
  tags: ['basic'],
  art: {
    gradient: ['#2a5298', '#1e3c72'],
    image: 'lightning',
  },
}

export const saveReward: PlayableCard = {
  type: 'playable',
  id: 'save-reward',
  name: 'A Penny Saved',
  description: "If you haven't collected a card this round, gain 2 points.",
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-play', target: 'self' },
      effects: [
        {
          type: 'update-resource',
          params: {
            resource: Resource.POINTS,
            update: (current: number, run: Run) => {
              const collected = run.events.some(
                (e) => e.type === 'card-collect' && e.round === run.stats.rounds,
              )
              return collected ? current : current + 2
            },
          },
        },
      ],
    },
  ],
  cost: 4,
  tags: ['basic'],
  art: {
    gradient: ['#6c5b7b', '#355c7d'],
    image: 'scarab',
  },
}

export const zeroReward: PlayableCard = {
  type: 'playable',
  id: 'zero-reward',
  name: 'Starting Surge',
  description: 'If you have 0 points, gain 6 points.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-play', target: 'self' },
      effects: [
        {
          type: 'update-resource',
          params: {
            resource: Resource.POINTS,
            update: (current: number) => (current === 0 ? 6 : current),
          },
        },
      ],
    },
  ],
  cost: 4,
  tags: ['basic'],
  art: {
    gradient: ['#734b6d', '#42275a'],
    image: 'scarab',
  },
}

export const pointReset: PlayableCard = {
  type: 'playable',
  id: 'point-reset',
  name: 'Point Reboot',
  description: 'Set your point total to 4.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-play', target: 'self' },
      effects: [
        {
          type: 'update-resource',
          params: {
            resource: Resource.POINTS,
            set: 4,
          },
        },
      ],
    },
  ],
  cost: 6,
  tags: ['basic'],
  art: {
    gradient: ['#71b280', '#134e5e'],
    image: 'scarab',
  },
}

export const pointMultiply: PlayableCard = {
  type: 'playable',
  id: 'point-multiply',
  name: 'Point Multiplication',
  description: 'If you have 4 or less points, double them.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-play', target: 'self' },
      effects: [
        {
          type: 'update-resource',
          params: {
            resource: Resource.POINTS,
            update: (current: number) => (current <= 4 ? current * 2 : current),
          },
        },
      ],
    },
  ],
  cost: 0,
  tags: ['basic'],
  art: {
    gradient: ['#ffb88c', '#de6262'],
    image: 'lightning',
  },
}

export const scoreSurge: PlayableCard = {
  type: 'playable',
  id: 'score-surge',
  name: 'Score Surge',
  description: 'Gain 2 points (max 8) for each "Score" played this round.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-play', target: 'self' },
      effects: [
        {
          type: 'update-resource',
          params: {
            resource: Resource.POINTS,
            update: (current: number, run: Run) => {
              const currentRound = run.stats.rounds
              const scoreCardsPlayedThisRound = run.events.filter(
                (event) =>
                  event.type === 'card-play' &&
                  event.cardId === 'score' &&
                  event.round === currentRound,
              ).length
              const pointsToGain = Math.min(scoreCardsPlayedThisRound * 2, 8)
              return current + pointsToGain
            },
          },
        },
      ],
    },
  ],
  cost: 10,
  tags: ['basic'],
  art: {
    gradient: ['#b06ab3', '#4568dc'],
    image: 'lightning',
  },
}

export const scoreSynergy: PlayableCard = {
  type: 'playable',
  id: 'score-synergy',
  name: 'Score Synergy',
  description: 'Gain 1 point (max 6) for each "Score" in your deck.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-play', target: 'self' },
      effects: [
        {
          type: 'update-resource',
          params: {
            resource: Resource.POINTS,
            update: (current: number, run: Run) => {
              const scoreCardsInDeck = run.deck.cards['score'] || 0
              const pointsToGain = Math.min(scoreCardsInDeck, 6)
              return current + pointsToGain
            },
          },
        },
      ],
    },
  ],
  cost: 10,
  tags: ['basic'],
  art: {
    gradient: ['#d38312', '#a83279'],
    image: 'scarab',
  },
}

export const pointLoan: PlayableCard = {
  type: 'playable',
  id: 'point-loan',
  name: 'Point Loan',
  description: 'Gain 6 points. Add a "Debt" card to your draw pile.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-play', target: 'self' },
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
    },
  ],
  cost: 10,
  tags: ['basic'],
  art: {
    gradient: ['#fc4a1a', '#f7b733'],
    image: 'scarab',
  },
}

export const debt: PlayableCard = {
  type: 'playable',
  id: 'debt',
  name: 'Debt',
  description: 'When you draw this, lose 6 points.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-draw', target: 'self' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: -6 } }],
    },
  ],
  cost: 0,
  tags: [],
  art: {
    gradient: ['#d7dde8', '#757f9a'],
    image: 'scarab',
  },
}

export const lastResort: PlayableCard = {
  type: 'playable',
  id: 'last-resort',
  name: 'Last Resort',
  description: 'Gain 8 Points. Destroy this card.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-play', target: 'self' },
      effects: [
        { type: 'update-resource', params: { resource: Resource.POINTS, delta: 8 } },
        { type: 'remove-card', params: { instanceId: 'self' } },
        { type: 'destroy-card', params: { cards: { 'last-resort': 1 } } },
      ],
    },
  ],
  cost: 12,
  tags: ['basic'],
  art: {
    gradient: ['#243b55', '#141e30'],
    image: 'lightning',
  },
}

export const basicEntity: PlayableCard = {
  type: 'playable',
  id: 'basic-entity',
  name: 'Basic Entity',
  description: '',
  attack: 1,
  defense: 1,
  abilities: [],
  cost: 2,
  tags: ['basic', 'entity'],
  art: {
    gradient: ['#0f2027', '#2c5364'],
    image: 'scarab',
  },
}

export const targetDummy: PlayableCard = {
  type: 'playable',
  id: 'target-dummy',
  name: 'Target Dummy',
  description: '',
  attack: 0,
  defense: 1,
  abilities: [],
  cost: 1,
  tags: ['test', 'entity'],
  art: {
    gradient: ['#2c3e50', '#bdc3c7'],
    image: 'scarab',
  },
}

// Attack test cards: exercise card-attack triggers in actual play

export const striker: PlayableCard = {
  type: 'playable',
  id: 'striker',
  name: 'Score Striker',
  description: 'When this card attacks, gain 1 point.',
  attack: 2,
  defense: 3,
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-attack', target: 'self', locations: ['board'] },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 1 } }],
    },
  ],
  cost: 2,
  tags: ['test', 'entity'],
  art: {
    gradient: ['#c8d4dc', '#ffffff'],
    image: 'lightning',
    fillGradient: ['#ff8c00', '#8b0000'],
    borderColor: '#56270c',
    // 3.3 rather than Thorn Dummy's 2.5: the lightning viewBox packs 177.8 user
    // units into the same box the scarab fills with 134, so its unit renders smaller.
    borderWidth: 3.3,
  },
}

export const basicStriker: PlayableCard = {
  type: 'playable',
  id: 'basic-striker',
  name: 'Basic Striker',
  description: 'A plain attacker.',
  attack: 1,
  defense: 3,
  abilities: [],
  cost: 1,
  tags: ['basic', 'entity'],
  art: {
    gradient: ['#ba211c', '#e95c20'],
    image: 'crossed-swords',
    fillGradient: ['#e8eef2', '#8fa3b0'],
  },
}

export const thornDummy: PlayableCard = {
  type: 'playable',
  id: 'thorn-dummy',
  name: 'Thorn Dummy',
  description: 'When this card is attacked, deal 1 damage to the attacker.',
  attack: 0,
  defense: 4,
  abilities: [
    {
      type: 'reactive',
      trigger: {
        on: 'card-attack',
        locations: ['board'],
        when: (ctx) =>
          ctx.event.type === 'card-attack' &&
          ctx.sourceCard.type === 'playable' &&
          ctx.event.targetInstanceId === ctx.sourceCard.instanceId,
      },
      // 'target' is the card the event is about — for card-attack, the attacker
      effects: [{ type: 'damage', params: { instanceId: 'target', amount: 1 } }],
    },
  ],
  cost: 1,
  tags: ['test', 'entity'],
  art: {
    gradient: ['#c8d4dc', '#ffffff'],
    image: 'spikes',
    fillGradient: ['#7ba05b', '#355c3a'],
    borderColor: '#2e3c28',
    borderWidth: 2.5,
  },
}

// Test rules card with no limits for manual testing
export const testRules: RulesCard = {
  type: 'rules',
  id: 'test-rules',
  name: 'Test Rules',
  art: {
    gradient: ['#00ff00', '#ff0000'],
    image: 'lightning',
  },
  deckLimits: { size: [0, 100] },
  turnStructure: { playAmount: 'any' },
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'run-start' },
      effects: [
        {
          type: 'add-cards',
          params: {
            location: 'drawPile',
            cards: {
              score: 2,
              'collect-basic': 2,
              'double-choice': 2,
              'choice-draw': 2,
              'draw-watcher': 1,
              'draw-bonus': 1,
              'lucky-draw': 2,
              'point-draw': 1,
              'draw-bonus-plus': 1,
            },
            mode: 'shuffle',
          },
        },
      ],
    },
    {
      type: 'reactive',
      trigger: { on: 'turn-start' },
      order: 'before-cards',
      effects: [{ type: 'draw-cards', params: { amount: 5 } }],
    },
    {
      type: 'reactive',
      trigger: { on: 'turn-end' },
      order: 'after-cards',
      effects: [{ type: 'discard-cards', params: { from: 'hand', amount: 'all' } }],
    },
    {
      type: 'reactive',
      trigger: {
        on: 'round-end',
        when: (ctx) => ctx.event.round >= 10,
      },
      order: 'after-cards',
      effects: [{ type: 'run-end', params: {} }],
    },
    ...coreGameFlowAbilities,
  ],
}

export const discardTestRules: RulesCard = {
  type: 'rules',
  id: 'discard-test-rules',
  name: 'Discard Test Rules',
  art: {
    gradient: ['#9e9e9e', '#4b4b4b'],
    image: 'scarab',
  },
  deckLimits: { size: [0, 4] },
  turnStructure: { playAmount: 1 },
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'run-start' },
      effects: [
        {
          type: 'add-cards',
          params: {
            location: 'drawPile',
            cards: { score: 1, 'hand-board-discard': 1 },
            mode: 'top',
          },
        },
        {
          type: 'add-cards',
          params: { location: 'board', cards: { score: 1 }, mode: 'top' },
        },
      ],
    },
    {
      type: 'reactive',
      trigger: { on: 'turn-start' },
      order: 'before-cards',
      effects: [{ type: 'draw-cards', params: { amount: 2 } }],
    },
    {
      type: 'reactive',
      trigger: { on: 'turn-end' },
      order: 'after-cards',
      effects: [{ type: 'discard-cards', params: { from: 'hand', amount: 'all' } }],
    },
    {
      type: 'reactive',
      trigger: { on: 'round-end' },
      order: 'after-cards',
      effects: [{ type: 'run-end', params: {} }],
    },
    ...coreGameFlowAbilities,
  ],
}

export const moveTestRules: RulesCard = {
  type: 'rules',
  id: 'move-test-rules',
  name: 'Move Test Rules',
  art: {
    gradient: ['#9e9e9e', '#4b4b4b'],
    image: 'scarab',
  },
  deckLimits: { size: [0, 4] },
  turnStructure: { playAmount: 1 },
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'run-start' },
      effects: [
        {
          type: 'add-cards',
          params: {
            location: 'drawPile',
            cards: { score: 1, 'hand-to-board': 1 },
            mode: 'top',
          },
        },
      ],
    },
    {
      type: 'reactive',
      trigger: { on: 'turn-start' },
      order: 'before-cards',
      effects: [{ type: 'draw-cards', params: { amount: 2 } }],
    },
    {
      type: 'reactive',
      trigger: { on: 'turn-end' },
      order: 'after-cards',
      effects: [{ type: 'discard-cards', params: { from: 'hand', amount: 'all' } }],
    },
    {
      type: 'reactive',
      trigger: { on: 'round-end' },
      order: 'after-cards',
      effects: [{ type: 'run-end', params: {} }],
    },
    ...coreGameFlowAbilities,
  ],
}

export const choiceTestRules: RulesCard = {
  type: 'rules',
  id: 'choice-test-rules',
  name: 'Choice Test Rules',
  art: {
    gradient: ['#9e9e9e', '#4b4b4b'],
    image: 'lightning',
  },
  deckLimits: { size: [0, 4] },
  turnStructure: { playAmount: 1 },
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'run-start' },
      effects: [
        {
          type: 'add-cards',
          params: {
            location: 'drawPile',
            cards: { 'choice-add-choice': 1 },
            mode: 'top',
          },
        },
      ],
    },
    {
      type: 'reactive',
      trigger: { on: 'turn-start' },
      order: 'before-cards',
      effects: [{ type: 'draw-cards', params: { amount: 1 } }],
    },
    {
      type: 'reactive',
      trigger: { on: 'turn-end' },
      order: 'after-cards',
      effects: [{ type: 'discard-cards', params: { from: 'hand', amount: 'all' } }],
    },
    {
      type: 'reactive',
      trigger: { on: 'round-end' },
      order: 'after-cards',
      effects: [{ type: 'run-end', params: {} }],
    },
    ...coreGameFlowAbilities,
  ],
}

// Rules for exercising attack mechanics: the deck's entities are drawn
// together on the first turn and can all be played immediately.
export const attackTestRules: RulesCard = {
  type: 'rules',
  id: 'attack-test-rules',
  name: 'Attack Test Rules',
  art: {
    gradient: ['#2c3e50', '#8b0000'],
    image: 'lightning',
  },
  deckLimits: { size: [0, 10] },
  turnStructure: { playAmount: 'any' },
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'turn-start' },
      order: 'before-cards',
      effects: [{ type: 'draw-cards', params: { amount: 2 } }],
    },
    {
      type: 'reactive',
      trigger: { on: 'turn-end' },
      order: 'after-cards',
      effects: [{ type: 'discard-cards', params: { from: 'hand', amount: 'all' } }],
    },
    {
      type: 'reactive',
      trigger: { on: 'round-end' },
      order: 'after-cards',
      effects: [{ type: 'run-end', params: {} }],
    },
    ...coreGameFlowAbilities,
  ],
}

export const rulesCards = {
  'starter-rules': starterRules,
  'test-rules': testRules,
  'discard-test-rules': discardTestRules,
  'move-test-rules': moveTestRules,
  'choice-test-rules': choiceTestRules,
  'attack-test-rules': attackTestRules,
} as const

// === TEST CARDS FOR PROBLEMATIC SCENARIOS ===

// Test: Two card-choices in sequence on the same card
export const doubleChoice: PlayableCard = {
  type: 'playable',
  id: 'double-choice',
  name: 'Double Choice',
  description: 'Choose a basic card to collect, then choose another.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-play', target: 'self' },
      effects: [
        {
          type: 'card-choice',
          params: {
            options: 3,
            tags: ['basic'],
            choiceHandler: (chosenCard) => [
              { type: 'collect-card', params: { cards: { [chosenCard]: 1 } } },
            ],
          },
        },
        {
          type: 'card-choice',
          params: {
            options: 3,
            tags: ['basic'],
            choiceHandler: (chosenCard) => [
              { type: 'collect-card', params: { cards: { [chosenCard]: 1 } } },
            ],
          },
        },
      ],
    },
  ],
  cost: 0,
  tags: ['test'],
  art: {
    gradient: ['#feca57', '#ff6b6b'],
    image: 'lightning',
  },
}

// Test: Card-choice where the effect gains points (simple effect after choice)
export const choiceDraw: PlayableCard = {
  type: 'playable',
  id: 'choice-draw',
  name: 'Choice & Gain',
  description: 'Choose a card to collect, then gain 2 points.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-play', target: 'self' },
      effects: [
        {
          type: 'card-choice',
          params: {
            options: 3,
            tags: ['basic'],
            choiceHandler: (chosenCard) => [
              { type: 'collect-card', params: { cards: { [chosenCard]: 1 } } },
              { type: 'update-resource', params: { resource: Resource.POINTS, delta: 2 } },
            ],
          },
        },
      ],
    },
  ],
  cost: 0,
  tags: ['test'],
  art: {
    gradient: ['#0abde3', '#48dbfb'],
    image: 'scarab',
  },
}

// Test: On-board card that triggers a choice when any card is drawn
export const drawWatcher: PlayableCard = {
  type: 'playable',
  id: 'draw-watcher',
  name: 'Draw Watcher',
  description: 'While on board: When you draw any card, choose a basic card to collect.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-draw', target: 'any', locations: ['board'] },
      effects: [
        {
          type: 'card-choice',
          params: {
            options: 2,
            tags: ['basic'],
            choiceHandler: (chosenCard) => [
              { type: 'collect-card', params: { cards: { [chosenCard]: 1 } } },
            ],
          },
        },
      ],
    },
  ],
  cost: 0,
  tags: ['test'],
  art: {
    gradient: ['#341f97', '#5f27cd'],
    image: 'scarab',
  },
}

// Test: Simpler asset card that gives points when you draw
export const drawBonus: PlayableCard = {
  type: 'playable',
  id: 'draw-bonus',
  name: 'Draw Bonus',
  description: 'While on board: When you draw any card, gain 1 point.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-draw', target: 'any', locations: ['board'] },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 1 } }],
    },
  ],
  cost: 0,
  tags: ['test'],
  art: {
    gradient: ['#1dd1a1', '#10ac84'],
    image: 'scarab',
  },
}

// Test: Triggers when this card itself is drawn
export const luckyDraw: PlayableCard = {
  type: 'playable',
  id: 'lucky-draw',
  name: 'Lucky Draw',
  description: 'When you draw this, gain 1 point.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-draw', target: 'self' },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 1 } }],
    },
  ],
  cost: 0,
  tags: ['test'],
  art: {
    gradient: ['#f12711', '#f5af19'],
    image: 'lightning',
  },
}

// Test: Draw a card when you gain points (while on board)
export const pointDraw: PlayableCard = {
  type: 'playable',
  id: 'point-draw',
  name: 'Point Draw',
  description: 'While on board: When you gain points, draw a card.',
  abilities: [
    {
      type: 'reactive',
      trigger: {
        on: 'resource-change',
        locations: ['board'],
        when: (ctx) => {
          const event = ctx.event as { resource: string; delta: number }
          return event.resource === Resource.POINTS && event.delta > 0
        },
      },
      effects: [{ type: 'draw-cards', params: { amount: 1 } }],
    },
  ],
  cost: 0,
  tags: ['test'],
  art: {
    gradient: ['#764ba2', '#667eea'],
    image: 'lightning',
  },
}

// Test: Gain 2 points when you draw any card (while on board)
export const drawBonusPlus: PlayableCard = {
  type: 'playable',
  id: 'draw-bonus-plus',
  name: 'Draw Bonus+',
  description: 'While on board: When you draw any card, gain 2 points.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-draw', target: 'any', locations: ['board'] },
      effects: [{ type: 'update-resource', params: { resource: Resource.POINTS, delta: 2 } }],
    },
  ],
  cost: 0,
  tags: ['test'],
  art: {
    gradient: ['#38ef7d', '#11998e'],
    image: 'scarab',
  },
}

export const handBoardDiscard: PlayableCard = {
  type: 'playable',
  id: 'hand-board-discard',
  name: 'Hand & Board Discard',
  description: 'Discard 1 from hand and 1 from board.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-play', target: 'self' },
      effects: [
        { type: 'discard-cards', params: { from: 'hand', amount: 1 } },
        { type: 'discard-cards', params: { from: 'board', amount: 1 } },
      ],
    },
  ],
  cost: 0,
  tags: ['test'],
  art: {
    gradient: ['#9e9e9e', '#4b4b4b'],
    image: 'scarab',
  },
}

export const handToBoard: PlayableCard = {
  type: 'playable',
  id: 'hand-to-board',
  name: 'Hand to Board',
  description: 'Move 1 card from hand to board.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-play', target: 'self' },
      effects: [{ type: 'move-card', params: { from: 'hand', amount: 1, to: 'board' } }],
    },
  ],
  cost: 0,
  tags: ['test'],
  art: {
    gradient: ['#9e9e9e', '#4b4b4b'],
    image: 'scarab',
  },
}

// Test: Choice → add-cards → choice sequence
export const choiceAddChoice: PlayableCard = {
  type: 'playable',
  id: 'choice-add-choice',
  name: 'Choice Add Choice',
  description:
    'Choose a basic card to add to hand. Add a Dual Score to hand. Choose a test card to add to hand.',
  abilities: [
    {
      type: 'reactive',
      trigger: { on: 'card-play', target: 'self' },
      effects: [
        {
          type: 'card-choice',
          params: {
            options: 3,
            tags: ['basic'],
            choiceHandler: (chosenCard) => [
              {
                type: 'add-cards',
                params: {
                  location: 'hand',
                  cards: { [chosenCard]: 1 } as Record<string, number>,
                  mode: 'top',
                },
              },
            ],
          },
        },
        {
          type: 'add-cards',
          params: { location: 'hand', cards: { 'dual-score': 1 }, mode: 'top' },
        },
        {
          type: 'card-choice',
          params: {
            options: 3,
            tags: ['test'],
            choiceHandler: (chosenCard) => [
              {
                type: 'add-cards',
                params: {
                  location: 'hand',
                  cards: { [chosenCard]: 1 } as Record<string, number>,
                  mode: 'top',
                },
              },
            ],
          },
        },
      ],
    },
  ],
  cost: 0,
  tags: ['test'],
  art: {
    gradient: ['#9e9e9e', '#4b4b4b'],
    image: 'lightning',
  },
}

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
  // Test cards
  'double-choice': doubleChoice,
  'choice-draw': choiceDraw,
  'draw-watcher': drawWatcher,
  'draw-bonus': drawBonus,
  'lucky-draw': luckyDraw,
  'point-draw': pointDraw,
  'draw-bonus-plus': drawBonusPlus,
  'hand-board-discard': handBoardDiscard,
  'hand-to-board': handToBoard,
  'choice-add-choice': choiceAddChoice,
  'basic-entity': basicEntity,
  'target-dummy': targetDummy,
  striker: striker,
  'thorn-dummy': thornDummy,
  'basic-striker': basicStriker,
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
