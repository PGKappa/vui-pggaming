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
import { getCarouselFilteredEvents, getFutureEventsFromCarousel } from '@/retail-lib/carousel-sync'
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

  // SELEZIONE UNIFICATA: un solo meccanismo per evitare competizioni
  useEffect(() => {
    const pickEvent = () => {
      setSelectedEvent((prev) => {
        const futureEvts = getFutureEventsFromCarousel(carouselEvents)

        if (prev) {
          const stillInCarousel = carouselEvents.some((e) => e.id === prev.id)
          if (stillInCarousel) {
            const now = new Date()
            const eventTime =
              prev.time instanceof Date ? prev.time : new Date(prev.time)
            if (eventTime > now) return prev // still valid and not expired
            // Expired → pick next future
            if (futureEvts.length > 0) return futureEvts[0]
            return prev // nothing better available
          }
          // Gone from carousel → pick new
        }

        return futureEvts[0] ?? carouselEvents[0] ?? undefined
      })
    }

    pickEvent()
    const interval = setInterval(pickEvent, 5000)
    return () => clearInterval(interval)
  }, [carouselEvents])

  return (
    <div className="retail-page-row min-w-0">
      <div className="retail-left-col gap-2">
        <div className="bg-betslip flex h-[88px] w-full shrink-0 flex-row items-center justify-center pb-[2px]">
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

        <div className="flex w-full flex-col gap-2 tabular-nums">
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
                    className="no-scrollbar h-full overflow-y-scroll"
                  >
                    {/* Sezione UpcomingRoundCard con scrollbar custom interna */}
                    <div className="relative h-[810px] flex-shrink-0 overflow-hidden">
                      <div className="h-full overflow-hidden">
                        <div
                          ref={scrollContainerRef}
                          className="no-scrollbar h-full overflow-y-scroll"
                          onWheel={(e) => {
                            const element = scrollContainerRef.current
                            if (element) {
                              const isAtTop = element.scrollTop === 0
                              const isAtBottom =
                                element.scrollHeight - element.scrollTop ===
                                element.clientHeight

                              if (
                                (isAtTop && e.deltaY < 0) ||
                                (isAtBottom && e.deltaY > 0)
                              ) {
                                return
                              }
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

                      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full">
                        <CustomScrollbar contentRef={scrollContainerRef} />
                      </div>
                    </div>

                    <div className="relative bottom-[15px]">
                      <Leaderboard
                        isExpanded={isLeaderboardExpanded}
                        onToggle={setIsLeaderboardExpanded}
                      />
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute right-0 top-0 z-20 h-[810px]">
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

      <div className="retail-betslip-col retail-betslip-col--calcio bg-background text-foreground">
        <BettingSlip selectedEvent={selectedEvent} />
      </div>
    </div>
  )
}
