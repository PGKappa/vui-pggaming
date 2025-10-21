'use client'
import BettingSlip from '@/retail-components/betting-slip'
import Leaderboard from '@/retail-components/leaderboard'
import MatchBettingOptions from '@/retail-components/match-betting-options'
import SearchEventResults from '@/retail-components/search-event-results'
import SkeletonRoundCard from '@/retail-components/skeleton-round-card'
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

  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent>()

  const [isLeaderboardExpanded, setIsLeaderboardExpanded] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // SEMPRE aggiorna al primo evento FUTURO disponibile quando cambiano gli upcomingEvents
    if (upcomingEvents && upcomingEvents.length > 0) {
      const now = new Date()

      const futureSoccerEvents = upcomingEvents
        .filter((e) => {
          // Per eventi SOCCER, potrebbe avere startTime invece di time
          const eventTime =
            e.time || (e.startTime ? new Date(e.startTime) : null)
          const isFuture = eventTime ? eventTime > now : false
          const isCorrectDiscipline = e.discipline === 'SOCCER'
          return isFuture && isCorrectDiscipline
        })
        .sort((a, b) => {
          const timeA =
            a.time || (a.startTime ? new Date(a.startTime) : new Date(0))
          const timeB =
            b.time || (b.startTime ? new Date(b.startTime) : new Date(0))
          return timeA.getTime() - timeB.getTime()
        })

      if (futureSoccerEvents.length > 0) {
        const firstFutureEvent = futureSoccerEvents[0]
        setSelectedEvent(firstFutureEvent)
      } else {
        // Fallback: se non ci sono eventi futuri, prova con tutti gli eventi (anche scaduti)
        const allSoccerEvents = upcomingEvents
          .filter((e) => e.discipline === 'SOCCER')
          .sort((a, b) => {
            const timeA =
              a.time || (a.startTime ? new Date(a.startTime) : new Date(0))
            const timeB =
              b.time || (b.startTime ? new Date(b.startTime) : new Date(0))
            return timeB.getTime() - timeA.getTime()
          })

        if (allSoccerEvents.length > 0) {
          setSelectedEvent(allSoccerEvents[0])
        } else {
          setSelectedEvent(undefined)
        }
      }
    }
  }, [upcomingEvents])

  // Controllo automatico per eventi scaduti
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedEvent && upcomingEvents) {
        const now = new Date()
        // Per eventi SOCCER, potrebbe avere startTime invece di time
        const eventTime =
          selectedEvent.time ||
          (selectedEvent.startTime ? new Date(selectedEvent.startTime) : null)

        if (eventTime && now >= eventTime) {
          // Trova SOLO eventi futuri (non scaduti) della disciplina corretta e ORDINALI per tempo
          const availableEvents = upcomingEvents
            .filter((e) => {
              const eTime =
                e.time || (e.startTime ? new Date(e.startTime) : null)
              return e.discipline === 'SOCCER' && eTime && new Date() < eTime
            })
            .sort((a, b) => {
              const timeA =
                a.time || (a.startTime ? new Date(a.startTime) : new Date(0))
              const timeB =
                b.time || (b.startTime ? new Date(b.startTime) : new Date(0))
              return timeA.getTime() - timeB.getTime()
            })

          const nextEvent = availableEvents[0]
          if (nextEvent) {
            setSelectedEvent(nextEvent)
          } else {
            setSelectedEvent(undefined)
          }
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [selectedEvent, upcomingEvents])

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
