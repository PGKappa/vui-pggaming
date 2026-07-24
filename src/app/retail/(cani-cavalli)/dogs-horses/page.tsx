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

export default function Home() {
  const { t } = useTranslation()
  const betslipHeight = useBetslipViewportHeight()
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

  return (
    <div className="relative flex min-w-[1200px] flex-row items-start">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="bg-betslip flex h-[99px] w-full shrink-0 flex-row items-center justify-center pr-2">
          <UpcomingEventsCarousel
            disciplines={activeDisciplines}
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
