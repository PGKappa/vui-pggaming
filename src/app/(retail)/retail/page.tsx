'use client'
import { Market, UpcomingRound } from '@/retail-lib/types'
import BettingSlip from '@/retail-components/betting-slip'
import MatchBettingOptions from '@/retail-components/match-betting-options'
import UpcomingRoundCard from '@/retail-components/upcoming-round-card'
import UpcomingRoundsCard from '@/retail-components/upcoming-rounds-card'
import { RootContext } from '@/retail-contexts/root-context'
import { useContext, useState } from 'react'
import LastRoundsResults from '@/retail-components/last-rounds-results'

export default function Home() {
  const { upcomingRounds } = useContext(RootContext)
  const [matchBetOptions, setMatchBetOptions] = useState<{
    round: {
      name: string
      number: number
      startingAt: Date
    }
    teams: string
    markets: Market[]
  }>()

  const [selectedRound, setSelectedRound] = useState<UpcomingRound>()
  const [lastResultsOpen, setLastResultsOpen] = useState(false)

  return (
    <div className="grid h-full grid-cols-4 justify-center gap-3">
      {/* First column - top content */}
      <div className="col-span-1 flex flex-col items-center gap-4">
        <UpcomingRoundsCard
          rounds={upcomingRounds}
          selectedRound={selectedRound}
          setSelectedRound={setSelectedRound}
          collapsed={lastResultsOpen}
          toggleCollapse={() => setLastResultsOpen((prev) => !prev)}
        />
        <LastRoundsResults
          roundsResults={[
            {
              round: {
                name: 'Triden',
                number: 17,
              },
              startTime: new Date(),
            },
            {
              round: {
                name: 'Triden',
                number: 16,
              },
              startTime: new Date(),
            },
            {
              round: {
                name: 'Triden',
                number: 15,
              },
              startTime: new Date(),
            },
            {
              round: {
                name: 'Triden',
                number: 14,
              },
              startTime: new Date(),
            },
            {
              round: {
                name: 'Triden',
                number: 13,
              },
              startTime: new Date(),
            },
            {
              round: {
                name: 'Triden',
                number: 12,
              },
              startTime: new Date(),
            },
          ]}
          open={lastResultsOpen}
          toggleOpen={() => setLastResultsOpen((prev) => !prev)}
        />
      </div>

      {/* SECOND COLUMN*/}
      <div className="col-span-2 space-y-3">
        {selectedRound ? (
          matchBetOptions ? (
            <MatchBettingOptions
              round={matchBetOptions.round}
              teams={matchBetOptions.teams}
              markets={matchBetOptions.markets}
              close={() => setMatchBetOptions(undefined)}
            />
          ) : (
            <UpcomingRoundCard
              round={selectedRound}
              viewMatchBettingOptions={setMatchBetOptions}
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center">
            No round selected
          </div>
        )}
      </div>

      {/*RIGHT COLUMN - Betting slip*/}
      <div className="col-span-1 h-full bg-background text-foreground">
        <BettingSlip />
      </div>
    </div>
  )
}
