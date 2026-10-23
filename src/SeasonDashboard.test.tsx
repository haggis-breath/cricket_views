import { render, screen, within } from '@testing-library/react'
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
})
