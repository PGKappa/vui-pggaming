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
import { useContext, useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollArea } from '@/retail-components/ui/scroll-area'

export default function Home() {
  const { t } = useTranslation()
  const { upcomingEvents, searchEventResults, setSearchEventResults } =
    useContext(RootContext)

  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | undefined>(
    undefined,
  )

  const carouselEvents = useMemo(
    () => getCarouselFilteredEvents(upcomingEvents, [Discipline.HORSES]),
    [upcomingEvents],
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

  return (
    <div className="relative bottom-[5px] flex h-[945px] min-w-0 flex-row overflow-hidden">
      {/* LEFT COLUMN - si allarga/stringe in base alla risoluzione */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="bg-betslip flex h-[99px] w-full flex-row items-center justify-center pb-[2px] pr-2">
          <UpcomingEventsCarousel
            selectedEvent={selectedEvent}
            setSelectedEvent={(event) => {
              setSelectedEvent(event)
              setSearchEventResults(undefined)
            }}
          />
        </div>

        <div className="bg-betslip flex flex-1 flex-row gap-2 overflow-hidden pr-2 pt-[2px]">
          <ScrollArea className="h-full w-full">
            {!!searchEventResults ? (
              <SearchEventResults />
            ) : selectedEvent ? (
              <UpcomingRaceCard race={selectedEvent} />
            ) : (
              <div className="flex h-full items-center justify-center">
                {t('no_event_selected')}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* RIGHT COLUMN - larghezza fissa, sempre ancorata a destra */}
      <div className="relative right-1 h-[950px] w-[400px] shrink-0 bg-background text-foreground">
        <BettingSlip selectedEvent={selectedEvent} />
      </div>
    </div>
  )
}
