# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with hot-reload
- `npm run build` - Type-check, compile and minify for production
- `npm run preview` - Preview production build locally

### Code Quality
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking with vue-tsc

### Testing
- `npm run test:unit` - Run unit tests with Vitest
- Test files are located in `src/__tests__/` with `.spec.ts` and `.spec.js` extensions

## Architecture

This is a Vue 3 + TypeScript deckbuilding game built with Vite. The application uses a single-page architecture with dynamic component rendering.

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

### Key Components
- `App.vue` - Root component with view router logic
- `CollectionView.vue` - Collection and deck management interface
- `RunView.vue` - Active game run interface
- `CardItem.vue` - Individual card display component

### Game Flow
1. Player starts in collection view with access to decks and cards
2. Player can start a run with a selected deck (transitions to run view)
3. During runs, players draw cards, play cards, gain resources
4. Runs end based on rules card conditions, returning to collection view

### Utilities
- `src/utils/` contains game logic utilities for cards, decks, collections, runs, and counters
- `src/constants.ts` defines the starting deck configuration
- CSS is organized by feature in `src/assets/css/`

### Configuration
- Uses path alias `@` for `./src` directory
- Vite configuration includes Vue DevTools plugin for development
- TypeScript configuration uses Vue-specific TSC compilation