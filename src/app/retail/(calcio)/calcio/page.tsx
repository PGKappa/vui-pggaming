'use client'
import BettingSlip from '@/retail-components/betting-slip'
import Leaderboard from '@/retail-components/leaderboard'
import MatchBettingOptions from '@/retail-components/match-betting-options'
import SearchEventResults from '@/retail-components/search-event-results'
import SkeletonRoundCard from '@/retail-components/skeleton-round-card'
import { UpcomingEventsCarousel } from '@/retail-components/upcoming-events-carousel'
import UpcomingRoundCard from '@/retail-components/upcoming-round-card'
import { RootContext } from '@/retail-contexts/root-context'
import {
  Market,
  UpcomingEvent,
  UpcomingRound,
  Discipline,
} from '@/retail-lib/types'
import {
  getCarouselFilteredEvents,
  getFutureEventsFromCarousel,
} from '@/retail-lib/carousel-sync'
import { useContext, useEffect, useRef, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()
  const {
    upcomingEvents,
    searchEventResults,
    setSearchEventResults,
    isLoadingEvents,
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

  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | undefined>(
    undefined,
  )

  const [isLeaderboardExpanded, setIsLeaderboardExpanded] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // SINCRONIZZAZIONE PERFETTA CON CAROSELLO
  const carouselEvents = useMemo(() => {
    return getCarouselFilteredEvents(upcomingEvents, [Discipline.SOCCER])
  }, [upcomingEvents])

  const futureEvents = useMemo(() => {
    return getFutureEventsFromCarousel(carouselEvents)
  }, [carouselEvents])

  // AUTO-SELEZIONE: Sempre primo evento del carosello
  useEffect(() => {
    if (futureEvents && futureEvents.length > 0 && futureEvents[0]) {
      setSelectedEvent(futureEvents[0])
    } else if (carouselEvents && carouselEvents.length > 0) {
      setSelectedEvent(carouselEvents[0])
    } else {
      setSelectedEvent(undefined)
    }
  }, [futureEvents, carouselEvents])

  // AUTO-AGGIORNAMENTO
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedEvent) {
        const now = new Date()
        const eventTime =
          selectedEvent.time instanceof Date
            ? selectedEvent.time
            : new Date(selectedEvent.time)

        if (eventTime <= now) {
          // Refresh degli eventi
          const freshFutureEvents = getFutureEventsFromCarousel(
            getCarouselFilteredEvents(upcomingEvents, [Discipline.SOCCER]),
          )

          if (freshFutureEvents.length > 0) {
            setSelectedEvent(freshFutureEvents[0])
          } else {
            // Nessun evento futuro, prendi il più recente
            const allEvents = getCarouselFilteredEvents(upcomingEvents, [
              Discipline.SOCCER,
            ])
            if (allEvents.length > 0) {
              setSelectedEvent(allEvents[allEvents.length - 1])
            }
          }
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedEvent, upcomingEvents])

  return (
    <div className="flex h-full flex-row overflow-hidden">
      <div className="flex flex-col gap-2">
        <div className="flex h-[88px] w-[1508px] flex-row items-center justify-center bg-betslip pb-[2px]">
          <UpcomingEventsCarousel
            selectedEvent={selectedEvent}
            setSelectedEvent={(event) => {
              setSelectedEvent(event)
              setSearchEventResults(undefined)
              setMatchBetOptions(undefined)
              setIsLeaderboardExpanded(false)
            }}
          />
        </div>

        <div className="flex h-[942px] w-[1503px] flex-col gap-2 overflow-y-auto pl-1 tabular-nums">
          {!!searchEventResults ? (
            <SearchEventResults />
          ) : isLoadingEvents ? (
            <SkeletonRoundCard />
          ) : selectedEvent ? (
            matchBetOptions ? (
              <MatchBettingOptions
                round={matchBetOptions.round}
                teams={matchBetOptions.teams}
                markets={matchBetOptions.markets}
                close={() => setMatchBetOptions(undefined)}
              />
            ) : (
              <div
                ref={scrollContainerRef}
                className="thin-scrollbar overflow-y-auto"
              >
                <div className="thin-scrollbar h-[814px] overflow-y-auto">
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
              {t('no_event_selected')}
            </div>
          )}
        </div>
      </div>

      <div className="h-[949px] w-[410px] bg-background pr-2 mt-[-5px] text-foreground">
        <BettingSlip selectedEvent={selectedEvent} />
      </div>
    </div>
  )
}
