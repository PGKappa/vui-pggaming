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
import {
  useRetailPageScroll,
  useRetailOriginalLayout,
} from '@/retail-lib/use-retail-compact-height'
import { cn } from '@/retail-lib/utils'
import { useContext, useEffect, useRef, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()
  const { upcomingEvents, searchEventResults, setSearchEventResults } =
    useContext(RootContext)
  const isPageScroll = useRetailPageScroll()
  const isOriginalLayout = useRetailOriginalLayout()
  const useFixedHeights = isPageScroll || isOriginalLayout

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
    <div
      className={cn(
        'flex min-w-[1280px] flex-row overflow-hidden',
        useFixedHeights ? 'h-[945px]' : 'h-full',
      )}
    >
      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden',
          useFixedHeights && 'h-full',
        )}
      >
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

        <div
          className={cn(
            'flex min-h-0 w-full flex-col gap-2 tabular-nums',
            useFixedHeights ? 'h-[942px]' : 'flex-1',
          )}
        >
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
              <div
                className={cn(
                  'relative min-h-0',
                  useFixedHeights ? 'h-[942px]' : 'h-full',
                )}
              >
                {/* Scroll principale della pagina */}
                <div className="h-full overflow-hidden">
                  <div
                    ref={pageScrollRef}
                    className="no-scrollbar h-full overflow-y-scroll"
                  >
                    {/* Sezione UpcomingRoundCard con scrollbar custom interna */}
                    <div
                      className={cn(
                        'relative flex-shrink-0 overflow-hidden',
                        useFixedHeights ? 'h-[810px]' : 'h-[min(810px,100%)]',
                      )}
                    >
                      <div className="h-full overflow-hidden">
                        <div
                          ref={scrollContainerRef}
                          className="no-scrollbar h-full overflow-y-scroll"
                          onWheel={(e) => {
                            // Se siamo al top o al bottom della scrollbar interna,
                            // lascia che lo scroll si propaghi alla pagina principale
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
                      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full">
                        <CustomScrollbar contentRef={scrollContainerRef} />
                      </div>
                    </div>

                    {/* Leaderboard con la sua scrollbar separata */}
                    <div className="relative bottom-[15px]">
                      <Leaderboard
                        isExpanded={isLeaderboardExpanded}
                        onToggle={setIsLeaderboardExpanded}
                      />
                    </div>
                  </div>
                </div>

                {/* Scrollbar custom per tutta la pagina - limitata all'altezza della sezione eventi */}
                <div
                  className={cn(
                    'pointer-events-none absolute right-0 top-0 z-20',
                    useFixedHeights ? 'h-[810px]' : 'h-[min(810px,100%)]',
                  )}
                >
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

      <div
        className={cn(
          'mt-[-5px] w-[410px] shrink-0 bg-background pr-2 text-foreground',
          useFixedHeights ? 'h-[937px]' : 'h-full',
        )}
      >
        <BettingSlip selectedEvent={selectedEvent} />
      </div>
    </div>
  )
}
