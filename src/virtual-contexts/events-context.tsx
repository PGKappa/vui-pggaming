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
import { createContext, useEffect, useRef, useState, useContext } from 'react'
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

export default function EventsContextProvider(props: {
  children: React.ReactNode
}) {
  const { initCode, apiRequest, isLoadingCashier } = useContext(CashierContext)

  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [eventResults, setEventResults] = useState<EventResult[]>([])
  const [upcomingRounds, setUpcomingRounds] = useState<UpcomingRound[]>([])
  const [liveRound, setLiveRound] = useState<LiveRound | undefined>(undefined)
  // Placeholder state — setters will be used when API support is added
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [roundStatistics, setRoundStatistics] = useState<
    RoundStatistics | undefined
  >(undefined)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [teamRankings, setTeamRankings] = useState<TeamRanking[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [matchResult, setMatchResult] = useState<MatchResult[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)

  const processedRoundIdRef = useRef<number | undefined>(undefined)

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

  // Fetch eventi quando cashier è pronto
  useEffect(() => {
    if (!initCode || isLoadingCashier) return

    // --- Soccer ---
    const fetchUpcomingRounds = async () => {
      if (isCacheValid(CACHE_KEYS.LAST_SOCCER_FETCH_TIME)) return
      if (!apiRequest) return

      const response = await apiRequest<{
        schedules: { schedule: UpcomingRound[] }
      }>('/football/20/', { method: 'GET' })

      if (!response?.schedules?.schedule?.length) return

      const allEvents = response.schedules.schedule[0].mag_event.slice(4) || [] //TODO: remove .slice(4) when the API is fixed

      const eventsByGroup: Record<number, UpcomingMatch[]> = {}
      allEvents.forEach((event) => {
        const groupId = event.eventIdentity?.groupId
        if (groupId !== undefined) {
          if (!eventsByGroup[groupId]) eventsByGroup[groupId] = []
          eventsByGroup[groupId].push(event)
        }
      })

      const rounds: UpcomingRound[] = Object.entries(eventsByGroup).map(
        ([groupId, events]) => {
          const firstEvent = events[0]
          return {
            ...response.schedules.schedule[0],
            scheduleId: Number(groupId),
            scheduleName:
              firstEvent.eventIdentity.scheduleType ??
              response.schedules.schedule[0].scheduleName,
            mag_event: events.map((event) => {
              //TODO: replace this events.map() with events when the API is fixed
              const startTime = new Date()
              startTime.setMinutes(new Date(event.startTime).getMinutes())
              startTime.setSeconds(0)
              startTime.setMilliseconds(0)

              return {
                ...event,
                startTime: startTime.toISOString(),
              }
            }),
          }
        },
      )

      setUpcomingRounds(rounds)
      saveToCache(CACHE_KEYS.SOCCER_EVENTS, rounds)
      localStorage.setItem(
        CACHE_KEYS.LAST_SOCCER_FETCH_TIME,
        Date.now().toString(),
      )
    }

    // --- Horses ---
    const fetchUpcomingHorseEvents = async () => {
      if (isCacheValid(CACHE_KEYS.LAST_HORSES_FETCH_TIME)) return

      try {
        const response = await createPGVirtualAPICall(
          '/api/event/list',
          initCode,
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch horse events: ${response.status}`)
        }

        const horseEvents = await response.json()
        const horseChannel = horseEvents.channels?.[1]

        if (!horseChannel?.next_events) return

        const upcomingHorseEvents: UpcomingEvent[] =
          horseChannel.next_events.map(
            (event: any, index: number): UpcomingEvent => {
              let startTime: Date
              if (event.start_time && typeof event.start_time === 'string') {
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
                podium: event.arrival.map((horse: any, index: number) => ({
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
      } catch (error) {
        console.error('Horse events fetch error:', error)
      }
    }

    // --- Dogs ---
    const fetchUpcomingDogEvents = async () => {
      if (isCacheValid(CACHE_KEYS.LAST_DOGS_FETCH_TIME)) return

      try {
        const response = await createPGVirtualAPICall(
          '/api/event/list',
          initCode,
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch dog events: ${response.status}`)
        }

        const dogEvents = await response.json()
        const dogChannel = dogEvents.channels?.[0]

        if (!dogChannel?.next_events) return

        const upcomingDogEvents: UpcomingEvent[] = dogChannel.next_events.map(
          (event: any, index: number): UpcomingEvent => {
            let startTime: Date
            if (event.start_time && typeof event.start_time === 'string') {
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
                podium: event.arrival.map((dog: any, index: number) => ({
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
      } catch (error) {
        console.error('Dog events fetch error:', error)
      }
    }

    // Carica cache first, poi fetch
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

    fetchUpcomingRounds()
    fetchUpcomingHorseEvents()
    fetchUpcomingDogEvents()

    // Refresh automatico ogni 3 minuti
    const refreshInterval = setInterval(
      () => {
        fetchUpcomingRounds()
        fetchUpcomingHorseEvents()
        fetchUpcomingDogEvents()
      },
      3 * 60 * 1000,
    )

    return () => clearInterval(refreshInterval)
  }, [initCode, isLoadingCashier, apiRequest])

  // Cleanup eventi scaduti ogni 30 secondi
  useEffect(() => {
    const cleanupExpiredEvents = () => {
      const now = new Date()
      setUpcomingEvents((prev) =>
        prev.filter((event) => new Date(event.time) > now),
      )
    }

    cleanupExpiredEvents()
    const cleanupInterval = setInterval(cleanupExpiredEvents, 30000)
    return () => clearInterval(cleanupInterval)
  }, [])

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
