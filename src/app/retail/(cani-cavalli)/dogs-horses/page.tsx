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
            if (eventTime > now) return prev
            if (futureEvts.length > 0) return futureEvts[0]
            return prev
          }
        }

        return futureEvts[0] ?? carouselEvents[0] ?? undefined
      })
    }

    pickEvent()
    const interval = setInterval(pickEvent, 500)
    return () => clearInterval(interval)
  }, [carouselEvents])

  const raceContent = !!searchEventResults ? (
    <SearchEventResults />
  ) : selectedEvent ? (
    <UpcomingRaceCard race={selectedEvent} />
  ) : (
    <div className="flex h-full items-center justify-center">
      {t('no_event_selected')}
    </div>
  )

  return (
    <div className="retail-page-row">
      <div className="retail-left-col">
        <div className="bg-betslip flex h-[102px] w-full shrink-0 flex-row items-center justify-center pr-2">
          <UpcomingEventsCarousel
            disciplines={activeDisciplines}
            selectedEvent={selectedEvent}
            setSelectedEvent={(event) => {
              setSelectedEvent(event)
              setSearchEventResults(undefined)
            }}
          />
        </div>

        <div className="retail-race-body bg-betslip">{raceContent}</div>
      </div>

      <div className="retail-betslip-col bg-background text-foreground">
        <BettingSlip selectedEvent={selectedEvent} />
      </div>
    </div>
  )
}
