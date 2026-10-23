export interface ParsedInnings {
  inningsNumber: number
  team: string
  score: string
  closureType: string
  battingPerformances: string[]
  bowlingPerformances: string[]
}

export interface ParsedMatchRow {
  matchDate: string
  roundName: string
  homeTeam: string
  homeTeamScore: string
  awayTeam: string
  awayTeamScore: string
  gradeName: string
  status: string
  format: string
  result: string
  venue: string
  innings: ParsedInnings[]
}

export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false

  const flushRow = () => {
    currentRow.push(currentField.trim())
    if (currentRow.some((cell) => cell !== '')) {
      rows.push(currentRow)
    }
    currentRow = []
    currentField = ''
  }

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i]
    const nextCh = csvText[i + 1]

    if (inQuotes) {
      if (ch === '"' && nextCh === '"') {
        currentField += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        currentField += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        currentRow.push(currentField.trim())
        currentField = ''
      } else if (ch === '\r' && nextCh === '\n') {
        flushRow()
        i++
      } else if (ch === '\n' || ch === '\r') {
        flushRow()
      } else {
        currentField += ch
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    flushRow()
  }

  return rows
}

function splitPerformances(raw: string): string[] {
  if (!raw) return []
  return raw
    .split('|')
    .map((entry) => entry.trim().replace(/\*{3,}/g, 'Unlisted Player'))
    .filter((entry) => entry.length > 0)
}

export function parseMatchResults(csvText: string): ParsedMatchRow[] {
  const rows = parseCsvRows(csvText)
  if (rows.length <= 1) return []

  const dataRows = rows.slice(1)
  return dataRows.map((cols) => {
    const innings: ParsedInnings[] = []
    for (let idx = 0; idx < 4; idx++) {
      const base = 11 + idx * 5
      const team = cols[base] ?? ''
      const score = cols[base + 1] ?? ''
      const closureType = cols[base + 2] ?? ''
      const battingRaw = cols[base + 3] ?? ''
      const bowlingRaw = cols[base + 4] ?? ''
      if (team || score || closureType || battingRaw || bowlingRaw) {
        innings.push({
          inningsNumber: idx + 1,
          team,
          score,
          closureType,
          battingPerformances: splitPerformances(battingRaw),
          bowlingPerformances: splitPerformances(bowlingRaw),
        })
      }
    }

    return {
      matchDate: cols[0] ?? '',
      roundName: cols[1] ?? '',
      homeTeam: cols[2] ?? '',
      homeTeamScore: cols[3] ?? '',
      awayTeam: cols[4] ?? '',
      awayTeamScore: cols[5] ?? '',
      gradeName: cols[6] ?? '',
      status: (cols[7] ?? '').toUpperCase(),
      format: cols[8] ?? '',
      result: cols[9] ?? '',
      venue: cols[10] ?? '',
      innings,
    }
  })
}

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export function formatMatchDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim())
  if (!match) return isoDate
  const year = match[1]
  const monthIndex = Number(match[2]) - 1
  const day = Number(match[3])
  const monthName = MONTHS_SHORT[monthIndex]
  if (!monthName) return isoDate
  return `${day} ${monthName} ${year}`
}

export function selectLastMatch(
  matches: ParsedMatchRow[],
  selectedMatchDate?: string,
): ParsedMatchRow | undefined {
  if (selectedMatchDate) {
    const pinned = matches.find((m) => m.matchDate === selectedMatchDate)
    if (pinned) return pinned
  }

  const nonUpcoming = matches.filter((m) => m.status !== 'UPCOMING')
  if (nonUpcoming.length > 0) {
    return [...nonUpcoming].sort((a, b) =>
      a.matchDate.localeCompare(b.matchDate),
    )[nonUpcoming.length - 1]
  }

  return matches[0]
}

export function selectNextUpcomingMatch(
  matches: ParsedMatchRow[],
): ParsedMatchRow | undefined {
  const upcoming = matches
    .filter((m) => m.status === 'UPCOMING')
    .sort((a, b) => a.matchDate.localeCompare(b.matchDate))
  return upcoming[0]
}

export function isSameTeam(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export function resolveOpponentLabel(
  match: ParsedMatchRow,
  teamName: string,
): string {
  const home = match.homeTeam.trim()
  const away = match.awayTeam.trim()
  if (isSameTeam(home, teamName) && away) {
    return `vs ${away}`
  }
  if (isSameTeam(away, teamName) && home) {
    return `at ${home}`
  }
  if (home && away) {
    return `${home} vs ${away}`
  }
  return home || away || 'TBA'
}

export function isByeMatch(match: ParsedMatchRow): boolean {
  return (
    match.status === 'BYE' ||
    match.homeTeam.trim().toLowerCase() === 'bye' ||
    match.awayTeam.trim().toLowerCase() === 'bye'
  )
}

export function resolveResultSummary(
  match: ParsedMatchRow,
  teamName: string,
): string {
  if (match.result) return match.result
  if (isByeMatch(match)) {
    const activeTeam =
      match.homeTeam.trim().toLowerCase() !== 'bye' && match.homeTeam.trim()
        ? match.homeTeam.trim()
        : match.awayTeam.trim().toLowerCase() !== 'bye' && match.awayTeam.trim()
          ? match.awayTeam.trim()
          : teamName
    return `${activeTeam} had a bye`
  }
  if (match.status === 'ABANDONED' || match.status === 'CANCELLED') {
    return 'Match abandoned / washout'
  }
  if (match.status === 'DRAWN' || match.status === 'DRAW') {
    return 'Match drawn'
  }
  if (match.status === 'TIED' || match.status === 'TIE') {
    return 'Match tied'
  }
  if (match.status === 'IN PROGRESS' || match.status === 'LIVE') {
    return 'Match in progress'
  }
  if (match.status === 'UPCOMING') {
    return 'Upcoming fixture'
  }
  return 'Result pending'
}
