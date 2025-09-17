import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/virtual-components/ui/carousel'
import { UpcomingEvent } from '@/virtual-lib/types'
import { useTranslation } from 'react-i18next'

import useTimeLeft from '@/virtual-lib/use-time-left'

export function UpcomingEventsCarousel(props: {
  selectedEvent?: UpcomingEvent
  setSelectedEvent: (event: UpcomingEvent) => void
  events: UpcomingEvent[]
}) {
  const { t } = useTranslation()

  return (
    <div className="relative w-full bg-white">
      <Carousel className="mx-auto w-full max-w-[849px]">
        <CarouselContent className="ml-0 h-10 pl-12">
          {props.events.length > 0 ? (
            <>
              {/* Sposta gli eventi verso destra */}
              <CarouselItem className="min-w-10 flex-shrink-0" />
              {props.events.map((event, index) => {
                return (
                  <UpcomingEventItem
                    key={`${event.discipline}-${event.id}-${index}`}
                    event={event}
                    selectedEvent={props.selectedEvent}
                    setSelectedEvent={props.setSelectedEvent}
                  />
                )
              })}
            </>
          ) : (
            <div className="w-full p-4 text-center text-background">
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
  const timeToEventStart = useTimeLeft(event.time)

  return (
    <CarouselItem
      className={`flex h-10 min-w-[140px] flex-shrink-0 cursor-pointer flex-row items-center justify-center gap-4 rounded-md border px-3 ${
        event.id === props.selectedEvent?.id &&
        event.discipline === props.selectedEvent?.discipline
          ? 'border-border bg-chart-1 text-background'
          : 'border-border bg-white text-background'
      }`}
      onClick={() => {
        props.setSelectedEvent(event)
      }}
    >
      <span className="text-center text-sm font-bold">{event.startTime}</span>
      <span className="w-[50px] rounded-md bg-accent p-1 text-center font-mono text-xs font-bold text-accent-foreground">
        {timeToEventStart}
      </span>
    </CarouselItem>
  )
}
