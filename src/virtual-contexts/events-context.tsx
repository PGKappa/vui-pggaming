'use client'

import {
  Discipline,
  EventResult,
  LiveRound,
  MatchResult,
  RaceResult,
  RoundStatistics,
  TeamRanking,
  UpcomingEvent,
  UpcomingMatch,
  UpcomingRound,
} from '@/virtual-lib/types'
import { createPGVirtualAPICall } from '@/virtual-lib/utils'
import { prefetchRaceInfo } from '@/virtual-lib/race-info-cache'
import {
  createContext,
  useEffect,
  useRef,
  useState,
  useContext,
  useCallback,
} from 'react'
import { CashierContext } from './cashier-context'

export type EventsContextType = {
  upcomingEvents?: UpcomingEvent[]
  eventResults?: EventResult[]
  upcomingRounds?: UpcomingRound[]
  liveRound?: LiveRound
  roundStatistics?: RoundStatistics
  teamRankings?: TeamRanking[]
  matchResult?: MatchResult[]
  isLoadingEvents?: boolean
}

const defaultEventsContext: EventsContextType = {
  upcomingEvents: undefined,
  eventResults: undefined,
  upcomingRounds: undefined,
  liveRound: undefined,
  roundStatistics: undefined,
  teamRankings: [],
  matchResult: [],
  isLoadingEvents: true,
}

export const EventsContext =
  createContext<EventsContextType>(defaultEventsContext)

// Cache keys e durata
const CACHE_KEYS = {
  DOGS_EVENTS: 'virtual_dogs_events_cache',
  HORSES_EVENTS: 'virtual_horses_events_cache',
  SOCCER_EVENTS: 'virtual_soccer_events_cache',
  DOGS_RESULTS: 'virtual_dogs_results_cache',
  HORSES_RESULTS: 'virtual_horses_results_cache',
  LAST_DOGS_FETCH_TIME: 'virtual_dogs_last_fetch',
  LAST_HORSES_FETCH_TIME: 'virtual_horses_last_fetch',
  LAST_SOCCER_FETCH_TIME: 'virtual_soccer_last_fetch',
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minuti

function saveToCache(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {}
}

function loadFromCache(key: string): any | null {
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null

    const parsed = JSON.parse(cached)
    if (Date.now() - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key)
      return null
    }

    return parsed.data
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

function isCacheValid(key: string): boolean {
  const lastFetch = localStorage.getItem(key)
  if (!lastFetch) return false
  return Date.now() - parseInt(lastFetch) < CACHE_DURATION
}

// Consente navigazione istantanea tra discipline senza spinner
let moduleEventsCache: UpcomingEvent[] = []
let moduleResultsCache: EventResult[] = []
let moduleRoundsCache: UpcomingRound[] = []
let moduleLiveRound: LiveRound | undefined = undefined
let moduleHasLoadedOnce = false

export default function EventsContextProvider(props: {
  children: React.ReactNode
}) {
  const { initCode, operator, apiRequest, isLoadingCashier } =
    useContext(CashierContext)

  const [upcomingEvents, setUpcomingEvents] =
    useState<UpcomingEvent[]>(moduleEventsCache)
  const [eventResults, setEventResults] =
    useState<EventResult[]>(moduleResultsCache)
  const [upcomingRounds, setUpcomingRounds] =
    useState<UpcomingRound[]>(moduleRoundsCache)
  const [liveRound, setLiveRound] = useState<LiveRound | undefined>(
    moduleLiveRound,
  )
  // Placeholder state — setters will be used when API support is added
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [roundStatistics, setRoundStatistics] = useState<
    RoundStatistics | undefined
  >(undefined)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [teamRankings, setTeamRankings] = useState<TeamRanking[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [matchResult, setMatchResult] = useState<MatchResult[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(!moduleHasLoadedOnce)

  const processedRoundIdRef = useRef<number | undefined>(undefined)
  const isFetchingRef = useRef(false)
  const upcomingEventsRef = useRef(upcomingEvents)
  const lastForceFetchRef = useRef(0)

  useEffect(() => {
    upcomingEventsRef.current = upcomingEvents
  }, [upcomingEvents])

  // Sync state → module cache (sopravvive ai rimount)
  useEffect(() => {
    moduleEventsCache = upcomingEvents
  }, [upcomingEvents])
  useEffect(() => {
    moduleResultsCache = eventResults
  }, [eventResults])
  useEffect(() => {
    moduleRoundsCache = upcomingRounds
  }, [upcomingRounds])
  useEffect(() => {
    moduleLiveRound = liveRound
  }, [liveRound])

  // Round transition: promuovi round upcoming a liveRound
  useEffect(() => {
    if (!initCode || !upcomingRounds?.length) return

    const checkRoundTransition = () => {
      const currentDate = new Date()
      const nextRound = upcomingRounds.find((round) => {
        const startTime = new Date(round.mag_event[0]?.startTime)
        return currentDate >= startTime
      })

      if (nextRound && processedRoundIdRef.current !== nextRound.scheduleId) {
        processedRoundIdRef.current = nextRound.scheduleId

        setLiveRound((prev) => ({
          name: nextRound.scheduleName,
          number: nextRound.scheduleId,
          scores: prev?.scores || [],
          startingAt: new Date(nextRound.mag_event[0]?.startTime),
          streamUrl: prev?.streamUrl || '',
        }))

        setUpcomingRounds((prev) => prev.slice(1))
      }
    }

    checkRoundTransition()
    const intervalId = setInterval(checkRoundTransition, 60000)
    return () => clearInterval(intervalId)
  }, [initCode, upcomingRounds])

  // Fetch all events (dogs + horses + soccer) — richiamabile da qualsiasi punto
  const fetchAllEvents = useCallback(
    async (force = false) => {
      if (!initCode || isLoadingCashier || isFetchingRef.current) return
      isFetchingRef.current = true

      try {
        // --- Soccer ---
        if (force || !isCacheValid(CACHE_KEYS.LAST_SOCCER_FETCH_TIME)) {
          if (apiRequest) {
            try {
              const response = await apiRequest<{
                schedules: { schedule: UpcomingRound[] }
              }>('/football/20/', { method: 'GET' })

              if (response?.schedules?.schedule?.length) {
                const allEvents =
                  response.schedules.schedule[0].mag_event.slice(4) || []

                const eventsByGroup: Record<number, UpcomingMatch[]> = {}
                allEvents.forEach((event) => {
                  const groupId = event.eventIdentity?.groupId
                  if (groupId !== undefined) {
                    if (!eventsByGroup[groupId]) eventsByGroup[groupId] = []
                    eventsByGroup[groupId].push(event)
                  }
                })

                const rounds: UpcomingRound[] = Object.entries(
                  eventsByGroup,
                ).map(([groupId, events]) => {
                  const firstEvent = events[0]
                  return {
                    ...response.schedules.schedule[0],
                    scheduleId: Number(groupId),
                    scheduleName:
                      firstEvent.eventIdentity.scheduleType ??
                      response.schedules.schedule[0].scheduleName,
                    mag_event: events.map((event) => {
                      const startTime = new Date()
                      startTime.setMinutes(
                        new Date(event.startTime).getMinutes(),
                      )
                      startTime.setSeconds(0)
                      startTime.setMilliseconds(0)
                      return { ...event, startTime: startTime.toISOString() }
                    }),
                  }
                })

                setUpcomingRounds(rounds)
                saveToCache(CACHE_KEYS.SOCCER_EVENTS, rounds)
                localStorage.setItem(
                  CACHE_KEYS.LAST_SOCCER_FETCH_TIME,
                  Date.now().toString(),
                )
              }
            } catch (error) {
              console.error('Soccer events fetch error:', error)
            }
          }
        }

        // --- Dogs + Horses (stessa API, canali diversi) ---
        const needsDogs =
          force || !isCacheValid(CACHE_KEYS.LAST_DOGS_FETCH_TIME)
        const needsHorses =
          force || !isCacheValid(CACHE_KEYS.LAST_HORSES_FETCH_TIME)

        if (needsDogs || needsHorses) {
          try {
            const response = await createPGVirtualAPICall(
              '/api/event/list',
              initCode,
              undefined,
              operator,
            )

            if (!response.ok) {
              throw new Error(`Failed to fetch events: ${response.status}`)
            }

            const eventsData = await response.json()

            // Dogs (channel 0)
            if (needsDogs) {
              const dogChannel = eventsData.channels?.[0]
              if (dogChannel?.next_events) {
                const upcomingDogEvents: UpcomingEvent[] =
                  dogChannel.next_events.map(
                    (event: any, index: number): UpcomingEvent => {
                      let startTime: Date
                      if (
                        event.start_time &&
                        typeof event.start_time === 'string'
                      ) {
                        const [hours, minutes] = event.start_time.split(':')
                        startTime = new Date()
                        startTime.setHours(
                          parseInt(hours, 10),
                          parseInt(minutes, 10),
                          0,
                          0,
                        )
                      } else {
                        startTime = new Date(event.time)
                      }
                      return {
                        id: parseInt(event.int_event_id),
                        extId: event.ext_pal_id,
                        duration: dogChannel.duration?.[index],
                        discipline: Discipline.DOGS,
                        name: 'Dog Race',
                        startTime: event.start_time,
                        time: startTime,
                        trackName: dogChannel.track_name,
                      }
                    },
                  )

                const dogEventResults: EventResult[] = await Promise.all(
                  (dogChannel.prev_events || []).map(async (event: any) => {
                    const startTime = new Date(event.time)
                    let detailedResult = null
                    try {
                      const res = await createPGVirtualAPICall(
                        `/api/event/results/${event.ext_pal_id}/${event.int_event_id}`,
                        initCode,
                        undefined,
                        operator,
                      )
                      if (res.ok) detailedResult = await res.json()
                    } catch (error) {
                      console.warn('Failed to fetch detailed result:', error)
                    }
                    return {
                      id: event.int_event_id,
                      extId: event.ext_pal_id,
                      name: `Dog Race ${event.int_event_id}`,
                      startTime,
                      time: event.time,
                      discipline: Discipline.DOGS,
                      result: {
                        podium: (
                          (detailedResult as any)?.arrival ||
                          event.arrival ||
                          []
                        ).map((dog: any, index: number) => ({
                          name: dog.name,
                          number: dog.number,
                          position: index + 1,
                        })),
                        odds: (detailedResult as any)?.odds || {},
                      } as RaceResult,
                    } as EventResult
                  }),
                )

                setUpcomingEvents((prev) => [
                  ...prev.filter((e) => e.discipline !== Discipline.DOGS),
                  ...upcomingDogEvents,
                ])
                setEventResults((prev) => [
                  ...prev.filter((e) => e.discipline !== Discipline.DOGS),
                  ...dogEventResults,
                ])
                saveToCache(CACHE_KEYS.DOGS_EVENTS, upcomingDogEvents)
                saveToCache(CACHE_KEYS.DOGS_RESULTS, dogEventResults)
                localStorage.setItem(
                  CACHE_KEYS.LAST_DOGS_FETCH_TIME,
                  Date.now().toString(),
                )

                // Pre-fetch race info per tutti i prossimi eventi cani (background)
                prefetchRaceInfo(upcomingDogEvents, initCode, operator)
              }
            }

            // Horses (channel 1)
            if (needsHorses) {
              const horseChannel = eventsData.channels?.[1]
              if (horseChannel?.next_events) {
                const upcomingHorseEvents: UpcomingEvent[] =
                  horseChannel.next_events.map(
                    (event: any, index: number): UpcomingEvent => {
                      let startTime: Date
                      if (
                        event.start_time &&
                        typeof event.start_time === 'string'
                      ) {
                        const [hours, minutes] = event.start_time.split(':')
                        startTime = new Date()
                        startTime.setHours(
                          parseInt(hours, 10),
                          parseInt(minutes, 10),
                          0,
                          0,
                        )
                      } else {
                        startTime = new Date(event.time)
                      }
                      return {
                        id: parseInt(event.int_event_id),
                        extId: event.ext_pal_id,
                        duration: horseChannel.duration?.[index],
                        discipline: Discipline.HORSES,
                        name: 'Horse Race',
                        startTime: event.start_time,
                        time: startTime,
                        trackName: horseChannel.track_name,
                      }
                    },
                  )

                const horseEventResults: EventResult[] = await Promise.all(
                  (horseChannel.prev_events || []).map(async (event: any) => {
                    const startTime = new Date(event.time)
                    let detailedResult = null
                    try {
                      const res = await createPGVirtualAPICall(
                        `/api/event/results/${event.ext_pal_id}/${event.int_event_id}`,
                        initCode,
                        undefined,
                        operator,
                      )
                      if (res.ok) detailedResult = await res.json()
                    } catch (error) {
                      console.warn('Failed to fetch detailed result:', error)
                    }
                    return {
                      id: event.int_event_id,
                      extId: event.ext_pal_id,
                      name: `Horse Race ${event.int_event_id}`,
                      startTime,
                      time: event.time,
                      discipline: Discipline.HORSES,
                      result: {
                        podium: (
                          (detailedResult as any)?.arrival ||
                          event.arrival ||
                          []
                        ).map((horse: any, index: number) => ({
                          name: horse.name,
                          number: horse.number,
                          position: index + 1,
                        })),
                        odds: (detailedResult as any)?.odds || {},
                      } as RaceResult,
                    } as EventResult
                  }),
                )

                setUpcomingEvents((prev) => [
                  ...prev.filter((e) => e.discipline !== Discipline.HORSES),
                  ...upcomingHorseEvents,
                ])
                setEventResults((prev) => [
                  ...prev.filter((e) => e.discipline !== Discipline.HORSES),
                  ...horseEventResults,
                ])
                saveToCache(CACHE_KEYS.HORSES_EVENTS, upcomingHorseEvents)
                saveToCache(CACHE_KEYS.HORSES_RESULTS, horseEventResults)
                localStorage.setItem(
                  CACHE_KEYS.LAST_HORSES_FETCH_TIME,
                  Date.now().toString(),
                )

                // Pre-fetch race info per tutti i prossimi eventi cavalli (background)
                prefetchRaceInfo(upcomingHorseEvents, initCode, operator)
              }
            }
          } catch (error) {
            console.error('Racing events fetch error:', error)
          }
        }
      } finally {
        isFetchingRef.current = false
      }
    },
    [initCode, operator, isLoadingCashier, apiRequest],
  )

  // Initial load: carica da cache, poi fetch
  useEffect(() => {
    if (!initCode || isLoadingCashier) return

    const cachedSoccer = loadFromCache(CACHE_KEYS.SOCCER_EVENTS)
    if (cachedSoccer) setUpcomingRounds(cachedSoccer)

    const cachedDogsEvents = loadFromCache(CACHE_KEYS.DOGS_EVENTS)
    const cachedHorsesEvents = loadFromCache(CACHE_KEYS.HORSES_EVENTS)
    const cachedDogsResults = loadFromCache(CACHE_KEYS.DOGS_RESULTS)
    const cachedHorsesResults = loadFromCache(CACHE_KEYS.HORSES_RESULTS)

    if (cachedDogsEvents || cachedHorsesEvents) {
      setUpcomingEvents([
        ...(cachedDogsEvents || []),
        ...(cachedHorsesEvents || []),
      ])
    }
    if (cachedDogsResults || cachedHorsesResults) {
      setEventResults([
        ...((cachedDogsResults as EventResult[])?.map((r: any) => ({
          ...r,
          startTime: new Date(r.startTime),
        })) || []),
        ...((cachedHorsesResults as EventResult[])?.map((r: any) => ({
          ...r,
          startTime: new Date(r.startTime),
        })) || []),
      ])
    }

    setIsLoadingEvents(false)
    moduleHasLoadedOnce = true

    fetchAllEvents()
  }, [initCode, isLoadingCashier, fetchAllEvents])

  // Cleanup + urgent check ogni 5s (usa ref per evitare reset del cooldown)
  useEffect(() => {
    if (!initCode || isLoadingCashier) return

    const MIN_EVENTS_THRESHOLD = 10
    const TICK_INTERVAL = 5 * 1000
    const FORCE_COOLDOWN = 5 * 1000 // min 5s tra force-fetch

    const tick = () => {
      const now = new Date()

      // 1. Cleanup: rimuovi eventi scaduti
      setUpcomingEvents((prev) => {
        const filtered = prev.filter((event) => {
          const eventTime =
            event.time instanceof Date ? event.time : new Date(event.time)
          return eventTime > now
        })
        return filtered.length === prev.length ? prev : filtered
      })

      // 2. Conta eventi futuri (dal ref, sempre aggiornato)
      const currentEvents = upcomingEventsRef.current
      const futureEvents = currentEvents.filter((event) => {
        const eventTime =
          event.time instanceof Date ? event.time : new Date(event.time)
        return eventTime > now
      })

      const futureDogs = futureEvents.filter(
        (e) => e.discipline === Discipline.DOGS,
      ).length
      const futureHorses = futureEvents.filter(
        (e) => e.discipline === Discipline.HORSES,
      ).length

      // 3. Se sotto soglia → force-fetch (con cooldown 5s)
      if (
        (futureDogs < MIN_EVENTS_THRESHOLD ||
          futureHorses < MIN_EVENTS_THRESHOLD) &&
        Date.now() - lastForceFetchRef.current > FORCE_COOLDOWN
      ) {
        lastForceFetchRef.current = Date.now()
        localStorage.removeItem(CACHE_KEYS.LAST_DOGS_FETCH_TIME)
        localStorage.removeItem(CACHE_KEYS.LAST_HORSES_FETCH_TIME)
        fetchAllEvents(true)
      }
    }

    tick() // esegui subito
    const tickId = setInterval(tick, TICK_INTERVAL)
    return () => clearInterval(tickId)
  }, [initCode, isLoadingCashier, fetchAllEvents])

  // Polling regolare ogni 45s (background refresh)
  useEffect(() => {
    if (!initCode || isLoadingCashier) return
    const id = setInterval(() => fetchAllEvents(), 45 * 1000)
    return () => clearInterval(id)
  }, [initCode, isLoadingCashier, fetchAllEvents])

  const contextValue: EventsContextType = {
    upcomingEvents: upcomingEvents.length > 0 ? upcomingEvents : undefined,
    eventResults: eventResults.length > 0 ? eventResults : undefined,
    upcomingRounds: upcomingRounds.length > 0 ? upcomingRounds : undefined,
    liveRound,
    roundStatistics,
    teamRankings,
    matchResult,
    isLoadingEvents,
  }

  return (
    <EventsContext.Provider value={contextValue}>
      {props.children}
    </EventsContext.Provider>
  )
}
