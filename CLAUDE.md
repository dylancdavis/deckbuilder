# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a ClojureScript deckbuilder game with an empty Vue.js template:

1. **ClojureScript Application** (`cljs-repo/`): A complete re-frame based deckbuilder game
2. **Vue.js Template** (root directory): Empty Vue 3 + TypeScript template (minimal setup only)

## Common Development Commands

### ClojureScript Application (cljs-repo/)
- `npm run dev` - Start Shadow CLJS development server (serves at http://localhost:8280)
- `npm run dev portfolio test` - Start dev server with portfolio and test builds
- `npm run release` - Build for production
- `npm run portfolio` - Start portfolio development server (serves at http://localhost:9800)
- `npm run test` - Run ClojureScript tests
- `npx shadow-cljs cljs-repl app` - Connect to browser REPL

### Vue.js Template (Root - Empty)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test:unit` - Run unit tests with Vitest
- `npm run lint` - Lint code with ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Architecture

### ClojureScript Application (Primary Project)
- **Framework**: re-frame (reactive framework built on Reagent/React)
- **Build Tool**: Shadow CLJS with hot reload
- **Development**: Shadow CLJS dashboard at http://localhost:9630
- **Testing**: Browser-based and Node.js test runners
- **Debug Tools**: CLJS DevTools and re-frame-10x for development builds
- **Entry Point**: `deckbuilder.core/init` function
- **Source Structure**: 
  - `src/deckbuilder/` - Main application code
  - `test/` - Test files
  - `portfolio/` - Component showcase
  - `resources/public/` - Static assets and compiled output

### Vue.js Template (Empty)
- **Framework**: Vue 3 with Composition API and TypeScript
- **Build Tool**: Vite
- **State Management**: Pinia (configured but unused)
- **Current State**: Contains only basic template structure with empty App.vue

## Development Notes

### ClojureScript Project
- Primary development should focus on the ClojureScript application in `cljs-repo/`
- Development builds enable re-frame tracing and debugging
- Portfolio system available for component development at port 9800
- Browser REPL available after connecting to running development server
- `debug?` variable in `config.cljs` controls development-only features

### Vue.js Project  
- Currently empty template - App.vue contains only basic structure
- Can be developed as separate frontend if needed
- Path alias `@/` maps to `src/` directory

## Key Files

- **ClojureScript**: `cljs-repo/src/deckbuilder/core.cljs`, `cljs-repo/shadow-cljs.edn`
- **Vue Template**: `src/App.vue` (empty), `src/main.ts`, `vite.config.ts`