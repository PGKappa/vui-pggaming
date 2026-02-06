'use client'
import BettingSlip from '@/retail-components/betting-slip'
import Leaderboard from '@/retail-components/leaderboard'
import MatchBettingOptions from '@/retail-components/match-betting-options'
import SearchEventResults from '@/retail-components/search-event-results'
import { UpcomingEventsCarousel } from '@/retail-components/upcoming-events-carousel'
import UpcomingRoundCard from '@/retail-components/upcoming-round-card'
import CustomScrollbar from '@/retail-components/custom-scrollbar'
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
  const { upcomingEvents, searchEventResults, setSearchEventResults } =
    useContext(RootContext)

  const [matchBetOptions, setMatchBetOptions] = useState<{
    round: {
      name: string
      number: number
      startingAt: Date
      roundId?: number
    }
    teams: string
    markets: Market[]
  }>()

  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | undefined>(
    undefined,
  )

  const [isLeaderboardExpanded, setIsLeaderboardExpanded] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pageScrollRef = useRef<HTMLDivElement>(null)

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
        <div className="bg-betslip flex h-[88px] w-[1500px] flex-row items-center justify-center pb-[2px]">
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

        <div className="flex h-[942px] w-[1500px] flex-col gap-2 tabular-nums">
          {!!searchEventResults ? (
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
              <div className="relative h-[942px]">
                {/* Scroll principale della pagina */}
                <div className="h-full overflow-hidden">
                  <div
                    ref={pageScrollRef}
                    className="h-full overflow-y-scroll no-scrollbar"
                  >
                    {/* Sezione UpcomingRoundCard con scrollbar custom interna */}
                    <div className="relative h-[810px] flex-shrink-0 overflow-hidden">
                      <div className="h-full overflow-hidden">
                        <div
                          ref={scrollContainerRef}
                          className="h-full overflow-y-scroll no-scrollbar"
                          onWheel={(e) => {
                            // Se siamo al top o al bottom della scrollbar interna, 
                            // lascia che lo scroll si propaghi alla pagina principale
                            const element = scrollContainerRef.current
                            if (element) {
                              const isAtTop = element.scrollTop === 0
                              const isAtBottom = 
                                element.scrollHeight - element.scrollTop === element.clientHeight
                              
                              if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                                // Lascia propagare lo scroll
                                return
                              }
                              // Blocca la propagazione se siamo nel mezzo
                              e.stopPropagation()
                            }
                          }}
                        >
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
                      </div>

                      {/* Scrollbar custom per UpcomingRoundCard */}
                      <div className="absolute right-0 top-0 h-full pointer-events-none z-10">
                        <CustomScrollbar contentRef={scrollContainerRef} />
                      </div>
                    </div>

                    {/* Leaderboard con la sua scrollbar separata */}
                    <div className=" relative bottom-[13px]">
                      <Leaderboard
                        isExpanded={isLeaderboardExpanded}
                        onToggle={setIsLeaderboardExpanded}
                      />
                    </div>
                  </div>
                </div>

                {/* Scrollbar custom per tutta la pagina - limitata all'altezza della sezione eventi */}
                <div className="absolute right-0 top-0 h-[810px] pointer-events-none z-20">
                  <CustomScrollbar contentRef={pageScrollRef} />
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

      <div className="mt-[-5px] h-[937px] w-[410px] bg-background pr-2 text-foreground">
        <BettingSlip selectedEvent={selectedEvent} />
      </div>
    </div>
  )
}