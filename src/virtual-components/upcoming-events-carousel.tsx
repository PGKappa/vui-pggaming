import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/virtual-components/ui/carousel'
import { UpcomingEvent } from '@/virtual-lib/types'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import useTimeLeft from '@/virtual-lib/use-time-left'

export function UpcomingEventsCarousel(props: {
  selectedEvent?: UpcomingEvent
  setSelectedEvent: (event: UpcomingEvent) => void
  events: UpcomingEvent[]
}) {
  const { t } = useTranslation()
  const viewportRef = useRef<HTMLDivElement>(null)
  // quanti tasti entrano interi nella riga: la larghezza di ogni tasto si
  // adatta (min 150px) così l'ultimo visibile non resta tagliato a metà
  const [perRow, setPerRow] = useState<number>()

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const update = () => {
      // px-11 ai lati: spazio delle frecce
      const width = el.clientWidth - ARROWS_SPACE
      if (width <= 0) return
      setPerRow(
        Math.max(
          1,
          Math.floor((width + ITEM_GAP) / (ITEM_MIN_WIDTH + ITEM_GAP)),
        ),
      )
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={viewportRef} className="relative w-full px-11">
      <Carousel className="w-full" opts={{ align: 'start', dragFree: true }}>
        <CarouselContent className="-ml-2 h-14">
          {props.events.length > 0 ? (
            props.events.map((event, index) => (
              <UpcomingEventItem
                key={`${event.discipline}-${event.id}-${index}`}
                event={event}
                selectedEvent={props.selectedEvent}
                setSelectedEvent={props.setSelectedEvent}
                basis={perRow ? `${100 / perRow}%` : undefined}
              />
            ))
          ) : (
            <div className="flex w-full items-center justify-center p-4 text-center text-muted-foreground">
              {t('no_upcoming_matches')}
            </div>
          )}
        </CarouselContent>
        <CarouselPrevious className="-left-11 h-14 w-9 rounded-sm bg-carouselArrow text-white hover:bg-carouselArrow/90 disabled:opacity-40" />
        <CarouselNext className="-right-11 h-14 w-9 rounded-sm bg-carouselArrow text-white hover:bg-carouselArrow/90 disabled:opacity-40" />
      </Carousel>
    </div>
  )
}

// larghezza minima di un tasto e spazio tra i tasti (pl-2)
const ITEM_MIN_WIDTH = 150
const ITEM_GAP = 8
const ARROWS_SPACE = 88

function UpcomingEventItem(props: {
  basis?: string
  event: UpcomingEvent
  selectedEvent?: UpcomingEvent
  setSelectedEvent: (event: UpcomingEvent) => void
}) {
  const { event } = props
  const timeToEventStart = useTimeLeft(event.time)

  if (timeToEventStart === '00:00') {
    return null
  }

  const isSelected =
    event.id === props.selectedEvent?.id &&
    event.discipline === props.selectedEvent?.discipline

  return (
    <CarouselItem className="pl-2" style={{ flexBasis: props.basis }}>
      <button
        type="button"
        className={`flex h-14 w-full min-w-[150px] flex-row items-center justify-center gap-3 rounded-sm px-3 transition-colors ${
          isSelected
            ? 'bg-selectedEvent text-tertiary-foreground shadow-md'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/85'
        }`}
        onClick={() => {
          props.setSelectedEvent(event)
        }}
      >
        <span className="text-md font-bold tabular-nums">
          {event.startTime}
        </span>
        <span className="min-w-[56px] rounded-sm bg-white px-2 py-0.5 text-center text-sm font-bold tabular-nums text-black">
          {timeToEventStart}
        </span>
      </button>
    </CarouselItem>
  )
}
