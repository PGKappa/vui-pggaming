'use client'
import BettingSlip from '@/retail-components/betting-slip'
import SearchEventResults from '@/retail-components/search-event-results'
import SkeletonRaceCard from '@/retail-components/skeleton-race-card'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import { UpcomingEventsCarousel } from '@/retail-components/upcoming-events-carousel'
import UpcomingRaceCard from '@/retail-components/upcoming-race-card'
import { RootContext } from '@/retail-contexts/root-context'
import { UpcomingEvent } from '@/retail-lib/types'
import { useContext, useEffect, useState } from 'react'
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

  useEffect(() => {
    // SEMPRE aggiorna al primo evento FUTURO disponibile quando cambiano gli upcomingEvents
    if (upcomingEvents && upcomingEvents.length > 0) {
      const now = new Date()

      const futureRaceEvents = upcomingEvents
        .filter((e) => {
          const isFuture = e.time > now
          const isCorrectDiscipline =
            e.discipline === 'DOGS' || e.discipline === 'HORSES'
          return isFuture && isCorrectDiscipline
        })
        .sort((a, b) => a.time.getTime() - b.time.getTime())

      if (futureRaceEvents.length > 0) {
        const firstFutureEvent = futureRaceEvents[0]
        setSelectedEvent(firstFutureEvent)
      } else {
        // Fallback: se non ci sono eventi futuri, prova con tutti gli eventi (anche scaduti)
        const allRaceEvents = upcomingEvents
          .filter((e) => e.discipline === 'DOGS' || e.discipline === 'HORSES')
          .sort((a, b) => b.time.getTime() - a.time.getTime())

        if (allRaceEvents.length > 0) {
          setSelectedEvent(allRaceEvents[0])
        } else {
          setSelectedEvent(undefined)
        }
      }
    }
  }, [upcomingEvents])

  // Controllo automatico per eventi scaduti
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedEvent && upcomingEvents) {
        const now = new Date()
        const eventTime = selectedEvent.time

        if (now >= eventTime) {
          // Trova SOLO eventi futuri (non scaduti) della disciplina corretta e ORDINALI per tempo
          const availableEvents = upcomingEvents
            .filter(
              (e) =>
                (e.discipline === 'DOGS' || e.discipline === 'HORSES') &&
                new Date() < e.time,
            )
            .sort((a, b) => a.time.getTime() - b.time.getTime())

          const nextEvent = availableEvents[0]
          if (nextEvent) {
            setSelectedEvent(nextEvent)
          } else {
            setSelectedEvent(undefined)
          }
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [selectedEvent, upcomingEvents])

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
