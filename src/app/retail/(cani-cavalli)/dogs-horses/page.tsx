'use client'
import BettingSlip from '@/retail-components/betting-slip'
import SearchEventResults from '@/retail-components/search-event-results'
import { UpcomingEventsCarousel } from '@/retail-components/upcoming-events-carousel'
import UpcomingRaceCard from '@/retail-components/upcoming-race-card'
import { RootContext } from '@/retail-contexts/root-context'
import { UpcomingEvent, Discipline } from '@/retail-lib/types'
import {
  getCarouselFilteredEvents,
  getFutureEventsFromCarousel,
} from '@/retail-lib/carousel-sync'
import { useRetailPageScroll, useRetailOriginalLayout } from '@/retail-lib/use-retail-compact-height'
import { cn } from '@/retail-lib/utils'
import { useContext, useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollArea } from '@/retail-components/ui/scroll-area'

export default function Home() {
  const { t } = useTranslation()
  const { upcomingEvents, searchEventResults, setSearchEventResults } =
    useContext(RootContext)
  const isPageScroll = useRetailPageScroll()
  const isOriginalLayout = useRetailOriginalLayout()
  const useFixedHeights = isPageScroll || isOriginalLayout

  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | undefined>(
    undefined,
  )

  // Dynamically derive which disciplines are present from the actual events
  // returned by the API. All three racing disciplines are fetched, but only
  // the ones with real events are shown. Before events load, all three are
  // included so nothing is hidden prematurely.
  const activeDisciplines = useMemo((): Discipline[] => {
    const all = [Discipline.DOGS, Discipline.DOGS8, Discipline.HORSES]
    if (!upcomingEvents?.length) return all
    const present = new Set(upcomingEvents.map((e) => e.discipline))
    const filtered = all.filter((d) => present.has(d))
    return filtered.length > 0 ? filtered : all
  }, [upcomingEvents])

  const carouselEvents = useMemo(
    () => getCarouselFilteredEvents(upcomingEvents, activeDisciplines),
    [upcomingEvents, activeDisciplines],
  )

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
    const interval = setInterval(pickEvent, 500)
    return () => clearInterval(interval)
  }, [carouselEvents])

  const mainContent = !!searchEventResults ? (
    <SearchEventResults />
  ) : selectedEvent ? (
    <UpcomingRaceCard race={selectedEvent} />
  ) : (
    <div className="flex h-full items-center justify-center">
      {t('no_event_selected')}
    </div>
  )

  return (
    <div
      className={cn(
        'relative flex min-w-[1200px] flex-row',
        isOriginalLayout && 'bottom-[5px]',
        useFixedHeights
          ? 'h-[945px] overflow-hidden'
          : 'h-full overflow-hidden',
      )}
    >
      {/* LEFT COLUMN - si allarga/stringe in base alla risoluzione */}
      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
          useFixedHeights && 'h-full',
        )}
      >
        <div className="bg-betslip flex h-[99px] w-full shrink-0 flex-row items-center justify-center pb-[2px] pr-2">
          <UpcomingEventsCarousel
            disciplines={activeDisciplines}
            selectedEvent={selectedEvent}
            setSelectedEvent={(event) => {
              setSelectedEvent(event)
              setSearchEventResults(undefined)
            }}
          />
        </div>

        <div className="bg-betslip flex min-h-0 flex-1 flex-row gap-2 overflow-hidden pr-2 pt-[2px]">
          <ScrollArea className="h-full w-full">{mainContent}</ScrollArea>
        </div>
      </div>

      {/* RIGHT COLUMN - larghezza fissa, sempre ancorata a destra */}
      <div
        className={cn(
          'relative right-1 w-[400px] shrink-0 bg-background text-foreground',
          useFixedHeights ? 'h-[950px]' : 'h-full',
        )}
      >
        <BettingSlip selectedEvent={selectedEvent} />
      </div>
    </div>
  )
}
