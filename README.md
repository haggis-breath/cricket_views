# Cricket Views

A responsive, zero-backend web dashboard that summarizes our `Team`'s `Season` performance, competition `Ladder`, `Last Match Result` (with next upcoming match preview), `Leaderboard` cards, and official PlayHQ `Season Statistics` combined with team-tracked `Manual Tallies`.

Published via GitHub Pages at **`https://haggis-breath.github.io/cricket_views/`**.

---

## Quick Weekly Update Workflow

After each round, update the dashboard in three steps and push to `main`:

### 1. Drop the PlayHQ CSV exports into the repository root

Export the two latest CSV files for the `Season` from the PlayHQ admin portal and save them in the repository root with date-stamped filenames:

1. **Match Results CSV** as `YYYY-MM-DD-match-results.csv` (powers the `Last Match Result` and next `UPCOMING` match callout)
2. **Combined Batting, Bowling & Fielding CSV** as `YYYY-MM-DD-combined-batting-bowling-fielding.csv` (powers `Season Statistics` and PlayHQ `Leaderboard` metrics)

Then point the `defaultMatchResultsCsv` and `defaultCombinedStatsCsv` imports at the top of `src/SeasonDashboard.tsx` at the new filenames:

```ts
import defaultMatchResultsCsv from '../YYYY-MM-DD-match-results.csv?raw'
import defaultCombinedStatsCsv from '../YYYY-MM-DD-combined-batting-bowling-fielding.csv?raw'
```

> **Note:** Keep the `2026-10-23-*.csv` files. They are fixed test fixtures used by `src/SeasonDashboard.test.tsx`, not live data. Older weekly exports can be deleted once replaced.

### 2. Update `data/season.json`

Open `data/season.json` and update:

- **Last Updated & `Last Match Result` selection (`season`)**:
  - Update `"lastUpdated"` to the latest completed round and date (e.g., `"Round 3 (24 Oct 2026)"`).
  - By default, the dashboard automatically selects the most recent completed (or non-upcoming) match from the Match Results CSV as the `Last Match Result`. If you ever need to pin a specific match date, set the optional `"selectedLastMatchDate"` field (e.g., `"2026-10-17"`).
- **Competition `Ladder` (`ladder`)**:
  - Update each team's `"position"`, `"played"`, `"won"`, `"lost"`, `"drawnOrNoResult"`, `"points"`, and `"percentage"` (NRR) from the current PlayHQ `Ladder`. Rows are displayed in `"position"` order, so copy positions exactly as PlayHQ shows them.
- **`Manual Tallies` (`manualTallies`)**:
  - Update `"droppedCatches"` per player (merges into the Fielding `Season Statistics` table as `Drops` and powers the **Butterfingers** `Leaderboard` card).
  - These are **cumulative Season totals**: add each round's drops onto the existing numbers rather than replacing them.
  - Player names can be written in either `"Last, First"` or `"First Last"` format (case-insensitive) and will automatically match their PlayHQ profile.
  - To track additional custom `Manual Tallies` on the `Leaderboard`, add entries under `"customCategories"`:
    ```json
    "manualTallies": {
      "droppedCatches": {
        "Craig Hearnden": 4,
        "Moffat, Andrew": 2,
        "Alistair Osborne": 1
      },
      "customCategories": [
        {
          "id": "fines-tin",
          "title": "Fines Tin",
          "unitLabel": "Fines",
          "tallies": {
            "Thomas Peeters": 3,
            "Kale Hook": 1
          }
        }
      ]
    }
    ```

### 3. Commit and push to `main`

```bash
git add .
git commit -m "chore: update Round X stats and ladder"
git push origin main
```

Pushing to `main` triggers the `.github/workflows/deploy.yml` GitHub Actions workflow, which runs `npm run typecheck`, `npm test`, and `npm run build` before automatically publishing the static `./dist` artifact to GitHub Pages.

> **Note:** The repository's Pages source must be set to **GitHub Actions** (Settings → Pages → Build and deployment → Source). If it is set to "Deploy from a branch", GitHub publishes the raw source instead of `./dist` and the site renders as a blank page.

---

## Local Development

```bash
# Install dependencies
npm install

# Start the local dev server
npm run dev

# Run typechecking
npm run typecheck

# Run the automated test suite
npm test

# Build the production static bundle (configured with base: '/cricket_views/')
npm run build
```
