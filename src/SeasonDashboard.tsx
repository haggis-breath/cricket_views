import { useState } from 'react'
import defaultSeasonData from '../data/season.json'
import defaultMatchResultsCsv from '../2026-10-23-match-results.csv?raw'
import defaultCombinedStatsCsv from '../2026-10-23-combined-batting-bowling-fielding.csv?raw'
import {
  formatMatchDate,
  isByeMatch,
  isSameTeam,
  parseMatchResults,
  resolveOpponentLabel,
  resolveResultSummary,
  selectLastMatch,
  selectNextUpcomingMatch,
} from './matchResults'
import {
  type ManualTalliesConfig,
  STATS_DISCIPLINES,
  STATS_DISCIPLINE_ORDER,
  type SortDirection,
  type StatsDiscipline,
  buildLeaderboardCards,
  parseSeasonStats,
} from './seasonStats'

export interface TeamMetadata {
  name: string
  club: string
  grade: string
  association: string
  playhqUrl: string
}

export interface SeasonMetadata {
  title: string
  lastUpdated: string
  selectedLastMatchDate?: string
}

export interface LadderEntry {
  position: number
  team: string
  played: number
  won: number
  lost: number
  drawnOrNoResult: number
  points: number
  percentage: number
}

export interface SeasonConfig {
  team: TeamMetadata
  season: SeasonMetadata
  ladder?: LadderEntry[]
  manualTallies?: ManualTalliesConfig
}

export interface SeasonDashboardProps {
  seasonJson?: SeasonConfig | string
  matchResultsCsv?: string
  combinedStatsCsv?: string
}

const ORDINAL_LABELS: Record<number, string> = {
  1: '1st Innings',
  2: '2nd Innings',
  3: '3rd Innings',
  4: '4th Innings',
}

function parseSeasonConfig(input: SeasonConfig | string): SeasonConfig {
  if (typeof input === 'string') {
    return JSON.parse(input) as SeasonConfig
  }
  return input
}

interface MobileToggleProps {
  expanded: boolean
  onToggle: () => void
  controls: string
  showLabel: string
  hideLabel: string
  className?: string
}

/**
 * Disclosure button shown only below the `sm` breakpoint. The content it
 * controls should use `hidden sm:<display>` while collapsed so it is always
 * visible on larger screens regardless of this toggle's state.
 */
function MobileToggle({
  expanded,
  onToggle,
  controls,
  showLabel,
  hideLabel,
  className = '',
}: MobileToggleProps) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onToggle}
      className={`inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700/60 sm:hidden ${className}`}
    >
      <span>{expanded ? hideLabel : showLabel}</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 10 10"
        className={`h-2.5 w-2.5 fill-current transition-transform ${
          expanded ? 'rotate-180' : ''
        }`}
      >
        <path d="M1 3h8L5 8z" />
      </svg>
    </button>
  )
}

// Literal class strings so Tailwind's source scanner picks them up.
const MOBILE_COLLAPSED_CLASSES = {
  block: 'hidden sm:block',
  'table-row': 'hidden sm:table-row',
  'inline-flex': 'hidden sm:inline-flex',
} as const

/** Classes for content collapsed on mobile but always shown at `sm`+. */
function mobileCollapse(
  expanded: boolean,
  display: keyof typeof MOBILE_COLLAPSED_CLASSES = 'block',
) {
  return expanded ? '' : MOBILE_COLLAPSED_CLASSES[display]
}

export function SeasonDashboard({
  seasonJson = defaultSeasonData,
  matchResultsCsv = defaultMatchResultsCsv,
  combinedStatsCsv = defaultCombinedStatsCsv,
}: SeasonDashboardProps) {
  const [activeStatsTab, setActiveStatsTab] =
    useState<StatsDiscipline>('batting')
  const [sortStateByTab, setSortStateByTab] = useState<
    Record<StatsDiscipline, { header: string; direction: SortDirection }>
  >({
    batting: {
      header: STATS_DISCIPLINES.batting.defaultSortHeader,
      direction: STATS_DISCIPLINES.batting.defaultSortDirection,
    },
    bowling: {
      header: STATS_DISCIPLINES.bowling.defaultSortHeader,
      direction: STATS_DISCIPLINES.bowling.defaultSortDirection,
    },
    fielding: {
      header: STATS_DISCIPLINES.fielding.defaultSortHeader,
      direction: STATS_DISCIPLINES.fielding.defaultSortDirection,
    },
  })
  const config = parseSeasonConfig(seasonJson)
  const [lastMatchExpanded, setLastMatchExpanded] = useState(false)
  const [ladderExpanded, setLadderExpanded] = useState(false)
  const [statsExpanded, setStatsExpanded] = useState(false)
  const [expandedLeaderboardCards, setExpandedLeaderboardCards] = useState<
    Record<string, boolean>
  >({})
  const { team, season } = config
  const ladderRows = [...(config.ladder ?? [])].sort(
    (a, b) => a.position - b.position,
  )
  const ourLadderIndex = ladderRows.findIndex((entry) =>
    isSameTeam(entry.team, team.name),
  )
  // On mobile the collapsed ladder shows our Team plus the rows either side.
  // If our Team is not on the ladder, fall back to the top three.
  const isLadderRowInCollapsedView = (index: number) =>
    ourLadderIndex === -1 ? index < 3 : Math.abs(index - ourLadderIndex) <= 1
  const matches = parseMatchResults(matchResultsCsv)
  const lastMatch = selectLastMatch(matches, season.selectedLastMatchDate)
  const nextUpcomingMatch = selectNextUpcomingMatch(matches)
  const playerStats = parseSeasonStats(combinedStatsCsv, config.manualTallies)
  const leaderboardCards = buildLeaderboardCards(
    playerStats,
    config.manualTallies,
  )
  const activeDiscipline = STATS_DISCIPLINES[activeStatsTab]
  const activeStatsColumns = activeDiscipline.columns
  const activeSort = sortStateByTab[activeStatsTab]
  const activeStatsRows = activeDiscipline.sortPlayers(
    playerStats,
    activeSort.header,
    activeSort.direction,
  )

  const handleSortColumnClick = (header: string, defaultDirection: SortDirection = 'desc') => {
    setSortStateByTab((prev) => {
      const current = prev[activeStatsTab]
      if (current.header === header) {
        return {
          ...prev,
          [activeStatsTab]: {
            header,
            direction: current.direction === 'desc' ? 'asc' : 'desc',
          },
        }
      }
      return {
        ...prev,
        [activeStatsTab]: {
          header,
          direction: defaultDirection,
        },
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <span>{team.association}</span>
                <span aria-hidden="true">•</span>
                <span>{team.grade}</span>
                <span aria-hidden="true">•</span>
                <span>{season.title}</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {team.name}
              </h1>
              <p className="mt-1 text-sm text-slate-400">{team.club}</p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300">
                Last updated: {season.lastUpdated}
              </span>
              <a
                href={team.playhqUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500"
              >
                View on PlayHQ
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <section
            aria-labelledby="last-match-result-heading"
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg"
          >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <h2
              id="last-match-result-heading"
              className="text-lg font-bold tracking-tight text-white"
            >
              Last Match Result
            </h2>
            {lastMatch && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="font-semibold text-emerald-400">
                  {lastMatch.roundName}
                </span>
                <span aria-hidden="true">•</span>
                <span>{formatMatchDate(lastMatch.matchDate)}</span>
                {lastMatch.format && (
                  <>
                    <span aria-hidden="true">•</span>
                    <span>{lastMatch.format}</span>
                  </>
                )}
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                  {lastMatch.status}
                </span>
              </div>
            )}
          </div>

          {lastMatch ? (
            <div className="mt-5 space-y-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-950/30 px-4 py-3 text-sm border border-emerald-900/50">
                  <span className="font-semibold text-emerald-300">
                    {resolveResultSummary(lastMatch, team.name)}
                  </span>
                  {lastMatch.venue &&
                    lastMatch.venue.toLowerCase() !== 'no venue' && (
                      <span className="text-xs text-slate-400">
                        Venue: {lastMatch.venue}
                      </span>
                    )}
                </div>
                {(!isByeMatch(lastMatch) || lastMatch.innings.length > 0) && (
                  <MobileToggle
                    expanded={lastMatchExpanded}
                    onToggle={() => setLastMatchExpanded((v) => !v)}
                    controls="last-match-details"
                    showLabel="Show full result"
                    hideLabel="Hide full result"
                  />
                )}
              </div>

              <div
                id="last-match-details"
                className={`space-y-5 ${mobileCollapse(lastMatchExpanded)}`}
              >
                {!isByeMatch(lastMatch) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        label: 'Home',
                        teamName: lastMatch.homeTeam,
                        score: lastMatch.homeTeamScore,
                      },
                      {
                        label: 'Away',
                        teamName: lastMatch.awayTeam,
                        score: lastMatch.awayTeamScore,
                      },
                    ].map((side) => (
                      <div
                        key={side.label}
                        className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                      >
                        <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
                          {side.label}
                        </div>
                        <div className="mt-1 flex items-baseline justify-between gap-2">
                          <span className="font-semibold text-white">
                            {side.teamName}
                          </span>
                          <span className="font-mono text-lg font-bold text-emerald-400">
                            {side.score || '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {lastMatch.innings.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Innings Breakdown
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {lastMatch.innings.map((inn) => (
                        <div
                          key={inn.inningsNumber}
                          className="rounded-xl border border-slate-800/90 bg-slate-950/40 p-3.5 text-xs"
                        >
                          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90">
                            {ORDINAL_LABELS[inn.inningsNumber] ??
                              `Innings ${inn.inningsNumber}`}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-200">
                              {inn.team}
                            </span>
                            <span className="font-mono font-bold text-slate-100">
                              {inn.score}
                            </span>
                          </div>
                          {inn.closureType && (
                            <div className="mt-0.5 text-[11px] text-slate-400">
                              {inn.closureType}
                            </div>
                          )}
                          {(inn.battingPerformances.length > 0 ||
                            inn.bowlingPerformances.length > 0) && (
                            <div className="mt-2.5 space-y-1.5 border-t border-slate-800/80 pt-2">
                              {inn.battingPerformances.length > 0 && (
                                <div>
                                  <span className="font-medium text-slate-400">
                                    Batting:{' '}
                                  </span>
                                  <span className="text-slate-200">
                                    {inn.battingPerformances.join(', ')}
                                  </span>
                                </div>
                              )}
                              {inn.bowlingPerformances.length > 0 && (
                                <div>
                                  <span className="font-medium text-slate-400">
                                    Bowling:{' '}
                                  </span>
                                  <span className="text-slate-200">
                                    {inn.bowlingPerformances.join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              No match results recorded yet.
            </p>
          )}

          {nextUpcomingMatch && lastMatch !== nextUpcomingMatch && (
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Next Fixture
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    {nextUpcomingMatch.roundName}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {nextUpcomingMatch.result ||
                    formatMatchDate(nextUpcomingMatch.matchDate)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-white">
                  {resolveOpponentLabel(nextUpcomingMatch, team.name)}
                </span>
                {nextUpcomingMatch.venue && (
                  <span className="text-xs text-slate-400">
                    {nextUpcomingMatch.venue}
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        <section
          aria-labelledby="ladder-heading"
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <h2
              id="ladder-heading"
              className="text-lg font-bold tracking-tight text-white"
            >
              Ladder
            </h2>
            {ladderRows.some((_, i) => !isLadderRowInCollapsedView(i)) && (
              <MobileToggle
                expanded={ladderExpanded}
                onToggle={() => setLadderExpanded((v) => !v)}
                controls="ladder-table"
                showLabel="Show full ladder"
                hideLabel="Show fewer"
              />
            )}
          </div>

          {ladderRows.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table
                id="ladder-table"
                className="w-full border-collapse text-left text-xs sm:text-sm"
              >
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th scope="col" className="py-2.5 pr-2 text-center">
                      Pos
                    </th>
                    <th scope="col" className="py-2.5 px-2">
                      Team
                    </th>
                    <th scope="col" className="py-2.5 px-1.5 text-right">
                      P
                    </th>
                    <th scope="col" className="py-2.5 px-1.5 text-right">
                      W
                    </th>
                    <th scope="col" className="py-2.5 px-1.5 text-right">
                      L
                    </th>
                    <th scope="col" className="py-2.5 px-1.5 text-right">
                      D/NR
                    </th>
                    <th scope="col" className="py-2.5 px-2 text-right">
                      Pts
                    </th>
                    <th scope="col" className="py-2.5 pl-2 text-right">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {ladderRows.map((entry, index) => {
                    const isOurTeam = isSameTeam(entry.team, team.name)
                    const collapseClasses = isLadderRowInCollapsedView(index)
                      ? ''
                      : mobileCollapse(ladderExpanded, 'table-row')
                    return (
                      <tr
                        key={entry.position}
                        aria-current={isOurTeam ? 'true' : undefined}
                        className={`${
                          isOurTeam
                            ? 'bg-emerald-950/50 text-emerald-200 ring-1 ring-inset ring-emerald-500/40'
                            : 'text-slate-200 hover:bg-slate-800/30'
                        } ${collapseClasses}`}
                      >
                        <td className="py-2.5 pl-2 pr-2 text-center font-mono text-xs text-slate-400">
                          {entry.position}
                        </td>
                        <td
                          className={`py-2.5 px-2 ${
                            isOurTeam
                              ? 'font-bold text-emerald-300'
                              : 'font-medium text-white'
                          }`}
                        >
                          {entry.team}
                        </td>
                        <td className="py-2.5 px-1.5 text-right font-mono">
                          {entry.played}
                        </td>
                        <td className="py-2.5 px-1.5 text-right font-mono">
                          {entry.won}
                        </td>
                        <td className="py-2.5 px-1.5 text-right font-mono">
                          {entry.lost}
                        </td>
                        <td className="py-2.5 px-1.5 text-right font-mono">
                          {entry.drawnOrNoResult}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-white">
                          {entry.points}
                        </td>
                        <td className="py-2.5 pl-2 pr-2 text-right font-mono text-slate-300">
                          {entry.percentage.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              No ladder entries available.
            </p>
          )}
        </section>
        </div>

        <section
          aria-labelledby="leaderboard-heading"
          className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <h2
              id="leaderboard-heading"
              className="text-lg font-bold tracking-tight text-white"
            >
              Leaderboard
            </h2>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leaderboardCards.map((card) => {
              const headingId = `leaderboard-card-${card.id}`
              const runnersUpId = `leaderboard-runners-up-${card.id}`
              return (
                <article
                  key={card.id}
                  aria-labelledby={headingId}
                  className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        id={headingId}
                        className="text-xs font-bold uppercase tracking-wider text-emerald-400"
                      >
                        {card.title}
                      </h3>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                        {card.unitLabel}
                      </span>
                    </div>

                    {card.leaders.length > 0 ? (
                      <div className="mt-3 rounded-lg border border-emerald-900/40 bg-emerald-950/25 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                                #1
                              </span>
                              <span className="font-bold text-white">
                                {card.leaders.map((l) => l.playerName).join(', ')}
                              </span>
                            </div>
                            {card.leaders[0].supportingContext && (
                              <div className="mt-1 text-xs text-slate-300">
                                {card.leaders
                                  .map((l) => l.supportingContext)
                                  .filter(Boolean)
                                  .join(' | ')}
                              </div>
                            )}
                          </div>
                          <span className="font-mono text-2xl font-extrabold text-emerald-400">
                            {card.leaders[0].primaryValue}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-slate-400">
                        No entries recorded yet.
                      </p>
                    )}

                    {card.runnersUp.length > 0 && (
                      <>
                        <MobileToggle
                          expanded={!!expandedLeaderboardCards[card.id]}
                          onToggle={() =>
                            setExpandedLeaderboardCards((prev) => ({
                              ...prev,
                              [card.id]: !prev[card.id],
                            }))
                          }
                          controls={runnersUpId}
                          showLabel="Show runners-up"
                          hideLabel="Hide runners-up"
                          className="mt-3"
                        />
                        <ol
                          id={runnersUpId}
                          className={`mt-3 divide-y divide-slate-800/60 text-xs ${mobileCollapse(
                            !!expandedLeaderboardCards[card.id],
                          )}`}
                        >
                          {card.runnersUp.map((entry) => (
                            <li
                              key={entry.playerKey}
                              className="flex items-center justify-between gap-2 py-1.5"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[11px] font-semibold text-slate-400">
                                  #{entry.rank}
                                </span>
                                <span className="truncate font-medium text-slate-200">
                                  {entry.playerName}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-slate-100">
                                {entry.primaryValue}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section
          aria-labelledby="season-statistics-heading"
          className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg"
        >
          <div className="flex flex-col gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="season-statistics-heading"
                className="text-lg font-bold tracking-tight text-white"
              >
                Season Statistics
              </h2>
              <MobileToggle
                expanded={statsExpanded}
                onToggle={() => setStatsExpanded((v) => !v)}
                controls="season-statistics-body"
                showLabel="Show statistics"
                hideLabel="Hide statistics"
              />
            </div>
            <div
              role="tablist"
              aria-label="Season Statistics disciplines"
              className={`rounded-xl border border-slate-800 bg-slate-950/80 p-1 ${
                mobileCollapse(statsExpanded, 'inline-flex') || 'inline-flex'
              }`}
            >
              {STATS_DISCIPLINE_ORDER.map((tab) => {
                const isSelected = activeStatsTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setActiveStatsTab(tab.id)}
                    className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div
            id="season-statistics-body"
            className={`mt-4 overflow-x-auto ${mobileCollapse(statsExpanded)}`}
          >
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th
                    scope="col"
                    aria-sort={
                      activeSort.header === 'Player'
                        ? activeSort.direction === 'desc'
                          ? 'descending'
                          : 'ascending'
                        : 'none'
                    }
                    className="sticky left-0 z-10 bg-slate-900 py-2.5 pr-4 pl-2"
                  >
                    <button
                      type="button"
                      onClick={() => handleSortColumnClick('Player', 'asc')}
                      className={`inline-flex items-center gap-1 uppercase tracking-wider transition ${
                        activeSort.header === 'Player'
                          ? 'font-bold text-emerald-400'
                          : 'font-semibold text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>Player</span>
                      {activeSort.header === 'Player' && (
                        <span
                          aria-hidden="true"
                          className="inline-flex items-center"
                        >
                          <svg
                            viewBox="0 0 10 10"
                            className="h-2.5 w-2.5 fill-current"
                          >
                            {activeSort.direction === 'desc' ? (
                              <path d="M1 3h8L5 8z" />
                            ) : (
                              <path d="M1 7h8L5 2z" />
                            )}
                          </svg>
                        </span>
                      )}
                    </button>
                  </th>
                  {activeStatsColumns.map((col, idx) => {
                    const isActiveSort = activeSort.header === col.header
                    const ariaSort = isActiveSort
                      ? activeSort.direction === 'desc'
                        ? 'descending'
                        : 'ascending'
                      : 'none'
                    return (
                      <th
                        key={col.header}
                        scope="col"
                        aria-sort={ariaSort}
                        className={`py-2.5 text-right ${
                          idx === activeStatsColumns.length - 1
                            ? 'pl-2 pr-2'
                            : 'px-2'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleSortColumnClick(
                              col.header,
                              col.defaultDirection ?? 'desc',
                            )
                          }
                          className={`inline-flex items-center justify-end gap-1 uppercase tracking-wider transition ${
                            isActiveSort
                              ? 'font-bold text-emerald-400'
                              : 'font-semibold text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span>{col.header}</span>
                          {isActiveSort && (
                            <span
                              aria-hidden="true"
                              className="inline-flex items-center"
                            >
                              <svg
                                viewBox="0 0 10 10"
                                className="h-2.5 w-2.5 fill-current"
                              >
                                {activeSort.direction === 'desc' ? (
                                  <path d="M1 3h8L5 8z" />
                                ) : (
                                  <path d="M1 7h8L5 2z" />
                                )}
                              </svg>
                            </span>
                          )}
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {activeStatsRows.map((player) => (
                  <tr
                    key={player.playerKey}
                    className="text-slate-200 hover:bg-slate-800/30"
                  >
                    <td className="sticky left-0 z-10 bg-slate-900 py-2.5 pr-4 pl-2 font-medium whitespace-nowrap text-white">
                      {player.playerName}
                    </td>
                    {activeStatsColumns.map((col, idx) => (
                      <td
                        key={col.header}
                        className={`py-2.5 text-right font-mono ${
                          col.emphasize ? 'font-bold text-white' : ''
                        } ${
                          idx === activeStatsColumns.length - 1
                            ? 'pl-2 pr-2'
                            : 'px-2'
                        }`}
                      >
                        {col.renderValue(player)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
