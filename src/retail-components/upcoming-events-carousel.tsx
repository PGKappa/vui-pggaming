import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/retail-components/ui/carousel'
import { RootContext } from '@/retail-contexts/root-context'
import { Discipline, UpcomingEvent } from '@/retail-lib/types'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'

import useTimeLeft from '@/retail-lib/use-time-left'
import Image from 'next/image'

export function UpcomingEventsCarousel(props: {
  selectedEvent?: UpcomingEvent
  setSelectedEvent: (event: UpcomingEvent) => void
}) {
  const { upcomingEvents } = useContext(RootContext)

  const { t } = useTranslation()

  const disciplines: Discipline[] = window.location.pathname.includes('dogs')
    ? [Discipline.DOGS]
    : window.location.pathname.includes('horses')
      ? [Discipline.HORSES]
      : [Discipline.SOCCER, Discipline.DOGS, Discipline.HORSES]

  return (
    <Carousel className="w-[1370px]">
      <CarouselContent className="-ml-1">
        {upcomingEvents && upcomingEvents.length > 0 ? (
          upcomingEvents
            .filter((event) => disciplines.includes(event.discipline))
            .map((event, index) => {
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
}) {
  const { event } = props

  const { t } = useTranslation()
  const timeToEventStart = useTimeLeft(event.time)
  return (
    <CarouselItem
      className={`flex h-[72px] basis-1/6 cursor-pointer flex-row items-center justify-center gap-3 py-2 ${event.id === props.selectedEvent?.id ? 'bg-tertiary text-tertiary-foreground' : 'hover:bg-trasparent bg-secondary text-secondary-foreground hover:text-accent-foreground'}`}
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
