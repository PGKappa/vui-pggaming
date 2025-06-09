'use client'
import BettingSlip from '@/retail-components/betting-slip'
import LastRoundsResults from '@/retail-components/last-rounds-results'
import Leaderboard from '@/retail-components/leaderboard'
import MatchBettingOptions from '@/retail-components/match-betting-options'
import SearchRoundResults from '@/retail-components/search-round-results'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import UpcomingRoundCard from '@/retail-components/upcoming-round-card'
import UpcomingRoundsCard from '@/retail-components/upcoming-rounds-card'
import { RootContext } from '@/retail-contexts/root-context'
import { Market, RoundResults, UpcomingRound } from '@/retail-lib/types'
import { useContext, useEffect, useState } from 'react'

export default function Home() {
  const { upcomingRounds, roundResults } = useContext(RootContext)

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
  const [lastResultsOpen, setLastResultsOpen] = useState(true)
  const [searchRoundResults, setSearchRoundResults] = useState<RoundResults[]>()

  useEffect(() => {
    if (!selectedRound && upcomingRounds && upcomingRounds.length > 0) {
      setSelectedRound(upcomingRounds[0])
    }
  }, [upcomingRounds, selectedRound])

  return (
    <div className="flex h-full overflow-hidden">
      {/* First column */}
      <div className="flex h-[942px] w-[290px] flex-col items-center justify-between gap-4 overflow-hidden">
        <UpcomingRoundsCard
          rounds={upcomingRounds}
          selectedRound={selectedRound}
          setSelectedRound={(round) => {
            setSelectedRound(round)
            setSearchRoundResults(undefined)
          }}
          collapsed={lastResultsOpen}
          toggleCollapse={() => setLastResultsOpen((prev) => !prev)}
        />
        <LastRoundsResults
          roundResults={roundResults}
          open={lastResultsOpen}
          toggleOpen={() => setLastResultsOpen((prev) => !prev)}
          setSearchRoundResults={setSearchRoundResults}
          searchRoundResults={searchRoundResults}
        />
      </div>

      {/* SECOND COLUMN*/}
      <div className="ml-2 flex h-[942px] w-[1241px] flex-col gap-2 overflow-y-auto">
        <ScrollArea className="h-full w-full">
          {!!searchRoundResults ? (
            <SearchRoundResults
              roundResults={searchRoundResults}
              onClose={() => setSearchRoundResults(undefined)}
            />
          ) : selectedRound ? (
            matchBetOptions ? (
              <MatchBettingOptions
                round={matchBetOptions.round}
                teams={matchBetOptions.teams}
                markets={matchBetOptions.markets}
                close={() => setMatchBetOptions(undefined)}
              />
            ) : (
              <>
                <UpcomingRoundCard
                  round={selectedRound}
                  viewMatchBettingOptions={setMatchBetOptions}
                />
                <Leaderboard />
              </>
            )
          ) : (
            <div className="flex h-full items-center justify-center">
              No round selected
            </div>
          )}
        </ScrollArea>
      </div>

      {/*RIGHT COLUMN - Betting slip*/}
      <div className="ml-2 h-[942px] w-[348px] overflow-y-auto bg-background text-foreground">
        <BettingSlip />
      </div>
    </div>
  )
}
