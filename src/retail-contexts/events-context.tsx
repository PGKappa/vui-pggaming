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

/**
 * Estrae le discipline dall'URL
 * /retail/cavalli → [HORSES]
 * /retail/cani → [DOGS]
 * /retail/cani-cavalli → [DOGS, HORSES]
 * /retail/calcio → [SOCCER]
 */
function getDisciplinesFromUrl(pathname: string): Discipline[] {
  if (!pathname) return []

  if (pathname.includes('dogs-horses'))
    return [Discipline.DOGS, Discipline.HORSES]
  if (pathname.includes('horses')) return [Discipline.HORSES]
  if (pathname.includes('dogs')) return [Discipline.DOGS]
  if (pathname.includes('calcio')) return [Discipline.SOCCER]

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
  const [upcomingRounds] = useState<any[]>([])
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
  const keepaliveIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

  // 1️⃣ Dettaglio evento on-demand
  const fetchEventDetails = useCallback(
    async (extPalId: string, intEventId: string) => {
      if (!effectiveInitCode) {
        console.warn('⚠️ No initCode available for fetchEventDetails')
        return
      }

      const cacheKey = `${extPalId}:${intEventId}`
      const cached = eventDetailsCache.current.get(cacheKey)

      // 3️⃣ Cache dei dettagli - riusa se ancora valido (30s TTL)
      if (cached && Date.now() - cached.timestamp < 30000) {
        console.log('♻️ Using cached event details:', cacheKey)
        setCurrentEvent(cached.event)
        return
      }

      setIsLoadingEventDetails(true)
      console.log('🔍 Fetching event details:', { extPalId, intEventId })

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
            console.log('✅ Event details loaded:', foundEvent)
            setCurrentEvent(foundEvent)
            eventDetailsCache.current.set(cacheKey, {
              timestamp: Date.now(),
              event: foundEvent,
            })

            // 2️⃣ Avvia keepalive per questo evento
            startKeepalive(extPalId, intEventId)
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

  // 2️⃣ Keepalive/polling sul singolo evento selezionato
  const startKeepalive = useCallback(
    (extPalId: string, intEventId: string) => {
      console.log('⏱️ startKeepalive called for:', { extPalId, intEventId })

      // Stoppa il precedente keepalive se esiste
      if (keepaliveIntervalRef.current) {
        console.log('🛑 Stopping previous keepalive')
        clearInterval(keepaliveIntervalRef.current)
      }

      // DISABILITO IL KEEPALIVE PER ORA - Debug
      console.log('⏸️ KEEPALIVE DISABLED FOR DEBUG - polling paused')
      return

      // Poll ogni 5 secondi per aggiornare l'evento corrente (DISABLED)
      /*
      keepaliveIntervalRef.current = setInterval(async () => {
        console.log('🔄 Keepalive tick - refreshing current event')
        
        // Invalida cache per forzare il refresh
        const cacheKey = `${extPalId}:${intEventId}`
        eventDetailsCache.current.delete(cacheKey)
        
        await fetchEventDetails(extPalId, intEventId)
      }, 5000)
      */
    },
    [fetchEventDetails],
  )

  // Cleanup del keepalive quando cambio evento o smonto
  useEffect(() => {
    return () => {
      if (keepaliveIntervalRef.current) {
        console.log('🧹 Cleaning up keepalive interval')
        clearInterval(keepaliveIntervalRef.current)
        keepaliveIntervalRef.current = null
      }
    }
  }, [])

  // Carica eventi quando pathname cambia (cambio canale)
  useEffect(() => {
    const disciplines = getDisciplinesFromUrl(pathname)

    console.log(`
========================================
📍 EventsContext EFFECT TRIGGERED
   Pathname: ${pathname}
   Disciplines: ${JSON.stringify(disciplines)}
   InitCode: ${initCode ? initCode.slice(0, 8) + '...' : 'NONE'}
========================================
    `)

    // RESET IMMEDIATO dello stato quando cambio pagina
    console.log('🧹 Clearing previous events data...')
    setUpcomingEvents([])
    setEventResults([])
    setSearchEventResults(undefined)

    if (!effectiveInitCode || disciplines.length === 0) {
      console.log('⚠️ No initCode or disciplines - skipping fetch', {
        effectiveInitCode,
        disciplinesLength: disciplines.length,
      })
      setIsLoadingEvents(false)
      return
    }

    const cacheKey = `${effectiveInitCode}:${disciplines.sort().join('+')}`
    const cached = eventsCacheRef.current.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < EVENTS_CACHE_TTL_MS) {
      console.log('♻️ Using cached events for disciplines', disciplines)
      console.log('   Cache age:', Date.now() - cached.timestamp, 'ms')
      setUpcomingEvents(cached.upcoming)
      setEventResults(cached.results)
      setIsLoadingEvents(false)
      return
    }

    // AbortController per cancellare le fetch se pathname cambia
    const abortController = new AbortController()

    const fetchEvents = async () => {
      setIsLoadingEvents(true)
      console.log('🚀 API CALL STARTING: /api/event/list')
      console.log('   Disciplines:', disciplines)
      console.log('   Timestamp:', new Date().toISOString())

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
            console.log('🎯 API Response - racingData:', racingData)
            console.log('🔍 Channel 0 (Dogs):', racingData.channels?.[0])
            console.log('🔍 Channel 1 (Horses):', racingData.channels?.[1])
            const timezone = getTimezone?.() || 'Europe/Rome'

            // Dogs
            if (disciplines.includes(Discipline.DOGS)) {
              const dogChannel = racingData.channels?.[0]

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

              // Event results
              if (dogChannel?.prev_events) {
                const dogResults: EventResult[] = dogChannel.prev_events.map(
                  (event: any): EventResult => {
                    const trackValue = event.track_name || event.track
                    return {
                      id: event.int_event_id,
                      extId: event.ext_pal_id,
                      name: `Dog Race ${event.int_event_id}`,
                      startTime: parseAPIDate(event.time, timezone),
                      discipline: Discipline.DOGS,
                      track: trackValue,
                      result: {
                        arrival:
                          event.arrival?.map((dog: any, idx: number) => ({
                            name: dog.name,
                            number: dog.number,
                            position: idx + 1,
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
                  },
                )
                allEventResults.push(...dogResults)
              }
            }

            // Horses
            if (disciplines.includes(Discipline.HORSES)) {
              const horseChannel = racingData.channels?.[1]

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

              // Event results
              if (horseChannel?.prev_events) {
                const horseResults: EventResult[] =
                  horseChannel.prev_events.map((event: any): EventResult => {
                    const trackValue = event.track_name || event.track
                    return {
                      id: event.int_event_id,
                      extId: event.ext_pal_id,
                      name: `Horse Race ${event.int_event_id}`,
                      startTime: parseAPIDate(event.time, timezone),
                      discipline: Discipline.HORSES,
                      track: trackValue,
                      result: {
                        arrival:
                          event.arrival?.map((horse: any, idx: number) => ({
                            name: horse.name,
                            number: horse.number,
                            position: idx + 1,
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
                  })
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
        if (shouldFetchSoccer) {
          console.log('⚽ Soccer events fetch - TODO')
          // Implementare quando necessario
        }

        if (!shouldFetchRacing) {
          console.log(
            '⏭️ Skipped racing fetch - not needed for this discipline',
          )
        }

        console.log(
          `✅ Loaded ${allUpcomingEvents.length} upcoming events, ${allEventResults.length} results`,
        )
        setUpcomingEvents(allUpcomingEvents)
        setEventResults(allEventResults)
        eventsCacheRef.current.set(cacheKey, {
          timestamp: Date.now(),
          upcoming: allUpcomingEvents,
          results: allEventResults,
        })
        console.log('📊 Events set in state:', {
          upcomingCount: allUpcomingEvents.length,
          resultsCount: allEventResults.length,
        })
      } catch (error) {
        // Ignora errori dovuti ad abort
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('⏹️ Event fetch was cancelled (pathname changed)')
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
      console.log('🧹 EventsContext cleanup - cancelling pending requests')
      abortController.abort()
    }
    // IMPORTANTE: Solo pathname come dipendenza!
    // initCode, operator, getTimezone vengono usati ma NON come dipendenza
    // perché sono stabilizzate dal useMemo nel CashierContext
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
