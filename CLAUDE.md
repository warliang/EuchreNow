# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Developer Profile

- Solo developer
- Strong in frontend (React, TypeScript, CSS)
- Less experienced with backend (Node.js, Express, Socket.io) and databases
  (PostgreSQL, Redis) — provide clear explanations for backend patterns,
  queries, and architecture decisions
- Include pros vs cons when recommending approaches

## Domain Reference

- Full game rules: see README.md (Euchre rules, scoring, house rules)
- Left Bower belongs to the trump suit during play, not its printed suit

## Commands

### Root (run from repo root)

```bash
npm run dev        # Run client + server concurrently
npm run client     # Client dev server only (Vite, port 5173)
npm run server     # Server only (Node --watch)
```

## Testing

Tests are not yet implemented in any package (placeholder scripts only).

## Architecture

This is a **monorepo** (`apps/*` + `packages/*` workspaces) for a real-time multiplayer Euchre card game.

## Conventions

- Game engine functions must remain pure — no side effects, no external dependencies
- Socket event handlers go in `apps/server/src/socket/events/`
- Prefer immutable patterns: return new GameState, never mutate
- All functions must have TypeScript return types
- Use human-readable callback parameter names (e.g., `currPlayer` not `p`) when iterating over arrays

### Three-Layer Design

**`packages/game-engine/`** — Pure game logic, zero external dependencies, exported as `@euchrenow/game-engine`.

- All functions are **immutable**: they accept `GameState` and return a new `GameState`.
- Entry point: `src/index.ts` — exports ~15 functions grouped by lifecycle phase (create, bid, play, score, etc.).
- Key modules: `game.ts` (orchestration), `types.ts` (all shared types), `bidding.ts`, `trick.ts`, `scoring.ts`, `utils.ts`.

**`apps/server/`** — Express HTTP + Socket.io backend.

- `src/index.ts`: Server bootstrap, `GET /health`.
- `src/room/roomManager.ts`: In-memory room/player management (TODO: migrate to Redis).
- `src/socket/index.ts`: Registers all Socket.io event handlers.
- `src/socket/events/`: Lobby and game event handler implementations — call game-engine functions, emit updated state back to room.

**`apps/client/`** — React 19 + Vite frontend. Currently scaffolded (Vite template); game UI not yet implemented.

### Data Flow

```
Client  --socket event-->  Server handler
                              └─ calls game-engine pure function(s)
                              └─ emits updated GameState to all clients in room
Client  <--socket event--  Server
```

### Socket.io Event Contract

**Client → Server** (11 events):

- Lobby: `lobby:create`, `lobby:join`, `lobby:leave`, `lobby:ready`, `lobby:start`
- Game: `game:orderUp`, `game:pass`, `game:nameTrump`, `game:dealerSwap`, `game:playCard`, `game:nextHand`

**Server → Client** (3 events):

- `room:updated` — Updated `Room` state
- `game:stateUpdated` — Updated `GameState`
- `game:error` — Error string

### Planned Infrastructure (not yet implemented)

- PostgreSQL for game persistence
- Redis for active game state caching (server currently uses in-memory `Map`)
