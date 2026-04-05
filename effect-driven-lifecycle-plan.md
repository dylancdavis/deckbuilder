# Effect-Driven Lifecycle Refactor

## Goal

Remove imperative turn/round/run orchestration from the store. All lifecycle transitions should be driven by emitting a single event and letting the rules card's abilities handle the rest — the same pattern used for playing cards today.

After this refactor:
- `nextTurn()` emits a single `turn-end` event
- `startRun()` creates a bare run and emits a single `run-start` event
- `startNewRound()` is deleted entirely
- `drawAmount`, `discardAmount`, `endConditions`, and `effects.gameStart` are removed from `RulesCard`
- `playAmount` stays on `turnStructure` for now

---

## Lifecycle Chains

### Starting a run

```
makeRun(deck)          — populates draw pile from deck.cards (unshuffled)
emit run-start event
  → rules card ability: add-cards (former gameStart effects)
  → core ability: round-start effect
    → core ability: turn-start effect
      → rules card ability: draw-cards
```

### Ending a turn (draw pile not empty)

```
emit turn-end event
  → rules card ability: discard hand
  → core ability: turn-start effect
    → rules card ability: draw-cards
```

### Ending a turn (draw pile empty)

```
emit turn-end event
  → rules card ability: discard hand
  → core ability: round-end effect
    → rules card ability: run-end (if end condition met)
    → core ability: refresh-deck effect
    → core ability: round-start effect
      → core ability: turn-start effect
        → rules card ability: draw-cards
```

---

## Changes by File

### `src/utils/cards.ts`

#### `RulesCard` type (lines 79–97)

Remove `drawAmount`, `discardAmount` from `turnStructure`. Remove `endConditions`. Remove `effects`.

Before:
```ts
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
```

After:
```ts
turnStructure: {
  playAmount: number | 'any'
}
```

#### `coreGameFlowAbilities` (lines 12–44)

Add one new ability for the run-start → round-start transition:

```ts
{ trigger: { on: 'run-start' }, effects: [{ type: 'round-start', params: {} }] },
```

No other changes — the existing abilities already handle:
- `turn-end` (draw pile > 0) → `turn-start`
- `turn-end` (draw pile empty) → `round-end`
- `round-end` → `refresh-deck`
- `round-end` → `round-start`
- `round-start` → `turn-start`

#### Each rules card definition

1. Move `effects.gameStart` array contents into a new ability with `trigger: { on: 'run-start' }`.
2. This ability must come **before** `...coreGameFlowAbilities` in the abilities array so cards are added before `round-start` → `turn-start` → draw fires.
3. Remove `effects`, `endConditions`, `drawAmount`, `discardAmount` properties.

Example — `starterRules`:

Before:
```ts
turnStructure: { drawAmount: 2, playAmount: 1, discardAmount: 'all' },
endConditions: { rounds: 1 },
effects: {
  gameStart: [
    { type: 'add-cards', params: { location: 'drawPile', cards: { score: 7, 'collect-basic': 1 }, mode: 'shuffle' } },
  ],
},
abilities: [
  ...coreGameFlowAbilities,
  { trigger: { on: 'turn-start' }, effects: [{ type: 'draw-cards', params: { amount: 2 } }] },
  { trigger: { on: 'turn-end' }, effects: [{ type: 'discard-cards', params: { from: 'hand', amount: 'all' } }] },
  { trigger: { on: 'round-end' }, effects: [{ type: 'run-end', params: {} }] },
],
```

After:
```ts
turnStructure: { playAmount: 1 },
abilities: [
  // Game setup — must come before coreGameFlowAbilities
  {
    trigger: { on: 'run-start' },
    effects: [
      { type: 'add-cards', params: { location: 'drawPile', cards: { score: 7, 'collect-basic': 1 }, mode: 'shuffle' } },
    ],
  },
  ...coreGameFlowAbilities,
  { trigger: { on: 'turn-start' }, effects: [{ type: 'draw-cards', params: { amount: 2 } }] },
  { trigger: { on: 'turn-end' }, effects: [{ type: 'discard-cards', params: { from: 'hand', amount: 'all' } }] },
  { trigger: { on: 'round-end' }, effects: [{ type: 'run-end', params: {} }] },
],
```

Apply the same transformation to: `testRules`, `discardTestRules`, `moveTestRules`, `choiceTestRules`.

---

### `src/utils/run.ts`

#### `populateDrawPile` (lines 78–92)

Remove the shuffle — `refresh-deck` on first round-end handles shuffling.

```ts
export function populateDrawPile(run: Run): Run {
  const ids = toArray(run.deck.cards)
  const cardsToAdd = ids.map((id) => ({
    ...playableCards[id],
    instanceId: crypto.randomUUID(),
  }))
  return { ...run, cards: { ...run.cards, drawPile: cardsToAdd } }
}
```

#### `makeRun` (lines 124–134)

Unchanged — still calls `populateDrawPile`. Start stats at `turns: 0, rounds: 0` so that `round-start` → `turn-start` increments to `1, 1`.

#### `initializeRun` (lines 140–173)

Simplify to: create run, emit `run-start` event. Remove `processStartOfGame` and `drawFirstHand` calls.

```ts
export function initializeRun(gameState: GameState): GameState {
  const selectedDeckKey = gameState.ui.collection.selectedDeck
  if (!selectedDeckKey) throw new Error('Cannot initialize run: no deck selected')

  const deck = gameState.game.collection.decks[selectedDeckKey]
  if (!deck) throw new Error(`Cannot initialize run: deck ${selectedDeckKey} not found`)

  const run = makeRun(deck)
  const stateWithRun: GameState = {
    ...gameState,
    game: { ...gameState.game, run },
  }

  const runStartEvent: RunStartEvent = {
    type: 'run-start',
    round: run.stats.rounds,
    turn: run.stats.turns,
  }
  return handleEvent(stateWithRun, runStartEvent)
}
```

#### Delete

- `processStartOfGame` (lines 97–111)
- `drawFirstHand` (lines 116–119)

---

### `src/stores/game.ts`

#### `nextTurn()` (lines 169–208)

Replace entire body — emit a single `turn-end` event, then check for run-end.

```ts
function nextTurn() {
  const run = gameState.value.game.run
  if (!run || !run.deck.rulesCard) return

  const turnEndEvent: TurnEndEvent = {
    type: 'turn-end',
    round: run.stats.rounds,
    turn: run.stats.turns,
  }
  gameState.value = handleEvent(gameState.value, turnEndEvent)

  // If run-end occurred during ability processing, clean up
  if (gameState.value.game.run?.events.some((e) => e.type === 'run-end')) {
    endRun()
  }
}
```

#### `startNewRound()` (lines 210–243)

Delete entirely. The ability chain handles: `round-end` → `refresh-deck` + `round-start` → `turn-start` → draw.

#### `startRun()` (lines 75–78)

No change needed — `initializeRun` now handles the `run-start` event internally. Add the same run-end check:

```ts
function startRun() {
  gameState.value.ui.currentView = ['run']
  gameState.value = initializeRun(gameState.value)

  // Handle edge case: run-start abilities immediately ended the run
  if (gameState.value.game.run?.events.some((e) => e.type === 'run-end')) {
    endRun()
  }
}
```

#### Imports

- Remove `drawCards` import (no longer used)
- Add `handleEvent` import
- Add event type imports (`TurnEndEvent`)

#### Exports

Remove `startNewRound` from the return object.

---

### `src/utils/game.ts`

#### `drawCards` function (lines 63–96)

Delete entirely. After refactor, drawing only happens through the effect system via `draw-cards` effects in abilities.

Clean up the `drawCards` import from the store.

---

### `src/components/RunView.vue`

#### `isEndOfRun` computed (lines 20–29)

Currently reads `endConditions.rounds`, which is being removed. Replace with a draw-pile-empty check:

```ts
const isEndOfRun = computed(() => {
  return run.value.cards.drawPile.length === 0
})
```

This is a simpler heuristic: if the draw pile is empty, the next turn-end will trigger the round-end chain (which may end the run depending on the rules card's abilities). Not perfectly accurate for all future rules cards, but sufficient for now.

---

### `src/__tests__/game/run.spec.ts`

- Update `baseRules` and `rulesWithAddedCards` fixtures to match new `RulesCard` shape (remove `drawAmount`, `discardAmount`, `endConditions`, `effects`).
- Remove or rewrite `processStartOfGame` tests — that function no longer exists. Replace with tests that emit a `run-start` event and verify abilities fire.
- `populateDrawPile` test can stay, just verify cards are added (no shuffle assertion needed).
- `moveCardByIndex` and `moveCards` tests are unaffected.

### `src/__tests__/ability-processor.spec.ts`

- The `createTestRun` helper uses `starterRules` which will have the new shape — no changes needed to the helper itself.
- Existing double-choice tests should still pass since they test card-play abilities, not lifecycle.

---

## Notes

- **Ability ordering**: The `round-end` abilities on rules cards (e.g., `run-end` condition check) currently fire after `coreGameFlowAbilities`'s `refresh-deck` and `round-start`. This means a game-ending round still reshuffles before ending. We're accepting this for now and will address resolution ordering separately.
- **`stack` in `refresh-deck`**: `handleRefreshDeck` collects cards from `stack` but doesn't clear it in the output. Pre-existing issue, not introduced by this refactor.
- **`handleEffects` in `effects.ts`**: Loses its only caller (`processStartOfGame`). Can be kept as a general utility or removed.
