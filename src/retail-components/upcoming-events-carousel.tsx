import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/retail-components/ui/carousel'
import { Skeleton } from '@/retail-components/ui/skeleton'
import { RootContext } from '@/retail-contexts/root-context'
import { Discipline, UpcomingEvent } from '@/retail-lib/types'
import { useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import useTimeLeft from '@/retail-lib/use-time-left'
import Image from 'next/image'

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

  return (
    <Carousel className="w-[1370px]">
      <CarouselContent className="relative left-[26px] bg-white">
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
}) {
  const { event } = props

  const { t } = useTranslation()
  const timeToEventStart = useTimeLeft(event.time)

  // Rimuovi quando scaduto
  if (timeToEventStart === '00:00') {
    return null
  }

  return (
    <CarouselItem
      className={`basis-1/7 flex h-[63px] w-[186px] cursor-pointer flex-row items-center justify-center gap-3 px-3 py-2 text-[15px] ${
        event.id === props.selectedEvent?.id &&
        event.discipline === props.selectedEvent?.discipline
          ? 'bg-[hsl(211deg_65%_37%_/_.9)] text-tertiary-foreground'
          : 'bg-secondary text-secondary-foreground'
      }`}
      onClick={() => {
        props.setSelectedEvent(event)
      }}
    >
      <div className="flex h-full w-12 flex-col items-center justify-center pb-[2px] pr-[4px]">
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
          className="size-11 object-contain"
        />
      </div>
      <div className="flex flex-col items-start pr-[1px]">
        <span className="relative top-[2px] text-[14px] font-semibold uppercase">
          {event.discipline === 'SOCCER'
            ? event.name
            : `${event.name} ${t('racing')}`}
        </span>

        <span className="relative  text-[13px] font-normal uppercase">
          {event.discipline === 'SOCCER'
            ? `${t('round')} ${event.id}`
            : `Track ${(event.data as any)?.channel || 6}`}
        </span>
        <div className="flex flex-row gap-2">
          <span className="relative bottom-[2px] text-[14px] font-semibold">
            {event.startTime}
          </span>
          <span className="absolute bottom-[3px] py-0 pl-[44px] text-[14px] font-semibold text-[#99a6b1]">
            {timeToEventStart}
          </span>
        </div>
      </div>
    </CarouselItem>
  )
}
