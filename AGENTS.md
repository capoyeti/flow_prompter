# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` houses Next.js App Router routes and layouts.
- Shared UI lives in `src/components/`, with app state in `src/stores/` and types in `src/types/`.
- Cross-cutting utilities and services live in `src/lib/` and `src/utils/`.
- Styling tokens are centralized in `src/theme/`, with config in `src/config/`.
- End-to-end tests are in `e2e/*.spec.ts` (Playwright).
- Static assets are in `public/`, and product notes live in `docs/`.
- Supabase schema and migrations are in `supabase/`.

## Build, Test, and Development Commands
- `npm run dev`: start the Next.js dev server on `http://localhost:3004`.
- `npm run build`: create a production build.
- `npm run start`: run the production server from `.next/`.
- `npm run lint`: run ESLint (Next.js + TypeScript).
- `npm run typecheck`: run `tsc --noEmit` for type safety.
- `npm run test:e2e`: run Playwright tests headlessly.
- `npm run test:e2e:ui`: open Playwright UI runner.
- `npm run test:e2e:headed`: run Playwright with a visible browser.

## Coding Style & Naming Conventions
- Follow the architecture rules in `CLAUDE.md` (feature co-location, logic in hooks, UI in TSX).
- Avoid `index.tsx`; file names should match their directory (e.g., `Feature/Feature.tsx`).
- Use theme tokens instead of inline styles or hard-coded colors.
- Keep formatting consistent with the existing codebase; run `npm run lint` before pushing.

## Testing Guidelines
- Add new Playwright specs in `e2e/` and name them `*.spec.ts`.
- Prefer coverage for critical flows; add unit tests only if you also add a runner and scripts.
- Keep tests readable and deterministic (stable selectors, no brittle timing).

## Commit & Pull Request Guidelines
- Commit messages follow a conventional pattern like `fix: ...`, sometimes with emoji (see `git log`).
- PRs should include a concise summary, test commands run, and screenshots for UI changes.
- Link related issues/notes and update docs when behavior or flows change.

## Agent-Specific Instructions
- Prioritize the “Fractal Architecture” and code standards described in `CLAUDE.md`.
