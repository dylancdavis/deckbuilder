# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commits

Make **atomic commits**: one logical change per commit.
Review diffs, confirm correctness, and use clear messages that describe what and why.
Commits made by Claude should be prefixed with [Claude], and should be one line only.

## Testing

Prefer **test-first development**: write or update tests to define expected behavior before implementing changes.  
Tests may be committed even if failing — they document intent and guide later fixes.  
Always verify changes by running tests before committing.

## Commands

### Code Quality

- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking with vue-tsc

### Testing

- `npm run test:unit` - Run unit tests with Vitest
- Test files are located in `src/__tests__/` with `.spec.ts` and `.spec.js` extensions

## Architecture

This is a Vue 3 + TypeScript deckbuilding game built with Vite. The application uses a single-page architecture with dynamic component rendering.

### Directory Structure

- `src/components/` - Vue components
- `src/composables/` - Reusable composition functions
- `src/stores/` - Pinia state management
- `src/utils/` - Game logic utilities
- `src/assets/css/` - Stylesheets organized by feature
- `src/__tests__/` - Unit tests
- `src/stories/` - Storybook stories
- `src/constants.ts` - Starting deck and game configuration

### Core Structure

**State Management**: Uses Pinia store (`src/stores/game.ts`) as the central state manager containing:

- Game state (collection, current run)
- UI state (current view, selected deck)
- View data (modals)

**View System**: The app renders different views based on `gameState.ui.currentView`:

- `collection` - Shows card collection and deck management
- `run` - Shows active game run with cards and resources

**Card System**: Two main card types defined in `src/utils/cards.ts`:

- `PlayableCard` - Cards that can be played in runs (have cost, effects, description)
- `RulesCard` - Cards that define game rules (deck limits, turn structure, end conditions)

**Game Flow**:

1. Player starts in collection view with access to decks and cards
2. Player can start a run with a selected deck (transitions to run view)
3. During runs, players draw cards, play cards, gain resources, and collect new cards
4. Runs end based on rules card conditions, returning to collection view

**Configuration**: Uses path alias `@` for `./src` directory

## Additional Instructions

- The `utils/utils.ts` contains functional, typed variants of common JS object methods, such as `keys`, `values`, and `entries`. Use these instead of object methods, and add additional functions if necessary
- Keep Claude.md and README.md up-to-date if making relevant changes.
