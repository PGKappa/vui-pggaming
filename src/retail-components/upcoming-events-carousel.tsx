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
import { getLayoutConfig } from '@/retail-lib/layout-config'
import { Discipline, UpcomingEvent } from '@/retail-lib/types'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useTimeLeft from '@/retail-lib/use-time-left'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export function UpcomingEventsCarousel(props: {
  selectedEvent?: UpcomingEvent
  setSelectedEvent: (event: UpcomingEvent) => void
}) {
  const { upcomingEvents, isLoadingEvents } = useContext(RootContext)

  const { t } = useTranslation()
  const pathname = usePathname()

  const disciplines = useMemo(() => {
    const path = (pathname || '/').toLowerCase()
    if (path.includes('dogs-horses') || path.includes('cani-cavalli')) {
      return [Discipline.DOGS, Discipline.HORSES]
    } else if (path.includes('dogs') || path.includes('cani')) {
      return [Discipline.DOGS]
    } else if (path.includes('horses') || path.includes('cavalli')) {
      return [Discipline.HORSES]
    } else {
      return [Discipline.SOCCER]
    }
  }, [pathname])

  const filteredAndSortedEvents = useMemo(() => {
    const events = upcomingEvents || []
    const filtered = events.filter((event) =>
      disciplines.includes(event.discipline),
    )
    const sorted = filtered.sort((a, b) => {
      const timeA =
        a.time instanceof Date ? a.time.getTime() : new Date(a.time).getTime()
      const timeB =
        b.time instanceof Date ? b.time.getTime() : new Date(b.time).getTime()
      return timeA - timeB
    })
    return sorted
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
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="flex h-[72px] basis-1/6 items-center justify-center gap-3 bg-muted/30 py-2"
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
  const rootContext = useContext(RootContext)
  const lang = rootContext?.userData?.lang || 'en'
  const layout = getLayoutConfig(lang)
  const timeToEventStart = useTimeLeft(event.time)
  const [progressValue, setProgressValue] = useState<number>(100)

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

  const imageOffset =
    layout.carousel.imageOffset[event.discipline] ?? 'bottom-[4px] right-[10px]'
  const textOffset =
    layout.carousel.textOffset[event.discipline] ?? 'right-[3px]'

  return (
    <CarouselItem
      className={`relative flex h-[88px] ${layout.carousel.itemBasis} cursor-pointer flex-row items-center justify-center gap-3 overflow-hidden border-l-8 border-l-background px-2 py-2 text-[15px] last:border-r-background ${
        event.id === props.selectedEvent?.id &&
        event.discipline === props.selectedEvent?.discipline
          ? 'bg-[hsl(211deg_65%_37%_/_.9)] text-tertiary-foreground'
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
        alt={event.discipline}
        width={40}
        height={20}
        className={`relative size-14 object-contain ${imageOffset}`}
      />
      <div className={`relative ${textOffset} flex flex-col items-start`}>
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
          <span className="relative bottom-[1px] text-[14px] font-semibold tabular-nums">
            {event.startTime}
          </span>
          <span className="relative bottom-[1px] left-[8px] min-w-[56px] bg-white px-2 py-[1px] pt-0 text-[14px] font-semibold tabular-nums text-black">
            {timeToEventStart}
          </span>
        </div>
      </div>
      <Progress
        value={progressValue}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[6px] rounded-none bg-navbarButton"
        indicatorClassName="bg-tertiary"
      />
    </CarouselItem>
  )
}
