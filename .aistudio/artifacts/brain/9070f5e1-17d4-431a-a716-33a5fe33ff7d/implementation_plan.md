# Implementation Plan - Fix Missing Hues and Cues Catalog Cover Image on Deploy

## Root Cause
- In `src/data/seedData.ts`, all other board games reference their cover image from the Vite static `/public/images/` directory (e.g., `'/images/game_avalon.jpg'`, `'/images/game_cheese_thief_1794065328864.jpg'`), which Vite automatically copies into `dist/images/` during `npm run build` (for Vercel/production deployment).
- However, `game-hues-cues` had `coverImage: '/src/assets/images/game_hues_cues_1794295237258.jpg'`, and the file only existed in `/src/assets/images/`.
- In Vite, files inside `/src/assets/` referenced as plain string paths (without ES `import`) work in `vite dev`, but are **not** copied into `dist/` during `vite build`.

## Proposed Changes
1. **Static Asset Placement (`/public/images/` & `/public/src/assets/images/`)**:
   - Copy `/src/assets/images/game_hues_cues_1794295237258.jpg` into `/public/images/game_hues_cues_1794295237258.jpg` (and `/public/src/assets/images/game_hues_cues_1794295237258.jpg` as a fallback) so Vite includes it in `dist/` on every production build.
2. **Update Catalog Seed Path (`src/data/seedData.ts`)**:
   - Update `coverImage` for `game-hues-cues` in `src/data/seedData.ts` from `'/src/assets/images/game_hues_cues_1794295237258.jpg'` to `'/images/game_hues_cues_1794295237258.jpg'`, matching all other catalog games.

## Verification Plan
- Run `compile_applet` and `lint_applet` to verify the production build (`dist/images/game_hues_cues_1794295237258.jpg`) is generated cleanly.
