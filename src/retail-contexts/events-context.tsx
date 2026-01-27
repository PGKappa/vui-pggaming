'use client'

import {
  Discipline,
  EventResult,
  UpcomingEvent,
  UpcomingRound,
} from '@/retail-lib/types'
import {
  createPGVirtualAPICall,
  parseAPIDate,
  SOCCER_API_URL,
} from '@/retail-lib/utils'
import { usePathname } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
const EVENTS_CACHE_TTL_MS = 10 * 60 * 1000 // 10 minuti

// MODULE-LEVEL cache and flags - persist across component remounts
const moduleEventsCache = new Map<
  string,
  { timestamp: number; upcoming: UpcomingEvent[]; results: EventResult[] }
>()
let moduleHasLoadedOnce = false
const moduleEventDetailsCache = new Map<
  string,
  { timestamp: number; event: EventResult }
>()

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
  // NOTE: hasLoadedOnce and caches are now at MODULE LEVEL to persist across remounts
  const [currentEvent, setCurrentEvent] = useState<EventResult | undefined>(
    undefined,
  )
  const [isLoadingEventDetails, setIsLoadingEventDetails] = useState(false)

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

      if (!operator) {
        console.error('❌ Cannot fetch event details: operator is required')
        toast.error('Operator is required for API calls')
        return
      }

      const cacheKey = `${extPalId}:${intEventId}`
      const cached = moduleEventDetailsCache.get(cacheKey)

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
            moduleEventDetailsCache.set(cacheKey, {
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

  // Funzione per fetch in background (senza mostrare loading)
  const fetchEventsInBackground = useCallback(
    async (
      disciplines: Discipline[],
      normalizedDisciplines: Discipline[],
      cacheKey: string,
    ) => {
      if (!operator || !effectiveInitCode) return

      try {
        const shouldFetchRacing =
          disciplines.includes(Discipline.DOGS) ||
          disciplines.includes(Discipline.HORSES)

        const allUpcomingEvents: UpcomingEvent[] = []
        const allEventResults: EventResult[] = []

        // Fetch racing in background
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
            const channels = Array.isArray(racingData.channels)
              ? racingData.channels
              : []
            const dogChannel = channels.find(
              (c: any) =>
                typeof c?.name === 'string' && /dog|grey/i.test(c.name),
            )

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
                    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
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

            // Horses
            const horseChannel = channels.find(
              (c: any) =>
                typeof c?.name === 'string' && /horse|cavall/i.test(c.name),
            )

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
                    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
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
          }
        }

        // Aggiorna cache e stato (senza loading)
        if (allUpcomingEvents.length > 0) {
          setUpcomingEvents(allUpcomingEvents)
          moduleEventsCache.set(cacheKey, {
            timestamp: Date.now(),
            upcoming: allUpcomingEvents,
            results: allEventResults,
          })
        }
      } catch (error) {
        // Ignora errori in background fetch
        console.warn('Background fetch error:', error)
      }
    },
    [operator, effectiveInitCode, getTimezone],
  )

  // Carica eventi quando pathname cambia (cambio canale)
  useEffect(() => {
    const disciplines = getDisciplinesFromUrl(pathname)

    // Unifica cache per racing: dogs e horses usano la stessa API, quindi usa una chiave condivisa
    const normalizedDisciplines = disciplines.includes(Discipline.SOCCER)
      ? disciplines
      : [Discipline.DOGS, Discipline.HORSES]

    console.log('🔄 [events-context] pathname changed:', pathname)
    console.log('🔄 [events-context] disciplines:', disciplines)
    console.log(
      '🔄 [events-context] normalizedDisciplines:',
      normalizedDisciplines,
    )

    if (!effectiveInitCode || disciplines.length === 0) {
      console.log('🔄 [events-context] No initCode or disciplines, skipping')
      setIsLoadingEvents(false)
      return
    }

    const nocache =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('nocache') === '1'

    const cacheKey = `${effectiveInitCode}:${normalizedDisciplines.sort().join('+')}`
    const cached = moduleEventsCache.get(cacheKey)

    console.log('🔄 [events-context] cacheKey:', cacheKey)
    console.log(
      '🔄 [events-context] cached:',
      cached
        ? `Found (age: ${Date.now() - cached.timestamp}ms, events: ${cached.upcoming.length})`
        : 'NOT FOUND',
    )
    console.log('🔄 [events-context] hasLoadedOnce:', moduleHasLoadedOnce)

    // Se abbiamo dati in cache validi, usali subito SENZA loading
    if (
      !nocache &&
      cached &&
      Date.now() - cached.timestamp < EVENTS_CACHE_TTL_MS
    ) {
      console.log('✅ [events-context] Using CACHE - NO loading!')
      // Imposta i dati immediatamente dalla cache
      setUpcomingEvents(cached.upcoming)
      setEventResults(cached.results)
      moduleHasLoadedOnce = true
      setIsLoadingEvents(false)

      // Fetch in background per aggiornare i dati (senza mostrare loading)
      // Solo se la cache è più vecchia di 30 secondi
      if (Date.now() - cached.timestamp > 30 * 1000) {
        fetchEventsInBackground(disciplines, normalizedDisciplines, cacheKey)
      }
      return
    }

    console.log('⏳ [events-context] Cache miss - will fetch')

    // AbortController per cancellare le fetch se pathname cambia
    const abortController = new AbortController()

    const fetchEvents = async () => {
      // Mostra loading SOLO al primissimo caricamento assoluto della pagina
      // Non mostrare loading per cambio disciplina (transizione fra pagine)
      console.log(
        '⏳ [events-context] fetchEvents called, hasLoadedOnce:',
        moduleHasLoadedOnce,
      )
      if (!moduleHasLoadedOnce) {
        console.log('⏳ [events-context] Setting isLoadingEvents = TRUE')
        setIsLoadingEvents(true)
      } else {
        console.log(
          '⏳ [events-context] hasLoadedOnce=true, NOT setting loading',
        )
      }

      try {
        if (!operator) {
          console.error('❌ Cannot fetch events: operator is required')
          toast.error('Operator is required for API calls')
          setIsLoadingEvents(false)
          return
        }

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
            if (
              disciplines.includes(Discipline.DOGS) ||
              disciplines.includes(Discipline.HORSES)
            ) {
              const channels = Array.isArray(racingData.channels)
                ? racingData.channels
                : []
              const dogChannel =
                channels.find(
                  (c: any) =>
                    typeof c?.name === 'string' && /dog|grey/i.test(c.name),
                ) || channels[0]

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
            if (
              disciplines.includes(Discipline.DOGS) ||
              disciplines.includes(Discipline.HORSES)
            ) {
              const channels = Array.isArray(racingData.channels)
                ? racingData.channels
                : []
              const horseChannel =
                channels.find(
                  (c: any) =>
                    typeof c?.name === 'string' && /horse|cavall/i.test(c.name),
                ) || channels[1]

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
        if (shouldFetchSoccer) {
          console.log('⚽ Starting Soccer API fetch...')
          try {
            // TODO: Sostituire con l'endpoint corretto per il calcio
            const soccerResponse = await fetch(
              `${SOCCER_API_URL}?t=${Date.now()}`,
            )
            if (soccerResponse.ok) {
              const soccerData = await soccerResponse.json()
              console.log('⚽ Soccer API Response:', soccerData)
              console.log('⚽ Soccer data type:', typeof soccerData)
              console.log('⚽ Soccer data keys:', Object.keys(soccerData || {}))

              // Log della struttura per capire il formato
              if (Array.isArray(soccerData)) {
                console.log(
                  '⚽ Soccer data is Array, length:',
                  soccerData.length,
                )
                if (soccerData.length > 0) {
                  console.log('⚽ First item sample:', soccerData[0])
                }
              } else if (soccerData && typeof soccerData === 'object') {
                console.log('⚽ Soccer data is Object')
                console.log(
                  '⚽ Full data structure:',
                  JSON.stringify(soccerData, null, 2),
                )

                // Espandi schedules se esiste
                if (soccerData.schedules) {
                  console.log('⚽ Schedules type:', typeof soccerData.schedules)
                  console.log(
                    '⚽ Schedules keys:',
                    Object.keys(soccerData.schedules || {}),
                  )
                  console.log('⚽ Schedules content:', soccerData.schedules)

                  // Se schedules è un object, elenca le categorie
                  if (
                    typeof soccerData.schedules === 'object' &&
                    !Array.isArray(soccerData.schedules)
                  ) {
                    Object.entries(soccerData.schedules).forEach(
                      ([key, value]: [string, any]) => {
                        console.log(`⚽ Schedule category "${key}":`, {
                          type: typeof value,
                          isArray: Array.isArray(value),
                          length: Array.isArray(value) ? value.length : 'N/A',
                          firstItem: Array.isArray(value) ? value[0] : value,
                        })
                      },
                    )
                  }
                }

                if (soccerData.header) {
                  console.log('⚽ Header:', soccerData.header)
                }
              }

              // ===== PARSE SOCCER DATA (OLD LOGIC) =====
              const scheduleArray = soccerData.schedules?.schedule || []

              if (scheduleArray.length === 0) {
                console.warn('⚽ No schedules found in soccer data')
                return
              }

              const firstSchedule = scheduleArray[0]
              const allEvents = firstSchedule.mag_event || []

              console.log(
                `⚽ Found ${allEvents.length} total events in schedule`,
              )

              // Raggruppa eventi per groupId (come nel vecchio codice)
              const eventsByGroup: Record<number, any[]> = {}

              allEvents.forEach((event: any) => {
                const groupId = event.eventIdentity?.groupId
                if (groupId !== undefined) {
                  if (!eventsByGroup[groupId]) {
                    eventsByGroup[groupId] = []
                  }
                  eventsByGroup[groupId].push(event)
                }
              })

              console.log(
                `⚽ Grouped events into ${Object.keys(eventsByGroup).length} groups`,
              )

              // Crea un UpcomingRound per ogni gruppo
              const rounds: UpcomingRound[] = Object.entries(eventsByGroup).map(
                ([groupId, events]) => {
                  const firstEvent = events[0]

                  return {
                    ...firstSchedule,
                    scheduleId: Number(groupId),
                    scheduleName:
                      firstEvent.eventIdentity.scheduleType ??
                      firstSchedule.scheduleName,
                    mag_event: events.map((event) => {
                      return {
                        ...event,
                        startTime: new Date(
                          event.eventIdentity.startTime,
                        ).toISOString(),
                      }
                    }),
                  }
                },
              )

              const timezone = getTimezone?.() || 'Europe/Rome'

              // Crea UpcomingEvent per ogni round (non per ogni partita singola)
              const upcomingSoccerEvents = rounds.map((round) => {
                const eventDate = parseAPIDate(
                  round.mag_event[0].startTime,
                  timezone,
                )
                return {
                  id: round.scheduleId,
                  name: round.scheduleName,
                  startTime: eventDate.toLocaleTimeString('it-IT', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  time: eventDate,
                  duration: 3,
                  discipline: Discipline.SOCCER,
                  data: round,
                }
              })

              allUpcomingEvents.push(...upcomingSoccerEvents)

              // Crea 10 risultati mockup per il calcio (come nel vecchio codice)
              const roundResults: EventResult[] = Array.from(
                { length: 10 },
                (_, index) => {
                  const date = new Date(rounds[0].mag_event[0].startTime)
                  date.setMinutes(date.getMinutes() - (index + 1) * 3)

                  return {
                    id: 10 - index,
                    name: ` Trident round ${10 - index}`,
                    startTime: date,
                    discipline: Discipline.SOCCER,
                    result: {
                      round: {
                        name: 'Trident',
                        number: 12 - index,
                      },
                      teams: 'AST - WOL',
                      score1: 2,
                      score2: 1,
                      odds: {
                        oneXTwo: {
                          odds: 1.95,
                        },
                        doubleChance: {
                          odds: 1.63,
                        },
                        firstScorer: {
                          teamLabel: 'WOL',
                          odds: 2.05,
                        },
                        sumGoals: {
                          value: 2,
                          odds: 1.63,
                        },
                        goalNoGoal: {
                          value: 1,
                          odds: 1.95,
                        },
                        redCard: {
                          value: 'WOL',
                          odds: 2.05,
                        },
                        winningCombo: {
                          value: 'WOL',
                          odds: 2.05,
                        },
                        exactGoals: {
                          value: 2,
                          odds: 1.63,
                        },
                      },
                    },
                  }
                },
              )

              allEventResults.push(...roundResults)

              console.log(
                `⚽ Soccer parsing complete: ${upcomingSoccerEvents.length} rounds created, ${roundResults.length} mock results added`,
              )
            } else {
              console.error('⚽ Soccer API response NOT OK:', {
                status: soccerResponse.status,
                statusText: soccerResponse.statusText,
              })
            }
          } catch (error) {
            console.error('⚽ Error fetching soccer events:', error)
          }
        }

        console.log(
          `✅ Loaded ${allUpcomingEvents.length} upcoming events, ${allEventResults.length} results`,
        )
        setUpcomingEvents(allUpcomingEvents)
        setEventResults(allEventResults)
        if (!nocache) {
          moduleEventsCache.set(cacheKey, {
            timestamp: Date.now(),
            upcoming: allUpcomingEvents,
            results: allEventResults,
          })
        }
        moduleHasLoadedOnce = true
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
  }, [
    pathname,
    operator,
    effectiveInitCode,
    getTimezone,
    activeDisciplines,
    fetchEventsInBackground,
  ])

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
