'use client'
import BettingSlip from '@/retail-components/betting-slip'
import Leaderboard from '@/retail-components/leaderboard'
import MatchBettingOptions from '@/retail-components/match-betting-options'
import SearchEventResults from '@/retail-components/search-event-results'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import UpcomingRoundCard from '@/retail-components/upcoming-round-card'
import { UpcomingRoundsCarousel } from '@/retail-components/upcoming-rounds-carousel'
import { RootContext } from '@/retail-contexts/root-context'
import { Market, UpcomingRound } from '@/retail-lib/types'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()
  const { upcomingRounds, searchRoundResults, setSearchRoundResults } =
    useContext(RootContext)

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

  return (
    <div className="flex h-full flex-row overflow-hidden py-2">
      <div className="flex flex-col">
        <div className="mx-2 flex h-16 w-[1500px] flex-row items-center justify-center bg-accent px-4">
          <UpcomingRoundsCarousel
            selectedRound={selectedRound}
            setSelectedRound={(round) => {
              setSelectedRound(round)
              setSearchRoundResults(undefined)
            }}
          />
        </div>

        {/* Main content area */}
        <div className="flex h-full flex-row gap-2 overflow-hidden px-2 pt-2">
          <div className="flex h-[942px] w-[1500px] flex-col gap-2 overflow-y-auto">
            <ScrollArea className="h-full w-full">
              {!!searchRoundResults ? (
                <SearchEventResults
                  eventResults={searchRoundResults}
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
                  {t('no_round_selected')}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Betting slip */}
      <div className="h-[942px] w-[410px] bg-background pr-2 text-foreground">
        <BettingSlip />
      </div>
    </div>
  )
}
