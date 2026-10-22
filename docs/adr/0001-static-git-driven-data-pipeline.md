# Static Git-Driven Data Pipeline

We build `cricket_views` as a static web application backed by PlayHQ CSV exports and structured data files (`Ladder`, `Last Match Result`, and `Manual Tallies`) committed to the repository, rather than a live backend calling the PlayHQ API or a database-backed admin UI.

PlayHQ's official Public API requires an association-provisioned `x-api-key`, PlayHQ's CSV exports do not include the competition `Ladder` or `Last Match Result`, and `Manual Tallies` (like dropped catches) require human input regardless. Because club cricket matches occur weekly, committing updated CSV/data files to trigger a static deployment eliminates backend hosting, database maintenance, and authentication complexity while keeping the full season history version-controlled in Git.
