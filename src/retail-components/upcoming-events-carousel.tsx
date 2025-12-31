import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/retail-components/ui/carousel'
import { Progress } from '@/retail-components/ui/progress'
import { Skeleton } from '@/retail-components/ui/skeleton'
import { RootContext } from '@/retail-contexts/root-context'
import { Discipline, UpcomingEvent } from '@/retail-lib/types'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useTimeLeft from '@/retail-lib/use-time-left'

export function UpcomingEventsCarousel(props: {
  selectedEvent?: UpcomingEvent
  setSelectedEvent: (event: UpcomingEvent) => void
}) {
  const { upcomingEvents, isLoadingEvents } = useContext(RootContext)

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

  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const maxRemainingMs = useMemo(() => {
    return filteredAndSortedEvents.reduce((max, event) => {
      const diff = new Date(event.time).getTime() - nowMs
      return diff > max ? diff : max
    }, 0)
  }, [filteredAndSortedEvents, nowMs])

  // Auto-seleziona il primo evento quando quello corrente scade o non è più disponibile
  useEffect(() => {
    if (filteredAndSortedEvents.length === 0) return

    const selectedEventStillExists = props.selectedEvent
      ? filteredAndSortedEvents.some(
          (event) =>
            event.id === props.selectedEvent?.id &&
            event.discipline === props.selectedEvent?.discipline,
        )
      : false

    // Se nessun evento è selezionato o l'evento selezionato è scaduto, seleziona il primo
    if (!props.selectedEvent || !selectedEventStillExists) {
      props.setSelectedEvent(filteredAndSortedEvents[0])
    }
  }, [filteredAndSortedEvents, props])

  return (
    <Carousel
      className="w-[1430px]"
      opts={{
        align: 'start',
        skipSnaps: false,
      }}
    >
      <CarouselContent className="bg-white">
        {isLoadingEvents ? (
          // Show skeleton loading
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="flex h-[72px] basis-1/5 items-center justify-center gap-3 bg-muted/30 py-2"
            >
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))
        ) : filteredAndSortedEvents.length > 0 ? (
          filteredAndSortedEvents.map((event, index) => {
            return (
              <UpcomingEventItem
                key={`${event.discipline}-${event.id}-${index}`}
                event={event}
                selectedEvent={props.selectedEvent}
                setSelectedEvent={props.setSelectedEvent}
                maxRemainingMs={maxRemainingMs}
              />
            )
          })
        ) : (
          <div className="p-2 text-center text-background">
            {t('no_upcoming_events')}
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
  maxRemainingMs: number
}) {
  const { event } = props

  const { t } = useTranslation()
  const timeToEventStart = useTimeLeft(event.time)
  const [progressValue, setProgressValue] = useState<number>(100)

  // Sincronizza progress con il tempo mancante rispetto all'evento più lontano
  useEffect(() => {
    if (!props.maxRemainingMs) {
      setProgressValue(0)
      return
    }

    const [mm, ss] = timeToEventStart.split(':')
    const remainingMs = (Number(mm) * 60 + Number(ss)) * 1000

    if (Number.isNaN(remainingMs)) {
      setProgressValue(0)
      return
    }

    const value = (remainingMs / props.maxRemainingMs) * 100
    setProgressValue(Math.max(0, Math.min(100, value)))
  }, [timeToEventStart, props.maxRemainingMs])

  // Rimuovi quando scaduto
  if (timeToEventStart === '00:00') {
    return null
  }

  return (
    <CarouselItem
      className={`relative flex h-[88px] max-w-[237px] basis-1/6 cursor-pointer flex-row items-center justify-center gap-3 overflow-hidden border-l-8 border-l-background px-3 py-2 text-[15px] last:min-w-[245px] last:border-r-8 last:border-r-background ${
        event.id === props.selectedEvent?.id &&
        event.discipline === props.selectedEvent?.discipline
          ? 'bg-bet/90 text-tertiary-foreground'
          : 'bg-secondary text-secondary-foreground'
      }`}
      onClick={() => {
        props.setSelectedEvent(event)
      }}
    > 

      <Image
        src={
          event.discipline === 'SOCCER'
            ? '/calciatore_blu.png'
            : event.discipline === 'DOGS'
              ? '/cane_blu.png'
              : '/cavallo_blu.png'
        }
        alt={'Horses'}
        width={40}
        height={20}
        className="size-14 object-contain relative right-[7px] bottom-[4px]"
      />
      <div className="flex flex-col items-start">
        <span className="relative bottom-[7px] whitespace-nowrap text-[14px] font-semibold uppercase">
          {event.discipline === 'SOCCER'
            ? event.name
            : event.discipline === 'HORSES'
              ? t('horse_races_label')
              : t('dog_races_label')}
        </span>
        <span className="relative bottom-[5px] whitespace-nowrap text-[13px] font-normal uppercase">
          {event.discipline === 'SOCCER'
            ? `${t('round')} ${event.id}`
            : `${t('track')} ${(event.data as any)?.channel || 6}`}
        </span>
        <div className="flex flex-row gap-2">
          <span className="relative bottom-[1px] text-[14px] font-semibold">
            {event.startTime}
          </span>
          <span className="relative bottom-[1px]  py-[1px] pt-0 text-[14px] font-semibold px-2 text-black bg-white left-1">
            {timeToEventStart}
          </span>
        </div>
      </div>
      <Progress
        value={progressValue}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[6px] rounded-none bg-navbarButton"
        indicatorClassName="bg-bet"
      />
    </CarouselItem>
  )
}
import Image from 'next/image'