import { UpcomingEvent, Discipline } from './types'

/**
 * Utility function che replica ESATTAMENTE la logica del carosello
 * per garantire sincronizzazione perfetta tra carosello e pagine
 *
 * @param upcomingEvents - Array degli eventi dal context
 * @param disciplines - Array delle discipline da filtrare
 * @returns Array filtrato e ordinato IDENTICO al carosello
 */
export function getCarouselFilteredEvents(
  upcomingEvents: UpcomingEvent[] | undefined,
  disciplines: Discipline[],
): UpcomingEvent[] {
  if (!upcomingEvents) return []

  // STESSA IDENTICA LOGICA DEL CAROSELLO
  return upcomingEvents
    .filter((event) => disciplines.includes(event.discipline))
    .sort((a, b) => {
      // FIX: Gestisce sia Date che string per event.time
      const timeA =
        a.time instanceof Date ? a.time.getTime() : new Date(a.time).getTime()
      const timeB =
        b.time instanceof Date ? b.time.getTime() : new Date(b.time).getTime()
      return timeA - timeB
    })
}

/**
 * Filtra solo eventi futuri dalla lista del carosello
 * @param events - Eventi già filtrati dal carosello
 * @returns Solo eventi futuri, mantenendo l'ordine del carosello
 */
export function getFutureEventsFromCarousel(
  events: UpcomingEvent[],
): UpcomingEvent[] {
  const now = new Date()
  return events.filter((event) => {
    // FIX: Gestisce sia Date che string per event.time
    const eventTime =
      event.time instanceof Date ? event.time : new Date(event.time)

    return eventTime > now
  })
}
