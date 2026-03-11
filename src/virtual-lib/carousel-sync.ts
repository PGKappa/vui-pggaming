import { UpcomingEvent, Discipline } from './types'

/**
 * Filtra e ordina eventi per discipline specifiche.
 * Garantisce sincronizzazione tra carousel e pagine.
 */
export function getCarouselFilteredEvents(
  upcomingEvents: UpcomingEvent[] | undefined,
  disciplines: Discipline[],
): UpcomingEvent[] {
  if (!upcomingEvents) return []

  return upcomingEvents
    .filter((event) => disciplines.includes(event.discipline))
    .sort((a, b) => {
      const timeA =
        a.time instanceof Date ? a.time.getTime() : new Date(a.time).getTime()
      const timeB =
        b.time instanceof Date ? b.time.getTime() : new Date(b.time).getTime()
      return timeA - timeB
    })
}

/**
 * Filtra solo eventi futuri dalla lista
 */
export function getFutureEventsFromCarousel(
  events: UpcomingEvent[],
): UpcomingEvent[] {
  const now = new Date()
  return events.filter((event) => {
    const eventTime =
      event.time instanceof Date ? event.time : new Date(event.time)
    return eventTime > now
  })
}
