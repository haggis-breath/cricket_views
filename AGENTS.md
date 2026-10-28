# Agent Guidelines

## Context & Architecture
- **Purpose**: Single-page static web dashboard for a local recreational cricket team (Tech College / Beresfield Memorial), published via GitHub Pages.
- **Tech Stack**: React 19, TypeScript, Vite, Tailwind CSS v4.
- **Data Flow**: Zero-backend. Data is read from static files at build time: `data/season.json` and weekly PlayHQ CSV exports in the repository root.
- **Core Files**:
  - `src/SeasonDashboard.tsx`: Main UI component.
  - `src/seasonStats.ts`: Parsing and calculation of batting, bowling, fielding, and leaderboard stats.
  - `src/matchResults.ts`: Parsing of match results and fixtures.
  - `data/season.json`: Team metadata, season info, competition ladder, and manual tallies.

## Operating Principles: Pragmatic & Lean

This project has a small footprint and low complexity. Agents working in this repo must be pragmatic to keep model usage and token overhead minimal:

1. **Direct In-Place Edits**:
   - Implement requested features and styling tweaks directly in the existing components or create a single lean mockup component if a preview is requested.
   - Do not generate multi-variant prototype switchers (e.g. `VariantA`, `VariantB`, `VariantC`) or throwaway branch structures unless the user explicitly asks for multiple options to compare.

2. **No Unsolicited Subagents**:
   - Do not invoke background subagents (`invoke_subagent`) or spawn parallel agent threads. Perform all inspection, research, and coding directly in the primary session.

3. **Skip Heavy Process Ceremony**:
   - Do not create formal specifications, ticket breakdowns, ADRs, or glossary updates for routine UI, styling, or stat-parsing tasks.
   - Address user requests directly with clean code rather than multi-phase interview/interview-prep workflows.

4. **Verification**:
   - Run `npm test` (`src/SeasonDashboard.test.tsx`) and `npm run typecheck` to verify changes without introducing rigid TDD ceremonies.
   - Preserve existing behavior and test coverage for CSV parsing and stat calculations.

5. **Weekly Updates**:
   - For weekly stats updates, follow the simple 3-step workflow documented in `README.md`.
