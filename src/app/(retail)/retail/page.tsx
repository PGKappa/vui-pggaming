'use client'
import BettingSlip from '@/retail-components/betting-slip'
import LastRoundsResults from '@/retail-components/last-rounds-results'
import Leaderboard from '@/retail-components/leaderboard'
import MatchBettingOptions from '@/retail-components/match-betting-options'
import SearchDialog from '@/retail-components/search-dialog'
import SearchRoundResults from '@/retail-components/search-round-results'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import UpcomingRoundCard from '@/retail-components/upcoming-round-card'
import UpcomingRoundsCard from '@/retail-components/upcoming-rounds-card'
import { RootContext } from '@/retail-contexts/root-context'
import { Market, RoundResults, UpcomingRound } from '@/retail-lib/types'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()
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
  const [searchRoundResults, setSearchRoundResults] = useState<RoundResults[]>()

  useEffect(() => {
    if (!selectedRound && upcomingRounds && upcomingRounds.length > 0) {
      setSelectedRound(upcomingRounds[0])
    }
  }, [upcomingRounds, selectedRound])

  return (
    <div className="mt-2 flex h-full flex-col overflow-hidden">
      <div className="mx-2 flex h-14 flex-row items-center justify-start gap-4 bg-accent px-4">
        <UpcomingRoundsCard
          rounds={upcomingRounds}
          selectedRound={selectedRound}
          setSelectedRound={(round) => {
            setSelectedRound(round)
            setSearchRoundResults(undefined)
          }}
        />

        <LastRoundsResults
          roundResults={roundResults}
          upcomingRound={upcomingRounds}
        />

        <SearchDialog setSearchRoundResults={setSearchRoundResults} />
      </div>

      {/* Main content area */}
      <div className="flex h-full flex-row gap-2 px-2 overflow-hidden pt-2">
        <div className="flex h-[942px] w-[1530px] flex-col gap-2 overflow-y-auto">
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
                {t('no_round_selected')}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* RIGHT COLUMN - Betting slip */}
        <div className="h-[882px] w-[384px] overflow-y-auto bg-background text-foreground">
          <BettingSlip />
        </div>
      </div>
    </div>
  )
}
