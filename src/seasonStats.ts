import { parseCsvRows } from './matchResults'

export interface ManualTalliesConfig {
  droppedCatches?: Record<string, number>
}

export interface PlayerSeasonStats {
  playerKey: string
  playerName: string
  matchesPlayed: number
  // Batting
  innings: number
  notOuts: number
  runs: number
  highScoreDisplay: string
  battingAverageDisplay: string
  ballsFaced: number
  battingStrikeRateDisplay: string
  fifties: number
  hundreds: number
  fours: number
  sixes: number
  ducks: number
  // Bowling
  oversDisplay: string
  maidens: number
  runsConceded: number
  wickets: number
  bowlingAverageDisplay: string
  bowlingAverageValue: number | null
  economyDisplay: string
  bowlingStrikeRateDisplay: string
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

export interface StatColumn {
  header: string
  emphasize?: boolean
  renderValue: (player: PlayerSeasonStats) => string | number
}

export interface StatsDisciplineConfig {
  id: StatsDiscipline
  label: string
  columns: StatColumn[]
  sortPlayers: (players: PlayerSeasonStats[]) => PlayerSeasonStats[]
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

export const BATTING_COLUMNS: StatColumn[] = [
  { header: 'M', renderValue: (p) => p.matchesPlayed },
  { header: 'Inn', renderValue: (p) => p.innings },
  { header: 'NO', renderValue: (p) => p.notOuts },
  { header: 'Runs', emphasize: true, renderValue: (p) => p.runs },
  { header: 'HS', renderValue: (p) => p.highScoreDisplay },
  { header: 'Avg', renderValue: (p) => p.battingAverageDisplay },
  { header: 'BF', renderValue: (p) => p.ballsFaced },
  { header: 'SR', renderValue: (p) => p.battingStrikeRateDisplay },
  { header: '50s', renderValue: (p) => p.fifties },
  { header: '100s', renderValue: (p) => p.hundreds },
  { header: '4s', renderValue: (p) => p.fours },
  { header: '6s', renderValue: (p) => p.sixes },
  { header: '0s', renderValue: (p) => p.ducks },
]

export const BOWLING_COLUMNS: StatColumn[] = [
  { header: 'M', renderValue: (p) => p.matchesPlayed },
  { header: 'O', renderValue: (p) => p.oversDisplay },
  { header: 'Mdn', renderValue: (p) => p.maidens },
  { header: 'R', renderValue: (p) => p.runsConceded },
  { header: 'Wkts', emphasize: true, renderValue: (p) => p.wickets },
  { header: 'Avg', renderValue: (p) => p.bowlingAverageDisplay },
  { header: 'Econ', renderValue: (p) => p.economyDisplay },
  { header: 'SR', renderValue: (p) => p.bowlingStrikeRateDisplay },
  { header: 'BBI', renderValue: (p) => p.bestBowlingDisplay },
  { header: '5W', renderValue: (p) => p.fiveWickets },
  { header: 'Wd', renderValue: (p) => p.wides },
  { header: 'NB', renderValue: (p) => p.noBalls },
]

export const FIELDING_COLUMNS: StatColumn[] = [
  { header: 'M', renderValue: (p) => p.matchesPlayed },
  { header: 'Ct', renderValue: (p) => p.catchesNonWk },
  { header: 'WK Ct', renderValue: (p) => p.catchesWk },
  { header: 'Tot Ct', renderValue: (p) => p.totalCatches },
  { header: 'RO', renderValue: (p) => p.runOuts },
  { header: 'St', renderValue: (p) => p.stumpings },
  { header: 'Dis', emphasize: true, renderValue: (p) => p.totalDismissals },
  { header: 'Drops', renderValue: (p) => p.droppedCatches },
]

export const STATS_DISCIPLINES: Record<StatsDiscipline, StatsDisciplineConfig> =
  {
    batting: {
      id: 'batting',
      label: 'Batting',
      columns: BATTING_COLUMNS,
      sortPlayers: (players) => [...players].sort((a, b) => b.runs - a.runs),
    },
    bowling: {
      id: 'bowling',
      label: 'Bowling',
      columns: BOWLING_COLUMNS,
      sortPlayers: (players) =>
        [...players].sort((a, b) => {
          if (b.wickets !== a.wickets) {
            return b.wickets - a.wickets
          }
          if (a.bowlingAverageValue !== null && b.bowlingAverageValue !== null) {
            return a.bowlingAverageValue - b.bowlingAverageValue
          }
          if (a.bowlingAverageValue !== null) return -1
          if (b.bowlingAverageValue !== null) return 1
          return 0
        }),
    },
    fielding: {
      id: 'fielding',
      label: 'Fielding',
      columns: FIELDING_COLUMNS,
      sortPlayers: (players) =>
        [...players].sort((a, b) => b.totalDismissals - a.totalDismissals),
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

function formatHighScore(
  innings: number,
  rawHighScore: string | undefined,
  rawDismissalStatus: string | undefined,
): string {
  const trimmedScore = (rawHighScore ?? '').trim()
  if (innings === 0 || !trimmedScore || trimmedScore === '--') {
    return '-'
  }
  const isNotOut = (rawDismissalStatus ?? '').trim().toLowerCase() === 'true'
  return isNotOut ? `${trimmedScore}*` : trimmedScore
}

export function formatOversFromBalls(ballsBowled: number): string {
  if (ballsBowled <= 0) return '0'
  const completedOvers = Math.floor(ballsBowled / 6)
  const remainingBalls = ballsBowled % 6
  return remainingBalls === 0
    ? `${completedOvers}`
    : `${completedOvers}.${remainingBalls}`
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
  return {
    playerKey,
    playerName,
    matchesPlayed: 0,
    innings: 0,
    notOuts: 0,
    runs: 0,
    highScoreDisplay: '-',
    battingAverageDisplay: '-',
    ballsFaced: 0,
    battingStrikeRateDisplay: '-',
    fifties: 0,
    hundreds: 0,
    fours: 0,
    sixes: 0,
    ducks: 0,
    oversDisplay: '0',
    maidens: 0,
    runsConceded: 0,
    wickets: 0,
    bowlingAverageDisplay: '-',
    bowlingAverageValue: null,
    economyDisplay: '-',
    bowlingStrikeRateDisplay: '-',
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
    const highScoreDisplay = formatHighScore(
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
    const bestBowlingDisplay = formatBestBowling(
      cols[PLAYHQ_COL.BOWLING_BEST_INNINGS],
    )
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
      highScoreDisplay,
      battingAverageDisplay: battingAvg.display,
      ballsFaced,
      battingStrikeRateDisplay: battingSr.display,
      fifties,
      hundreds,
      fours,
      sixes,
      ducks,
      oversDisplay,
      maidens,
      runsConceded,
      wickets,
      bowlingAverageDisplay: bowlingAvg.display,
      bowlingAverageValue: bowlingAvg.value,
      economyDisplay: economy.display,
      bowlingStrikeRateDisplay: bowlingSr.display,
      bestBowlingDisplay,
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
