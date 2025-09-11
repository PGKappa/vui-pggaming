import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/retail-components/ui/carousel'
import { RootContext } from '@/retail-contexts/root-context'
import { Discipline, UpcomingEvent } from '@/retail-lib/types'
import { useCallback, useContext, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import useTimeLeft from '@/retail-lib/use-time-left'
import Image from 'next/image'

export function UpcomingEventsCarousel(props: {
  selectedEvent?: UpcomingEvent
  setSelectedEvent: (event: UpcomingEvent) => void
}) {
  const { upcomingEvents } = useContext(RootContext)

  const { t } = useTranslation()

  const disciplines = useMemo(() => {
  const path = window.location.pathname
  if (path.includes('dogs-horses')) {
    return [Discipline.DOGS, Discipline.HORSES]
  } else if (path.includes('dogs')) {
    return [Discipline.DOGS]
  } else if (path.includes('horses')) {
    return [Discipline.HORSES]
  } else {
    return [Discipline.SOCCER]
  }
}, [])

  const filteredAndSortedEvents = useMemo(() => {
    return upcomingEvents
      ? upcomingEvents
          .filter((event) => disciplines.includes(event.discipline))
          .sort((a, b) => {
            const timeA = new Date(a.time).getTime()
            const timeB = new Date(b.time).getTime()
            return timeA - timeB
          })
      : []
  }, [upcomingEvents, disciplines])

  // Callback per gestire eventi scaduti
  const handleEventExpired = useCallback(
    (expiredEvent: UpcomingEvent) => {
      
      // Se l'evento scaduto è quello attualmente selezionato
      if (
        props.selectedEvent?.id === expiredEvent.id &&
        props.selectedEvent?.discipline === expiredEvent.discipline
      ) {
        // Trova il prossimo evento disponibile
        const availableEvents = filteredAndSortedEvents.filter(
          (event) =>
            event.id !== expiredEvent.id ||
            event.discipline !== expiredEvent.discipline,
        )

        if (availableEvents.length > 0) {
          props.setSelectedEvent(availableEvents[0])
        }
      }
    },
    [filteredAndSortedEvents, props],
  )

  // Auto-selezione del primo evento se nessuno è selezionato
  useEffect(() => {
    if (!props.selectedEvent && filteredAndSortedEvents.length > 0) {
      props.setSelectedEvent(filteredAndSortedEvents[0])
    }
  }, [filteredAndSortedEvents, props])

  return (
    <Carousel className="w-[1370px]">
      <CarouselContent className="-ml-1">
        {filteredAndSortedEvents.length > 0 ? (
          filteredAndSortedEvents.map((event, index) => {
            return (
              <UpcomingEventItem
                key={`${event.discipline}-${event.id}-${index}`}
                event={event}
                selectedEvent={props.selectedEvent}
                setSelectedEvent={props.setSelectedEvent}
                onEventExpired={handleEventExpired}
              />
            )
          })
        ) : (
          <div className="p-4 text-center text-background">
            {t('no_upcoming_rounds')}
          </div>
        )}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}

function UpcomingEventItem(props: {
  event: UpcomingEvent
  selectedEvent?: UpcomingEvent
  setSelectedEvent: (event: UpcomingEvent) => void
  onEventExpired?: (expiredEvent: UpcomingEvent) => void
}) {
  const { event } = props

  const { t } = useTranslation()
  const timeToEventStart = useTimeLeft(event.time)

  useEffect(() => {
    if (event.discipline !== 'SOCCER' && timeToEventStart === '00:00') {
      props.onEventExpired?.(event)
    }
  }, [timeToEventStart, props, event])

  // Rimuovi quando scaduto
  if (event.discipline !== 'SOCCER' && timeToEventStart === '00:00') {
    return null
  }

  return (
    <CarouselItem
      className={`flex h-[72px] basis-1/6 cursor-pointer flex-row items-center justify-center gap-3 py-2 ${
        event.id === props.selectedEvent?.id &&
        event.discipline === props.selectedEvent?.discipline
          ? 'bg-tertiary text-tertiary-foreground'
          : 'hover:bg-trasparent bg-secondary text-secondary-foreground hover:text-accent-foreground'
      }`}
      onClick={() => {
        props.setSelectedEvent(event)
      }}
    >
      <div className="flex h-full w-12 flex-col items-center justify-center bg-white py-0.5">
        <Image
          src={
            event.discipline === 'SOCCER'
              ? '/soccer.svg'
              : event.discipline === 'DOGS'
                ? '/dogs.png'
                : '/horses.png'
          }
          alt={'Horses'}
          width={40}
          height={20}
          className="size-10 object-contain"
        />
      </div>
      <div className="flex flex-col items-start">
        <span className="text-md font-bold">{event.name}</span>
        <span className="text-md font-bold">
          {t('round')} {event.id}
        </span>
        <div className="flex flex-row gap-2">
          <span className="text-md font-bold">{event.startTime}</span>
          <span className="font-mono text-md italic">{timeToEventStart}</span>
        </div>
      </div>
    </CarouselItem>
  )
}
