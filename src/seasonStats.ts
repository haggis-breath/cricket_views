import { parseCsvRows } from './matchResults'

export interface ManualTalliesConfig {
  droppedCatches?: Record<string, number>
}

export interface OptionalRateMetric {
  display: string
  value: number | null
}

export interface HighScoreMetric {
  display: string
  value: number | null
  notOut: boolean
}

export interface BestBowlingMetric {
  display: string
  wickets: number | null
  runs: number | null
}

export interface PlayerSeasonStats {
  playerKey: string
  playerName: string
  matchesPlayed: number
  // Batting
  innings: number
  notOuts: number
  runs: number
  highScore: HighScoreMetric
  highScoreDisplay: string
  battingAverage: OptionalRateMetric
  battingAverageDisplay: string
  ballsFaced: number
  battingStrikeRate: OptionalRateMetric
  battingStrikeRateDisplay: string
  fifties: number
  hundreds: number
  fours: number
  sixes: number
  ducks: number
  // Bowling
  ballsBowled: number
  oversDisplay: string
  maidens: number
  runsConceded: number
  wickets: number
  bowlingAverage: OptionalRateMetric
  bowlingAverageDisplay: string
  bowlingAverageValue: number | null
  economy: OptionalRateMetric
  economyDisplay: string
  bowlingStrikeRate: OptionalRateMetric
  bowlingStrikeRateDisplay: string
  bestBowling: BestBowlingMetric
  bestBowlingDisplay: string
  fiveWickets: number
  wides: number
  noBalls: number
  // Fielding
  catchesNonWk: number
  catchesWk: number
  totalCatches: number
  runOuts: number
  stumpings: number
  totalDismissals: number
  droppedCatches: number
}

export type StatsDiscipline = 'batting' | 'bowling' | 'fielding'

export type SortDirection = 'asc' | 'desc'

export interface StatColumn {
  header: string
  emphasize?: boolean
  defaultDirection?: SortDirection
  renderValue: (player: PlayerSeasonStats) => string | number
  compare: (
    a: PlayerSeasonStats,
    b: PlayerSeasonStats,
    direction: SortDirection,
  ) => number
}

export interface StatsDisciplineConfig {
  id: StatsDiscipline
  label: string
  defaultSortHeader: string
  defaultSortDirection: SortDirection
  columns: StatColumn[]
  sortPlayers: (
    players: PlayerSeasonStats[],
    sortHeader?: string,
    sortDirection?: SortDirection,
  ) => PlayerSeasonStats[]
}

const PLAYHQ_COL = {
  PLAYER_NAME: 0,
  MATCHES_PLAYED: 2,
  INNINGS: 3,
  BATTING_AVERAGE: 4,
  BATTING_AGGREGATE: 5,
  BALLS_FACED: 6,
  NOT_OUTS: 7,
  FIFTIES: 8,
  HUNDREDS: 9,
  DUCKS: 10,
  HIGH_SCORE: 11,
  HIGH_SCORE_DISMISSAL_STATUS: 12,
  BATTING_STRIKE_RATE: 13,
  FOURS: 14,
  SIXES: 15,
  WICKETS: 16,
  MAIDENS: 17,
  BOWLING_RUNS_CONCEDED: 18,
  BALLS_BOWLED: 19,
  FIVE_WICKETS: 20,
  BOWLING_BEST_INNINGS: 21,
  BOWLING_AVERAGE: 22,
  BOWLING_STRIKE_RATE: 23,
  ECONOMY_RATE: 24,
  WIDES: 25,
  NO_BALLS: 26,
  CATCHES_NON_WK: 27,
  CATCHES_WK: 28,
  TOTAL_CATCHES: 29,
  RUN_OUTS_UNASSISTED: 30,
  RUN_OUTS_ASSISTED: 31,
  STUMPINGS: 32,
} as const

function compareNumbers(
  aVal: number,
  bVal: number,
  direction: SortDirection,
): number {
  return direction === 'desc' ? bVal - aVal : aVal - bVal
}

export function comparePlayerNames(
  a: PlayerSeasonStats,
  b: PlayerSeasonStats,
  direction: SortDirection,
): number {
  const cmp = a.playerName.localeCompare(b.playerName)
  return direction === 'asc' ? cmp : -cmp
}

function compareNullable<T>(
  aVal: T | null,
  bVal: T | null,
  compareDefined: (a: T, b: T) => number,
): number {
  if (aVal === null && bVal === null) return 0
  if (aVal === null) return 1
  if (bVal === null) return -1
  return compareDefined(aVal, bVal)
}

function compareOptionalRate(
  aVal: number | null,
  bVal: number | null,
  direction: SortDirection,
): number {
  return compareNullable(aVal, bVal, (a, b) => compareNumbers(a, b, direction))
}

function compareHighScore(
  a: PlayerSeasonStats,
  b: PlayerSeasonStats,
  direction: SortDirection,
): number {
  return compareNullable(a.highScore.value, b.highScore.value, (aScore, bScore) => {
    if (aScore !== bScore) {
      return compareNumbers(aScore, bScore, direction)
    }
    if (a.highScore.notOut !== b.highScore.notOut) {
      if (direction === 'desc') {
        return a.highScore.notOut ? -1 : 1
      }
      return a.highScore.notOut ? 1 : -1
    }
    return 0
  })
}

function compareBestBowling(
  a: PlayerSeasonStats,
  b: PlayerSeasonStats,
  direction: SortDirection,
): number {
  const aFigs =
    a.bestBowling.wickets !== null && a.bestBowling.runs !== null
      ? { wickets: a.bestBowling.wickets, runs: a.bestBowling.runs }
      : null
  const bFigs =
    b.bestBowling.wickets !== null && b.bestBowling.runs !== null
      ? { wickets: b.bestBowling.wickets, runs: b.bestBowling.runs }
      : null

  return compareNullable(aFigs, bFigs, (af, bf) => {
    if (af.wickets !== bf.wickets) {
      const diff = bf.wickets - af.wickets
      return direction === 'desc' ? diff : -diff
    }
    if (af.runs !== bf.runs) {
      const diff = af.runs - bf.runs
      return direction === 'desc' ? diff : -diff
    }
    return 0
  })
}

export const BATTING_COLUMNS: StatColumn[] = [
  {
    header: 'M',
    renderValue: (p) => p.matchesPlayed,
    compare: (a, b, dir) => compareNumbers(a.matchesPlayed, b.matchesPlayed, dir),
  },
  {
    header: 'Inn',
    renderValue: (p) => p.innings,
    compare: (a, b, dir) => compareNumbers(a.innings, b.innings, dir),
  },
  {
    header: 'NO',
    renderValue: (p) => p.notOuts,
    compare: (a, b, dir) => compareNumbers(a.notOuts, b.notOuts, dir),
  },
  {
    header: 'Runs',
    emphasize: true,
    renderValue: (p) => p.runs,
    compare: (a, b, dir) => compareNumbers(a.runs, b.runs, dir),
  },
  {
    header: 'HS',
    renderValue: (p) => p.highScoreDisplay,
    compare: compareHighScore,
  },
  {
    header: 'Avg',
    renderValue: (p) => p.battingAverageDisplay,
    compare: (a, b, dir) =>
      compareOptionalRate(a.battingAverage.value, b.battingAverage.value, dir),
  },
  {
    header: 'BF',
    renderValue: (p) => p.ballsFaced,
    compare: (a, b, dir) => compareNumbers(a.ballsFaced, b.ballsFaced, dir),
  },
  {
    header: 'SR',
    renderValue: (p) => p.battingStrikeRateDisplay,
    compare: (a, b, dir) =>
      compareOptionalRate(
        a.battingStrikeRate.value,
        b.battingStrikeRate.value,
        dir,
      ),
  },
  {
    header: '50s',
    renderValue: (p) => p.fifties,
    compare: (a, b, dir) => compareNumbers(a.fifties, b.fifties, dir),
  },
  {
    header: '100s',
    renderValue: (p) => p.hundreds,
    compare: (a, b, dir) => compareNumbers(a.hundreds, b.hundreds, dir),
  },
  {
    header: '4s',
    renderValue: (p) => p.fours,
    compare: (a, b, dir) => compareNumbers(a.fours, b.fours, dir),
  },
  {
    header: '6s',
    renderValue: (p) => p.sixes,
    compare: (a, b, dir) => compareNumbers(a.sixes, b.sixes, dir),
  },
  {
    header: '0s',
    renderValue: (p) => p.ducks,
    compare: (a, b, dir) => compareNumbers(a.ducks, b.ducks, dir),
  },
]

export const BOWLING_COLUMNS: StatColumn[] = [
  {
    header: 'M',
    renderValue: (p) => p.matchesPlayed,
    compare: (a, b, dir) => compareNumbers(a.matchesPlayed, b.matchesPlayed, dir),
  },
  {
    header: 'O',
    renderValue: (p) => p.oversDisplay,
    compare: (a, b, dir) => compareNumbers(a.ballsBowled, b.ballsBowled, dir),
  },
  {
    header: 'Mdn',
    renderValue: (p) => p.maidens,
    compare: (a, b, dir) => compareNumbers(a.maidens, b.maidens, dir),
  },
  {
    header: 'R',
    renderValue: (p) => p.runsConceded,
    compare: (a, b, dir) => compareNumbers(a.runsConceded, b.runsConceded, dir),
  },
  {
    header: 'Wkts',
    emphasize: true,
    renderValue: (p) => p.wickets,
    compare: (a, b, dir) => {
      if (a.wickets !== b.wickets) {
        return compareNumbers(a.wickets, b.wickets, dir)
      }
      return compareOptionalRate(
        a.bowlingAverageValue,
        b.bowlingAverageValue,
        'asc',
      )
    },
  },
  {
    header: 'Avg',
    defaultDirection: 'asc',
    renderValue: (p) => p.bowlingAverageDisplay,
    compare: (a, b, dir) =>
      compareOptionalRate(a.bowlingAverageValue, b.bowlingAverageValue, dir),
  },
  {
    header: 'Econ',
    defaultDirection: 'asc',
    renderValue: (p) => p.economyDisplay,
    compare: (a, b, dir) =>
      compareOptionalRate(a.economy.value, b.economy.value, dir),
  },
  {
    header: 'SR',
    defaultDirection: 'asc',
    renderValue: (p) => p.bowlingStrikeRateDisplay,
    compare: (a, b, dir) =>
      compareOptionalRate(
        a.bowlingStrikeRate.value,
        b.bowlingStrikeRate.value,
        dir,
      ),
  },
  {
    header: 'BBI',
    renderValue: (p) => p.bestBowlingDisplay,
    compare: compareBestBowling,
  },
  {
    header: '5W',
    renderValue: (p) => p.fiveWickets,
    compare: (a, b, dir) => compareNumbers(a.fiveWickets, b.fiveWickets, dir),
  },
  {
    header: 'Wd',
    renderValue: (p) => p.wides,
    compare: (a, b, dir) => compareNumbers(a.wides, b.wides, dir),
  },
  {
    header: 'NB',
    renderValue: (p) => p.noBalls,
    compare: (a, b, dir) => compareNumbers(a.noBalls, b.noBalls, dir),
  },
]

export const FIELDING_COLUMNS: StatColumn[] = [
  {
    header: 'M',
    renderValue: (p) => p.matchesPlayed,
    compare: (a, b, dir) => compareNumbers(a.matchesPlayed, b.matchesPlayed, dir),
  },
  {
    header: 'Ct',
    renderValue: (p) => p.catchesNonWk,
    compare: (a, b, dir) => compareNumbers(a.catchesNonWk, b.catchesNonWk, dir),
  },
  {
    header: 'WK Ct',
    renderValue: (p) => p.catchesWk,
    compare: (a, b, dir) => compareNumbers(a.catchesWk, b.catchesWk, dir),
  },
  {
    header: 'Tot Ct',
    renderValue: (p) => p.totalCatches,
    compare: (a, b, dir) => compareNumbers(a.totalCatches, b.totalCatches, dir),
  },
  {
    header: 'RO',
    renderValue: (p) => p.runOuts,
    compare: (a, b, dir) => compareNumbers(a.runOuts, b.runOuts, dir),
  },
  {
    header: 'St',
    renderValue: (p) => p.stumpings,
    compare: (a, b, dir) => compareNumbers(a.stumpings, b.stumpings, dir),
  },
  {
    header: 'Dis',
    emphasize: true,
    renderValue: (p) => p.totalDismissals,
    compare: (a, b, dir) =>
      compareNumbers(a.totalDismissals, b.totalDismissals, dir),
  },
  {
    header: 'Drops',
    renderValue: (p) => p.droppedCatches,
    compare: (a, b, dir) =>
      compareNumbers(a.droppedCatches, b.droppedCatches, dir),
  },
]

function sortPlayersByColumn(
  players: PlayerSeasonStats[],
  columns: StatColumn[],
  sortHeader: string,
  sortDirection: SortDirection,
): PlayerSeasonStats[] {
  if (sortHeader === 'Player') {
    return [...players].sort((a, b) => comparePlayerNames(a, b, sortDirection))
  }
  const col = columns.find((c) => c.header === sortHeader)
  if (!col) return [...players]
  return [...players].sort((a, b) => col.compare(a, b, sortDirection))
}

export const STATS_DISCIPLINES: Record<StatsDiscipline, StatsDisciplineConfig> =
  {
    batting: {
      id: 'batting',
      label: 'Batting',
      defaultSortHeader: 'Runs',
      defaultSortDirection: 'desc',
      columns: BATTING_COLUMNS,
      sortPlayers: (players, sortHeader = 'Runs', sortDirection = 'desc') =>
        sortPlayersByColumn(players, BATTING_COLUMNS, sortHeader, sortDirection),
    },
    bowling: {
      id: 'bowling',
      label: 'Bowling',
      defaultSortHeader: 'Wkts',
      defaultSortDirection: 'desc',
      columns: BOWLING_COLUMNS,
      sortPlayers: (players, sortHeader = 'Wkts', sortDirection = 'desc') =>
        sortPlayersByColumn(players, BOWLING_COLUMNS, sortHeader, sortDirection),
    },
    fielding: {
      id: 'fielding',
      label: 'Fielding',
      defaultSortHeader: 'Dis',
      defaultSortDirection: 'desc',
      columns: FIELDING_COLUMNS,
      sortPlayers: (players, sortHeader = 'Dis', sortDirection = 'desc') =>
        sortPlayersByColumn(
          players,
          FIELDING_COLUMNS,
          sortHeader,
          sortDirection,
        ),
    },
  }

export const STATS_DISCIPLINE_ORDER: StatsDisciplineConfig[] = [
  STATS_DISCIPLINES.batting,
  STATS_DISCIPLINES.bowling,
  STATS_DISCIPLINES.fielding,
]

function formatDisplayWord(word: string): string {
  if (!word) return word
  if (word === word.toLowerCase()) {
    return word.charAt(0).toUpperCase() + word.slice(1)
  }
  return word
}

export function normalizePlayerName(rawName: string): string {
  const trimmed = rawName.trim()
  if (!trimmed) return ''
  const commaIdx = trimmed.indexOf(',')
  let ordered = trimmed
  if (commaIdx !== -1) {
    const last = trimmed.slice(0, commaIdx).trim()
    const first = trimmed.slice(commaIdx + 1).trim()
    if (first && last) {
      ordered = `${first} ${last}`
    }
  }
  return ordered
    .split(/\s+/)
    .map(formatDisplayWord)
    .join(' ')
}

export function getPlayerKey(name: string): string {
  return normalizePlayerName(name).toLowerCase()
}

function parseIntCell(raw: string | undefined): number {
  if (!raw) return 0
  const parsed = Number.parseInt(raw.trim(), 10)
  return Number.isNaN(parsed) ? 0 : parsed
}

function parseOptionalRate(raw: string | undefined): {
  display: string
  value: number | null
} {
  const trimmed = (raw ?? '').trim()
  if (!trimmed || trimmed === '--' || trimmed === '-') {
    return { display: '-', value: null }
  }
  const num = Number(trimmed)
  if (Number.isNaN(num)) {
    return { display: '-', value: null }
  }
  return { display: trimmed, value: num }
}

function parseHighScore(
  innings: number,
  rawHighScore: string | undefined,
  rawDismissalStatus: string | undefined,
): { display: string; value: number | null; notOut: boolean } {
  const trimmedScore = (rawHighScore ?? '').trim()
  if (innings === 0 || !trimmedScore || trimmedScore === '--') {
    return { display: '-', value: null, notOut: false }
  }
  const num = Number.parseInt(trimmedScore, 10)
  if (Number.isNaN(num)) {
    return { display: '-', value: null, notOut: false }
  }
  const isNotOut = (rawDismissalStatus ?? '').trim().toLowerCase() === 'true'
  return {
    display: isNotOut ? `${trimmedScore}*` : trimmedScore,
    value: num,
    notOut: isNotOut,
  }
}

export function formatOversFromBalls(ballsBowled: number): string {
  if (ballsBowled <= 0) return '0'
  const completedOvers = Math.floor(ballsBowled / 6)
  const remainingBalls = ballsBowled % 6
  return remainingBalls === 0
    ? `${completedOvers}`
    : `${completedOvers}.${remainingBalls}`
}

function parseBestBowling(rawBbi: string | undefined): {
  display: string
  wickets: number | null
  runs: number | null
} {
  const display = formatBestBowling(rawBbi)
  if (display === '-') {
    return { display: '-', wickets: null, runs: null }
  }
  const parts = display.split('/')
  if (parts.length !== 2) {
    return { display, wickets: null, runs: null }
  }
  const wickets = Number.parseInt(parts[0], 10)
  const runs = Number.parseInt(parts[1], 10)
  if (Number.isNaN(wickets) || Number.isNaN(runs)) {
    return { display, wickets: null, runs: null }
  }
  return { display, wickets, runs }
}

export function formatBestBowling(rawBbi: string | undefined): string {
  const trimmed = (rawBbi ?? '').trim()
  if (!trimmed || trimmed === '--' || trimmed === '-') {
    return '-'
  }
  return trimmed.replace('--', '/')
}

interface ExtractedPlayerTally {
  displayName: string
  droppedCatches: number
}

function extractDroppedCatchesMap(
  manualTallies?: ManualTalliesConfig,
): Map<string, ExtractedPlayerTally> {
  const map = new Map<string, ExtractedPlayerTally>()
  if (!manualTallies?.droppedCatches) return map

  for (const [rawName, count] of Object.entries(manualTallies.droppedCatches)) {
    if (typeof count !== 'number') continue
    const normalized = normalizePlayerName(rawName)
    if (!normalized) continue
    const key = normalized.toLowerCase()
    const existing = map.get(key)
    map.set(key, {
      displayName: existing?.displayName ?? normalized,
      droppedCatches: (existing?.droppedCatches ?? 0) + count,
    })
  }

  return map
}

function createSynthesizedPlayer(
  playerKey: string,
  playerName: string,
  droppedCatches: number,
): PlayerSeasonStats {
  const emptyRate: OptionalRateMetric = { display: '-', value: null }
  const emptyHighScore: HighScoreMetric = {
    display: '-',
    value: null,
    notOut: false,
  }
  const emptyBbi: BestBowlingMetric = {
    display: '-',
    wickets: null,
    runs: null,
  }
  return {
    playerKey,
    playerName,
    matchesPlayed: 0,
    innings: 0,
    notOuts: 0,
    runs: 0,
    highScore: emptyHighScore,
    highScoreDisplay: '-',
    battingAverage: emptyRate,
    battingAverageDisplay: '-',
    ballsFaced: 0,
    battingStrikeRate: emptyRate,
    battingStrikeRateDisplay: '-',
    fifties: 0,
    hundreds: 0,
    fours: 0,
    sixes: 0,
    ducks: 0,
    ballsBowled: 0,
    oversDisplay: '0',
    maidens: 0,
    runsConceded: 0,
    wickets: 0,
    bowlingAverage: emptyRate,
    bowlingAverageDisplay: '-',
    bowlingAverageValue: null,
    economy: emptyRate,
    economyDisplay: '-',
    bowlingStrikeRate: emptyRate,
    bowlingStrikeRateDisplay: '-',
    bestBowling: emptyBbi,
    bestBowlingDisplay: '-',
    fiveWickets: 0,
    wides: 0,
    noBalls: 0,
    catchesNonWk: 0,
    catchesWk: 0,
    totalCatches: 0,
    runOuts: 0,
    stumpings: 0,
    totalDismissals: 0,
    droppedCatches,
  }
}

export function parseSeasonStats(
  csvText: string,
  manualTallies?: ManualTalliesConfig,
): PlayerSeasonStats[] {
  const rows = parseCsvRows(csvText)
  const manualMap = extractDroppedCatchesMap(manualTallies)
  const seenKeys = new Set<string>()

  const dataRows = rows.length > 1 ? rows.slice(1) : []
  const parsedPlayers: PlayerSeasonStats[] = dataRows.map((cols) => {
    const playerName = normalizePlayerName(cols[PLAYHQ_COL.PLAYER_NAME] ?? '')
    const playerKey = getPlayerKey(playerName)
    seenKeys.add(playerKey)

    const matchesPlayed = parseIntCell(cols[PLAYHQ_COL.MATCHES_PLAYED])
    const innings = parseIntCell(cols[PLAYHQ_COL.INNINGS])
    const battingAvg = parseOptionalRate(cols[PLAYHQ_COL.BATTING_AVERAGE])
    const runs = parseIntCell(cols[PLAYHQ_COL.BATTING_AGGREGATE])
    const ballsFaced = parseIntCell(cols[PLAYHQ_COL.BALLS_FACED])
    const notOuts = parseIntCell(cols[PLAYHQ_COL.NOT_OUTS])
    const fifties = parseIntCell(cols[PLAYHQ_COL.FIFTIES])
    const hundreds = parseIntCell(cols[PLAYHQ_COL.HUNDREDS])
    const ducks = parseIntCell(cols[PLAYHQ_COL.DUCKS])
    const highScore = parseHighScore(
      innings,
      cols[PLAYHQ_COL.HIGH_SCORE],
      cols[PLAYHQ_COL.HIGH_SCORE_DISMISSAL_STATUS],
    )
    const battingSr = parseOptionalRate(cols[PLAYHQ_COL.BATTING_STRIKE_RATE])
    const fours = parseIntCell(cols[PLAYHQ_COL.FOURS])
    const sixes = parseIntCell(cols[PLAYHQ_COL.SIXES])

    const wickets = parseIntCell(cols[PLAYHQ_COL.WICKETS])
    const maidens = parseIntCell(cols[PLAYHQ_COL.MAIDENS])
    const runsConceded = parseIntCell(cols[PLAYHQ_COL.BOWLING_RUNS_CONCEDED])
    const ballsBowled = parseIntCell(cols[PLAYHQ_COL.BALLS_BOWLED])
    const oversDisplay = formatOversFromBalls(ballsBowled)
    const fiveWickets = parseIntCell(cols[PLAYHQ_COL.FIVE_WICKETS])
    const bestBowling = parseBestBowling(cols[PLAYHQ_COL.BOWLING_BEST_INNINGS])
    const bowlingAvg = parseOptionalRate(cols[PLAYHQ_COL.BOWLING_AVERAGE])
    const bowlingSr = parseOptionalRate(cols[PLAYHQ_COL.BOWLING_STRIKE_RATE])
    const economy = parseOptionalRate(cols[PLAYHQ_COL.ECONOMY_RATE])
    const wides = parseIntCell(cols[PLAYHQ_COL.WIDES])
    const noBalls = parseIntCell(cols[PLAYHQ_COL.NO_BALLS])

    const catchesNonWk = parseIntCell(cols[PLAYHQ_COL.CATCHES_NON_WK])
    const catchesWk = parseIntCell(cols[PLAYHQ_COL.CATCHES_WK])
    const totalCatches = parseIntCell(cols[PLAYHQ_COL.TOTAL_CATCHES])
    const runOuts =
      parseIntCell(cols[PLAYHQ_COL.RUN_OUTS_UNASSISTED]) +
      parseIntCell(cols[PLAYHQ_COL.RUN_OUTS_ASSISTED])
    const stumpings = parseIntCell(cols[PLAYHQ_COL.STUMPINGS])
    const totalDismissals = totalCatches + runOuts + stumpings
    const droppedCatches = manualMap.get(playerKey)?.droppedCatches ?? 0

    return {
      playerKey,
      playerName,
      matchesPlayed,
      innings,
      notOuts,
      runs,
      highScore,
      highScoreDisplay: highScore.display,
      battingAverage: battingAvg,
      battingAverageDisplay: battingAvg.display,
      ballsFaced,
      battingStrikeRate: battingSr,
      battingStrikeRateDisplay: battingSr.display,
      fifties,
      hundreds,
      fours,
      sixes,
      ducks,
      ballsBowled,
      oversDisplay,
      maidens,
      runsConceded,
      wickets,
      bowlingAverage: bowlingAvg,
      bowlingAverageDisplay: bowlingAvg.display,
      bowlingAverageValue: bowlingAvg.value,
      economy,
      economyDisplay: economy.display,
      bowlingStrikeRate: bowlingSr,
      bowlingStrikeRateDisplay: bowlingSr.display,
      bestBowling,
      bestBowlingDisplay: bestBowling.display,
      fiveWickets,
      wides,
      noBalls,
      catchesNonWk,
      catchesWk,
      totalCatches,
      runOuts,
      stumpings,
      totalDismissals,
      droppedCatches,
    }
  })

  for (const [playerKey, entry] of manualMap.entries()) {
    if (!seenKeys.has(playerKey)) {
      parsedPlayers.push(
        createSynthesizedPlayer(
          playerKey,
          entry.displayName,
          entry.droppedCatches,
        ),
      )
    }
  }

  return parsedPlayers
}
