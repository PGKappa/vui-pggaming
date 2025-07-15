'use client'
import BettingSlip from '@/retail-components/betting-slip'
import Leaderboard from '@/retail-components/leaderboard'
import MatchBettingOptions from '@/retail-components/match-betting-options'
import SearchEventResults from '@/retail-components/search-event-results'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import { UpcomingEventsCarousel } from '@/retail-components/upcoming-events-carousel'
import UpcomingRoundCard from '@/retail-components/upcoming-round-card'
import { RootContext } from '@/retail-contexts/root-context'
import { Market, UpcomingEvent, UpcomingRound } from '@/retail-lib/types'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()
  const {
    upcomingEvents,
    searchEventResults: searchRoundResults,
    setSearchEventResults: setSearchRoundResults,
  } = useContext(RootContext)

  const [matchBetOptions, setMatchBetOptions] = useState<{
    round: {
      name: string
      number: number
      startingAt: Date
    }
    teams: string
    markets: Market[]
  }>()

  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent>()

  useEffect(() => {
    if (!selectedEvent && upcomingEvents && upcomingEvents.length > 0) {
      setSelectedEvent(upcomingEvents[0])
    }
  }, [upcomingEvents, selectedEvent])

  useEffect(() => {
    console.log('Search round results updated:', searchRoundResults)
  }, [searchRoundResults])

  return (
    <div className="flex h-full flex-row overflow-hidden py-2">
      <div className="flex flex-col">
        <div className="mx-2 flex h-[80px] w-[1500px] flex-row items-center justify-center bg-accent px-4">
          <UpcomingEventsCarousel
            selectedEvent={selectedEvent}
            setSelectedEvent={(event) => {
              setSelectedEvent(event)
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
              ) : selectedEvent ? (
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
                      round={selectedEvent.data as UpcomingRound}
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
