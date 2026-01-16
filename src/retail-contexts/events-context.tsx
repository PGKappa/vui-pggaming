'use client'

import { Discipline, EventResult, UpcomingEvent } from '@/retail-lib/types'
import { createPGVirtualAPICall, parseAPIDate } from '@/retail-lib/utils'
import { usePathname } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'
import { CashierContext } from './cashier-context'

export type EventsContextType = {
  upcomingEvents?: UpcomingEvent[]
  eventResults?: EventResult[]
  searchEventResults?: EventResult[]
  setSearchEventResults: (searchEventResults?: EventResult[]) => void
  isLoadingEvents: boolean
  activeDrawerId?: string
  setActiveDrawer: (drawerId?: string) => void
  upcomingRounds?: any[]
  currentEvent?: EventResult // Dettaglio evento corrente
  fetchEventDetails: (extPalId: string, intEventId: string) => Promise<void>
  isLoadingEventDetails: boolean
}

const defaultEventsContext: EventsContextType = {
  setSearchEventResults: () => {},
  isLoadingEvents: false,
  setActiveDrawer: () => {},
  upcomingEvents: [],
  eventResults: [],
  upcomingRounds: [],
  currentEvent: undefined,
  fetchEventDetails: async () => {},
  isLoadingEventDetails: false,
}

export const EventsContext =
  createContext<EventsContextType>(defaultEventsContext)

// Cache leggero per evitare refetch se si torna su una disciplina già caricata
const EVENTS_CACHE_TTL_MS = 60 * 1000

function getDisciplinesFromUrl(pathname: string): Discipline[] {
  if (!pathname) return []

  const p = pathname.toLowerCase()

  // Support both English and Italian slugs
  if (p.includes('dogs-horses') || p.includes('cani-cavalli'))
    return [Discipline.DOGS, Discipline.HORSES]
  if (p.includes('horses') || p.includes('cavalli')) return [Discipline.HORSES]
  if (p.includes('dogs') || p.includes('cani')) return [Discipline.DOGS]
  if (p.includes('calcio') || p.includes('football') || p.includes('soccer'))
    return [Discipline.SOCCER]

  return []
}

export default function EventsContextProvider(props: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const cashierContext = useContext(CashierContext)
  const { initCode, operator, getTimezone } = cashierContext

  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [eventResults, setEventResults] = useState<EventResult[]>([])
  const [searchEventResults, setSearchEventResults] = useState<
    EventResult[] | undefined
  >(undefined)
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [activeDrawerId, setActiveDrawerId] = useState<string | undefined>(
    undefined,
  )

  // Get disciplines from current URL/page
  const activeDisciplines = getDisciplinesFromUrl(pathname)
  const [upcomingRounds] = useState<any[]>([])
  const hasLoadedOnce = useRef(false)
  const [currentEvent, setCurrentEvent] = useState<EventResult | undefined>(
    undefined,
  )
  const [isLoadingEventDetails, setIsLoadingEventDetails] = useState(false)
  const eventsCacheRef = useRef(
    new Map<
      string,
      { timestamp: number; upcoming: UpcomingEvent[]; results: EventResult[] }
    >(),
  )
  // Cache dedicata ai dettagli evento (key: "extPalId:intEventId")
  const eventDetailsCache = useRef(
    new Map<string, { timestamp: number; event: EventResult }>(),
  )

  // Se initCode non è ancora disponibile da CashierContext, prova localStorage
  const effectiveInitCode =
    initCode ||
    (typeof window !== 'undefined' ? localStorage.getItem('initCode') : null) ||
    undefined

  const setActiveDrawer = useCallback((drawerId?: string) => {
    setActiveDrawerId(drawerId)
  }, [])

  const setSearchEventResultsCallback = useCallback(
    (results?: EventResult[]) => {
      setSearchEventResults(results)
    },
    [],
  )

  // Dettaglio evento on-demand
  const fetchEventDetails = useCallback(
    async (extPalId: string, intEventId: string) => {
      if (!effectiveInitCode) {
        console.warn('⚠️ No initCode available for fetchEventDetails')
        return
      }

      const cacheKey = `${extPalId}:${intEventId}`
      const cached = eventDetailsCache.current.get(cacheKey)

      // Cache dei dettagli - riusa se ancora valido (30s TTL)
      if (cached && Date.now() - cached.timestamp < 30000) {
        setCurrentEvent(cached.event)
        return
      }

      setIsLoadingEventDetails(true)

      try {
        const response = await createPGVirtualAPICall(
          '/api/event/list',
          effectiveInitCode,
          undefined,
          operator,
        )

        if (response.ok) {
          const data = await response.json()
          const timezone = getTimezone?.() || 'Europe/Rome'

          // Cerca l'evento nei canali (0=Dogs, 1=Horses)
          let foundEvent: EventResult | undefined

          for (const channel of data.channels || []) {
            if (channel?.closed_events) {
              const event = channel.closed_events.find(
                (e: any) =>
                  e.ext_pal_id === extPalId && e.int_event_id === intEventId,
              )
              if (event) {
                const discipline =
                  channel.name === 'dogs' ? Discipline.DOGS : Discipline.HORSES
                const track = channel.location || 'Unknown'

                foundEvent = {
                  id: parseInt(event.int_event_id),
                  extId: event.ext_pal_id,
                  name: event.name || `Race ${event.ext_pal_id}`,
                  startTime: parseAPIDate(event.time, timezone),
                  discipline,
                  track,
                  result: {
                    arrival:
                      event.arrival?.map((item: any) => ({
                        name: item.name,
                        number: item.number,
                      })) || [],
                    odds: {
                      winner: {},
                      placed: {},
                      show: {},
                      exacta: {},
                      quinella: {},
                      trifecta: {},
                      boxedtrifecta: {},
                      evenodd: {},
                      underover: {},
                    },
                  },
                }
                break
              }
            }
          }

          if (foundEvent) {
            setCurrentEvent(foundEvent)
            eventDetailsCache.current.set(cacheKey, {
              timestamp: Date.now(),
              event: foundEvent,
            })
          } else {
            console.warn('⚠️ Event not found in API response')
          }
        }
      } catch (error) {
        console.error('❌ Error fetching event details:', error)
        toast.error('Failed to load event details')
      } finally {
        setIsLoadingEventDetails(false)
      }
    },
    [effectiveInitCode, operator, getTimezone],
  )

  // Carica eventi quando pathname cambia (cambio canale)
  useEffect(() => {
    const disciplines = getDisciplinesFromUrl(pathname)

    if (!effectiveInitCode || disciplines.length === 0) {
      setIsLoadingEvents(false)
      return
    }

    const nocache =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('nocache') === '1'

    const cacheKey = `${effectiveInitCode}:${disciplines.sort().join('+')}`
    const cached = eventsCacheRef.current.get(cacheKey)
    if (
      !nocache &&
      cached &&
      Date.now() - cached.timestamp < EVENTS_CACHE_TTL_MS
    ) {
      setUpcomingEvents(cached.upcoming)
      setEventResults(cached.results)
      hasLoadedOnce.current = true
      setIsLoadingEvents(false)
      return
    }

    // AbortController per cancellare le fetch se pathname cambia
    const abortController = new AbortController()

    const fetchEvents = async () => {
      // Mostra loading solo al primissimo caricamento
      setIsLoadingEvents(!hasLoadedOnce.current)

      try {
        const shouldFetchRacing =
          disciplines.includes(Discipline.DOGS) ||
          disciplines.includes(Discipline.HORSES)
        const shouldFetchSoccer = disciplines.includes(Discipline.SOCCER)

        const allUpcomingEvents: UpcomingEvent[] = []
        const allEventResults: EventResult[] = []

        // ===== RACING (Dogs + Horses) =====
        if (shouldFetchRacing) {
          const response = await createPGVirtualAPICall(
            '/api/event/list',
            effectiveInitCode,
            undefined,
            operator,
          )


          if (response.ok) {
            const racingData = await response.json()
            const timezone = getTimezone?.() || 'Europe/Rome'

            // Dogs
            if (disciplines.includes(Discipline.DOGS)) {
              const channels = Array.isArray(racingData.channels)
                ? racingData.channels
                : []
              const dogChannel =
                channels.find(
                  (c: any) =>
                    typeof c?.name === 'string' && /dog|grey/i.test(c.name),
                ) || channels[0]
              if (!dogChannel) {
                console.warn(
                  '⚠️ No dog channel found. Available channels:',
                  channels?.map((c: any) => c?.name),
                )
              }

              // Upcoming events
              if (dogChannel?.next_events) {
                const dogEvents = dogChannel.next_events.map(
                  (event: any, idx: number): UpcomingEvent => {
                    let startTime: Date
                    if (event.since && typeof event.since === 'number') {
                      startTime = new Date(Date.now() + event.since * 1000)
                    } else if (
                      event.start_time &&
                      typeof event.start_time === 'string'
                    ) {
                      const [hours, minutes] = event.start_time.split(':')
                      startTime = new Date()
                      startTime.setHours(
                        parseInt(hours),
                        parseInt(minutes),
                        0,
                        0,
                      )
                    } else {
                      startTime = parseAPIDate(event.time, timezone)
                    }

                    return {
                      id: parseInt(event.int_event_id),
                      extId: event.ext_pal_id,
                      duration: dogChannel.duration?.[idx] || 3,
                      name: 'Dog',
                      startTime: event.start_time,
                      time: startTime,
                      discipline: Discipline.DOGS,
                    }
                  },
                )
                allUpcomingEvents.push(...dogEvents)
              }

              // Event results - SOLO se disciplina è attiva e limita a 10
              if (
                dogChannel?.prev_events &&
                activeDisciplines.includes(Discipline.DOGS)
              ) {
                // Limita ai soli ultimi 10 per velocità
                const topDogs = dogChannel.prev_events.slice(0, 10)
                
                // Fetch dettagli per i top 10 (necessario per avere arrival/podium)
                const dogResults: EventResult[] = await Promise.all(
                  topDogs.map(async (event: any) => {
                    let detailedResult = null
                    try {
                      const response = await createPGVirtualAPICall(
                        `/api/event/results/${event.ext_pal_id}/${event.int_event_id}`,
                        effectiveInitCode,
                        undefined,
                        operator,
                      )
                      if (response.ok) {
                        detailedResult = await response.json()
                      }
                    } catch (error) {
                      console.error('Failed to fetch dog details:', error)
                    }

                    const trackValue =
                      (detailedResult as any)?.track_name ||
                      event.track_name ||
                      event.track
                    return {
                      id: event.int_event_id,
                      extId: event.ext_pal_id,
                      name: `Dog Race ${event.int_event_id}`,
                      startTime: parseAPIDate(event.time, timezone),
                      time: event.time,
                      discipline: Discipline.DOGS,
                      track: trackValue,
                      result: detailedResult || {
                        podium:
                          event.arrival?.map((dog: any, idx: number) => ({
                            name: dog.name,
                            number: dog.number,
                            position: idx + 1,
                          })) || [],
                        odds: {},
                      },
                    }
                  }),
                )
                allEventResults.push(...dogResults)
              }
            }

            // Horses
            if (disciplines.includes(Discipline.HORSES)) {
              const channels = Array.isArray(racingData.channels)
                ? racingData.channels
                : []
              const horseChannel =
                channels.find(
                  (c: any) =>
                    typeof c?.name === 'string' && /horse|cavall/i.test(c.name),
                ) || channels[1]
              if (!horseChannel) {
                console.warn(
                  '⚠️ No horse channel found. Available channels:',
                  channels?.map((c: any) => c?.name),
                )
              }

              // Upcoming events
              if (horseChannel?.next_events) {
                const horseEvents = horseChannel.next_events.map(
                  (event: any, idx: number): UpcomingEvent => {
                    let startTime: Date
                    if (event.since && typeof event.since === 'number') {
                      startTime = new Date(Date.now() + event.since * 1000)
                    } else if (
                      event.start_time &&
                      typeof event.start_time === 'string'
                    ) {
                      const [hours, minutes] = event.start_time.split(':')
                      startTime = new Date()
                      startTime.setHours(
                        parseInt(hours),
                        parseInt(minutes),
                        0,
                        0,
                      )
                    } else {
                      startTime = parseAPIDate(event.time, timezone)
                    }

                    return {
                      id: parseInt(event.int_event_id),
                      extId: event.ext_pal_id,
                      duration: horseChannel.duration?.[idx] || 3,
                      name: 'Horse',
                      startTime: event.start_time,
                      time: startTime,
                      discipline: Discipline.HORSES,
                    }
                  },
                )
                allUpcomingEvents.push(...horseEvents)
              }

              // Event results - SOLO se disciplina è attiva e limita a 10
              if (
                horseChannel?.prev_events &&
                activeDisciplines.includes(Discipline.HORSES)
              ) {
                // Limita ai soli ultimi 10 per velocità
                const topHorses = horseChannel.prev_events.slice(0, 10)

                // Fetch dettagli per i top 10 (necessario per avere arrival/podium)
                const horseResults: EventResult[] = await Promise.all(
                  topHorses.map(async (event: any) => {
                    let detailedResult = null
                    try {
                      const response = await createPGVirtualAPICall(
                        `/api/event/results/${event.ext_pal_id}/${event.int_event_id}`,
                        effectiveInitCode,
                        undefined,
                        operator,
                      )
                      if (response.ok) {
                        detailedResult = await response.json()
                      }
                    } catch (error) {
                      console.error('Failed to fetch horse details:', error)
                    }

                    const trackValue =
                      (detailedResult as any)?.track_name ||
                      event.track_name ||
                      event.track
                    return {
                      id: event.int_event_id,
                      extId: event.ext_pal_id,
                      name: `Horse Race ${event.int_event_id}`,
                      startTime: parseAPIDate(event.time, timezone),
                      time: event.time,
                      discipline: Discipline.HORSES,
                      track: trackValue,
                      result: detailedResult || {
                        podium:
                          event.arrival?.map((horse: any, idx: number) => ({
                            name: horse.name,
                            number: horse.number,
                            position: idx + 1,
                          })) || [],
                        odds: {},
                      },
                    }
                  }),
                )
                allEventResults.push(...horseResults)
              }
            }
          } else {
            console.error('❌ API Racing response NOT OK:', {
              status: response.status,
              statusText: response.statusText,
            })
          }
        }

        // ===== SOCCER =====
        setUpcomingEvents(allUpcomingEvents)
        setEventResults(allEventResults)
        if (!nocache) {
          eventsCacheRef.current.set(cacheKey, {
            timestamp: Date.now(),
            upcoming: allUpcomingEvents,
            results: allEventResults,
          })
        }
        hasLoadedOnce.current = true
      } catch (error) {
        // Ignora errori dovuti ad abort
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        console.error('Error fetching events:', error)
        toast.error('Error loading events')
      } finally {
        setIsLoadingEvents(false)
      }
    }

    fetchEvents()

    // Cleanup: cancel fetch se pathname cambia prima che sia finito
    return () => {
      abortController.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <EventsContext.Provider
      value={{
        upcomingEvents,
        eventResults,
        searchEventResults,
        setSearchEventResults: setSearchEventResultsCallback,
        isLoadingEvents,
        activeDrawerId,
        setActiveDrawer,
        upcomingRounds,
        currentEvent,
        fetchEventDetails,
        isLoadingEventDetails,
      }}
    >
      {props.children}
    </EventsContext.Provider>
  )
}
