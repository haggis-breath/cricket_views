import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { SeasonDashboard } from './SeasonDashboard'
import seasonData from '../data/season.json'
import matchResultsCsv from '../2026-10-23-match-results.csv?raw'
import combinedStatsCsv from '../2026-10-23-combined-batting-bowling-fielding.csv?raw'

describe('SeasonDashboard', () => {
  test('renders Team header with team name, club, competition grade, association, Season title, last-updated indicator, and PlayHQ link', () => {
    render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    expect(
      screen.getByRole('heading', { name: /Tech College \(Beresfield Memorial\)/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Beresfield Memorial Cricket Club/i)).toBeInTheDocument()
    expect(screen.getByText(/Division 7/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Newcastle District Cricket Association Inc\./i),
    ).toBeInTheDocument()
    expect(screen.getByText(/2026\/27 Summer/i)).toBeInTheDocument()
    expect(screen.getByText(/Round 2 \(17 Oct 2026\)/i)).toBeInTheDocument()

    const playhqLinks = screen.getAllByRole('link', { name: /PlayHQ/i })
    expect(playhqLinks.length).toBeGreaterThanOrEqual(1)
    expect(playhqLinks[0]).toHaveAttribute(
      'href',
      'https://www.playhq.com/cricket-australia/org/newcastle-district-cricket-association-inc',
    )
  })

  test('renders Last Match Result selecting the most recent completed match from matchResultsCsv with round, date, format, venue, teams, scores, result, innings closure types, and performances', () => {
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
      within(lastMatchRegion).getByText(/Hudson Park \(KOTARA\)/i),
    ).toBeInTheDocument()
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
      screen.getByRole('heading', {
        name: /Tech College \(Beresfield Memorial\)/i,
      }),
    ).toBeInTheDocument()

    const lastMatchRegion = screen.getByRole('region', {
      name: /Last Match Result/i,
    })
    expect(within(lastMatchRegion).getByText('Round 2')).toBeInTheDocument()
    expect(within(lastMatchRegion).getByText(/Next Fixture/i)).toBeInTheDocument()
    expect(within(lastMatchRegion).getByText('Round 3')).toBeInTheDocument()
  })

  test('renders the competition Ladder with all columns (Pos, Team, P, W, L, D/NR, Pts, %) in rank order', () => {
    render(
      <SeasonDashboard
        seasonJson={seasonData}
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

    // Rows in order (1 header row + 4 team rows)
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(5)

    const row1Cells = within(rows[1]).getAllByRole('cell')
    expect(row1Cells.map((c) => c.textContent)).toEqual([
      '1',
      'MDCC Lions Senior Men Div 7',
      '2',
      '2',
      '0',
      '0',
      '12',
      '1.42',
    ])

    const row2Cells = within(rows[2]).getAllByRole('cell')
    expect(row2Cells.map((c) => c.textContent)).toEqual([
      '2',
      'Tech College (Beresfield Memorial)',
      '2',
      '1',
      '1',
      '0',
      '6',
      '1.00',
    ])

    const row3Cells = within(rows[3]).getAllByRole('cell')
    expect(row3Cells.map((c) => c.textContent)).toEqual([
      '3',
      'Adamstown Cricket Club (Scorpions)',
      '2',
      '1',
      '1',
      '0',
      '6',
      '0.96',
    ])

    const row4Cells = within(rows[4]).getAllByRole('cell')
    expect(row4Cells.map((c) => c.textContent)).toEqual([
      '4',
      'Kotara',
      '2',
      '0',
      '2',
      '0',
      '0',
      '0.78',
    ])
  })

  test('visually highlights our Team row in the Ladder and leaves opponent rows unhighlighted', () => {
    render(
      <SeasonDashboard
        seasonJson={seasonData}
        matchResultsCsv={matchResultsCsv}
        combinedStatsCsv={combinedStatsCsv}
      />,
    )

    const ladderRegion = screen.getByRole('region', { name: /Ladder/i })
    const rows = within(ladderRegion).getAllByRole('row')

    const opponentRow1 = rows[1]
    const ourTeamRow = rows[2]
    const opponentRow3 = rows[3]
    const opponentRow4 = rows[4]

    expect(ourTeamRow).toHaveAttribute('aria-current', 'true')

    expect(opponentRow1).not.toHaveAttribute('aria-current')
    expect(opponentRow3).not.toHaveAttribute('aria-current')
    expect(opponentRow4).not.toHaveAttribute('aria-current')
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

  test('switches to Fielding tab, computes RO and Total Dismissals (Dis) sorted descending, merges Manual Tallies dropped catches across "Last, First" and "First Last" formats (case-insensitive, trimmed), and synthesizes players only in Manual Tallies', () => {
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

    // #1 fielder by Total Dismissals: Alex Keeper (0 non-WK + 2 WK = 2 Tot Ct, 1 unassisted + 1 assisted = 2 RO, 1 St -> 5 Dis, 0 Drops)
    expect(
      within(rows[1])
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['Alex Keeper', '2', '0', '2', '2', '2', '1', '5', '0'])

    // #2 fielder: Alistair Osborne (3 Ct, 0 WK Ct, 3 Tot Ct, 0 RO, 0 St, 3 Dis, 1 Drop matched from '  osborne, alistair ')
    expect(
      within(rows[2])
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['Alistair Osborne', '2', '3', '0', '3', '0', '0', '3', '1'])

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
})
