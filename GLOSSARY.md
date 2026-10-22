# Cricket Views

A responsive web dashboard that summarizes a single cricket team's season performance, competition standing, official PlayHQ player statistics, and team-tracked leaderboards.

## Language

**Team**:
The single cricket squad competing in a specific competition grade that this site tracks.
_Avoid_: Club, side, grade

**Season**:
A single competition campaign within which all matches, standings, and player statistics are aggregated.
_Avoid_: Tournament, year, series

**Last Match Result**:
A summary of the Team's most recently completed (or currently in-progress multi-day) fixture in the Season.
_Avoid_: Last game, match report, fixture

**Ladder**:
The current competition standings table ranking all teams in the grade by points and tie-breaker percentage/quotient.
_Avoid_: Current table, league table, standings

**Season Statistics**:
The official per-player Batting, Bowling, and Fielding tables for the Season, sourced from PlayHQ.
_Avoid_: Leaderboard, raw stats

**Leaderboard**:
Highlighted rank cards for specific single-metric categories (such as most ducks, most dropped catches, most runs, or most wickets), combining official PlayHQ metrics and Manual Tallies.
_Avoid_: Stats table, honour board

**Manual Tally**:
A player metric not captured by PlayHQ scorecards (such as dropped catches) that is maintained directly by the Team.
_Avoid_: Custom stat, override
