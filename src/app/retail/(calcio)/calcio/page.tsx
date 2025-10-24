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
  const hasAutoSelectedRef = useRef(false)

  const [isLeaderboardExpanded, setIsLeaderboardExpanded] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Memoize filtered and sorted soccer events for performance
  const soccerEvents = useMemo(() => {
    if (!upcomingEvents) return []
    return upcomingEvents
      .filter((event) => event.discipline === Discipline.SOCCER)
      .sort((a, b) => {
        const timeA = new Date(a.time).getTime()
        const timeB = new Date(b.time).getTime()
        return timeA - timeB
      })
  }, [upcomingEvents])

  const futureSoccerEvents = useMemo(() => {
    const now = new Date()
    return soccerEvents.filter((event) => {
      const eventTime = new Date(event.time)
      return eventTime > now
    })
  }, [soccerEvents])

  useEffect(() => {
    // SEMPRE aggiorna al primo evento FUTURO disponibile usando i memoized events
    if (futureSoccerEvents.length > 0) {
      const firstFutureEvent = futureSoccerEvents[0]
      setSelectedEvent(firstFutureEvent)
      hasAutoSelectedRef.current = true
    } else {
      // Fallback: se non ci sono eventi futuri, prova con tutti gli eventi (anche scaduti)
      if (soccerEvents.length > 0) {
        // Ordina per più recenti primi per gli eventi scaduti
        const sortedPastEvents = [...soccerEvents].sort((a, b) => {
          const timeA = new Date(a.time).getTime()
          const timeB = new Date(b.time).getTime()
          return timeB - timeA
        })
        setSelectedEvent(sortedPastEvents[0])
        hasAutoSelectedRef.current = true
      } else {
        setSelectedEvent(undefined)
        hasAutoSelectedRef.current = false
      }
    }
  }, [futureSoccerEvents, soccerEvents])

  // Controllo automatico per eventi scaduti
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedEvent) {
        const now = new Date()
        const eventTime = new Date(selectedEvent.time)

        if (eventTime && now >= eventTime) {
          // Usa i futureSoccerEvents già memoized invece di rifiltrare
          if (futureSoccerEvents.length > 0) {
            const nextEvent = futureSoccerEvents[0]
            setSelectedEvent(nextEvent)
          } else {
            setSelectedEvent(undefined)
          }
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedEvent, futureSoccerEvents])

  return (
    <div className="flex h-full flex-row overflow-hidden py-2">
      <div className="flex flex-col gap-2">
        <div className="mx-2 flex h-[80px] w-[1500px] flex-row items-center justify-center bg-accent px-4">
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

        <div className="mx-2 flex h-[942px] w-[1500px] flex-col gap-2">
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
              {t('no_event_selected')}
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
