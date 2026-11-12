import { useEffect } from 'react'
import { UpcomingEvent } from './types'

// Il carosello nasconde un evento quando il suo timer arriva a 00:00, cioè
// nell'ultimo secondo prima della partenza: da lì l'evento è considerato scaduto
const EXPIRY_MARGIN_MS = 1000

const startOf = (event: UpcomingEvent) => new Date(event.time).getTime()

const isExpired = (event: UpcomingEvent, now: number) =>
  startOf(event) - now < EXPIRY_MARGIN_MS

/**
 * Quando l'evento selezionato scade passa subito al primo evento ancora
 * giocabile (o, se non ce ne sono, all'ultimo disponibile). Il cambio è
 * programmato sull'istante esatto di scadenza invece che a intervalli.
 */
export default function useAutoAdvanceEvent(
  events: UpcomingEvent[],
  selectedEvent: UpcomingEvent | undefined,
  setSelectedEvent: (event: UpcomingEvent) => void,
) {
  useEffect(() => {
    if (!selectedEvent) return

    const advance = () => {
      const now = Date.now()
      const next = events
        .filter((event) => !isExpired(event, now))
        .sort((a, b) => startOf(a) - startOf(b))[0]
      const fallback = events[events.length - 1]
      const target = next ?? fallback
      if (target && target !== selectedEvent) setSelectedEvent(target)
    }

    const delay = startOf(selectedEvent) - EXPIRY_MARGIN_MS - Date.now()
    if (delay <= 0) {
      advance()
      return
    }
    const timeoutId = setTimeout(advance, delay)
    return () => clearTimeout(timeoutId)
  }, [events, selectedEvent, setSelectedEvent])
}
