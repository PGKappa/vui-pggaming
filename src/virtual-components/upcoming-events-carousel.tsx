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
      <Carousel className="mx-auto w-full">
        <CarouselContent
          className={`ml-0 h-12 ${filteredAndSortedEvents.length > 0 ? 'px-12' : ''}`}
        >
          {filteredAndSortedEvents.length > 0 ? (
            <>
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
      className={`flex h-12 flex-shrink-0 basis-1/3 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-1 sm:h-12 sm:min-w-[80px] sm:basis-auto sm:flex-col sm:gap-0 sm:px-3 ${
        event.id === props.selectedEvent?.id &&
        event.discipline === props.selectedEvent?.discipline
          ? 'border-border bg-chart-1 text-background'
          : 'border-border bg-white text-background'
      }`}
      onClick={() => {
        props.setSelectedEvent(event)
      }}
    >
      {/* Label: solo sm+ */}
      <span className="hidden text-center text-[10px] font-semibold uppercase leading-tight sm:block">
        {event.discipline === Discipline.FOOTBALL
          ? `${t('round')} ${event.id}`
          : `${t('track')} ${event.trackName?.match(/\d+/)?.[0] || ''}`}
      </span>
      {/* Riga orario + badge: sempre visibile */}
      <div className="flex flex-row items-center gap-1 sm:gap-2">
        <span className="text-center text-sm font-bold">{event.startTime}</span>
        <span className="w-[44px] rounded-md bg-accent p-1 text-center font-mono text-xs font-bold text-accent-foreground">
          {timeToEventStart}
        </span>
      </div>
    </CarouselItem>
  )
}
