'use client'
import BettingSlip from '@/retail-components/betting-slip'
import SearchEventResults from '@/retail-components/search-event-results'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
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
    <div className="retail-page-row">
      <div className="retail-left-col">
        <div className="bg-betslip flex h-[102px] w-full shrink-0 flex-row items-center justify-center">
          <UpcomingEventsCarousel
            selectedEvent={selectedEvent}
            setSelectedEvent={(event) => {
              setSelectedEvent(event)
              setSearchEventResults(undefined)
            }}
          />
        </div>

        <div className="retail-race-body bg-betslip">
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

      <div className="retail-betslip-col bg-background text-foreground">
        <BettingSlip selectedEvent={selectedEvent} />
      </div>
    </div>
  )
}
