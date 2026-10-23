# Cricket Views

A responsive, zero-backend web dashboard that summarizes our `Team`'s `Season` performance, competition `Ladder`, `Last Match Result` (with next upcoming match preview), `Leaderboard` cards, and official PlayHQ `Season Statistics` combined with team-tracked `Manual Tallies`.

Published via GitHub Pages at **`https://haggis-breath.github.io/cricket_views/`**.

---

## Quick Weekly Update Workflow

After each round, update the dashboard in three steps and push to `main`:

### 1. Drop the PlayHQ CSV exports into the repository root

Export the two latest CSV files for the `Season` from the PlayHQ admin portal:

1. **Match Results CSV** (powers the `Last Match Result` and next `UPCOMING` match callout)
   - Replace `2026-10-23-match-results.csv` in the repository root with the newly exported match results CSV (or if you save it under a new date-stamped filename such as `YYYY-MM-DD-match-results.csv`, update the `defaultMatchResultsCsv` import at the top of `src/SeasonDashboard.tsx`).
2. **Combined Batting, Bowling & Fielding CSV** (powers `Season Statistics` and PlayHQ `Leaderboard` metrics)
   - Replace `2026-10-23-combined-batting-bowling-fielding.csv` in the repository root with the newly exported combined player stats CSV (or if using a new filename, update the `defaultCombinedStatsCsv` import in `src/SeasonDashboard.tsx`).

### 2. Update `data/season.json`

Open `data/season.json` and update:

- **Last Updated & `Last Match Result` selection (`season`)**:
  - Update `"lastUpdated"` to the latest completed round and date (e.g., `"Round 3 (24 Oct 2026)"`).
  - By default, the dashboard automatically selects the most recent completed (or non-upcoming) match from the Match Results CSV as the `Last Match Result`. If you ever need to pin a specific match date, set the optional `"selectedLastMatchDate"` field (e.g., `"2026-10-17"`).
- **Competition `Ladder` (`ladder`)**:
  - Update each team's `"position"`, `"played"`, `"won"`, `"lost"`, `"drawnOrNoResult"`, `"points"`, and `"percentage"` from the current PlayHQ `Ladder`.
- **`Manual Tallies` (`manualTallies`)**:
  - Update `"droppedCatches"` per player (merges into the Fielding `Season Statistics` table as `Drops` and powers the **Butterfingers** `Leaderboard` card).
  - Player names can be written in either `"Last, First"` or `"First Last"` format (case-insensitive) and will automatically match their PlayHQ profile.
  - To track additional custom `Manual Tallies` on the `Leaderboard`, add entries under `"customCategories"`:
    ```json
    "manualTallies": {
      "droppedCatches": {
        "Moffat, Andrew": 2,
        "Alistair Osborne": 1,
        "Ewan Bauer": 1
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
