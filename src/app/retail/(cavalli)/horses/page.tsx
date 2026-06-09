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
    setSelectedEvent((prev) => {
      if (prev) {
        const stillExists = carouselEvents.some((e) => e.id === prev.id)
        if (stillExists) return prev
      }

      if (futureEvents && futureEvents.length > 0 && futureEvents[0]) {
        return futureEvents[0]
      } else if (carouselEvents && carouselEvents.length > 0) {
        return carouselEvents[0]
      } else {
        return undefined
      }
    })
  }, [futureEvents, carouselEvents])

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedEvent((prev) => {
        if (!prev) return prev
        const now = new Date()
        const eventTime =
          prev.time instanceof Date ? prev.time : new Date(prev.time)

        if (eventTime <= now) {
          const freshFutureEvents = getFutureEventsFromCarousel(
            getCarouselFilteredEvents(upcomingEvents, [Discipline.DOGS]),
          )

          if (freshFutureEvents.length > 0) {
            if (freshFutureEvents[0].id === prev.id) return prev
            return freshFutureEvents[0]
          } else {
            const allEvents = getCarouselFilteredEvents(upcomingEvents, [
              Discipline.DOGS,
            ])
            if (allEvents.length > 0) {
              const last = allEvents[allEvents.length - 1]
              if (last.id === prev.id) return prev
              return last
            }
          }
        }
        return prev
      })
    }, 500)

    return () => clearInterval(interval)
  }, [upcomingEvents])

  return (
    <div className="relative bottom-[5px] flex h-full flex-row overflow-hidden">
      <div className="flex flex-col">
        <div className="bg-betslip flex h-[109px] w-[1508px] flex-row items-center justify-center pb-[2px] pr-2">
          <UpcomingEventsCarousel
            selectedEvent={selectedEvent}
            setSelectedEvent={(event) => {
              setSelectedEvent(event)
              setSearchEventResults(undefined)
            }}
          />
        </div>

        <div className="bg-betslip flex h-full flex-row gap-2 overflow-hidden pr-2 pt-[2px]">
          <div className="flex h-[921px] w-[1500px] flex-col gap-2 overflow-y-auto pb-16">
            {!!searchEventResults ? (
              <SearchEventResults />
            ) : selectedEvent ? (
              <UpcomingRaceCard race={selectedEvent} />
            ) : (
              <div className="flex h-full items-center justify-center">
                {t('no_event_selected')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Betting slip */}
      <div className="relative right-2 h-[937px] w-[410px] bg-background text-foreground">
        <BettingSlip selectedEvent={selectedEvent} />
      </div>
    </div>
  )
}
