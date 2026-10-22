# Static Git-Driven Data Pipeline

We build `cricket_views` as a static web application backed by PlayHQ CSV exports (`*-combined-batting-bowling-fielding.csv` and `*-match-results.csv`) and a structured repository data file (`data/season.json` for `Team` metadata, the competition `Ladder`, and `Manual Tallies`), rather than a live backend calling the PlayHQ API or a database-backed admin UI.

PlayHQ's official Public API requires an association-provisioned `x-api-key`, PlayHQ does not export the competition `Ladder` as a CSV, and `Manual Tallies` (like dropped catches) require human input regardless. Because club cricket matches occur weekly, dropping the two PlayHQ CSV exports into the repo and updating `data/season.json` to trigger a static GitHub Pages deployment eliminates backend hosting, database maintenance, and authentication complexity while keeping the full season history version-controlled in Git.
