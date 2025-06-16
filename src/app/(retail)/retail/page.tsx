'use client'
import BettingSlip from '@/retail-components/betting-slip'
import LastRoundsResults from '@/retail-components/last-rounds-results'
import Leaderboard from '@/retail-components/leaderboard'
import MatchBettingOptions from '@/retail-components/match-betting-options'
import SearchDialog from '@/retail-components/search-dialog'
import SearchRoundResults from '@/retail-components/search-round-results'
import { Button } from '@/retail-components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from '@/retail-components/ui/drawer'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import UpcomingRoundCard from '@/retail-components/upcoming-round-card'
import UpcomingRoundsCard from '@/retail-components/upcoming-rounds-card'
import { RootContext } from '@/retail-contexts/root-context'
import { Market, RoundResults, UpcomingRound } from '@/retail-lib/types'
import { CalendarIcon, HistoryIcon } from 'lucide-react'
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
  const [lastResultsOpen, setLastResultsOpen] = useState(true)
  const [searchRoundResults, setSearchRoundResults] = useState<RoundResults[]>()

  useEffect(() => {
    if (!selectedRound && upcomingRounds && upcomingRounds.length > 0) {
      setSelectedRound(upcomingRounds[0])
    }
  }, [upcomingRounds, selectedRound])

  return (
    <div className="mt-2 flex h-full overflow-hidden">
      <div className="top-navbar-height fixed left-0 flex h-full w-14 flex-col items-center justify-start gap-8 border-r border-border bg-accent py-6">
        <Drawer>
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              className="text-background hover:bg-transparent"
              style={{ scale: 2 }}
            >
              <CalendarIcon />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-full w-[300px] p-0">
            <UpcomingRoundsCard
              rounds={upcomingRounds}
              selectedRound={selectedRound}
              setSelectedRound={(round) => {
                setSelectedRound(round)
                setSearchRoundResults(undefined)
              }}
            />
          </DrawerContent>
        </Drawer>

        <Drawer>
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              className="text-background hover:bg-transparent"
              style={{ scale: 2 }}
            >
              <HistoryIcon />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-full w-[300px] p-0">
            <LastRoundsResults
              roundResults={roundResults}
              open={lastResultsOpen}
              toggleOpen={() => setLastResultsOpen((prev) => !prev)}
            />
          </DrawerContent>
        </Drawer>

        <SearchDialog setSearchRoundResults={setSearchRoundResults} />
      </div>

      {/* Main content area */}
      <div className="ml-[56px] mr-2 flex h-[942px] w-[1466px] flex-col gap-2 overflow-y-auto pl-2">
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
      <div className="h-[942px] w-[384px] overflow-y-auto bg-background text-foreground">
        <BettingSlip />
      </div>
    </div>
  )
}
