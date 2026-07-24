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
import { useBetslipViewportHeight } from '@/retail-lib/use-retail-compact-height'
import { useContext, useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export default function Dogs8Page() {
  const { t } = useTranslation()
  const betslipHeight = useBetslipViewportHeight()
  const { upcomingEvents, searchEventResults, setSearchEventResults } =
    useContext(RootContext)

  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | undefined>(
    undefined,
  )

  const carouselEvents = useMemo(
    () => getCarouselFilteredEvents(upcomingEvents, [Discipline.DOGS8]),
    [upcomingEvents],
  )

  const futureEvents = useMemo(
    () => getFutureEventsFromCarousel(carouselEvents),
    [carouselEvents],
  )

  useEffect(() => {
    if (selectedEvent) {
      const stillExists = carouselEvents.some((e) => e.id === selectedEvent.id)
      if (stillExists) {
        return
      }
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
            getCarouselFilteredEvents(upcomingEvents, [Discipline.DOGS8]),
          )

          if (freshFutureEvents.length > 0) {
            setSelectedEvent(freshFutureEvents[0])
          } else {
            const allEvents = getCarouselFilteredEvents(upcomingEvents, [
              Discipline.DOGS8,
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
    <div className="relative flex min-w-[1200px] flex-row items-start">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="bg-betslip flex h-[99px] w-full shrink-0 flex-row items-center justify-center pr-2">
          <UpcomingEventsCarousel
            selectedEvent={selectedEvent}
            setSelectedEvent={(event) => {
              setSelectedEvent(event)
              setSearchEventResults(undefined)
            }}
          />
        </div>

        <div className="bg-betslip min-w-0 flex-1 pr-2 pt-[2px]">
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

      <div
        className="sticky top-16 flex w-[400px] shrink-0 flex-col self-start bg-background text-foreground"
        style={
          betslipHeight != null
            ? { height: betslipHeight }
            : { height: 'calc(100dvh - 4rem - 0.5rem)' }
        }
      >
        <BettingSlip selectedEvent={selectedEvent} />
      </div>
    </div>
  )
}
