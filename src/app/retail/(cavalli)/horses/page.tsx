'use client'
import BettingSlip from '@/retail-components/betting-slip'
import SearchEventResults from '@/retail-components/search-event-results'
import SkeletonRaceCard from '@/retail-components/skeleton-race-card'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import { UpcomingEventsCarousel } from '@/retail-components/upcoming-events-carousel'
import UpcomingRaceCard from '@/retail-components/upcoming-race-card'
import { RootContext } from '@/retail-contexts/root-context'
import { UpcomingEvent, Discipline } from '@/retail-lib/types'
import { useContext, useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()
  const {
    upcomingEvents,
    searchEventResults,
    setSearchEventResults,
    isLoadingEvents,
  } = useContext(RootContext)

  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | undefined>(
    undefined,
  )

  // Memoize filtered and sorted horses events for performance
  const horsesEvents = useMemo(() => {
    if (!upcomingEvents) return []
    return upcomingEvents
      .filter((event) => event.discipline === Discipline.HORSES)
      .sort((a, b) => {
        const timeA = new Date(a.time).getTime()
        const timeB = new Date(b.time).getTime()
        return timeA - timeB
      })
  }, [upcomingEvents])

  const futureHorsesEvents = useMemo(() => {
    const now = new Date()
    return horsesEvents.filter((event) => {
      const eventTime = new Date(event.time)
      return eventTime > now
    })
  }, [horsesEvents])

  useEffect(() => {
    // SEMPRE aggiorna al primo evento FUTURO disponibile usando i memoized events
    if (futureHorsesEvents.length > 0) {
      const firstFutureEvent = futureHorsesEvents[0]
      setSelectedEvent(firstFutureEvent)
    } else {
      // Fallback: se non ci sono eventi futuri, prova con tutti gli eventi (anche scaduti)
      if (horsesEvents.length > 0) {
        // Ordina per più recenti primi per gli eventi scaduti
        const sortedPastEvents = [...horsesEvents].sort((a, b) => {
          const timeA = new Date(a.time).getTime()
          const timeB = new Date(b.time).getTime()
          return timeB - timeA
        })
        setSelectedEvent(sortedPastEvents[0])
      } else {
        setSelectedEvent(undefined)
      }
    }
  }, [futureHorsesEvents, horsesEvents])

  // Controllo automatico per eventi scaduti
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedEvent) {
        const now = new Date()
        const eventTime = new Date(selectedEvent.time)

        if (eventTime && now >= eventTime) {
          // Usa i futureHorsesEvents già memoized invece di rifiltrare
          if (futureHorsesEvents.length > 0) {
            const nextEvent = futureHorsesEvents[0]
            setSelectedEvent(nextEvent)
          } else {
            setSelectedEvent(undefined)
          }
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [selectedEvent, futureHorsesEvents])

  return (
    <div className="flex h-full flex-row overflow-hidden">
      <div className="flex flex-col">
        <div className="flex h-[80px] w-[1500px] flex-row items-center justify-center bg-accent pr-2">
          <UpcomingEventsCarousel
            selectedEvent={selectedEvent}
            setSelectedEvent={(event) => {
              setSelectedEvent(event)
              setSearchEventResults(undefined)
            }}
          />
        </div>

        {/* Main content area */}
        <div className="flex h-full flex-row gap-2 overflow-hidden pr-2 pt-2">
          <div className="flex h-[942px] w-[1500px] flex-col gap-2 overflow-y-auto">
            <ScrollArea className="h-full w-full">
              {!!searchEventResults ? (
                <SearchEventResults />
              ) : isLoadingEvents ? (
                <SkeletonRaceCard />
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
      </div>

      {/* RIGHT COLUMN - Betting slip */}
      <div className="h-[942px] w-[410px] bg-background text-foreground">
        <BettingSlip selectedEvent={selectedEvent} />
      </div>
    </div>
  )
}
