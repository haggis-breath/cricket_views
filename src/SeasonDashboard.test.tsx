import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { SeasonDashboard } from './SeasonDashboard'
import seasonData from '../data/season.json'
import matchResultsCsv from '../2026-10-23-match-results.csv?raw'
import combinedStatsCsv from '../2026-10-23-combined-batting-bowling-fielding.csv?raw'

// Fixed Round 2 standings so Ladder tests don't change with weekly data updates
const ladderFixtureSeason = {
  ...seasonData,
  ladder: [
    { position: 1, team: 'Warners Bay', played: 2, won: 2, lost: 0, drawnOrNoResult: 0, points: 6, percentage: 1.372 },
    { position: 2, team: 'Kotara', played: 2, won: 1, lost: 1, drawnOrNoResult: 0, points: 4, percentage: 1.114 },
    { position: 3, team: 'MDCC Lions Senior Men Div 7', played: 2, won: 1, lost: 1, drawnOrNoResult: 0, points: 4, percentage: 0.385 },
    { position: 4, team: 'Nelson Bay', played: 2, won: 1, lost: 1, drawnOrNoResult: 0, points: 4, percentage: -0.01 },
    { position: 5, team: 'Tech College (Beresfield Memorial)', played: 2, won: 1, lost: 1, drawnOrNoResult: 0, points: 4, percentage: -0.754 },
    { position: 6, team: 'Adamstown Cricket Club (Scorpions)', played: 2, won: 1, lost: 1, drawnOrNoResult: 0, points: 4, percentage: -0.404 },
    { position: 7, team: 'Adamstown Cricket Club (Blue)', played: 1, won: 0, lost: 1, drawnOrNoResult: 0, points: 1, percentage: -2.755 },
    { position: 8, team: 'Beresfield Memorial', played: 1, won: 0, lost: 1, drawnOrNoResult: 0, points: 1, percentage: -1.724 },
  ],
}

describe('SeasonDashboard', () => {
  test('renders Team header with short display name, competition grade, association, Season title, and last-updated indicator, without club name or PlayHQ link', () => {
    render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    const banner = screen.getByRole('banner')
    expect(
      within(banner).getByRole('heading', { level: 1 }),
    ).toHaveTextContent(/^Tech College$/)
    expect(
      within(banner).queryByText(/Beresfield Memorial/i),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/Division 7/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Newcastle District Cricket Association Inc\./i),
    ).toBeInTheDocument()
    expect(screen.getByText(/2026\/27 Summer/i)).toBeInTheDocument()
    expect(
      screen.getByText(`Last updated: ${seasonData.season.lastUpdated}`),
    ).toBeInTheDocument()

    expect(screen.queryByRole('link', { name: /PlayHQ/i })).not.toBeInTheDocument()
  })

  test('falls back to the full Team name in the header when no displayName is configured', () => {
    const { displayName: _omit, ...teamWithoutDisplayName } = seasonData.team
    render(
      <SeasonDashboard
        seasonJson={{ ...seasonData, team: teamWithoutDisplayName }}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    expect(
      within(screen.getByRole('banner')).getByRole('heading', { level: 1 }),
    ).toHaveTextContent(/^Tech College \(Beresfield Memorial\)$/)
  })

  test('renders Last Match Result selecting the most recent completed match from matchResultsCsv with round, date, format, teams, scores, result, innings closure types, and performances, without the venue', () => {
    render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    const lastMatchRegion = screen.getByRole('region', {
      name: /Last Match Result/i,
    })

    // Round 2 (2026-10-17) is the most recent completed match in 2026-10-23-match-results.csv
    expect(within(lastMatchRegion).getByText('Round 2')).toBeInTheDocument()
    expect(within(lastMatchRegion).getByText('17 Oct 2026')).toBeInTheDocument()
    expect(within(lastMatchRegion).getByText('One Day')).toBeInTheDocument()
    expect(
      within(lastMatchRegion).queryByText(/Hudson Park \(KOTARA\)/i),
    ).not.toBeInTheDocument()
    expect(
      within(lastMatchRegion).getByText(
        /MDCC Lions Senior Men Div 7 won by 4 wickets/i,
      ),
    ).toBeInTheDocument()

    // Scores and closure types
    expect(
      within(lastMatchRegion).getAllByText(/6-116/).length,
    ).toBeGreaterThanOrEqual(1)
    expect(
      within(lastMatchRegion).getAllByText(/115/).length,
    ).toBeGreaterThanOrEqual(1)
    expect(within(lastMatchRegion).getByText(/All Out/i)).toBeInTheDocument()
    expect(within(lastMatchRegion).getByText(/End of Match/i)).toBeInTheDocument()
    expect(within(lastMatchRegion).getByText(/J Thurlow - 33/i)).toBeInTheDocument()
  })

  test('formats pipe-separated bowling performances and replaces masked opponent names (********) with a clean label', () => {
    const round1OnlyCsv = matchResultsCsv
      .trim()
      .split(/\r?\n/)
      .slice(0, 2)
      .join('\n')

    render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={round1OnlyCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    const lastMatchRegion = screen.getByRole('region', {
      name: /Last Match Result/i,
    })

    expect(within(lastMatchRegion).getByText('Round 1')).toBeInTheDocument()
    expect(within(lastMatchRegion).getByText('10 Oct 2026')).toBeInTheDocument()
    expect(
      within(lastMatchRegion).getByText(
        /Tech College \(Beresfield Memorial\) won by 1 runs/i,
      ),
    ).toBeInTheDocument()
    expect(
      within(lastMatchRegion).getByText(/Compulsory Close/i),
    ).toBeInTheDocument()

    // Batting and pipe-separated bowling performances in 1st & 2nd innings
    expect(within(lastMatchRegion).getByText(/T Peeters - 64/i)).toBeInTheDocument()
    expect(within(lastMatchRegion).getByText(/A Doherty - 3-28/i)).toBeInTheDocument()
    expect(within(lastMatchRegion).getByText(/j oehme - 3-32/i)).toBeInTheDocument()
    expect(within(lastMatchRegion).getByText(/A Osborne - 4-18/i)).toBeInTheDocument()

    // Masked opponent entry "******** - 59" is normalized cleanly without raw asterisks
    expect(within(lastMatchRegion).queryByText(/\*{4,}/)).not.toBeInTheDocument()
    expect(
      within(lastMatchRegion).getByText(/Unlisted Player - 59/i),
    ).toBeInTheDocument()
  })

  test('renders Next Fixture callout when matchResultsCsv includes an UPCOMING row with round, opponent, date/time, and venue', () => {
    render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    const lastMatchRegion = screen.getByRole('region', {
      name: /Last Match Result/i,
    })

    expect(within(lastMatchRegion).getByText(/Next Fixture/i)).toBeInTheDocument()
    expect(within(lastMatchRegion).getByText('Round 3')).toBeInTheDocument()
    expect(
      within(lastMatchRegion).getByText(/Adamstown Cricket Club \(Scorpions\)/i),
    ).toBeInTheDocument()
    expect(
      within(lastMatchRegion).getByText(/Sat 24 Oct 2026 at 1:30PM \(local time\)/i),
    ).toBeInTheDocument()
    expect(
      within(lastMatchRegion).getByText(/Smith Park \(HAMILTON NORTH\)/i),
    ).toBeInTheDocument()
  })

  test('gracefully renders non-standard match statuses: ABANDONED (washout), BYE, Tied/Drawn, and IN PROGRESS multi-day match with 1st–4th innings', () => {
    const header = matchResultsCsv.trim().split(/\r?\n/)[0]

    // 1. ABANDONED / washout without scores or result text
    const abandonedCsv = [
      header,
      '2026-10-31,Round 4,Tech College (Beresfield Memorial),,Kotara,,,ABANDONED,One Day,,Nesbitt Park (KOTARA),,,,,,,,,,,,,,,,,,,,',
    ].join('\n')

    const { unmount: unmountAbandoned } = render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={abandonedCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    let region = screen.getByRole('region', { name: /Last Match Result/i })
    expect(within(region).getByText('Round 4')).toBeInTheDocument()
    expect(within(region).getByText('ABANDONED')).toBeInTheDocument()
    expect(
      within(region).getByText(/Match abandoned \/ washout/i),
    ).toBeInTheDocument()
    unmountAbandoned()

    // 2. BYE round (Away team is "Bye" or Status is "BYE", no scores)
    const byeCsv = [
      header,
      '2026-11-07,Round 5,Tech College (Beresfield Memorial),,Bye,,,BYE,One Day,,No Venue,,,,,,,,,,,,,,,,,,,,',
    ].join('\n')

    const { unmount: unmountBye } = render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={byeCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    region = screen.getByRole('region', { name: /Last Match Result/i })
    expect(within(region).getByText('Round 5')).toBeInTheDocument()
    expect(within(region).getByText('BYE')).toBeInTheDocument()
    expect(
      within(region).getByText(/Tech College \(Beresfield Memorial\) had a bye/i),
    ).toBeInTheDocument()
    expect(within(region).queryByText('Home')).not.toBeInTheDocument()
    unmountBye()

    // 3. Tied match & Drawn match
    const tiedCsv = [
      header,
      '2026-11-14,Round 6,Tech College (Beresfield Memorial),8-150,Kotara,150,,COMPLETED,One Day,Match Tied,Smith Park (HAMILTON NORTH),Tech College (Beresfield Memorial),8-150,Compulsory Close,T Peeters - 52,,Kotara,150,All Out,Unlisted - 40,A Osborne - 3-25,,,,,,,,,,',
    ].join('\n')

    const { unmount: unmountTied } = render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={tiedCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    region = screen.getByRole('region', { name: /Last Match Result/i })
    expect(within(region).getByText('Round 6')).toBeInTheDocument()
    expect(within(region).getByText(/Match Tied/i)).toBeInTheDocument()
    unmountTied()

    const drawnCsv = [
      header,
      '2026-11-18,Round 6B,Tech College (Beresfield Memorial),4-120,Kotara,7-140,,DRAWN,Two Day,,Smith Park (HAMILTON NORTH),Tech College (Beresfield Memorial),4-120,End of Match,,,Kotara,7-140,Declared,,,,,,,,,,,',
    ].join('\n')

    const { unmount: unmountDrawn } = render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={drawnCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    region = screen.getByRole('region', { name: /Last Match Result/i })
    expect(within(region).getByText('Round 6B')).toBeInTheDocument()
    expect(within(region).getByText('DRAWN')).toBeInTheDocument()
    expect(within(region).getByText(/Match drawn/i)).toBeInTheDocument()
    unmountDrawn()

    // 4. IN PROGRESS multi-day match with 3rd and 4th innings populated
    const inProgressMultiDayCsv = [
      header,
      '2026-11-21,Round 7,Tech College (Beresfield Memorial),180 & 2-45,MDCC Lions Senior Men Div 7,165 & 190,,IN PROGRESS,Two Day,,Hudson Park (KOTARA),Tech College (Beresfield Memorial),180,All Out,T Peeters - 75,,MDCC Lions Senior Men Div 7,165,All Out,,A Osborne - 5-40,MDCC Lions Senior Men Div 7,190,Declared,J Thurlow - 88,,Tech College (Beresfield Memorial),2-45,In Progress,B Estatheo - 22*,',
    ].join('\n')

    render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={inProgressMultiDayCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    region = screen.getByRole('region', { name: /Last Match Result/i })
    expect(within(region).getByText('Round 7')).toBeInTheDocument()
    expect(within(region).getByText('IN PROGRESS')).toBeInTheDocument()
    expect(within(region).getByText('Two Day')).toBeInTheDocument()
    expect(within(region).getByText(/Match in progress/i)).toBeInTheDocument()
    expect(within(region).getByText(/1st Innings/i)).toBeInTheDocument()
    expect(within(region).getByText(/2nd Innings/i)).toBeInTheDocument()
    expect(within(region).getByText(/3rd Innings/i)).toBeInTheDocument()
    expect(within(region).getByText(/4th Innings/i)).toBeInTheDocument()
    expect(within(region).getByText(/Declared/i)).toBeInTheDocument()
    expect(within(region).getByText(/B Estatheo - 22\*/i)).toBeInTheDocument()
  })

  test('renders out of the box with default repository Division 7 data when no props are provided', () => {
    render(<SeasonDashboard />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Tech College' }),
    ).toBeInTheDocument()

    const lastMatchRegion = screen.getByRole('region', {
      name: /Last Match Result/i,
    })
    // Kept independent of the specific round so weekly CSV updates don't break it
    expect(
      within(lastMatchRegion).queryByText(/No match results recorded yet/i),
    ).not.toBeInTheDocument()
    expect(
      within(lastMatchRegion).getByRole('button', { name: /Show full result/i }),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: /Season Statistics/i }))
        .getAllByRole('row').length,
    ).toBeGreaterThan(1)
  })

  test('renders the competition Ladder with all columns (Pos, Team, P, W, L, D/NR, Pts, %) in rank order', () => {
    render(
      <SeasonDashboard
        seasonJson={ladderFixtureSeason}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    const ladderRegion = screen.getByRole('region', { name: /Ladder/i })
    const table = within(ladderRegion).getByRole('table')

    // Column headers in order
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Pos', 'Team', 'P', 'W', 'L', 'D/NR', 'Pts', '%'])

    // Rows in order (1 header row + 8 team rows)
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(9)

    const row1Cells = within(rows[1]).getAllByRole('cell')
    expect(row1Cells.map((c) => c.textContent)).toEqual([
      '1',
      'Warners Bay',
      '2',
      '2',
      '0',
      '0',
      '6',
      '1.37',
    ])

    const row2Cells = within(rows[2]).getAllByRole('cell')
    expect(row2Cells.map((c) => c.textContent)).toEqual([
      '2',
      'Kotara',
      '2',
      '1',
      '1',
      '0',
      '4',
      '1.11',
    ])

    const row5Cells = within(rows[5]).getAllByRole('cell')
    expect(row5Cells.map((c) => c.textContent)).toEqual([
      '5',
      'Tech College (Beresfield Memorial)',
      '2',
      '1',
      '1',
      '0',
      '4',
      '-0.75',
    ])

    const row8Cells = within(rows[8]).getAllByRole('cell')
    expect(row8Cells.map((c) => c.textContent)).toEqual([
      '8',
      'Beresfield Memorial',
      '1',
      '0',
      '1',
      '0',
      '1',
      '-1.72',
    ])
  })

  test('visually highlights our Team row in the Ladder and leaves opponent rows unhighlighted', () => {
    render(
      <SeasonDashboard
        seasonJson={ladderFixtureSeason}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    const ladderRegion = screen.getByRole('region', { name: /Ladder/i })
    const rows = within(ladderRegion).getAllByRole('row')

    const opponentRow1 = rows[1]
    const ourTeamRow = rows[5] // Position 5
    const opponentRow2 = rows[2]
    const opponentRow8 = rows[8]

    expect(ourTeamRow).toHaveAttribute('aria-current', 'true')

    expect(opponentRow1).not.toHaveAttribute('aria-current')
    expect(opponentRow2).not.toHaveAttribute('aria-current')
    expect(opponentRow8).not.toHaveAttribute('aria-current')
  })

  test('renders Season Statistics Batting tab by default with positional CSV columns, normalized player names, not-out HS asterisks, dash for empty averages, sticky Player column, and Runs descending order', () => {
    render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    const statsRegion = screen.getByRole('region', {
      name: /Season Statistics/i,
    })

    const battingTab = within(statsRegion).getByRole('tab', { name: /Batting/i })
    const bowlingTab = within(statsRegion).getByRole('tab', { name: /Bowling/i })
    const fieldingTab = within(statsRegion).getByRole('tab', {
      name: /Fielding/i,
    })

    expect(battingTab).toHaveAttribute('aria-selected', 'true')
    expect(bowlingTab).toHaveAttribute('aria-selected', 'false')
    expect(fieldingTab).toHaveAttribute('aria-selected', 'false')

    const table = within(statsRegion).getByRole('table')
    const headers = within(table).getAllByRole('columnheader')
    expect(headers.map((h) => h.textContent)).toEqual([
      'Player',
      'M',
      'Inn',
      'NO',
      'Runs',
      'HS',
      'Avg',
      'BF',
      'SR',
      '50s',
      '100s',
      '4s',
      '6s',
      '0s',
    ])

    // Sticky left Player column header
    expect(headers[0].className).toMatch(/sticky/)
    expect(headers[0].className).toMatch(/left-0/)

    const rows = within(table).getAllByRole('row')
    // 1 header row + 14 players from CSV
    expect(rows.length).toBeGreaterThanOrEqual(15)

    // Top scorer: Thomas Peeters (64 runs, HS 64 without *, Batting Avg 64 at col 4, Batting SR 104.92 at col 13)
    const row1Cells = within(rows[1]).getAllByRole('cell')
    expect(row1Cells[0].className).toMatch(/sticky/)
    expect(row1Cells[0].className).toMatch(/left-0/)
    expect(row1Cells.map((c) => c.textContent)).toEqual([
      'Thomas Peeters',
      '1',
      '1',
      '0',
      '64',
      '64',
      '64',
      '61',
      '104.92',
      '1',
      '0',
      '11',
      '0',
      '0',
    ])

    // 2nd scorer: Alistair Osborne (Batting Avg 17 from col 4, not Bowling Avg 4.83 from col 22; Batting SR 117.24 from col 13, not Bowling SR 10 from col 23)
    const row2Cells = within(rows[2]).getAllByRole('cell')
    expect(row2Cells.map((c) => c.textContent)).toEqual([
      'Alistair Osborne',
      '2',
      '2',
      '0',
      '34',
      '27',
      '17',
      '29',
      '117.24',
      '0',
      '0',
      '3',
      '2',
      '0',
    ])

    // Kale Hook: 2 innings, 2 not outs, empty Batting Average -> '-', High Score 4 with dismissal status true -> '4*'
    const kaleRow = rows.find((r) =>
      within(r).queryByText('Kale Hook'),
    )
    expect(kaleRow).toBeDefined()
    expect(
      within(kaleRow!)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual([
      'Kale Hook',
      '2',
      '2',
      '2',
      '8',
      '4*',
      '-',
      '21',
      '38.1',
      '0',
      '0',
      '0',
      '0',
      '0',
    ])

    // Nathan Standing: High Score 3 with dismissal status true -> '3*'
    const nathanRow = rows.find((r) =>
      within(r).queryByText('Nathan Standing'),
    )
    expect(nathanRow).toBeDefined()
    expect(
      within(nathanRow!)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual([
      'Nathan Standing',
      '2',
      '2',
      '1',
      '3',
      '3*',
      '3',
      '8',
      '37.5',
      '0',
      '0',
      '0',
      '0',
      '1',
    ])
  })

  test('switches to Bowling tab and displays positional bowling stats, Balls Bowled to overs.balls conversion, W--R BBI formatting, dash for undefined bowling rates, and default sort by Wickets desc then Avg asc', () => {
    render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    const statsRegion = screen.getByRole('region', {
      name: /Season Statistics/i,
    })

    const bowlingTab = within(statsRegion).getByRole('tab', { name: /Bowling/i })
    fireEvent.click(bowlingTab)

    expect(bowlingTab).toHaveAttribute('aria-selected', 'true')
    expect(
      within(statsRegion).getByRole('tab', { name: /Batting/i }),
    ).toHaveAttribute('aria-selected', 'false')

    const table = within(statsRegion).getByRole('table')
    const headers = within(table).getAllByRole('columnheader')
    expect(headers.map((h) => h.textContent)).toEqual([
      'Player',
      'M',
      'O',
      'Mdn',
      'R',
      'Wkts',
      'Avg',
      'Econ',
      'SR',
      'BBI',
      '5W',
      'Wd',
      'NB',
    ])
    expect(headers[0].className).toMatch(/sticky/)
    expect(headers[0].className).toMatch(/left-0/)

    const rows = within(table).getAllByRole('row')

    // #1 bowler: Alistair Osborne (60 balls -> 10 overs, 29 runs conceded from col 18, 6 wkts, Bowling Avg 4.83 from col 22, Econ 2.9, Bowling SR 10 from col 23, BBI 4--18 -> 4/18)
    expect(
      within(rows[1])
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual([
      'Alistair Osborne',
      '2',
      '10',
      '0',
      '29',
      '6',
      '4.83',
      '2.9',
      '10',
      '4/18',
      '0',
      '0',
      '0',
    ])

    // #2 bowler: Mitchell Owen (48 balls -> 8 overs, 49 runs, 4 wkts, Avg 12.25, Econ 6.13, SR 12, BBI 2--20 -> 2/20, 9 wides, 3 no balls)
    expect(
      within(rows[2])
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual([
      'Mitchell Owen',
      '2',
      '8',
      '0',
      '49',
      '4',
      '12.25',
      '6.13',
      '12',
      '2/20',
      '0',
      '9',
      '3',
    ])

    // #3 bowler: Brock Estatheo (42 balls -> 7 overs, 50 runs, 2 wkts, Avg 25, Econ 7.14, SR 21, BBI 2--50 -> 2/50)
    expect(
      within(rows[3])
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual([
      'Brock Estatheo',
      '1',
      '7',
      '0',
      '50',
      '2',
      '25',
      '7.14',
      '21',
      '2/50',
      '0',
      '1',
      '3',
    ])

    // 1-wicket bowlers tie-broken by Bowling Avg ascending:
    // #4: Martin Bigg (27 balls -> 4.3 overs, 1 wkt, Avg 9, BBI 1--9 -> 1/9)
    // #5: Ewan Bauer (42 balls -> 7 overs, 1 wkt, Avg 26, BBI 1--26 -> 1/26)
    // #6: Andrew Moffat (66 balls -> 11 overs, 1 wkt, Avg 63, BBI 1--37 -> 1/37)
    expect(
      within(rows[4])
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual([
      'Martin Bigg',
      '1',
      '4.3',
      '0',
      '9',
      '1',
      '9',
      '2',
      '27',
      '1/9',
      '0',
      '0',
      '0',
    ])
    expect(
      within(rows[5])
        .getAllByRole('cell')
        .map((c) => c.textContent)[0],
    ).toBe('Ewan Bauer')
    expect(
      within(rows[6])
        .getAllByRole('cell')
        .map((c) => c.textContent)[0],
    ).toBe('Andrew Moffat')

    // Thomas Peeters: 18 balls -> 3 overs, 0 wkts, Avg '-', Econ 4.67, SR '-', BBI 0--14 -> 0/14
    const peetersRow = rows.find((r) =>
      within(r).queryByText('Thomas Peeters'),
    )
    expect(
      within(peetersRow!)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual([
      'Thomas Peeters',
      '1',
      '3',
      '0',
      '14',
      '0',
      '-',
      '4.67',
      '-',
      '0/14',
      '0',
      '0',
      '0',
    ])

    // Hayden Barrett: 9 balls -> 1.3 overs, 10 runs, 0 wkts, BBI 0--10 -> 0/10
    const barrettRow = rows.find((r) =>
      within(r).queryByText('Hayden Barrett'),
    )
    expect(
      within(barrettRow!)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual([
      'Hayden Barrett',
      '1',
      '1.3',
      '0',
      '10',
      '0',
      '-',
      '6.67',
      '-',
      '0/10',
      '0',
      '0',
      '1',
    ])

    // Tyran Cameron: 0 balls -> 0 overs, BBI '--' -> '-', Avg/Econ/SR '-'
    const cameronRow = rows.find((r) =>
      within(r).queryByText('Tyran Cameron'),
    )
    expect(
      within(cameronRow!)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual([
      'Tyran Cameron',
      '1',
      '0',
      '0',
      '0',
      '0',
      '-',
      '-',
      '-',
      '-',
      '0',
      '0',
      '0',
    ])
  })

  test('switches to Fielding tab, computes RO and Total Dismissals (Dis), sorts by Total Catches (Tot Ct) descending by default, merges Manual Tallies dropped catches across "Last, First" and "First Last" formats (case-insensitive, trimmed), and synthesizes players only in Manual Tallies', () => {
    // Augment CSV row to exercise WK catches, unassisted + assisted run outs, and stumpings alongside real Division 7 data
    const customCsv = [
      combinedStatsCsv.trim(),
      '"Keeper, Alex",Beresfield Memorial Cricket Club,2,1,15,15,20,0,0,0,0,15,false,75,2,0,0,0,0,0,0,--,,,,0,0,0,2,2,1,1,1,Division 7,Newcastle District Cricket Association Inc.',
    ].join('\n')

    const customSeasonJson = {
      ...seasonData,
      manualTallies: {
        droppedCatches: {
          '  osborne, alistair ': 1,
          'Andrew Moffat': 2,
          'Bauer, Ewan': 1,
          'Newcomer, Jordan': 3,
        },
      },
    }

    render(
      <SeasonDashboard
        seasonJson={customSeasonJson}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={customCsv}
      />,
    )

    const statsRegion = screen.getByRole('region', {
      name: /Season Statistics/i,
    })

    const fieldingTab = within(statsRegion).getByRole('tab', {
      name: /Fielding/i,
    })
    fireEvent.click(fieldingTab)

    expect(fieldingTab).toHaveAttribute('aria-selected', 'true')
    expect(
      within(statsRegion).getByRole('tab', { name: /Batting/i }),
    ).toHaveAttribute('aria-selected', 'false')
    expect(
      within(statsRegion).getByRole('tab', { name: /Bowling/i }),
    ).toHaveAttribute('aria-selected', 'false')

    const table = within(statsRegion).getByRole('table')
    const headers = within(table).getAllByRole('columnheader')
    expect(headers.map((h) => h.textContent)).toEqual([
      'Player',
      'M',
      'Ct',
      'WK Ct',
      'Tot Ct',
      'RO',
      'St',
      'Dis',
      'Drops',
    ])
    expect(headers[0].className).toMatch(/sticky/)
    expect(headers[0].className).toMatch(/left-0/)

    const rows = within(table).getAllByRole('row')

    // Default sort is Total Catches (Tot Ct) descending
    const totCtHeader = headers.find((h) => h.textContent === 'Tot Ct')!
    expect(totCtHeader).toHaveAttribute('aria-sort', 'descending')
    const totCtValues = rows
      .slice(1)
      .map((r) => Number(within(r).getAllByRole('cell')[4].textContent))
    expect(totCtValues).toEqual([...totCtValues].sort((a, b) => b - a))

    // #1 fielder by Tot Ct: Alistair Osborne (3 Ct, 0 WK Ct, 3 Tot Ct, 0 RO, 0 St, 3 Dis, 1 Drop matched from '  osborne, alistair ')
    expect(
      within(rows[1])
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['Alistair Osborne', '2', '3', '0', '3', '0', '0', '3', '1'])

    // Alex Keeper: 0 non-WK + 2 WK = 2 Tot Ct, 1 unassisted + 1 assisted = 2 RO, 1 St -> 5 Dis, 0 Drops
    const keeperRow = rows.find((r) => within(r).queryByText('Alex Keeper'))
    expect(
      within(keeperRow!)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['Alex Keeper', '2', '0', '2', '2', '2', '1', '5', '0'])

    // Ewan Bauer (2 Dis, 1 Drop matched from 'Bauer, Ewan') and Andrew Moffat (2 Dis, 2 Drops matched from 'Andrew Moffat')
    const moffatRow = rows.find((r) =>
      within(r).queryByText('Andrew Moffat'),
    )
    expect(
      within(moffatRow!)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['Andrew Moffat', '2', '2', '0', '2', '0', '0', '2', '2'])

    const bauerRow = rows.find((r) => within(r).queryByText('Ewan Bauer'))
    expect(
      within(bauerRow!)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['Ewan Bauer', '2', '2', '0', '2', '0', '0', '2', '1'])

    // Synthesized player present only in Manual Tallies: 'Newcomer, Jordan' -> 'Jordan Newcomer' with 3 Drops and 0s elsewhere
    const newcomerFieldingRow = rows.find((r) =>
      within(r).queryByText('Jordan Newcomer'),
    )
    expect(newcomerFieldingRow).toBeDefined()
    expect(
      within(newcomerFieldingRow!)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['Jordan Newcomer', '0', '0', '0', '0', '0', '0', '0', '3'])

    // Switching back to Batting tab shows Jordan Newcomer synthesized with '-' for HS, Avg, and SR
    fireEvent.click(within(statsRegion).getByRole('tab', { name: /Batting/i }))
    const battingTable = within(statsRegion).getByRole('table')
    const newcomerBattingRow = within(battingTable)
      .getAllByRole('row')
      .find((r) => within(r).queryByText('Jordan Newcomer'))
    expect(newcomerBattingRow).toBeDefined()
    expect(
      within(newcomerBattingRow!)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual([
      'Jordan Newcomer',
      '0',
      '0',
      '0',
      '0',
      '-',
      '-',
      '0',
      '-',
      '0',
      '0',
      '0',
      '0',
      '0',
    ])
  })

  test('sorts Batting Season Statistics columns when clicking column headers and toggles between descending and ascending with aria-sort', () => {
    render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    const statsRegion = screen.getByRole('region', {
      name: /Season Statistics/i,
    })
    const table = within(statsRegion).getByRole('table')

    // By default, Batting is sorted by Runs descending
    const playerHeader = within(table).getByRole('columnheader', {
      name: /^Player/i,
    })
    const runsHeader = within(table).getByRole('columnheader', {
      name: /^Runs/i,
    })
    const bfHeader = within(table).getByRole('columnheader', { name: /^BF/i })
    expect(runsHeader).toHaveAttribute('aria-sort', 'descending')
    expect(bfHeader).toHaveAttribute('aria-sort', 'none')
    expect(playerHeader).toHaveAttribute('aria-sort', 'none')

    // Clicking active 'Runs' header toggles to ascending
    fireEvent.click(within(runsHeader).getByRole('button'))
    expect(runsHeader).toHaveAttribute('aria-sort', 'ascending')

    let rows = within(table).getAllByRole('row')
    // Lowest runs: Joseph Chenery (0 runs)
    expect(within(rows[1]).getAllByRole('cell')[0].textContent).toBe(
      'Joseph Chenery',
    )
    // Highest runs at bottom: Thomas Peeters (64 runs)
    expect(
      within(rows[rows.length - 1]).getAllByRole('cell')[0].textContent,
    ).toBe('Thomas Peeters')

    // Clicking 'BF' header sorts by Balls Faced descending
    fireEvent.click(within(bfHeader).getByRole('button'))
    expect(bfHeader).toHaveAttribute('aria-sort', 'descending')
    expect(runsHeader).toHaveAttribute('aria-sort', 'none')

    rows = within(table).getAllByRole('row')
    // Top 3 BF: Thomas Peeters (61), Cameron Haines (43), Andrew Moffat (37)
    expect(
      rows
        .slice(1, 4)
        .map((r) => within(r).getAllByRole('cell')[0].textContent),
    ).toEqual(['Thomas Peeters', 'Cameron Haines', 'Andrew Moffat'])

    // Clicking 'BF' again toggles to ascending
    fireEvent.click(within(bfHeader).getByRole('button'))
    expect(bfHeader).toHaveAttribute('aria-sort', 'ascending')
    rows = within(table).getAllByRole('row')
    expect(within(rows[1]).getAllByRole('cell')[0].textContent).toBe(
      'Joseph Chenery',
    )

    // Clicking 'Player' header sorts alphabetically ascending, then toggles to descending
    fireEvent.click(within(playerHeader).getByRole('button'))
    expect(playerHeader).toHaveAttribute('aria-sort', 'ascending')
    rows = within(table).getAllByRole('row')
    expect(within(rows[1]).getAllByRole('cell')[0].textContent).toBe(
      'Alistair Osborne',
    )
    expect(
      within(rows[rows.length - 1]).getAllByRole('cell')[0].textContent,
    ).toBe('Tyran Cameron')

    fireEvent.click(within(playerHeader).getByRole('button'))
    expect(playerHeader).toHaveAttribute('aria-sort', 'descending')
    rows = within(table).getAllByRole('row')
    expect(within(rows[1]).getAllByRole('cell')[0].textContent).toBe(
      'Tyran Cameron',
    )
    expect(
      within(rows[rows.length - 1]).getAllByRole('cell')[0].textContent,
    ).toBe('Alistair Osborne')
  })

  test('sorts Highest Score (HS) numerically rather than alphabetically, ranking not-out scores ahead of equal dismissed scores (64* > 64 > 27 > 4* > 4) and sinking "-" to the bottom', () => {
    const customCsv = [
      combinedStatsCsv.trim(),
      // Unbeaten 64* to compare directly against Thomas Peeters (64 dismissed)
      '"Unbeaten, Star",Beresfield Memorial Cricket Club,1,1,,64,50,1,1,0,0,64,true,128,8,1,0,0,0,0,0,--,,,,0,0,0,0,0,0,0,0,Division 7,Newcastle District Cricket Association Inc.',
      // Dismissed 4 to compare directly against Kale Hook (4*)
      '"Dismissed, Four",Beresfield Memorial Cricket Club,1,1,4,4,10,0,0,0,0,4,false,40,1,0,0,0,0,0,0,--,,,,0,0,0,0,0,0,0,0,Division 7,Newcastle District Cricket Association Inc.',
      // 0 innings -> HS "-"
      '"DidNotBat, Sam",Beresfield Memorial Cricket Club,1,0,,0,0,0,0,0,0,0,false,,0,0,0,0,0,0,0,--,,,,0,0,0,0,0,0,0,0,Division 7,Newcastle District Cricket Association Inc.',
    ].join('\n')

    render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={customCsv}
      />,
    )

    const statsRegion = screen.getByRole('region', {
      name: /Season Statistics/i,
    })
    const table = within(statsRegion).getByRole('table')
    const hsHeader = within(table).getByRole('columnheader', { name: /^HS/i })

    // Sort by HS descending
    fireEvent.click(within(hsHeader).getByRole('button'))
    expect(hsHeader).toHaveAttribute('aria-sort', 'descending')

    let rows = within(table).getAllByRole('row').slice(1)
    const descNamesAndHs = rows.map((r) => {
      const cells = within(r).getAllByRole('cell')
      return `${cells[0].textContent}:${cells[5].textContent}`
    })

    // Verify 64* > 64 > 27 ... > 4* > 4 > 3* > 0 > -
    const idx64Star = descNamesAndHs.indexOf('Star Unbeaten:64*')
    const idx64 = descNamesAndHs.indexOf('Thomas Peeters:64')
    const idx27 = descNamesAndHs.indexOf('Alistair Osborne:27')
    const idx11 = descNamesAndHs.indexOf('Ewan Bauer:11')
    const idx8 = descNamesAndHs.indexOf('Craig Hearnden:8')
    const idx4Star = descNamesAndHs.indexOf('Kale Hook:4*')
    const idx4 = descNamesAndHs.indexOf('Four Dismissed:4')
    const idx3Star = descNamesAndHs.indexOf('Nathan Standing:3*')
    const idx0 = descNamesAndHs.indexOf('Joseph Chenery:0')
    const idxDash = descNamesAndHs.indexOf('Sam DidNotBat:-')

    expect(idx64Star).toBe(0)
    expect(idx64).toBe(1)
    expect(idx27).toBeGreaterThan(idx64)
    // Numeric comparison: 11 > 8 (alphabetical would put 8 before 11)
    expect(idx8).toBeGreaterThan(idx11)
    expect(idx4Star).toBeGreaterThan(idx8)
    expect(idx4).toBe(idx4Star + 1)
    expect(idx3Star).toBe(idx4 + 1)
    expect(idx0).toBe(idx3Star + 1)
    // Undefined '-' sinks to the bottom in descending order
    expect(idxDash).toBe(descNamesAndHs.length - 1)

    // Toggle to HS ascending
    fireEvent.click(within(hsHeader).getByRole('button'))
    expect(hsHeader).toHaveAttribute('aria-sort', 'ascending')

    rows = within(table).getAllByRole('row').slice(1)
    const ascNamesAndHs = rows.map((r) => {
      const cells = within(r).getAllByRole('cell')
      return `${cells[0].textContent}:${cells[5].textContent}`
    })

    // In ascending order: 0 < 3* < 4 < 4* ... < 64 < 64*, and '-' still sinks to the bottom
    expect(ascNamesAndHs[0]).toBe('Joseph Chenery:0')
    expect(ascNamesAndHs[1]).toBe('Nathan Standing:3*')
    expect(ascNamesAndHs[2]).toBe('Four Dismissed:4')
    expect(ascNamesAndHs[3]).toBe('Kale Hook:4*')
    expect(ascNamesAndHs[ascNamesAndHs.length - 3]).toBe('Thomas Peeters:64')
    expect(ascNamesAndHs[ascNamesAndHs.length - 2]).toBe('Star Unbeaten:64*')
    expect(ascNamesAndHs[ascNamesAndHs.length - 1]).toBe('Sam DidNotBat:-')
  })

  test('sorts Best Bowling (BBI) by wickets descending then runs ascending (4/18 > 2/20 > 2/50 > 1/9 > 0/6) and places "-" at the bottom in both directions', () => {
    render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    const statsRegion = screen.getByRole('region', {
      name: /Season Statistics/i,
    })
    fireEvent.click(within(statsRegion).getByRole('tab', { name: /Bowling/i }))

    const table = within(statsRegion).getByRole('table')
    const bbiHeader = within(table).getByRole('columnheader', { name: /^BBI/i })

    // Click BBI to sort descending (best bowling figures first)
    fireEvent.click(within(bbiHeader).getByRole('button'))
    expect(bbiHeader).toHaveAttribute('aria-sort', 'descending')

    let rows = within(table).getAllByRole('row').slice(1)
    const descBbis = rows.map(
      (r) => within(r).getAllByRole('cell')[9].textContent,
    )

    // First 10 bowlers have bowled balls: 4/18 > 2/20 > 2/50 > 1/9 > 1/26 > 1/37 > 0/6 > 0/10 > 0/14 > 0/17
    // Remaining 4 players have '-' at the bottom
    expect(descBbis.slice(0, 10)).toEqual([
      '4/18',
      '2/20',
      '2/50',
      '1/9',
      '1/26',
      '1/37',
      '0/6',
      '0/10',
      '0/14',
      '0/17',
    ])
    expect(descBbis.slice(10)).toEqual(['-', '-', '-', '-'])

    // Click BBI again to sort ascending (worst defined figures first, '-' still at the bottom)
    fireEvent.click(within(bbiHeader).getByRole('button'))
    expect(bbiHeader).toHaveAttribute('aria-sort', 'ascending')

    rows = within(table).getAllByRole('row').slice(1)
    const ascBbis = rows.map(
      (r) => within(r).getAllByRole('cell')[9].textContent,
    )

    expect(ascBbis.slice(0, 10)).toEqual([
      '0/17',
      '0/14',
      '0/10',
      '0/6',
      '1/37',
      '1/26',
      '1/9',
      '2/50',
      '2/20',
      '4/18',
    ])
    expect(ascBbis.slice(10)).toEqual(['-', '-', '-', '-'])
  })

  test('sorts Overs (O) accurately by total balls bowled (11 > 10 > 8 > 7 > 6 > 4.3 > 3 > 1.3 > 1 > 0)', () => {
    render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    const statsRegion = screen.getByRole('region', {
      name: /Season Statistics/i,
    })
    fireEvent.click(within(statsRegion).getByRole('tab', { name: /Bowling/i }))

    const table = within(statsRegion).getByRole('table')
    const oversHeader = within(table).getByRole('columnheader', {
      name: /^O$/i,
    })

    // Click 'O' to sort descending
    fireEvent.click(within(oversHeader).getByRole('button'))
    expect(oversHeader).toHaveAttribute('aria-sort', 'descending')

    let rows = within(table).getAllByRole('row').slice(1)
    const descOvers = rows.map(
      (r) => within(r).getAllByRole('cell')[2].textContent,
    )

    // 11 (66 balls) > 10 (60 balls) > 8 (48 balls) > 7 (42 balls) > 7 (42 balls) > 6 (36 balls) > 4.3 (27 balls) > 3 (18 balls) > 1.3 (9 balls) > 1 (6 balls) > 0s
    expect(descOvers).toEqual([
      '11',
      '10',
      '8',
      '7',
      '7',
      '6',
      '4.3',
      '3',
      '1.3',
      '1',
      '0',
      '0',
      '0',
      '0',
    ])

    // Click 'O' again to sort ascending
    fireEvent.click(within(oversHeader).getByRole('button'))
    expect(oversHeader).toHaveAttribute('aria-sort', 'ascending')

    rows = within(table).getAllByRole('row').slice(1)
    const ascOvers = rows.map(
      (r) => within(r).getAllByRole('cell')[2].textContent,
    )

    expect(ascOvers).toEqual([
      '0',
      '0',
      '0',
      '0',
      '1',
      '1.3',
      '3',
      '4.3',
      '6',
      '7',
      '7',
      '8',
      '10',
      '11',
    ])
  })

  test('sorts Batting Avg and SR numerically while sinking undefined "-" values (such as Kale Hook) to the bottom in both ascending and descending directions, and includes all players without a qualification filter toggle', () => {
    const customSeasonJson = {
      ...seasonData,
      manualTallies: {
        droppedCatches: {
          'Newcomer, Jordan': 2,
        },
      },
    }

    render(
      <SeasonDashboard
        seasonJson={customSeasonJson}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    const statsRegion = screen.getByRole('region', {
      name: /Season Statistics/i,
    })

    // No qualification filter toggle exists anywhere in Season Statistics
    expect(
      within(statsRegion).queryByRole('checkbox'),
    ).not.toBeInTheDocument()
    expect(
      within(statsRegion).queryByText(/qualif/i),
    ).not.toBeInTheDocument()

    // Batting Avg: Kale Hook ('-') and Jordan Newcomer ('-') sink to the bottom in both directions
    const table = within(statsRegion).getByRole('table')
    const battingAvgHeader = within(table).getByRole('columnheader', {
      name: /^Avg$/i,
    })

    fireEvent.click(within(battingAvgHeader).getByRole('button'))
    expect(battingAvgHeader).toHaveAttribute('aria-sort', 'descending')

    let rows = within(table).getAllByRole('row').slice(1)
    // All 15 players (14 CSV + 1 synthesized) are included
    expect(rows).toHaveLength(15)
    let battingAvgs = rows.map(
      (r) => within(r).getAllByRole('cell')[6].textContent,
    )
    expect(battingAvgs).toEqual([
      '64',
      '27',
      '24',
      '20',
      '17',
      '11',
      '10',
      '8',
      '7.5',
      '6.5',
      '6',
      '3',
      '0',
      '-',
      '-',
    ])

    // Toggle Batting Avg to ascending -> '0' first, '64' before the two '-' at the bottom
    fireEvent.click(within(battingAvgHeader).getByRole('button'))
    expect(battingAvgHeader).toHaveAttribute('aria-sort', 'ascending')
    rows = within(table).getAllByRole('row').slice(1)
    battingAvgs = rows.map(
      (r) => within(r).getAllByRole('cell')[6].textContent,
    )
    expect(battingAvgs).toEqual([
      '0',
      '3',
      '6',
      '6.5',
      '7.5',
      '8',
      '10',
      '11',
      '17',
      '20',
      '24',
      '27',
      '64',
      '-',
      '-',
    ])

    // Batting SR: Jordan Newcomer ('-') sinks to the bottom in both directions
    const battingSrHeader = within(table).getByRole('columnheader', {
      name: /^SR$/i,
    })
    fireEvent.click(within(battingSrHeader).getByRole('button'))
    expect(battingSrHeader).toHaveAttribute('aria-sort', 'descending')
    rows = within(table).getAllByRole('row').slice(1)
    let battingSrs = rows.map(
      (r) => within(r).getAllByRole('cell')[8].textContent,
    )
    expect(battingSrs[0]).toBe('117.24')
    expect(battingSrs[1]).toBe('104.92')
    expect(battingSrs[battingSrs.length - 2]).toBe('0')
    expect(battingSrs[battingSrs.length - 1]).toBe('-')

    fireEvent.click(within(battingSrHeader).getByRole('button'))
    expect(battingSrHeader).toHaveAttribute('aria-sort', 'ascending')
    rows = within(table).getAllByRole('row').slice(1)
    battingSrs = rows.map(
      (r) => within(r).getAllByRole('cell')[8].textContent,
    )
    expect(battingSrs[0]).toBe('0')
    expect(battingSrs[battingSrs.length - 2]).toBe('117.24')
    expect(battingSrs[battingSrs.length - 1]).toBe('-')
  })

  test('sorts Bowling Avg, Econ, and SR numerically while sinking undefined "-" values (0-wicket or 0-ball bowlers) to the bottom in both ascending and descending directions, and sorts Fielding columns interactively', () => {
    const customSeasonJson = {
      ...seasonData,
      manualTallies: {
        droppedCatches: {
          'Newcomer, Jordan': 2,
        },
      },
    }

    render(
      <SeasonDashboard
        seasonJson={customSeasonJson}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    const statsRegion = screen.getByRole('region', {
      name: /Season Statistics/i,
    })

    fireEvent.click(within(statsRegion).getByRole('tab', { name: /Bowling/i }))
    let table = within(statsRegion).getByRole('table')

    // Bowling Avg defaults to ascending (lower bowling average is better), with '-' at the bottom
    const bowlingAvgHeader = within(table).getByRole('columnheader', {
      name: /^Avg$/i,
    })
    fireEvent.click(within(bowlingAvgHeader).getByRole('button'))
    expect(bowlingAvgHeader).toHaveAttribute('aria-sort', 'ascending')

    let rows = within(table).getAllByRole('row').slice(1)
    const bowlingAvgsAsc = rows.map(
      (r) => within(r).getAllByRole('cell')[6].textContent,
    )
    expect(bowlingAvgsAsc.slice(0, 6)).toEqual([
      '4.83',
      '9',
      '12.25',
      '25',
      '26',
      '63',
    ])
    expect(bowlingAvgsAsc.slice(6)).toEqual(Array(9).fill('-'))

    // Toggling Bowling Avg sorts descending, still keeping '-' at the bottom
    fireEvent.click(within(bowlingAvgHeader).getByRole('button'))
    expect(bowlingAvgHeader).toHaveAttribute('aria-sort', 'descending')
    rows = within(table).getAllByRole('row').slice(1)
    const bowlingAvgsDesc = rows.map(
      (r) => within(r).getAllByRole('cell')[6].textContent,
    )
    expect(bowlingAvgsDesc.slice(0, 6)).toEqual([
      '63',
      '26',
      '25',
      '12.25',
      '9',
      '4.83',
    ])
    expect(bowlingAvgsDesc.slice(6)).toEqual(Array(9).fill('-'))

    // Bowling Econ defaults to ascending, sinking '-' to the bottom in both directions
    const econHeader = within(table).getByRole('columnheader', {
      name: /^Econ$/i,
    })
    fireEvent.click(within(econHeader).getByRole('button'))
    expect(econHeader).toHaveAttribute('aria-sort', 'ascending')
    rows = within(table).getAllByRole('row').slice(1)
    const econsAsc = rows.map(
      (r) => within(r).getAllByRole('cell')[7].textContent,
    )
    expect(econsAsc[0]).toBe('2')
    expect(econsAsc[9]).toBe('7.14')
    expect(econsAsc.slice(10)).toEqual(Array(5).fill('-'))

    fireEvent.click(within(econHeader).getByRole('button'))
    expect(econHeader).toHaveAttribute('aria-sort', 'descending')
    rows = within(table).getAllByRole('row').slice(1)
    const econsDesc = rows.map(
      (r) => within(r).getAllByRole('cell')[7].textContent,
    )
    expect(econsDesc[0]).toBe('7.14')
    expect(econsDesc[9]).toBe('2')
    expect(econsDesc.slice(10)).toEqual(Array(5).fill('-'))

    // Bowling SR defaults to ascending, sinking '-' to the bottom in both directions
    const bowlingSrHeader = within(table).getByRole('columnheader', {
      name: /^SR$/i,
    })
    fireEvent.click(within(bowlingSrHeader).getByRole('button'))
    expect(bowlingSrHeader).toHaveAttribute('aria-sort', 'ascending')
    rows = within(table).getAllByRole('row').slice(1)
    const bowlingSrsAsc = rows.map(
      (r) => within(r).getAllByRole('cell')[8].textContent,
    )
    expect(bowlingSrsAsc.slice(0, 6)).toEqual([
      '10',
      '12',
      '21',
      '27',
      '42',
      '66',
    ])
    expect(bowlingSrsAsc.slice(6)).toEqual(Array(9).fill('-'))

    fireEvent.click(within(bowlingSrHeader).getByRole('button'))
    expect(bowlingSrHeader).toHaveAttribute('aria-sort', 'descending')
    rows = within(table).getAllByRole('row').slice(1)
    const bowlingSrsDesc = rows.map(
      (r) => within(r).getAllByRole('cell')[8].textContent,
    )
    expect(bowlingSrsDesc.slice(0, 6)).toEqual([
      '66',
      '42',
      '27',
      '21',
      '12',
      '10',
    ])
    expect(bowlingSrsDesc.slice(6)).toEqual(Array(9).fill('-'))

    // Fielding interactive sorting (Drops descending then ascending)
    fireEvent.click(within(statsRegion).getByRole('tab', { name: /Fielding/i }))
    table = within(statsRegion).getByRole('table')
    const dropsHeader = within(table).getByRole('columnheader', {
      name: /^Drops$/i,
    })
    fireEvent.click(within(dropsHeader).getByRole('button'))
    expect(dropsHeader).toHaveAttribute('aria-sort', 'descending')
    rows = within(table).getAllByRole('row').slice(1)
    expect(within(rows[0]).getAllByRole('cell')[0].textContent).toBe(
      'Jordan Newcomer',
    )
    fireEvent.click(within(dropsHeader).getByRole('button'))
    expect(dropsHeader).toHaveAttribute('aria-sort', 'ascending')
    rows = within(table).getAllByRole('row').slice(1)
    expect(
      within(rows[rows.length - 1]).getAllByRole('cell')[0].textContent,
    ).toBe('Jordan Newcomer')
  })

  test('renders Leaderboard headline cards (Leading Run Scorer, Leading Wicket Taker, Safe Hands) featuring the #1 leader, supporting context, and top runners-up', () => {
    render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    const leaderboardRegion = screen.getByRole('region', {
      name: /Leaderboard/i,
    })

    // 1. Leading Run Scorer
    const runScorerCard = within(leaderboardRegion).getByRole('article', {
      name: /Leading Run Scorer/i,
    })
    expect(within(runScorerCard).getByText('Thomas Peeters')).toBeInTheDocument()
    expect(within(runScorerCard).getByText('64')).toBeInTheDocument()
    expect(within(runScorerCard).getByText(/Avg:\s*64/i)).toBeInTheDocument()
    expect(within(runScorerCard).getByText(/HS:\s*64/i)).toBeInTheDocument()

    const runScorerRunnersUp = within(runScorerCard).getAllByRole('listitem')
    expect(runScorerRunnersUp.map((li) => li.textContent)).toEqual([
      expect.stringMatching(/#2.*Alistair Osborne.*34/i),
      expect.stringMatching(/#3.*Brock Estatheo.*27/i),
      expect.stringMatching(/#4.*Cameron Haines.*24/i),
      expect.stringMatching(/#5.*Tyran Cameron.*20/i),
      expect.stringMatching(/#6.*Mitchell Owen.*20/i),
    ])

    // 2. Leading Wicket Taker
    const wicketTakerCard = within(leaderboardRegion).getByRole('article', {
      name: /Leading Wicket Taker/i,
    })
    expect(
      within(wicketTakerCard).getByText('Alistair Osborne'),
    ).toBeInTheDocument()
    expect(within(wicketTakerCard).getByText('6')).toBeInTheDocument()
    expect(
      within(wicketTakerCard).getByText(/Avg:\s*4\.83/i),
    ).toBeInTheDocument()
    expect(within(wicketTakerCard).getByText(/BBI:\s*4\/18/i)).toBeInTheDocument()

    const wicketTakerRunnersUp = within(wicketTakerCard).getAllByRole('listitem')
    expect(wicketTakerRunnersUp.map((li) => li.textContent)).toEqual([
      expect.stringMatching(/#2.*Mitchell Owen.*4/i),
      expect.stringMatching(/#3.*Brock Estatheo.*2/i),
      expect.stringMatching(/#4.*Martin Bigg.*1/i),
      expect.stringMatching(/#5.*Ewan Bauer.*1/i),
      expect.stringMatching(/#6.*Andrew Moffat.*1/i),
    ])

    // 3. Safe Hands
    const safeHandsCard = within(leaderboardRegion).getByRole('article', {
      name: /Safe Hands/i,
    })
    expect(within(safeHandsCard).getByText('Alistair Osborne')).toBeInTheDocument()
    expect(within(safeHandsCard).getByText('3')).toBeInTheDocument()
    expect(within(safeHandsCard).getByText(/3\s*Ct/i)).toBeInTheDocument()

    const safeHandsRunnersUp = within(safeHandsCard).getAllByRole('listitem')
    expect(safeHandsRunnersUp.map((li) => li.textContent)).toEqual([
      expect.stringMatching(/#2.*Andrew Moffat.*2/i),
      expect.stringMatching(/#2.*Ewan Bauer.*2/i),
      expect.stringMatching(/#4.*Thomas Peeters.*1/i),
    ])
  })

  test('renders Leaderboard banter/infamy cards (Duck Pond and Butterfingers), filtering out 0-tally players, handling ties, and matching Manual Tallies across "Last, First", "First Last", and CSV-absent players', () => {
    const customSeasonJson = {
      ...seasonData,
      manualTallies: {
        droppedCatches: {
          'Moffat, Andrew': 3,
          'Alistair Osborne': 2,
          'Bauer, Ewan': 1,
          'Newcomer, Jordan': 1,
          'Peeters, Thomas': 0,
        },
      },
    }

    render(
      <SeasonDashboard
        seasonJson={customSeasonJson}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    const leaderboardRegion = screen.getByRole('region', {
      name: /Leaderboard/i,
    })

    // 1. Duck Pond: Andrew Moffat, Nathan Standing, and Joseph Chenery tied at #1 with 1 duck; 0-duck players excluded
    const duckPondCard = within(leaderboardRegion).getByRole('article', {
      name: /Duck Pond/i,
    })
    expect(within(duckPondCard).getByText(/Andrew Moffat/i)).toBeInTheDocument()
    expect(
      within(duckPondCard).getByText(/Joseph Chenery/i),
    ).toBeInTheDocument()
    expect(
      within(duckPondCard).getByText(/Nathan Standing/i),
    ).toBeInTheDocument()
    expect(within(duckPondCard).getByText('1')).toBeInTheDocument()
    // 0-duck players must not appear on Duck Pond
    expect(
      within(duckPondCard).queryByText(/Thomas Peeters/i),
    ).not.toBeInTheDocument()
    expect(within(duckPondCard).queryAllByRole('listitem')).toHaveLength(0)

    // 2. Butterfingers: Andrew Moffat #1 with 3 drops, Alistair Osborne #2 with 2, Ewan Bauer & Jordan Newcomer (not in CSV) tied #3 with 1, Thomas Peeters (0 drops) excluded
    const butterfingersCard = within(leaderboardRegion).getByRole('article', {
      name: /Butterfingers/i,
    })
    expect(
      within(butterfingersCard).getByText('Andrew Moffat'),
    ).toBeInTheDocument()
    expect(within(butterfingersCard).getByText('3')).toBeInTheDocument()
    expect(
      within(butterfingersCard).queryByText(/Thomas Peeters/i),
    ).not.toBeInTheDocument()

    const butterfingersRunnersUp =
      within(butterfingersCard).getAllByRole('listitem')
    expect(butterfingersRunnersUp.map((li) => li.textContent)).toEqual([
      expect.stringMatching(/#2.*Alistair Osborne.*2/i),
      expect.stringMatching(/#3.*Ewan Bauer.*1/i),
      expect.stringMatching(/#3.*Jordan Newcomer.*1/i),
    ])
  })

  test('renders additional Manual Tally categories configured in season.json as Leaderboard cards, aggregating across "Last, First" and "First Last" formats and including CSV-absent players', () => {
    const customSeasonJson = {
      ...seasonData,
      manualTallies: {
        droppedCatches: {
          'Moffat, Andrew': 2,
          'Alistair Osborne': 1,
        },
        lateForWarmup: {
          'Estatheo, Brock': 3,
          'Brock Estatheo': 1,
          'Owen, Mitchell': 2,
          'Newcomer, Jordan': 1,
          'Peeters, Thomas': 0,
        },
        'Clubhouse Shouts': {
          'Osborne, Alistair': 5,
          'Moffat, Andrew': 3,
        },
      },
    }

    render(
      <SeasonDashboard
        seasonJson={customSeasonJson}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    const leaderboardRegion = screen.getByRole('region', {
      name: /Leaderboard/i,
    })

    // 1. camelCase key formatted to "Late For Warmup" with aggregated player tallies
    const lateCard = within(leaderboardRegion).getByRole('article', {
      name: /Late For Warmup/i,
    })
    expect(within(lateCard).getByText('Brock Estatheo')).toBeInTheDocument()
    expect(within(lateCard).getByText('4')).toBeInTheDocument()
    expect(
      within(lateCard).queryByText(/Thomas Peeters/i),
    ).not.toBeInTheDocument()

    const lateRunnersUp = within(lateCard).getAllByRole('listitem')
    expect(lateRunnersUp.map((li) => li.textContent)).toEqual([
      expect.stringMatching(/#2.*Mitchell Owen.*2/i),
      expect.stringMatching(/#3.*Jordan Newcomer.*1/i),
    ])

    // 2. Additional space-separated Manual Tally category
    const shoutsCard = within(leaderboardRegion).getByRole('article', {
      name: /Clubhouse Shouts/i,
    })
    expect(
      within(shoutsCard).getByText('Alistair Osborne'),
    ).toBeInTheDocument()
    expect(within(shoutsCard).getByText('5')).toBeInTheDocument()

    const shoutsRunnersUp = within(shoutsCard).getAllByRole('listitem')
    expect(shoutsRunnersUp.map((li) => li.textContent)).toEqual([
      expect.stringMatching(/#2.*Andrew Moffat.*3/i),
    ])
  })

  test('breaks Leading Run Scorer ties by batting Average descending and Leading Wicket Taker ties by bowling Average ascending', () => {
    const header = combinedStatsCsv.trim().split(/\r?\n/)[0]
    const tieBreakCsv = [
      header,
      // Both batters have 50 runs; Alpha has avg 50 (1 out), Beta has avg 25 (2 outs) -> Alpha #1, Beta #2
      // Both bowlers have 4 wickets; Gamma has bowling avg 10.0, Delta has bowling avg 18.5 -> Gamma #1, Delta #2
      '"Alpha, Batter",Beresfield Memorial Cricket Club,2,2,50,50,40,1,1,0,0,30,true,125,5,1,0,0,0,0,0,--,,,,0,0,0,0,0,0,0,0,Division 7,Newcastle District Cricket Association Inc.',
      '"Beta, Batter",Beresfield Memorial Cricket Club,2,2,25,50,50,0,0,0,0,35,false,100,4,0,0,0,0,0,0,--,,,,0,0,0,0,0,0,0,0,Division 7,Newcastle District Cricket Association Inc.',
      '"Delta, Bowler",Beresfield Memorial Cricket Club,2,1,5,5,10,0,0,0,0,5,false,50,0,0,4,0,74,60,0,2--30,18.5,15,7.4,0,0,0,0,0,0,0,0,Division 7,Newcastle District Cricket Association Inc.',
      '"Gamma, Bowler",Beresfield Memorial Cricket Club,2,1,5,5,10,0,0,0,0,5,false,50,0,0,4,1,40,60,0,3--15,10,15,4,0,0,0,0,0,0,0,0,Division 7,Newcastle District Cricket Association Inc.',
    ].join('\n')

    render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={tieBreakCsv}
      />,
    )

    const leaderboardRegion = screen.getByRole('region', {
      name: /Leaderboard/i,
    })

    const runScorerCard = within(leaderboardRegion).getByRole('article', {
      name: /Leading Run Scorer/i,
    })
    expect(within(runScorerCard).getByText('Batter Alpha')).toBeInTheDocument()
    expect(within(runScorerCard).getByText(/Avg:\s*50/i)).toBeInTheDocument()
    expect(within(runScorerCard).getByText(/HS:\s*30\*/i)).toBeInTheDocument()
    const runRunnersUp = within(runScorerCard).getAllByRole('listitem')
    expect(runRunnersUp[0].textContent).toMatch(/#2.*Batter Beta.*50/i)

    const wicketTakerCard = within(leaderboardRegion).getByRole('article', {
      name: /Leading Wicket Taker/i,
    })
    expect(
      within(wicketTakerCard).getByText('Bowler Gamma'),
    ).toBeInTheDocument()
    expect(within(wicketTakerCard).getByText(/Avg:\s*10/i)).toBeInTheDocument()
    expect(within(wicketTakerCard).getByText(/BBI:\s*3\/15/i)).toBeInTheDocument()
    const wicketRunnersUp = within(wicketTakerCard).getAllByRole('listitem')
    expect(wicketRunnersUp[0].textContent).toMatch(/#2.*Bowler Delta.*4/i)
  })
})

describe('SeasonDashboard mobile disclosures', () => {
  // On mobile (below the `sm` breakpoint) secondary detail is collapsed behind a
  // toggle button. The button itself is hidden at `sm` and above, where the
  // detail is always shown via `sm:*` display utilities.
  const renderDashboard = () =>
    render(
      <SeasonDashboard
        seasonJson={ladderFixtureSeason}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

  const controlledBy = (button: HTMLElement) => {
    const id = button.getAttribute('aria-controls')
    expect(id).toBeTruthy()
    const el = document.getElementById(id!)
    expect(el).not.toBeNull()
    return el!
  }

  test('Last Match Result shows the result summary on mobile and collapses scores and innings breakdown behind a toggle', () => {
    renderDashboard()

    const region = screen.getByRole('region', { name: /Last Match Result/i })
    const toggle = within(region).getByRole('button', {
      name: /Show full result/i,
    })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle.className).toMatch(/\bsm:hidden\b/)

    const details = controlledBy(toggle)
    expect(details.classList).toContain('hidden')
    expect(details.className).toMatch(/\bsm:block\b/)

    // Summary stays visible outside the collapsible detail
    const summary = within(region).getByText(
      /MDCC Lions Senior Men Div 7 won by 4 wickets/i,
    )
    expect(details).not.toContainElement(summary)

    // Scores and innings breakdown are inside the collapsible detail
    expect(within(details).getByText(/Innings Breakdown/i)).toBeInTheDocument()
    expect(within(details).getByText(/J Thurlow - 33/i)).toBeInTheDocument()

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(toggle).toHaveAccessibleName(/Hide full result/i)
    expect(details.classList).not.toContain('hidden')
  })

  test('Ladder shows only our Team and adjacent rows on mobile until expanded', () => {
    renderDashboard()

    const region = screen.getByRole('region', { name: /Ladder/i })
    const toggle = within(region).getByRole('button', {
      name: /Show full ladder/i,
    })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle.className).toMatch(/\bsm:hidden\b/)
    expect(controlledBy(toggle)).toBe(within(region).getByRole('table'))

    const rows = within(region).getAllByRole('row').slice(1)
    const hiddenPositions = rows
      .filter((r) => r.classList.contains('hidden'))
      .map((r) => within(r).getAllByRole('cell')[0].textContent)
    // Our Team is 5th, so 4th–6th stay visible
    expect(hiddenPositions).toEqual(['1', '2', '3', '7', '8'])
    rows
      .filter((r) => r.classList.contains('hidden'))
      .forEach((r) => expect(r.className).toMatch(/\bsm:table-row\b/))

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(toggle).toHaveAccessibleName(/Show fewer/i)
    expect(rows.filter((r) => r.classList.contains('hidden'))).toHaveLength(0)
  })

  test('Leaderboard cards show the #1 leader on mobile and collapse runners-up behind a per-card toggle', () => {
    renderDashboard()

    const region = screen.getByRole('region', { name: /Leaderboard/i })
    const runScorerCard = within(region).getByRole('article', {
      name: /Leading Run Scorer/i,
    })
    const wicketTakerCard = within(region).getByRole('article', {
      name: /Leading Wicket Taker/i,
    })

    const runToggle = within(runScorerCard).getByRole('button', {
      name: /Show runners-up/i,
    })
    const wicketToggle = within(wicketTakerCard).getByRole('button', {
      name: /Show runners-up/i,
    })
    expect(runToggle).toHaveAttribute('aria-expanded', 'false')
    expect(runToggle.className).toMatch(/\bsm:hidden\b/)

    const runList = controlledBy(runToggle)
    const wicketList = controlledBy(wicketToggle)
    expect(runList).toBe(within(runScorerCard).getByRole('list'))
    expect(runList.classList).toContain('hidden')
    expect(runList.className).toMatch(/\bsm:block\b/)

    // Leader stays visible outside the collapsible list
    expect(runList).not.toContainElement(
      within(runScorerCard).getByText('#1'),
    )

    fireEvent.click(runToggle)
    expect(runToggle).toHaveAttribute('aria-expanded', 'true')
    expect(runToggle).toHaveAccessibleName(/Hide runners-up/i)
    expect(runList.classList).not.toContain('hidden')

    // Each card expands independently
    expect(wicketToggle).toHaveAttribute('aria-expanded', 'false')
    expect(wicketList.classList).toContain('hidden')
  })

  test('Season Statistics collapses the tabs and table behind a toggle on mobile', () => {
    renderDashboard()

    const region = screen.getByRole('region', { name: /Season Statistics/i })
    const toggle = within(region).getByRole('button', {
      name: /Show statistics/i,
    })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle.className).toMatch(/\bsm:hidden\b/)

    const body = controlledBy(toggle)
    expect(body.classList).toContain('hidden')
    expect(body.className).toMatch(/\bsm:block\b/)
    expect(within(body).getByRole('table')).toBeInTheDocument()
    const tablist = within(region).getByRole('tablist')
    expect(tablist.classList).toContain('hidden')
    expect(tablist.className).toMatch(/\bsm:inline-flex\b/)

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(toggle).toHaveAccessibleName(/Hide statistics/i)
    expect(body.classList).not.toContain('hidden')
    expect(tablist.classList).not.toContain('hidden')
  })
})
