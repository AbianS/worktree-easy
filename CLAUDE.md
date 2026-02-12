# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Worktree Easy is a VS Code extension for managing git worktrees. It provides a TreeView UI in the Activity Bar for creating, opening, and archiving git worktrees.

## Commands

```bash
# Install dependencies
pnpm install

# Build (type-check + lint + bundle)
pnpm run compile

# Watch mode (esbuild + tsc in parallel)
pnpm run watch

# Production build (type-check + lint + minified bundle)
pnpm run package

# Lint
pnpm run lint          # biome check src

# Type-check only
pnpm run check-types   # tsc --noEmit

# Run tests (requires compile first)
pnpm run test          # vscode-test

# Compile tests only
pnpm run compile-tests # tsc -p . --outDir out

# Publish
pnpm run release       # package + vsce publish
```

Tests use `@vscode/test-cli` and run inside an Electron-based VS Code instance. Test files live in `src/test/` and compile to `out/test/**/*.test.js`.

## Architecture

```
src/
├── extension.ts          # Entry point: activates on workspaceContains:.git
├── commands/              # Command handlers (create, open, archive worktrees)
├── providers/             # TreeDataProvider for worktree list in Activity Bar
├── services/              # Core logic
│   ├── git-service.ts     # Executes git CLI commands
│   ├── worktree-service.ts # Worktree lifecycle (list, create, remove, prune)
│   └── task-runner.ts     # Post-create task automation with variable substitution
├── ui/                    # StatusBarManager, quick-pick helpers
├── types/                 # Worktree, PostCreateTask, WorktreeCreateOptions interfaces
└── utils/                 # Configuration getter, custom error types
```

**Data flow**: User Action → Command → WorktreeService → GitService (git CLI) → UI Update

**Build**: esbuild bundles `src/extension.ts` → `dist/extension.js` (CommonJS, Node platform, `vscode` external).

## Code Style

- **Formatter/Linter**: Biome (not ESLint/Prettier)
- Single quotes, semicolons, trailing commas, 2-space indent, 80 char line width
- Filename convention: kebab-case
- Format and organize imports on save (VS Code workspace settings)

## Release

Uses changesets (`@changesets/cli`) for versioning. CI runs on PRs and pushes to `main`. Release workflow auto-creates release PRs and publishes to VS Code Marketplace.
