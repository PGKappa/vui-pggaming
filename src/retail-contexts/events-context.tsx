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
import { useTranslation } from 'react-i18next'
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
let isFetchingEvents = false // Previene chiamate duplicate
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
  if (p.includes('dogs8') || p.includes('cani8')) return [Discipline.DOGS8]
  if (p.includes('horses') || p.includes('cavalli')) return [Discipline.HORSES]
  if (p.includes('dogs') || p.includes('cani')) return [Discipline.DOGS]
  if (p.includes('calcio') || p.includes('football') || p.includes('soccer'))
    return [Discipline.SOCCER]

  return []
}

export default function EventsContextProvider(props: {
  children: React.ReactNode
}) {
  const { t } = useTranslation()
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
        console.warn('No initCode available for fetchEventDetails')
        return
      }

      if (!operator) {
        toast.error(t('operator_required'))
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
            console.warn('Event not found in API response')
          }
        }
      } catch (error) {
        console.error('Error fetching event details:', error)
        toast.error(t('error_fetching_event_details'))
      } finally {
        setIsLoadingEventDetails(false)
      }
    },
    [effectiveInitCode, operator, getTimezone, t],
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
          disciplines.includes(Discipline.DOGS8) ||
          disciplines.includes(Discipline.HORSES)

        const allUpcomingEvents: UpcomingEvent[] = []

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

            const dogChannel =
              channels.find(
                (c: any) =>
                  // Cerca nel game_id (dogs6) o nel name (Dog, Grey, etc) - ma NON dogs8
                  (typeof c?.game_id === 'string' &&
                    /dogs?6|dog[^8]/i.test(c.game_id)) ||
                  (typeof c?.name === 'string' &&
                    /dog|grey/i.test(c.name) &&
                    !/8/.test(c.name) &&
                    !/8/.test(c.game_id || '')),
              ) || channels[0] // Fallback to first channel

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

            // Dogs8
            const dog8Channel = channels.find(
              (c: any) =>
                // Cerca nel game_id (dogs8) o nel name (Dog8, Grey8, etc)
                (typeof c?.game_id === 'string' && /dogs?8/i.test(c.game_id)) ||
                (typeof c?.name === 'string' && /dog.*8|grey.*8/i.test(c.name)),
            ) // NO fallback - solo se esiste esplicitamente

            if (dog8Channel?.next_events) {
              const dog8Events = dog8Channel.next_events.map(
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
                    duration: dog8Channel.duration?.[idx] || 3,
                    name: 'Dog8',
                    startTime: event.start_time,
                    time: startTime,
                    discipline: Discipline.DOGS8,
                  }
                },
              )
              allUpcomingEvents.push(...dog8Events)
            }

            // Horses
            const horseChannel = channels.find(
              (c: any) =>
                // Cerca nel game_id (horse) o nel name (Horse, Cavall, etc)
                (typeof c?.game_id === 'string' && /horse/i.test(c.game_id)) ||
                (typeof c?.name === 'string' && /horse|cavall/i.test(c.name)),
            ) // NO fallback - solo se esiste esplicitamente

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
            results: [], // I risultati verranno caricati on-demand
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

    // Unifica cache per racing: dogs, dogs8 e horses usano la stessa API, quindi usa una chiave condivisa
    const normalizedDisciplines = disciplines.includes(Discipline.SOCCER)
      ? disciplines
      : [Discipline.DOGS, Discipline.DOGS8, Discipline.HORSES]

    if (!effectiveInitCode || disciplines.length === 0) {
      setIsLoadingEvents(false)
      return
    }

    const nocache =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('nocache') === '1'

    const cacheKey = `${effectiveInitCode}:${normalizedDisciplines.sort().join('+')}`
    const cached = moduleEventsCache.get(cacheKey)

    // Se abbiamo dati in cache validi, usali subito SENZA loading
    if (
      !nocache &&
      cached &&
      Date.now() - cached.timestamp < EVENTS_CACHE_TTL_MS
    ) {
      // Imposta i dati immediatamente dalla cache
      setUpcomingEvents(cached.upcoming)
      setEventResults(cached.results)
      moduleHasLoadedOnce = true
      setIsLoadingEvents(false)

      // Fetch in background per aggiornare i dati
      if (Date.now() - cached.timestamp > 30 * 1000) {
        fetchEventsInBackground(disciplines, normalizedDisciplines, cacheKey)
      }
      return
    }

    // Previeni chiamate duplicate
    if (isFetchingEvents) {
      return
    }
    isFetchingEvents = true

    // AbortController per cancellare le fetch se pathname cambia
    const abortController = new AbortController()

    const fetchEvents = async () => {
      // Mostra loading SOLO al primissimo caricamento assoluto della pagina
      if (!moduleHasLoadedOnce) {
        setIsLoadingEvents(true)
      }

      try {
        if (!operator) {
          toast.error(t('operator_required'))
          setIsLoadingEvents(false)
          isFetchingEvents = false
          return
        }

        const shouldFetchRacing =
          disciplines.includes(Discipline.DOGS) ||
          disciplines.includes(Discipline.DOGS8) ||
          disciplines.includes(Discipline.HORSES)
        const shouldFetchSoccer = disciplines.includes(Discipline.SOCCER)

        const allUpcomingEvents: UpcomingEvent[] = []

        let racingData: any = null
        if (shouldFetchRacing) {
          const response = await createPGVirtualAPICall(
            '/api/event/list',
            effectiveInitCode,
            undefined,
            operator,
          )

          if (response.ok) {
            racingData = await response.json()

            const timezone = getTimezone?.() || 'Europe/Rome'
            const channels = Array.isArray(racingData.channels)
              ? racingData.channels
              : []

            // Dogs - solo next_events
            const dogChannel =
              channels.find(
                (c: any) =>
                  // Cerca nel game_id (dogs6) o nel name (Dog, Grey, etc) - ma NON dogs8
                  (typeof c?.game_id === 'string' &&
                    /dogs?6|dog[^8]/i.test(c.game_id)) ||
                  (typeof c?.name === 'string' &&
                    /dog|grey/i.test(c.name) &&
                    !/8/.test(c.name) &&
                    !/8/.test(c.game_id || '')),
              ) || channels[0]

            console.log(
              '[DEBUG EventsContext] dogChannel found:',
              dogChannel
                ? {
                    id: dogChannel.id,
                    name: dogChannel.name,
                    game_id: dogChannel.game_id,
                    next_events_count: dogChannel.next_events?.length,
                  }
                : null,
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
              console.log(
                '[DEBUG EventsContext] dogEvents added:',
                dogEvents.length,
              )
            }

            // Dogs8 - solo next_events
            const dog8Channel = channels.find(
              (c: any) =>
                // Cerca nel game_id (dogs8) o nel name (Dog8, Grey8, etc)
                (typeof c?.game_id === 'string' && /dogs?8/i.test(c.game_id)) ||
                (typeof c?.name === 'string' && /dog.*8|grey.*8/i.test(c.name)),
            ) // NO fallback - solo se esiste esplicitamente

            console.log(
              '[DEBUG EventsContext] dog8Channel found:',
              dog8Channel
                ? {
                    id: dog8Channel.id,
                    name: dog8Channel.name,
                    game_id: dog8Channel.game_id,
                    next_events_count: dog8Channel.next_events?.length,
                  }
                : null,
            )

            if (dog8Channel?.next_events) {
              const dog8Events = dog8Channel.next_events.map(
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
                    duration: dog8Channel.duration?.[idx] || 3,
                    name: 'Dog8',
                    startTime: event.start_time,
                    time: startTime,
                    discipline: Discipline.DOGS8,
                  }
                },
              )
              allUpcomingEvents.push(...dog8Events)
            }

            // Horses - solo next_events
            const horseChannel = channels.find(
              (c: any) =>
                // Cerca nel game_id (horse) o nel name (Horse, Cavall, etc)
                (typeof c?.game_id === 'string' && /horse/i.test(c.game_id)) ||
                (typeof c?.name === 'string' && /horse|cavall/i.test(c.name)),
            ) // NO fallback - solo se esiste esplicitamente

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

            setUpcomingEvents(allUpcomingEvents)
            setIsLoadingEvents(false)
            moduleHasLoadedOnce = true
            isFetchingEvents = false

            // Salva in cache (senza risultati per ora)
            if (!nocache) {
              moduleEventsCache.set(cacheKey, {
                timestamp: Date.now(),
                upcoming: allUpcomingEvents,
                results: [], // I risultati verranno caricati on-demand
              })
            }
          } else {
            console.error('API Racing response NOT OK:', {
              status: response.status,
              statusText: response.statusText,
            })
            isFetchingEvents = false
          }
        }

        // ===== SOCCER =====
        if (shouldFetchSoccer) {
          const allSoccerResults: EventResult[] = []
          try {
            // TODO: Sostituire con l'endpoint corretto per il calcio
            const soccerResponse = await fetch(
              `${SOCCER_API_URL}?t=${Date.now()}`,
            )
            if (soccerResponse.ok) {
              const soccerData = await soccerResponse.json()

              const scheduleArray = soccerData.schedules?.schedule || []

              if (scheduleArray.length === 0) {
                return
              }

              const firstSchedule = scheduleArray[0]
              const allEvents = firstSchedule.mag_event || []

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

              // Crea 10 risultati mockup per il calcio
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

              allSoccerResults.push(...roundResults)

              // Soccer: mostra subito
              setUpcomingEvents(upcomingSoccerEvents)
              setEventResults(allSoccerResults)
              setIsLoadingEvents(false)
              moduleHasLoadedOnce = true
              isFetchingEvents = false

              if (!nocache) {
                moduleEventsCache.set(cacheKey, {
                  timestamp: Date.now(),
                  upcoming: upcomingSoccerEvents,
                  results: allSoccerResults,
                })
              }
            } else {
              console.error('⚽ Soccer API response NOT OK:', {
                status: soccerResponse.status,
                statusText: soccerResponse.statusText,
              })
              isFetchingEvents = false
            }
          } catch (error) {
            console.error('⚽ Error fetching soccer events:', error)
            isFetchingEvents = false
          }
        }

        // Se non abbiamo fetchato nulla, nascondi loading comunque
        if (!shouldFetchRacing && !shouldFetchSoccer) {
          setIsLoadingEvents(false)
          isFetchingEvents = false
        }
      } catch (error) {
        // Ignora errori dovuti ad abort
        if (error instanceof Error && error.name === 'AbortError') {
          isFetchingEvents = false
          return
        }
        console.error('Error fetching events:', error)
        toast.error('Error loading events')
        setIsLoadingEvents(false)
        isFetchingEvents = false
      }
    }

    fetchEvents()

    // Cleanup: cancel fetch se pathname cambia prima che sia finito
    return () => {
      abortController.abort()
      isFetchingEvents = false
    }
  }, [
    pathname,
    operator,
    effectiveInitCode,
    getTimezone,
    activeDisciplines,
    fetchEventsInBackground,
    t,
  ])

  // Polling periodico per mantenere il carosello aggiornato
  useEffect(() => {
    const POLLING_INTERVAL_MS = 45 * 1000 // 45 secondi
    const MIN_EVENTS_THRESHOLD = 6 // Soglia minima di eventi prima di fare refresh
    const CHECK_INTERVAL_MS = 25 * 1000 // Controlla ogni 25 secondi se serve refresh

    // Non fare polling se non abbiamo ancora i dati iniziali
    if (!moduleHasLoadedOnce || !effectiveInitCode || !operator) {
      return
    }

    const disciplines = getDisciplinesFromUrl(pathname)
    if (disciplines.length === 0) {
      return
    }

    // Normalizza le discipline per racing (DOGS + HORSES usano stessa API)
    const isRacing = disciplines.some(
      (d) => d === Discipline.DOGS || d === Discipline.HORSES,
    )
    const normalizedDisciplines = isRacing
      ? [Discipline.DOGS, Discipline.HORSES]
      : disciplines

    const cacheKey = `${effectiveInitCode}:${normalizedDisciplines.sort().join('+')}`

    let lastFetchTime = Date.now()

    // Funzione per controllare se serve un refresh
    const checkAndRefresh = () => {
      const now = new Date()

      // Conta gli eventi futuri (non ancora scaduti)
      const futureEvents = upcomingEvents.filter((event) => {
        const eventTime =
          event.time instanceof Date ? event.time : new Date(event.time)
        return eventTime > now
      })

      // Filtra per le discipline correnti
      const relevantFutureEvents = futureEvents.filter((event) =>
        disciplines.includes(event.discipline),
      )

      // Se abbiamo meno eventi della soglia, fai refresh immediato
      if (
        relevantFutureEvents.length < MIN_EVENTS_THRESHOLD &&
        Date.now() - lastFetchTime > 100000
      ) {
        lastFetchTime = Date.now()
        fetchEventsInBackground(disciplines, normalizedDisciplines, cacheKey)
      }
    }

    // Controlla frequentemente se serve refresh
    const checkIntervalId = setInterval(checkAndRefresh, CHECK_INTERVAL_MS)

    // Polling regolare ogni 45 secondi
    const pollingIntervalId = setInterval(() => {
      lastFetchTime = Date.now()
      fetchEventsInBackground(disciplines, normalizedDisciplines, cacheKey)
    }, POLLING_INTERVAL_MS)

    return () => {
      clearInterval(checkIntervalId)
      clearInterval(pollingIntervalId)
    }
  }, [
    pathname,
    effectiveInitCode,
    operator,
    fetchEventsInBackground,
    upcomingEvents,
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
