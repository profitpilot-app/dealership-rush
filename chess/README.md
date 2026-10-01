# Dealership Chess — playable prototype

A standalone dealership-themed chess game. This directory is independent of the older slot-game page at the repository root and of the BizzLotz/Inkora projects.

## Run

Requires Node.js 22.12+ (tested on Node 24).

```sh
cd chess
npm ci
npm run dev
```

Production build: `npm run build`. Serve `dist/` at a website root. Render static-site settings would be root directory `chess`, build `npm ci && npm run build`, publish directory `dist`. This change does not create or deploy a Render service.

## Implemented

- Standard chess through chess.js: turn enforcement, king safety, castling, en passant, choice of promotion, checkmate and draws.
- Local two-player and a basic two-ply computer opponent in a Web Worker. The computer has no claimed rating.
- Procedural Three.js dealership pieces, crimson versus cobalt, animated movement/capture, knight hops, castling animation and board rotation.
- Original synthesized sound cues for selection, movement, capture, check, promotion and mate. Sound toggle and reduced-motion setting persist locally.
- Accessible 2D board option and automatic 2D fallback if WebGL cannot initialize.
- Local PGN autosave, move history, undo, confirmed new game, PGN export.
- Responsive desktop/mobile layout.

## Piece mapping

| Chess | Dealership |
|---|---|
| King | General Manager with keys |
| Queen | Closer with folder |
| Bishop | Finance Manager with contract |
| Knight | Service Technician with wrench |
| Rook | Showroom |
| Pawn | Salesperson |

Crimson uses the standard white side and moves first. Saved games use standard chess notation.

## Validation

```sh
npm test
npx playwright install chromium
npm run test:ui
npm run build
```

Verified on 2026-10-01: 8 rules tests and 3 browser tests passed; the production build passed. Browser checks used headless Chromium with software WebGL. Physical iPhone testing and listening checks on real hardware remain outstanding. Vite reports a bundle-size advisory for the Three.js-containing main chunk (about 152 KB gzip).

The tests cover illegal moves, castling and castling through check, en passant, underpromotion, checkmate/stalemate, PGN restoration, immediate mate selection by the computer, and browser interactions.

## Scope and next work

This is a browser prototype, not an iOS binary or an App Store submission. Models are deliberately simplified procedural geometry, not the detailed rigged characters in the concept art. Sounds are short synthesized cues, not recorded showroom effects. No multiplayer server, accounts, Supabase project, Stripe charges, analytics, or monetization have been added. Games are saved only on the current browser; clearing browser storage deletes that save.

Next release steps: refine/custom-model the pieces, package and test a separate iOS app, add real-device performance/accessibility validation, then prepare App Store metadata. Account and online multiplayer features require a separate backend design.

Runtime packages are version-pinned in package-lock.json. The interface uses Google Fonts when available, with local system-font fallbacks. Game logic and graphics are bundled; there is no runtime CDN dependency for them.
