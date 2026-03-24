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
    () => getCarouselFilteredEvents(upcomingEvents, [Discipline.DOGS]),
    [upcomingEvents],
  )

  const futureEvents = useMemo(
    () => getFutureEventsFromCarousel(carouselEvents),
    [carouselEvents],
  )

  useEffect(() => {
    if (selectedEvent) {
      const stillExists = carouselEvents.some((e) => e.id === selectedEvent.id)
      if (stillExists) return
    }

    if (futureEvents && futureEvents.length > 0 && futureEvents[0]) {
      setSelectedEvent(futureEvents[0])
    } else if (carouselEvents && carouselEvents.length > 0) {
      setSelectedEvent(carouselEvents[0])
    } else {
      setSelectedEvent(undefined)
    }
  }, [futureEvents, carouselEvents, selectedEvent])

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedEvent) {
        const now = new Date()
        const eventTime =
          selectedEvent.time instanceof Date
            ? selectedEvent.time
            : new Date(selectedEvent.time)

        if (eventTime <= now) {
          const freshFutureEvents = getFutureEventsFromCarousel(
            getCarouselFilteredEvents(upcomingEvents, [Discipline.DOGS]),
          )

          if (freshFutureEvents.length > 0) {
            setSelectedEvent(freshFutureEvents[0])
          } else {
            const allEvents = getCarouselFilteredEvents(upcomingEvents, [
              Discipline.DOGS,
            ])
            if (allEvents.length > 0) {
              setSelectedEvent(allEvents[allEvents.length - 1])
            }
          }
        }
      }
    }, 500)

    return () => clearInterval(interval)
  }, [selectedEvent, upcomingEvents])

  return (
    <div className="relative bottom-[5px] flex h-full min-w-[1200px] flex-row overflow-hidden">
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
      <div className="h-[950px] w-[400px] relative right-1 shrink-0 bg-background text-foreground">
        <BettingSlip selectedEvent={selectedEvent} />
      </div>
    </div>
  )
}