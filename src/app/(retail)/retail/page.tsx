'use client'
import { Market, UpcomingRound } from '@/lib/types'
import BettingSlip from '@/retail-components/betting-slip'
import MatchBettingOptions from '@/retail-components/match-betting-options'
import UpcomingRoundCard from '@/retail-components/upcoming-round-card'
import UpcomingRoundsCard from '@/retail-components/upcoming-rounds-card'
import { RootContext } from '@/retail-contexts/root-context'
import { useContext, useState } from 'react'

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
  const [accordionOpen, setAccordionOpen] = useState(false)

  return (
    <div className="grid h-full grid-cols-4 justify-center gap-3">
      {/* First column - top content */}
      <div className="col-span-1 flex flex-col items-center gap-4">
        <UpcomingRoundsCard
          rounds={upcomingRounds}
          selectedRound={selectedRound}
          setSelectedRound={setSelectedRound}
          onCollapse={() => setAccordionOpen(!accordionOpen)}
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
