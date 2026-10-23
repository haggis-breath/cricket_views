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
  type StatsDiscipline,
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

export function SeasonDashboard({
  seasonJson = defaultSeasonData,
  matchResultsCsv = defaultMatchResultsCsv,
  combinedStatsCsv = defaultCombinedStatsCsv,
}: SeasonDashboardProps) {
  const [activeStatsTab, setActiveStatsTab] =
    useState<StatsDiscipline>('batting')
  const config = parseSeasonConfig(seasonJson)
  const { team, season } = config
  const ladderRows = [...(config.ladder ?? [])].sort(
    (a, b) => a.position - b.position,
  )
  const matches = parseMatchResults(matchResultsCsv)
  const lastMatch = selectLastMatch(matches, season.selectedLastMatchDate)
  const nextUpcomingMatch = selectNextUpcomingMatch(matches)
  const playerStats = parseSeasonStats(combinedStatsCsv, config.manualTallies)
  const activeDiscipline = STATS_DISCIPLINES[activeStatsTab]
  const activeStatsColumns = activeDiscipline.columns
  const activeStatsRows = activeDiscipline.sortPlayers(playerStats)

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
          </div>

          {ladderRows.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
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
                  {ladderRows.map((entry) => {
                    const isOurTeam = isSameTeam(entry.team, team.name)
                    return (
                      <tr
                        key={entry.position}
                        aria-current={isOurTeam ? 'true' : undefined}
                        className={
                          isOurTeam
                            ? 'bg-emerald-950/50 text-emerald-200 ring-1 ring-inset ring-emerald-500/40'
                            : 'text-slate-200 hover:bg-slate-800/30'
                        }
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
          aria-labelledby="season-statistics-heading"
          className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg"
        >
          <div className="flex flex-col gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2
              id="season-statistics-heading"
              className="text-lg font-bold tracking-tight text-white"
            >
              Season Statistics
            </h2>
            <div
              role="tablist"
              aria-label="Season Statistics disciplines"
              className="inline-flex rounded-xl border border-slate-800 bg-slate-950/80 p-1"
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

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-slate-900 py-2.5 pr-4 pl-2"
                  >
                    Player
                  </th>
                  {activeStatsColumns.map((col, idx) => (
                    <th
                      key={col.header}
                      scope="col"
                      className={`py-2.5 text-right ${
                        idx === activeStatsColumns.length - 1
                          ? 'pl-2 pr-2'
                          : 'px-2'
                      }`}
                    >
                      {col.header}
                    </th>
                  ))}
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
