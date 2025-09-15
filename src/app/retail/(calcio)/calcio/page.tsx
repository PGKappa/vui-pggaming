'use client'
import BettingSlip from '@/retail-components/betting-slip'
import Leaderboard from '@/retail-components/leaderboard'
import MatchBettingOptions from '@/retail-components/match-betting-options'
import SearchEventResults from '@/retail-components/search-event-results'
import { UpcomingEventsCarousel } from '@/retail-components/upcoming-events-carousel'
import UpcomingRoundCard from '@/retail-components/upcoming-round-card'
import { RootContext } from '@/retail-contexts/root-context'
import { Market, UpcomingEvent, UpcomingRound } from '@/retail-lib/types'
import { useContext, useEffect, useRef, useState } from 'react'
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

  const [isLeaderboardExpanded, setIsLeaderboardExpanded] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedEvent && upcomingEvents && upcomingEvents.length > 0) {
      setSelectedEvent(upcomingEvents[0])
    }
  }, [upcomingEvents, selectedEvent])

  return (
    <div className="flex h-full flex-row overflow-hidden py-2">
      <div className="flex flex-col gap-2">
        <div className="mx-2 flex h-[80px] w-[1500px] flex-row items-center justify-center bg-accent px-4">
          <UpcomingEventsCarousel
            selectedEvent={selectedEvent}
            setSelectedEvent={(event) => {
              setSelectedEvent(event)
              setSearchRoundResults(undefined)
              setMatchBetOptions(undefined)
              setIsLeaderboardExpanded(false)
            }}
          />
        </div>

        <div className="mx-2 flex h-[942px] w-[1500px] flex-col gap-2">
          {!!searchRoundResults ? (
            <SearchEventResults />
          ) : selectedEvent ? (
            matchBetOptions ? (
              <MatchBettingOptions
                round={matchBetOptions.round}
                teams={matchBetOptions.teams}
                markets={matchBetOptions.markets}
                close={() => setMatchBetOptions(undefined)}
              />
            ) : (
              <div ref={scrollContainerRef} className="overflow-y-auto">
                <div className="h-[814px] overflow-y-auto">
                  <UpcomingRoundCard
                    round={selectedEvent.data as UpcomingRound}
                    viewMatchBettingOptions={setMatchBetOptions}
                    onTabChange={() => {
                      scrollContainerRef.current?.scrollTo({
                        top: 0,
                        behavior: 'smooth',
                      })
                    }}
                  />
                </div>

                <div>
                  <Leaderboard
                    isExpanded={isLeaderboardExpanded}
                    onToggle={setIsLeaderboardExpanded}
                  />
                </div>
              </div>
            )
          ) : (
            <div className="flex h-full items-center justify-center">
              {t('no_round_selected')}
            </div>
          )}
        </div>
      </div>

      <div className="h-[942px] w-[410px] bg-background pr-2 text-foreground">
        <BettingSlip selectedEvent={selectedEvent} />
      </div>
    </div>
  )
}
