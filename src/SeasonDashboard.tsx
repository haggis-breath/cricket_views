import { useState } from 'react'
import defaultSeasonData from '../data/season.json'
import defaultMatchResultsCsv from '../2026-11-03-match-results.csv?raw'
import defaultCombinedStatsCsv from '../2026-11-03-combined-batting-bowling-fielding.csv?raw'
import clubLogoUrl from '../Logo.png'
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

export type RetroThemeId = 'ch9' | 'snes' | 'club'

interface RetroThemeStyle {
  id: RetroThemeId
  shortLabel: string
  subtitle: string
  pageBg: string
  headerWrapper: string
  headerStripe: string
  logoBadge: string
  headingFont: string
  metaText: string
  updatedPill: string
  sectionCard: string
  sectionHeaderBar: string
  sectionHeading: string
  headerBarMetaText: string
  headerBarRoundText: string
  statusBadge: string
  resultBanner: string
  resultBannerText: string
  subCard: string
  scoreValue: string
  inningsTag: string
  fixtureCard: string
  fixtureBadge: string
  tableHeaderRow: string
  tableDivider: string
  ourTeamRow: string
  ourTeamName: string
  opponentRow: string
  leaderHighlightBox: string
  leaderRankBadge: string
  leaderValue: string
  tabList: string
  tabActive: string
  tabInactive: string
  stickyCellBg: string
  sortActive: string
  sortInactive: string
  mobileToggle: string
}

const RETRO_THEMES: Record<RetroThemeId, RetroThemeStyle> = {
  ch9: {
    id: 'ch9',
    shortLabel: "CH.9 '84 Broadcast",
    subtitle: 'World Series TV Chyron (Gold / Black / White)',
    pageBg: 'min-h-screen bg-[#0e1015] bg-crt-scanlines text-slate-100',
    headerWrapper:
      'relative border-b-4 border-[#ffe600] bg-gradient-to-r from-[#0a0b0e] via-[#141821] to-[#0a0b0e] shadow-[0_6px_0_#000]',
    headerStripe:
      'h-2.5 w-full bg-gradient-to-r from-[#ffe600] via-[#ffffff] to-[#1e293b]',
    logoBadge:
      'flex h-16 w-20 shrink-0 items-center justify-center rounded-md border-2 border-white bg-[#ffe600] p-1.5 shadow-[3px_3px_0_#000]',
    headingFont:
      'font-broadcast uppercase tracking-wider italic text-3xl sm:text-4xl font-extrabold text-white drop-shadow-[2px_2px_0_#000]',
    metaText: 'font-broadcast text-sm font-bold uppercase tracking-widest text-[#ffe600]',
    updatedPill:
      'inline-flex items-center gap-2 rounded-none border-2 border-[#ffe600] bg-black px-3 py-1 font-scoreboard text-xs font-bold uppercase tracking-wider text-[#ffe600] shadow-[3px_3px_0_#000]',
    sectionCard:
      'rounded-none border-2 border-slate-300/80 bg-[#12161f] p-5 sm:p-6 shadow-[6px_6px_0_#000]',
    sectionHeaderBar:
      'flex flex-wrap items-center justify-between gap-2 -mx-5 -mt-5 sm:-mx-6 sm:-mt-6 mb-5 border-b-2 border-black bg-gradient-to-r from-[#ffe600] via-[#facc15] to-[#eab308] px-5 py-3 sm:px-6',
    sectionHeading:
      'font-broadcast text-xl sm:text-2xl font-extrabold uppercase italic tracking-wider text-black',
    headerBarMetaText: 'text-black/90 font-semibold',
    headerBarRoundText: 'font-extrabold text-black underline decoration-2',
    statusBadge:
      'rounded-none bg-black px-2.5 py-0.5 font-scoreboard text-[11px] font-bold uppercase tracking-wide text-[#ffe600]',
    resultBanner:
      'rounded-none border-l-4 border-[#ffe600] bg-black/90 px-4 py-3 text-sm ring-1 ring-white/15 shadow-inner',
    resultBannerText: 'font-scoreboard font-bold tracking-wide text-[#ffe600]',
    subCard:
      'rounded-none border border-slate-600/80 bg-[#0b0e14] p-4 shadow-[3px_3px_0_#000]',
    scoreValue: 'font-scoreboard text-xl font-extrabold text-[#ffe600]',
    inningsTag:
      'mb-1 inline-block bg-[#ffe600] px-1.5 py-0.5 font-broadcast text-xs font-extrabold uppercase tracking-wider text-black',
    fixtureCard:
      'mt-6 rounded-none border-2 border-[#ffe600]/80 bg-[#0b0e14] p-4 shadow-[4px_4px_0_#000]',
    fixtureBadge:
      'bg-[#ffe600] px-2 py-0.5 font-broadcast text-xs font-extrabold uppercase tracking-wider text-black',
    tableHeaderRow:
      'border-b-2 border-[#ffe600]/70 bg-black/50 font-broadcast text-xs font-bold uppercase tracking-widest text-[#ffe600]',
    tableDivider: 'divide-y divide-slate-800',
    ourTeamRow:
      'bg-[#ffe600]/20 text-white ring-1 ring-inset ring-[#ffe600]',
    ourTeamName: 'font-bold text-[#ffe600]',
    opponentRow: 'text-slate-100 hover:bg-white/5',
    leaderHighlightBox:
      'mt-3 rounded-none border-l-4 border-[#ffe600] bg-black/80 p-3 ring-1 ring-white/15',
    leaderRankBadge:
      'bg-[#ffe600] px-1.5 py-0.5 font-scoreboard text-[11px] font-extrabold text-black',
    leaderValue: 'font-scoreboard text-2xl font-extrabold text-[#ffe600]',
    tabList:
      'rounded-none border-2 border-black bg-[#0b0e14] p-1 shadow-[2px_2px_0_#000]',
    tabActive:
      'rounded-none bg-[#ffe600] px-4 py-1 font-broadcast text-sm font-extrabold uppercase tracking-wider text-black',
    tabInactive:
      'rounded-none px-4 py-1 font-broadcast text-sm font-bold uppercase tracking-wider text-slate-300 hover:text-white',
    stickyCellBg: 'bg-[#12161f]',
    sortActive: 'font-extrabold text-[#ffe600] underline decoration-2 underline-offset-4',
    sortInactive: 'font-bold text-slate-300 hover:text-white',
    mobileToggle:
      'rounded-none border border-black bg-black/90 text-[#ffe600] hover:bg-black',
  },
  snes: {
    id: 'snes',
    shortLabel: "Super Int. Cricket '94",
    subtitle: '16-Bit SNES Arcade (Turf Green + Club Gold)',
    pageBg: 'min-h-screen bg-snes-turf text-slate-100 font-arcade',
    headerWrapper:
      'relative border-b-4 border-white bg-[#0d1926] shadow-[0_6px_0_#000]',
    headerStripe:
      'h-3 w-full bg-[repeating-linear-gradient(90deg,#ffe600_0px,#ffe600_24px,#000000_24px,#000000_32px,#ffffff_32px,#ffffff_48px,#000000_48px,#000000_56px)]',
    logoBadge:
      'flex h-16 w-20 shrink-0 items-center justify-center rounded-none border-2 border-black bg-[#ffe600] p-1.5 ring-2 ring-white shadow-[4px_4px_0_#000]',
    headingFont:
      'font-arcade uppercase tracking-wide text-2xl sm:text-3xl font-bold text-[#ffe600] drop-shadow-[3px_3px_0_#000]',
    metaText: 'font-arcade text-xs font-bold uppercase tracking-widest text-emerald-300',
    updatedPill:
      'inline-flex items-center gap-2 rounded-none border-2 border-white bg-[#166534] px-3 py-1 font-scoreboard text-xs font-bold uppercase text-[#ffe600] shadow-[3px_3px_0_#000]',
    sectionCard:
      'rounded-none border-2 border-white bg-[#0f1722] p-5 sm:p-6 ring-2 ring-black shadow-[6px_6px_0_#000]',
    sectionHeaderBar:
      'flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#ffe600] pb-3.5',
    sectionHeading:
      'font-arcade text-lg sm:text-xl font-bold uppercase tracking-wider text-[#ffe600] drop-shadow-[2px_2px_0_#000]',
    headerBarMetaText: 'text-slate-200',
    headerBarRoundText: 'font-bold text-[#ffe600]',
    statusBadge:
      'rounded-none border border-[#ffe600] bg-black px-2.5 py-0.5 font-scoreboard text-[11px] font-bold uppercase tracking-wide text-[#ffe600]',
    resultBanner:
      'rounded-none border-2 border-[#4ade80] bg-[#062e16] px-4 py-3 text-sm shadow-[3px_3px_0_#000]',
    resultBannerText: 'font-scoreboard font-bold text-[#ffe600]',
    subCard:
      'rounded-none border-2 border-slate-500 bg-[#090e16] p-4 shadow-[3px_3px_0_#000]',
    scoreValue: 'font-scoreboard text-lg font-extrabold text-[#4ade80]',
    inningsTag:
      'mb-1 inline-block border border-[#ffe600] bg-black px-1.5 py-0.5 font-scoreboard text-[10px] font-bold uppercase tracking-wider text-[#ffe600]',
    fixtureCard:
      'mt-6 rounded-none border-2 border-[#ffe600] bg-[#090e16] p-4 shadow-[4px_4px_0_#000]',
    fixtureBadge:
      'border border-black bg-[#ffe600] px-2 py-0.5 font-scoreboard text-[11px] font-extrabold uppercase tracking-wider text-black',
    tableHeaderRow:
      'border-b-2 border-white/60 bg-black/40 font-scoreboard text-[11px] font-bold uppercase tracking-wider text-[#ffe600]',
    tableDivider: 'divide-y divide-slate-800/90',
    ourTeamRow:
      'bg-[#166534]/70 text-white ring-2 ring-inset ring-[#ffe600]',
    ourTeamName: 'font-bold text-[#ffe600]',
    opponentRow: 'text-slate-100 hover:bg-white/5',
    leaderHighlightBox:
      'mt-3 rounded-none border-2 border-[#ffe600] bg-[#062e16]/90 p-3 shadow-[3px_3px_0_#000]',
    leaderRankBadge:
      'bg-[#ffe600] px-1.5 py-0.5 font-scoreboard text-[10px] font-extrabold text-black',
    leaderValue: 'font-scoreboard text-2xl font-extrabold text-[#ffe600]',
    tabList:
      'rounded-none border-2 border-white bg-[#090e16] p-1 shadow-[3px_3px_0_#000]',
    tabActive:
      'rounded-none bg-[#ffe600] px-4 py-1.5 font-scoreboard text-xs font-extrabold uppercase text-black',
    tabInactive:
      'rounded-none px-4 py-1.5 font-scoreboard text-xs font-semibold uppercase text-slate-300 hover:text-white',
    stickyCellBg: 'bg-[#0f1722]',
    sortActive: 'font-extrabold text-[#ffe600]',
    sortInactive: 'font-semibold text-slate-300 hover:text-white',
    mobileToggle:
      'rounded-none border-2 border-white bg-[#166534] text-[#ffe600] shadow-[2px_2px_0_#000]',
  },
  club: {
    id: 'club',
    shortLabel: 'Club Kit Heritage',
    subtitle: 'Beresfield Shirt Palette (Canary / Black / Silver / White)',
    pageBg: 'min-h-screen bg-[#0b0c10] text-slate-100',
    headerWrapper:
      'relative border-b border-[#ffe600]/40 bg-gradient-to-b from-[#151821] to-[#0b0c10]',
    headerStripe: 'h-2 w-full bg-shirt-stripes',
    logoBadge:
      'flex h-16 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-white/90 bg-gradient-to-b from-[#ffe600] to-[#facc15] p-1.5 shadow-md',
    headingFont:
      'font-broadcast uppercase tracking-tight text-2xl sm:text-4xl font-extrabold text-white',
    metaText: 'text-xs font-bold uppercase tracking-wider text-[#ffe600]',
    updatedPill:
      'inline-flex items-center rounded-full border border-[#ffe600]/40 bg-[#171a24] px-3.5 py-1 text-xs font-semibold text-slate-200',
    sectionCard:
      'rounded-2xl border border-slate-700/80 border-t-4 border-t-[#ffe600] bg-[#141720] p-6 shadow-xl',
    sectionHeaderBar:
      'flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4',
    sectionHeading:
      'font-broadcast text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-white',
    headerBarMetaText: 'text-slate-300',
    headerBarRoundText: 'font-bold text-[#ffe600]',
    statusBadge:
      'rounded-full border border-[#ffe600]/40 bg-black/80 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#ffe600]',
    resultBanner:
      'rounded-xl border border-[#ffe600]/40 bg-[#ffe600]/10 px-4 py-3 text-sm',
    resultBannerText: 'font-semibold text-[#ffe600]',
    subCard: 'rounded-xl border border-slate-700/80 bg-[#0d0f15] p-4',
    scoreValue: 'font-scoreboard text-lg font-bold text-[#ffe600]',
    inningsTag:
      'mb-1 text-[10px] font-bold uppercase tracking-wider text-[#ffe600]',
    fixtureCard:
      'mt-6 rounded-xl border border-slate-700 bg-[#0d0f15] p-4',
    fixtureBadge:
      'rounded-md bg-[#ffe600] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-black',
    tableHeaderRow:
      'border-b border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-300',
    tableDivider: 'divide-y divide-slate-800/80',
    ourTeamRow:
      'bg-[#ffe600]/15 text-white ring-1 ring-inset ring-[#ffe600]/50',
    ourTeamName: 'font-bold text-[#ffe600]',
    opponentRow: 'text-slate-200 hover:bg-slate-800/40',
    leaderHighlightBox:
      'mt-3 rounded-lg border border-[#ffe600]/40 bg-[#ffe600]/10 p-3',
    leaderRankBadge:
      'rounded bg-[#ffe600] px-1.5 py-0.5 font-scoreboard text-[10px] font-extrabold text-black',
    leaderValue: 'font-scoreboard text-2xl font-extrabold text-[#ffe600]',
    tabList: 'rounded-xl border border-slate-700 bg-[#0d0f15] p-1',
    tabActive:
      'rounded-lg bg-[#ffe600] px-4 py-1.5 text-xs font-extrabold text-black shadow-sm',
    tabInactive:
      'rounded-lg px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white',
    stickyCellBg: 'bg-[#141720]',
    sortActive: 'font-bold text-[#ffe600]',
    sortInactive: 'font-semibold text-slate-300 hover:text-white',
    mobileToggle:
      'rounded-lg border border-slate-600 bg-slate-800/80 text-slate-100 hover:bg-slate-700/80',
  },
}

export interface TeamMetadata {
  /** Full PlayHQ team name, used to match the Team in results and the Ladder. */
  name: string
  /** Shorter name shown in the header; falls back to `name`. */
  displayName?: string
  grade: string
  association: string
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
  themeClass?: string
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
  themeClass = 'rounded-lg border border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700/60',
  className = '',
}: MobileToggleProps) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition sm:hidden ${themeClass} ${className}`}
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

const THEME_OPTIONS: RetroThemeId[] = ['ch9', 'snes', 'club']

export function SeasonDashboard({
  seasonJson = defaultSeasonData,
  matchResultsCsv = defaultMatchResultsCsv,
  combinedStatsCsv = defaultCombinedStatsCsv,
}: SeasonDashboardProps) {
  const [activeTheme, setActiveTheme] = useState<RetroThemeId>('ch9')
  const theme = RETRO_THEMES[activeTheme]
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
    <div className={theme.pageBg}>
      <aside
        aria-label="Theme selector"
        className="border-b border-[#ffe600]/30 bg-black/95 px-4 py-2 text-xs text-slate-200"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 sm:px-2">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#ffe600]" />
            <span className="font-scoreboard text-[11px] font-bold uppercase tracking-wider text-[#ffe600]">
              Retro Style:
            </span>
            <span className="hidden text-slate-400 md:inline">
              {theme.subtitle}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {THEME_OPTIONS.map((optionId) => {
              const opt = RETRO_THEMES[optionId]
              const isCurrent = activeTheme === optionId
              return (
                <button
                  key={optionId}
                  type="button"
                  aria-pressed={isCurrent}
                  onClick={() => setActiveTheme(optionId)}
                  className={`px-2.5 py-1 font-scoreboard text-[11px] font-bold uppercase tracking-wider transition ${
                    isCurrent
                      ? 'border border-white bg-[#ffe600] text-black shadow-[2px_2px_0_#fff]'
                      : 'border border-slate-700 bg-slate-900 text-slate-300 hover:border-[#ffe600]/60 hover:text-white'
                  }`}
                >
                  {opt.shortLabel}
                </button>
              )
            })}
          </div>
        </div>
      </aside>

      <header className={theme.headerWrapper}>
        <div className={theme.headerStripe} aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className={theme.logoBadge} aria-hidden="true">
                <img
                  src={clubLogoUrl}
                  alt=""
                  className="h-full w-full object-contain mix-blend-multiply"
                />
              </div>
              <div>
                <div className={`flex flex-wrap items-center gap-2 ${theme.metaText}`}>
                  <span>{team.association}</span>
                  <span aria-hidden="true">•</span>
                  <span>{team.grade}</span>
                  <span aria-hidden="true">•</span>
                  <span>{season.title}</span>
                </div>
                <h1 className={`mt-0.5 ${theme.headingFont}`}>
                  {team.displayName ?? team.name}
                </h1>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className={theme.updatedPill}>
                Last updated: {season.lastUpdated}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <section
            aria-labelledby="last-match-result-heading"
            className={theme.sectionCard}
          >
            <div className={theme.sectionHeaderBar}>
              <h2
                id="last-match-result-heading"
                className={theme.sectionHeading}
              >
                Last Match Result
              </h2>
              {lastMatch && (
                <div className={`flex flex-wrap items-center gap-2 text-xs ${theme.headerBarMetaText}`}>
                  <span className={theme.headerBarRoundText}>
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
                  <span className={theme.statusBadge}>
                    {lastMatch.status}
                  </span>
                </div>
              )}
            </div>

            {lastMatch ? (
              <div className="mt-5 space-y-5">
                <div className="space-y-3">
                  <div className={theme.resultBanner}>
                    <span className={theme.resultBannerText}>
                      {resolveResultSummary(lastMatch, team.name)}
                    </span>
                  </div>
                  {(!isByeMatch(lastMatch) || lastMatch.innings.length > 0) && (
                    <MobileToggle
                      expanded={lastMatchExpanded}
                      onToggle={() => setLastMatchExpanded((v) => !v)}
                      controls="last-match-details"
                      showLabel="Show full result"
                      hideLabel="Hide full result"
                      themeClass={theme.mobileToggle}
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
                          className={theme.subCard}
                        >
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {side.label}
                          </div>
                          <div className="mt-1 flex items-baseline justify-between gap-2">
                            <span className="font-bold text-white">
                              {side.teamName}
                            </span>
                            <span className={theme.scoreValue}>
                              {side.score || '—'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {lastMatch.innings.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Innings Breakdown
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {lastMatch.innings.map((inn) => (
                          <div
                            key={inn.inningsNumber}
                            className={`${theme.subCard} text-xs`}
                          >
                            <div className={theme.inningsTag}>
                              {ORDINAL_LABELS[inn.inningsNumber] ??
                                `Innings ${inn.inningsNumber}`}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-white">
                                {inn.team}
                              </span>
                              <span className="font-scoreboard font-bold text-[#ffe600]">
                                {inn.score}
                              </span>
                            </div>
                            {inn.closureType && (
                              <div className="mt-0.5 text-[11px] text-slate-300">
                                {inn.closureType}
                              </div>
                            )}
                            {(inn.battingPerformances.length > 0 ||
                              inn.bowlingPerformances.length > 0) && (
                              <div className="mt-2.5 space-y-1.5 border-t border-slate-700/80 pt-2">
                                {inn.battingPerformances.length > 0 && (
                                  <div>
                                    <span className="font-semibold text-[#ffe600]">
                                      Batting:{' '}
                                    </span>
                                    <span className="text-slate-100">
                                      {inn.battingPerformances.join(', ')}
                                    </span>
                                  </div>
                                )}
                                {inn.bowlingPerformances.length > 0 && (
                                  <div>
                                    <span className="font-semibold text-[#ffe600]">
                                      Bowling:{' '}
                                    </span>
                                    <span className="text-slate-100">
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
              <p className="mt-4 text-sm text-slate-300">
                No match results recorded yet.
              </p>
            )}

            {nextUpcomingMatch && lastMatch !== nextUpcomingMatch && (
              <div className={theme.fixtureCard}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={theme.fixtureBadge}>
                      Next Fixture
                    </span>
                    <span className="text-xs font-bold text-[#ffe600]">
                      {nextUpcomingMatch.roundName}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-300">
                    {nextUpcomingMatch.result ||
                      formatMatchDate(nextUpcomingMatch.matchDate)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-white">
                    {resolveOpponentLabel(nextUpcomingMatch, team.name)}
                  </span>
                  {nextUpcomingMatch.venue && (
                    <span className="text-xs text-slate-300">
                      {nextUpcomingMatch.venue}
                    </span>
                  )}
                </div>
              </div>
            )}
          </section>

          <section
            aria-labelledby="ladder-heading"
            className={theme.sectionCard}
          >
            <div className={theme.sectionHeaderBar}>
              <h2
                id="ladder-heading"
                className={theme.sectionHeading}
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
                  themeClass={theme.mobileToggle}
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
                    <tr className={theme.tableHeaderRow}>
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
                  <tbody className={theme.tableDivider}>
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
                            isOurTeam ? theme.ourTeamRow : theme.opponentRow
                          } ${collapseClasses}`}
                        >
                          <td className="py-2.5 pl-2 pr-2 text-center font-scoreboard text-xs text-slate-300">
                            {entry.position}
                          </td>
                          <td
                            className={`py-2.5 px-2 ${
                              isOurTeam
                                ? theme.ourTeamName
                                : 'font-medium text-white'
                            }`}
                          >
                            {entry.team}
                          </td>
                          <td className="py-2.5 px-1.5 text-right font-scoreboard">
                            {entry.played}
                          </td>
                          <td className="py-2.5 px-1.5 text-right font-scoreboard">
                            {entry.won}
                          </td>
                          <td className="py-2.5 px-1.5 text-right font-scoreboard">
                            {entry.lost}
                          </td>
                          <td className="py-2.5 px-1.5 text-right font-scoreboard">
                            {entry.drawnOrNoResult}
                          </td>
                          <td className="py-2.5 px-2 text-right font-scoreboard font-bold text-[#ffe600]">
                            {entry.points}
                          </td>
                          <td className="py-2.5 pl-2 pr-2 text-right font-scoreboard text-slate-200">
                            {entry.percentage.toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-300">
                No ladder entries available.
              </p>
            )}
          </section>
        </div>

        <section
          aria-labelledby="leaderboard-heading"
          className={`mt-8 ${theme.sectionCard}`}
        >
          <div className={theme.sectionHeaderBar}>
            <h2
              id="leaderboard-heading"
              className={theme.sectionHeading}
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
                  className={`flex flex-col justify-between ${theme.subCard}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        id={headingId}
                        className="font-broadcast text-sm font-extrabold uppercase tracking-wider text-[#ffe600]"
                      >
                        {card.title}
                      </h3>
                      <span className="font-scoreboard text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {card.unitLabel}
                      </span>
                    </div>

                    {card.leaders.length > 0 ? (
                      <div className={theme.leaderHighlightBox}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={theme.leaderRankBadge}>
                                #1
                              </span>
                              <span className="font-bold text-white">
                                {card.leaders.map((l) => l.playerName).join(', ')}
                              </span>
                            </div>
                            {card.leaders[0].supportingContext && (
                              <div className="mt-1 font-scoreboard text-xs text-slate-300">
                                {card.leaders
                                  .map((l) => l.supportingContext)
                                  .filter(Boolean)
                                  .join(' | ')}
                              </div>
                            )}
                          </div>
                          <span className={theme.leaderValue}>
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
                          themeClass={theme.mobileToggle}
                          className="mt-3"
                        />
                        <ol
                          id={runnersUpId}
                          className={`mt-3 divide-y divide-slate-800 text-xs ${mobileCollapse(
                            !!expandedLeaderboardCards[card.id],
                          )}`}
                        >
                          {card.runnersUp.map((entry) => (
                            <li
                              key={entry.playerKey}
                              className="flex items-center justify-between gap-2 py-1.5"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-scoreboard text-[11px] font-bold text-[#ffe600]/80">
                                  #{entry.rank}
                                </span>
                                <span className="truncate font-medium text-slate-100">
                                  {entry.playerName}
                                </span>
                              </div>
                              <span className="font-scoreboard font-bold text-white">
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
          className={`mt-8 ${theme.sectionCard}`}
        >
          <div className={`${theme.sectionHeaderBar} flex-col sm:flex-row sm:items-center`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="season-statistics-heading"
                className={theme.sectionHeading}
              >
                Season Statistics
              </h2>
              <MobileToggle
                expanded={statsExpanded}
                onToggle={() => setStatsExpanded((v) => !v)}
                controls="season-statistics-body"
                showLabel="Show statistics"
                hideLabel="Hide statistics"
                themeClass={theme.mobileToggle}
              />
            </div>
            <div
              role="tablist"
              aria-label="Season Statistics disciplines"
              className={`${theme.tabList} ${
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
                    className={`transition ${
                      isSelected ? theme.tabActive : theme.tabInactive
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
                <tr className={theme.tableHeaderRow}>
                  <th
                    scope="col"
                    aria-sort={
                      activeSort.header === 'Player'
                        ? activeSort.direction === 'desc'
                          ? 'descending'
                          : 'ascending'
                        : 'none'
                    }
                    className={`sticky left-0 z-10 ${theme.stickyCellBg} py-2.5 pr-4 pl-2`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSortColumnClick('Player', 'asc')}
                      className={`inline-flex items-center gap-1 uppercase tracking-wider transition ${
                        activeSort.header === 'Player'
                          ? theme.sortActive
                          : theme.sortInactive
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
                            isActiveSort ? theme.sortActive : theme.sortInactive
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
              <tbody className={theme.tableDivider}>
                {activeStatsRows.map((player) => (
                  <tr
                    key={player.playerKey}
                    className={theme.opponentRow}
                  >
                    <td className={`sticky left-0 z-10 ${theme.stickyCellBg} py-2.5 pr-4 pl-2 font-semibold whitespace-nowrap text-white`}>
                      {player.playerName}
                    </td>
                    {activeStatsColumns.map((col, idx) => (
                      <td
                        key={col.header}
                        className={`py-2.5 text-right font-scoreboard ${
                          col.emphasize ? 'font-bold text-[#ffe600]' : 'text-slate-200'
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
