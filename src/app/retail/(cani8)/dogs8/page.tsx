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

export default function Dogs8Page() {
  const { t } = useTranslation()
  const { upcomingEvents, searchEventResults, setSearchEventResults } =
    useContext(RootContext)

  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | undefined>(
    undefined,
  )

  // SINCRONIZZAZIONE PERFETTA CON CAROSELLO
  const carouselEvents = useMemo(
    () => getCarouselFilteredEvents(upcomingEvents, [Discipline.DOGS8]),
    [upcomingEvents],
  )

  const futureEvents = useMemo(
    () => getFutureEventsFromCarousel(carouselEvents),
    [carouselEvents],
  )

  // AUTO-SELEZIONE: Solo se non c'è evento selezionato o se l'evento selezionato non esiste più
  useEffect(() => {
    // Se c'è un evento selezionato, verifica che esista ancora
    if (selectedEvent) {
      const stillExists = carouselEvents.some((e) => e.id === selectedEvent.id)
      if (stillExists) {
        return // Evento ancora valido, non cambiare
      }
    }

    // Auto-seleziona il primo evento futuro
    if (futureEvents && futureEvents.length > 0 && futureEvents[0]) {
      setSelectedEvent(futureEvents[0])
    } else if (carouselEvents && carouselEvents.length > 0) {
      setSelectedEvent(carouselEvents[0])
    } else {
      setSelectedEvent(undefined)
    }
  }, [futureEvents, carouselEvents, selectedEvent])

  // AUTO-AGGIORNAMENTO
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedEvent) {
        const now = new Date()
        const eventTime =
          selectedEvent.time instanceof Date
            ? selectedEvent.time
            : new Date(selectedEvent.time)

        if (eventTime <= now) {
          // Refresh degli eventi
          const freshFutureEvents = getFutureEventsFromCarousel(
            getCarouselFilteredEvents(upcomingEvents, [Discipline.DOGS8]),
          )

          if (freshFutureEvents.length > 0) {
            setSelectedEvent(freshFutureEvents[0])
          } else {
            // Nessun evento futuro, prendi il più recente
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
