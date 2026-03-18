import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/virtual-components/ui/carousel'
import { RootContext } from '@/virtual-contexts/root-context'
import { Discipline, UpcomingEvent } from '@/virtual-lib/types'
import useTimeLeft from '@/virtual-lib/use-time-left'
import { usePathname } from 'next/navigation'
import { useContext, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Carousel component — esatto pattern retail.
 * Legge upcomingEvents dal context, filtra per disciplina dal pathname.
 * Auto-seleziona il primo evento se quello corrente non è più nella lista.
 * NON gestisce auto-advance (lo fa la pagina con il suo interval).
 */
export function UpcomingEventsCarousel(props: {
  selectedEvent?: UpcomingEvent
  setSelectedEvent: (event: UpcomingEvent) => void
}) {
  const { upcomingEvents } = useContext(RootContext)
  const { t } = useTranslation()
  const pathname = usePathname()

  const disciplines = useMemo(() => {
    const path = (pathname || '/').toLowerCase()
    if (path.includes('dogs') && path.includes('horses'))
      return [Discipline.DOGS, Discipline.HORSES]
    if (path.includes('dogs')) return [Discipline.DOGS]
    if (path.includes('horses')) return [Discipline.HORSES]
    if (path.includes('calcio')) return [Discipline.FOOTBALL]
    return [Discipline.DOGS, Discipline.HORSES]
  }, [pathname])

  const filteredAndSortedEvents = useMemo(() => {
    const events = upcomingEvents || []
    return events
      .filter((event) => disciplines.includes(event.discipline))
      .sort((a, b) => {
        const timeA =
          a.time instanceof Date ? a.time.getTime() : new Date(a.time).getTime()
        const timeB =
          b.time instanceof Date ? b.time.getTime() : new Date(b.time).getTime()
        return timeA - timeB
      })
  }, [upcomingEvents, disciplines])

  // Auto-seleziona il primo evento quando quello corrente non esiste più nella lista
  useEffect(() => {
    if (filteredAndSortedEvents.length === 0) return

    const selectedEventStillExists = props.selectedEvent
      ? filteredAndSortedEvents.some(
          (event) =>
            event.id === props.selectedEvent?.id &&
            event.discipline === props.selectedEvent?.discipline,
        )
      : false

    if (!props.selectedEvent || !selectedEventStillExists) {
      props.setSelectedEvent(filteredAndSortedEvents[0])
    }
  }, [filteredAndSortedEvents, props])

  return (
    <div className="relative w-full bg-white">
      <Carousel className="mx-auto w-full max-w-[849px]">
        <CarouselContent
          className={`ml-0 h-12 ${filteredAndSortedEvents.length > 0 ? 'pl-12' : ''}`}
        >
          {filteredAndSortedEvents.length > 0 ? (
            <>
              <CarouselItem className="min-w-10 flex-shrink-0" />
              {filteredAndSortedEvents.map((event, index) => (
                <UpcomingEventItem
                  key={`${event.discipline}-${event.id}-${index}`}
                  event={event}
                  selectedEvent={props.selectedEvent}
                  setSelectedEvent={props.setSelectedEvent}
                />
              ))}
            </>
          ) : (
            <div className="flex w-full items-center justify-center p-4 text-center text-background">
              {t('no_upcoming_matches')}
            </div>
          )}
        </CarouselContent>
        <CarouselPrevious className="left-0 bg-accent" />
        <CarouselNext className="right-0 bg-accent" />
      </Carousel>
    </div>
  )
}

function UpcomingEventItem(props: {
  event: UpcomingEvent
  selectedEvent?: UpcomingEvent
  setSelectedEvent: (event: UpcomingEvent) => void
}) {
  const { event } = props
  const { t } = useTranslation()
  const timeToEventStart = useTimeLeft(event.time)

  if (timeToEventStart === '00:00') {
    return null
  }

  return (
    <CarouselItem
      className={`flex h-12 min-w-[140px] flex-shrink-0 cursor-pointer flex-col items-center justify-center rounded-md border px-3 ${
        event.id === props.selectedEvent?.id &&
        event.discipline === props.selectedEvent?.discipline
          ? 'border-border bg-chart-1 text-background'
          : 'border-border bg-white text-background'
      }`}
      onClick={() => {
        props.setSelectedEvent(event)
      }}
    >
      <span className="text-center text-[10px] font-semibold uppercase leading-tight">
        {event.discipline === Discipline.FOOTBALL
          ? `${t('round')} ${event.id}`
          : `${t('track')} ${event.trackName?.match(/\d+/)?.[0] || ''}`}
      </span>
      <div className="flex flex-row items-center gap-2">
        <span className="text-center text-sm font-bold">{event.startTime}</span>
        <span className="w-[50px] rounded-md bg-accent p-1 text-center font-mono text-xs font-bold text-accent-foreground">
          {timeToEventStart}
        </span>
      </div>
    </CarouselItem>
  )
}
