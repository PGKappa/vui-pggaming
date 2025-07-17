'use client'
import { RootContext } from '@/retail-contexts/root-context'
import { UpcomingRound } from '@/retail-lib/types'
import { useContext, useEffect, useState } from 'react'

export default function Home() {
  const { upcomingRounds } = useContext(RootContext)

  // const [matchBetOptions, setMatchBetOptions] = useState<{
  //   round: {
  //     name: string
  //     number: number
  //     startingAt: Date
  //   }
  //   teams: string
  //   markets: Market[]
  // }>()

  const [selectedRound, setSelectedRound] = useState<UpcomingRound>()
  // const [lastResultsOpen, setLastResultsOpen] = useState(true)
  // const [searchEventResults, setSearchEventResults] = useState<EventResult[]>()

  useEffect(() => {
    if (!selectedRound && upcomingRounds && upcomingRounds.length > 0) {
      setSelectedRound(upcomingRounds[0])
    }
  }, [upcomingRounds, selectedRound])

  return (
    <div className="flex h-full overflow-hidden">
      {/* First column 
      <div className="flex h-[942px] w-[263px] flex-col items-center justify-between gap-2 overflow-hidden">
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
              {t('no_round_selected')}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="ml-2 h-[942px] w-[382px] overflow-y-auto bg-background text-foreground">
        <BettingSlip />
      </div> */}
    </div>
  )
}
