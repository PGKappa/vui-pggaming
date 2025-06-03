'use client'
import { Market, UpcomingRound } from '@/retail-lib/types'
import BettingSlip from '@/retail-components/betting-slip'
import MatchBettingOptions from '@/retail-components/match-betting-options'
import UpcomingRoundCard from '@/retail-components/upcoming-round-card'
import UpcomingRoundsCard from '@/retail-components/upcoming-rounds-card'
import { RootContext } from '@/retail-contexts/root-context'
import { useContext, useEffect, useMemo, useState } from 'react'
import LastRoundsResults from '@/retail-components/last-rounds-results'

export default function Home() {
  const { upcomingRounds } = useContext(RootContext)

  const referenceDate = useMemo(() => {
    if (upcomingRounds && upcomingRounds.length > 0) {
      const firstMatch = upcomingRounds[0].mag_event?.[0]
      return firstMatch ? new Date(firstMatch.startTime) : new Date()
    }
    return new Date()
  }, [upcomingRounds])

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
  useEffect(() => {
    if (!selectedRound && upcomingRounds && upcomingRounds.length > 0) {
      setSelectedRound(upcomingRounds[0])
    }
  }, [upcomingRounds, selectedRound])

  const [lastResultsOpen, setLastResultsOpen] = useState(false)

  return (
    <div className="flex h-full overflow-hidden">
      {/* First column */}
      <div className="w-[263px] flex h-full max-h-full flex-col items-center justify-between overflow-hidden ml-2 mr-3">
        <UpcomingRoundsCard
          rounds={upcomingRounds}
          selectedRound={selectedRound}
          setSelectedRound={setSelectedRound}
          collapsed={lastResultsOpen}
          toggleCollapse={() => setLastResultsOpen((prev) => !prev)}
        />
        <LastRoundsResults
          roundsResults={Array.from({ length: 3 }, (_, index) => {
            const date = new Date(referenceDate)
            date.setMinutes(date.getMinutes() - (index + 1) * 3)

            return {
              round: {
                name: 'Triden',
                number: 3 - index,
              },
              startTime: date,
            }
          })}
          open={lastResultsOpen}
          toggleOpen={() => setLastResultsOpen((prev) => !prev)}
        />
      </div>

      {/* SECOND COLUMN*/}
      <div className="w-[1241px] h-full overflow-y-auto mr-3">
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
      <div className="w-[375] h-full max-h-full overflow-y-auto bg-background text-foreground">
        <BettingSlip />
      </div>
    </div>
  )
}
