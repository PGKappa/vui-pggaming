'use client'

import LoadingSpinner from '@/virtual-components/loading-spinner'
import {
  Discipline,
  EventResult,
  LiveRound,
  MatchResult,
  RaceResult,
  RoundStatistics,
  TeamRanking,
  Ticket,
  UpcomingEvent,
  UpcomingMatch,
  UpcomingRound,
  User,
} from '@/virtual-lib/types'
import { BASE_API_URL, fetchCashierInit } from '@/virtual-lib/utils'
import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const DEBUG_ENABLED = true
const debugLog = (section: string, message: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[${section}] ${message}`, data || '')
  }
}

export type RootContextType = {
  initCode?: string
  userData?: User
  cashierData?: any
  apiRequest?: <T>(
    input: string | URL | globalThis.Request,
    init?: RequestInit,
    params?: Record<string, string>,
  ) => Promise<T>
  liveRound?: LiveRound
  roundStatistics?: RoundStatistics
  teamRankings?: TeamRanking[]
  upcomingRounds?: UpcomingRound[]
  upcomingEvents?: UpcomingEvent[]
  eventResults?: EventResult[]
  betsHistory: Ticket[]
  matchResult?: MatchResult[]
  getCurrencySymbol?: () => string
  getCurrencyCode?: () => string
  getMinStakeIncrement?: () => number
  getChannels?: (type?: 'calcio' | 'dogs' | 'horses') => any[]
  getTrackName?: (channel?: number) => string
  getTranslation?: (key: string, fallback?: string) => string
}

const defaultRootContext: RootContextType = {
  upcomingEvents: undefined,
  eventResults: undefined,
  //TODO: remove mock data
  liveRound: {
    name: 'Super League',
    number: 28,
    scores: [
      { team1: 'BUR', team2: 'EVE', score1: 2, score2: 0 },
      { team1: 'MCI', team2: 'MUN', score1: 1, score2: 1 },
      { team1: 'TOT', team2: 'ARS', score1: 0, score2: 0 },
      { team1: 'CHE', team2: 'LIV', score1: 1, score2: 1 },
    ],
    startingAt: new Date('2025-02-10T20:00:00Z'),
  },
  roundStatistics: {
    name: 'Super League',
    number: 29,
    matches: [
      {
        teams: 'NAP - GEN',
        probabilities: [30, 50, 20],
        startTime: new Date('2025-02-10T00:01:00Z'),
      },
      {
        teams: 'CAT - ELE',
        probabilities: [30, 50, 20],
        startTime: new Date('2025-02-10T00:01:00Z'),
      },
      {
        teams: 'JUV - MIL',
        probabilities: [30, 50, 20],
        startTime: new Date('2025-02-10T00:01:00Z'),
      },
      {
        teams: 'INT - ROM',
        probabilities: [30, 50, 20],
        startTime: new Date('2025-02-10T00:01:00Z'),
      },
    ],
  },
  teamRankings: [
    {
      position: 1,
      team: 'NAP',
      played: 26,
      wins: 14,
      draws: 8,
      losses: 4,
      points: 50,
      last8: ['W', 'W', 'L', 'W', 'W', 'X', 'L', 'W'],
    },
    {
      position: 2,
      team: 'JUV',
      played: 26,
      wins: 14,
      draws: 8,
      losses: 4,
      points: 50,
      last8: ['W', 'W', 'L', 'W', 'W', 'X', 'L', 'L'],
    },
    {
      position: 3,
      team: 'GEN',
      played: 26,
      wins: 13,
      draws: 7,
      losses: 6,
      points: 46,
      last8: ['L', 'W', 'L', 'X', 'W', 'X', 'W', 'X'],
    },
    {
      position: 4,
      team: 'MIL',
      played: 26,
      wins: 13,
      draws: 7,
      losses: 6,
      points: 46,
      last8: ['L', 'W', 'L', 'X', 'W', 'X', 'W', 'W'],
    },
  ],
  betsHistory: [],
  matchResult: [
    {
      round: { name: 'Super League', number: 28 },
      teams: 'NAP - GEN',
      score1: 2,
      score2: 0,
    },
  ],
}

export const RootContext = createContext<RootContextType>(defaultRootContext)

function getInitCodeFromUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined

  const params = new URLSearchParams(window.location.search)

  return params.get('init_code') || undefined
}

export default function RootContextProvider(props: {
  children: React.ReactNode
}) {
  const [initCode, setInitCode] = useState<string | undefined>(undefined)
  const [rootContext, setRootContext] =
    useState<RootContextType>(defaultRootContext)
  const { i18n } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [isCashierReady, setIsCashierReady] = useState(false)
  const processedRoundIdRef = useRef<number | undefined>(undefined)

  // Cache keys for localStorage
  const CACHE_KEYS = {
    DOGS_EVENTS: 'virtual_dogs_events_cache',
    HORSES_EVENTS: 'virtual_horses_events_cache',
    SOCCER_EVENTS: 'virtual_soccer_events_cache',
    DOGS_RESULTS: 'virtual_dogs_results_cache',
    HORSES_RESULTS: 'virtual_horses_results_cache',
    SOCCER_RESULTS: 'virtual_soccer_results_cache',
    LAST_DOGS_FETCH_TIME: 'virtual_dogs_last_fetch',
    LAST_HORSES_FETCH_TIME: 'virtual_horses_last_fetch',
    LAST_SOCCER_FETCH_TIME: 'virtual_soccer_last_fetch',
    CASHIER_DATA: 'virtual_cashier_data_cache',
    LAST_CASHIER_FETCH_TIME: 'virtual_cashier_last_fetch',
  }

  const CACHE_DURATION = 5 * 60 * 1000 // 5 minuti per eventi
  const CASHIER_CACHE_DURATION = 30 * 60 * 1000 // 30 minuti per cashier

  const saveToCache = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        }),
      )
    } catch {}
  }, [])

  // Funzioni specifiche per il caching cashier
  const saveCashierToCache = useCallback(
    (initCode: string, cashierData: any, contextData: any) => {
      if (typeof window === 'undefined') return

      try {
        const cacheData = {
          initCode,
          cashierData,
          contextData,
          timestamp: Date.now(),
        }
        localStorage.setItem(CACHE_KEYS.CASHIER_DATA, JSON.stringify(cacheData))
        localStorage.setItem(
          CACHE_KEYS.LAST_CASHIER_FETCH_TIME,
          Date.now().toString(),
        )
      } catch (error) {
        console.warn('Failed to cache cashier data:', error)
      }
    },
    [CACHE_KEYS.CASHIER_DATA, CACHE_KEYS.LAST_CASHIER_FETCH_TIME],
  )

  const loadCashierFromCache = useCallback(
    (initCode: string) => {
      if (typeof window === 'undefined') return null

      try {
        const cached = localStorage.getItem(CACHE_KEYS.CASHIER_DATA)
        if (!cached) return null

        const parsed = JSON.parse(cached)
        const now = Date.now()
        const age = now - parsed.timestamp

        // Verifica se il cache è ancora valido e per lo stesso initCode
        if (age > CASHIER_CACHE_DURATION || parsed.initCode !== initCode) {
          localStorage.removeItem(CACHE_KEYS.CASHIER_DATA)
          localStorage.removeItem(CACHE_KEYS.LAST_CASHIER_FETCH_TIME)
          return null
        }

        // Verifica che i dati essenziali siano presenti
        if (!parsed.contextData || !parsed.contextData.userData) {
          localStorage.removeItem(CACHE_KEYS.CASHIER_DATA)
          localStorage.removeItem(CACHE_KEYS.LAST_CASHIER_FETCH_TIME)
          return null
        }

        return parsed.contextData
      } catch (error) {
        console.warn('Failed to load cashier cache:', error)
        localStorage.removeItem(CACHE_KEYS.CASHIER_DATA)
        localStorage.removeItem(CACHE_KEYS.LAST_CASHIER_FETCH_TIME)
        return null
      }
    },
    [
      CACHE_KEYS.CASHIER_DATA,
      CACHE_KEYS.LAST_CASHIER_FETCH_TIME,
      CASHIER_CACHE_DURATION,
    ],
  )

  const loadFromCache = useCallback(
    (key: string): any | null => {
      try {
        const cached = localStorage.getItem(key)
        if (!cached) {
          return null
        }

        const parsed = JSON.parse(cached)
        const now = Date.now()
        const age = now - parsed.timestamp

        if (age > CACHE_DURATION) {
          localStorage.removeItem(key)
          return null
        }

        return parsed.data
      } catch {
        localStorage.removeItem(key)
        return null
      }
    },
    [CACHE_DURATION],
  )

  const isCacheValid = useCallback(
    (key: string): boolean => {
      const lastFetch = localStorage.getItem(key)
      if (!lastFetch) return false

      const age = Date.now() - parseInt(lastFetch)
      return age < CACHE_DURATION
    },
    [CACHE_DURATION],
  )

  const loadCachedRacingEvents = useCallback(() => {
    const cachedDogsEvents = loadFromCache(CACHE_KEYS.DOGS_EVENTS)
    const cachedHorsesEvents = loadFromCache(CACHE_KEYS.HORSES_EVENTS)
    const cachedDogsResults = loadFromCache(CACHE_KEYS.DOGS_RESULTS)
    const cachedHorsesResults = loadFromCache(CACHE_KEYS.HORSES_RESULTS)

    if (
      cachedDogsEvents ||
      cachedHorsesEvents ||
      cachedDogsResults ||
      cachedHorsesResults
    ) {
      setRootContext((prev) => ({
        ...prev,
        upcomingEvents: [
          ...(prev.upcomingEvents?.filter(
            (event) =>
              event.discipline !== Discipline.DOGS &&
              event.discipline !== Discipline.HORSES,
          ) || []),
          ...(cachedDogsEvents || []),
          ...(cachedHorsesEvents || []),
        ],
        eventResults: [
          ...(prev.eventResults?.filter(
            (result) =>
              result.discipline !== Discipline.DOGS &&
              result.discipline !== Discipline.HORSES,
          ) || []),
          ...((cachedDogsResults as EventResult[])?.map((r) => ({
            ...r,
            startTime: new Date(r.startTime),
          })) || []),
          ...((cachedHorsesResults as EventResult[])?.map((r) => ({
            ...r,
            startTime: new Date(r.startTime),
          })) || []),
        ],
      }))

      return true
    }

    return false
  }, [
    loadFromCache,
    CACHE_KEYS.DOGS_EVENTS,
    CACHE_KEYS.HORSES_EVENTS,
    CACHE_KEYS.DOGS_RESULTS,
    CACHE_KEYS.HORSES_RESULTS,
  ])

  const loadCachedSoccerEvents = useCallback(() => {
    const cachedSoccerEvents = loadFromCache(CACHE_KEYS.SOCCER_EVENTS)

    if (cachedSoccerEvents) {
      setRootContext((prev) => ({
        ...prev,
        upcomingRounds: cachedSoccerEvents,
      }))

      return true
    }

    return false
  }, [loadFromCache, CACHE_KEYS.SOCCER_EVENTS])

  type UserApiResponse = {
    status: string
    description: string
    playerId: string
    currency: string
    lang: string
    level: number
    group: string[]
  }

  const apiRequest = useCallback(
    async <T,>(
      input: string | URL | globalThis.Request,
      init?: RequestInit,
      params?: Record<string, string>,
    ): Promise<T> => {
      let url = `${BASE_API_URL}${input}`

      const urlObj = new URL(url)
      urlObj.searchParams.set('init_code', initCode || '')
      if (params && Object.keys(params).length > 0) {
        Object.entries(params).forEach(([key, value]) => {
          urlObj.searchParams.append(key, value)
        })
      }
      url = urlObj.toString()

      return await fetch(url, init)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }
          return response.json()
        })
        .catch((error) => {
          toast.error('API request failed!', {
            description: error.message,
          })
        })
    },
    [initCode],
  )

  // Helper per chiamate API PGVirtual
  const pgVirtualFetch = useCallback(
    (endpoint: string, options?: RequestInit) => {
      return fetch(`https://api-btprod.pgvirtual.eu${endpoint}`, {
        ...options,
        headers: {
          accept: 'application/json',
          'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
          authorization: `Bearer ${initCode}`,
          operator: 'sc',
          ...options?.headers,
        },
        mode: 'cors',
        credentials: 'include',
      })
    },
    [initCode],
  )

  useEffect(() => {
    const initCode = getInitCodeFromUrl()

    if (initCode) {
      const storedInitCode = localStorage.getItem('initCode')
      if (storedInitCode && storedInitCode !== initCode) {
        localStorage.removeItem('betsContext')
        setIsCashierReady(false)
      }

      localStorage.setItem('initCode', initCode)
    } else {
      localStorage.removeItem('initCode')
      setIsLoading(false)
      setIsCashierReady(false)
    }

    setInitCode(initCode)
  }, [])

  useEffect(() => {
    if (!initCode) return

    const checkRoundTransition = () => {
      const upcomingRounds = rootContext.upcomingRounds

      if (upcomingRounds?.length) {
        const currentDate = new Date()
        const nextRound = upcomingRounds.find((round) => {
          const startTime = new Date(round.mag_event[0]?.startTime)
          return currentDate >= startTime
        })

        if (nextRound) {
          if (processedRoundIdRef.current === nextRound.scheduleId) {
            return
          }

          processedRoundIdRef.current = nextRound.scheduleId

          setRootContext((prev) => ({
            ...prev,
            liveRound: {
              name: nextRound.scheduleName,
              number: nextRound.scheduleId,
              scores: prev.liveRound?.scores || [],
              startingAt: new Date(nextRound.mag_event[0]?.startTime),
              streamUrl: prev.liveRound?.streamUrl || '',
            },
            upcomingRounds: prev.upcomingRounds?.slice(1) || [],
          }))
        }
      }
    }

    checkRoundTransition()

    const intervalId = setInterval(checkRoundTransition, 60000)

    return () => clearInterval(intervalId)
  }, [initCode, rootContext.upcomingRounds])

  useEffect(() => {
    if (!initCode) return

    const fetchUserData = async (retryCount = 0, maxRetries = 3) => {
      // Prova a caricare dalla cache prima di chiamare l'API
      const cachedContext = loadCashierFromCache(initCode)
      if (cachedContext) {
        debugLog('CACHE', 'Loaded cashier data from cache', cachedContext)

        // Ricrea le funzioni helper usando il cashierData dalla cache
        const cashierData = cachedContext.cashierData

        const getCurrencyCode = () => cashierData.intl?.currency || 'EUR'

        const getCurrencySymbol = () => {
          const apiSymbol = cashierData.dict?.misc?.currency?.symbol
          if (apiSymbol) return apiSymbol

          const currencyCode = cashierData.intl?.currency || 'USD'
          const currencyMap: Record<string, string> = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            JPY: '¥',
            CHF: 'CHF',
            CAD: 'C$',
            AUD: 'A$',
          }
          return currencyMap[currencyCode] || '$'
        }

        const getChannels = (type: 'calcio' | 'dogs' | 'horses' = 'calcio') => {
          const channels: {
            id?: number
            name?: string
            description?: string
          }[] = []

          const magChannels = cashierData.configs?.mag_channels

          if (type === 'calcio' && magChannels?.VFL?.length) {
            channels.push(...magChannels.VFL)
          } else if (type === 'dogs' && magChannels?.VDR?.length) {
            channels.push(...magChannels.VDR)
          } else if (type === 'horses' && magChannels?.VHR?.length) {
            channels.push(...magChannels.VHR)
          }

          return channels
        }

        const getTrackName = (channel?: number): string => {
          if (!channel) return ''
          const magTracks = cashierData.configs?.mag_tracks
          const track = magTracks?.find((t) => t.id === channel)
          return track?.name || ''
        }

        const getTranslation = (key: string, fallback?: string): string => {
          const keys = key.split('.')
          let value: any = cashierData.dict
          for (const k of keys) {
            value = value?.[k]
            if (value === undefined) break
          }
          return typeof value === 'string' ? value : fallback || key
        }

        const getMinStakeIncrement = () => {
          const increment = cashierData.configs?.min_stake_increment
          return increment !== undefined ? increment : 0.05
        }

        // Applica i dati dalla cache con le funzioni ricreate
        i18n.changeLanguage(cachedContext.userData.lang.substring(0, 2))
        setRootContext((prev) => ({
          ...prev,
          userData: cachedContext.userData,
          cashierData: cachedContext.cashierData,
          getCurrencySymbol,
          getCurrencyCode,
          getMinStakeIncrement,
          getChannels,
          getTrackName,
          getTranslation,
        }))

        toast.success('Cashier data loaded from cache!')
        setIsLoading(false)
        setIsCashierReady(true)
        return
      }

      try {
        const cashierData = await fetchCashierInit(initCode)

        if (cashierData?.ret_code === 1024) {
          // Estrai i dati "utente" dai configs e intl (allineato con retail)
          const userData: UserApiResponse = {
            status: '1024',
            description: cashierData.description || 'Success',
            playerId: `${cashierData.configs?.user_type || 'user'}-${cashierData.configs?.terminals?.[0] || 'unknown'}`,
            currency: cashierData.intl?.currency || 'EUR',
            lang:
              cashierData.dictInfo?.lang || cashierData.intl?.lang || 'en-US',
            level: 1,
            group: [cashierData.configs?.ui_type || 'web'],
          }

          // Crea funzioni helper per accedere ai dati cashier
          const getCurrencyCode = () => cashierData.intl?.currency || 'EUR'

          const getCurrencySymbol = () => {
            // Prima prova a usare il simbolo dall'API cashier
            const apiSymbol = cashierData.dict?.misc?.currency?.symbol
            if (apiSymbol) {
              return apiSymbol
            }

            // Fallback: usa il mapping basato sul currency code
            const currencyCode = cashierData.intl?.currency || 'USD'
            const currencyMap: Record<string, string> = {
              USD: '$',
              EUR: '€',
              GBP: '£',
              JPY: '¥',
              CHF: 'CHF',
              CAD: 'C$',
              AUD: 'A$',
            }
            return currencyMap[currencyCode] || '$'
          }

          const getChannels = (
            type: 'calcio' | 'dogs' | 'horses' = 'calcio',
          ) => {
            const channels: {
              id?: number
              name?: string
              description?: string
            }[] = []

            const magChannels = cashierData.configs?.mag_channels

            if (type === 'calcio' && magChannels?.VFL?.length) {
              channels.push(...magChannels.VFL)
            } else if (type === 'dogs' && magChannels?.VDR?.length) {
              channels.push(...magChannels.VDR)
            } else if (type === 'horses' && magChannels?.VHR?.length) {
              channels.push(...magChannels.VHR)
            }

            return channels
          }

          const getTrackName = (channel?: number): string => {
            if (!channel) return ''

            const magTracks = cashierData.configs?.mag_tracks
            const track = magTracks?.find((t) => t.id === channel)
            return track?.name || ''
          }

          const getTranslation = (key: string, fallback?: string): string => {
            const keys = key.split('.')
            let value: any = cashierData.dict
            for (const k of keys) {
              value = value?.[k]
              if (value === undefined) break
            }
            return typeof value === 'string' ? value : fallback || key
          }

          const getMinStakeIncrement = () => {
            const increment = cashierData.configs?.min_stake_increment
            return increment !== undefined ? increment : 0.05
          }

          const contextData = {
            userData,
            cashierData,
            getCurrencySymbol,
            getCurrencyCode,
            getMinStakeIncrement,
            getChannels,
            getTrackName,
            getTranslation,
          }

          i18n.changeLanguage(userData.lang.substring(0, 2))
          setRootContext((prev) => ({
            ...prev,
            ...contextData,
          }))

          // Salva i dati cashier in cache
          saveCashierToCache(initCode, cashierData, contextData)

          toast.success('User data fetched successfully!')
          setIsLoading(false)
          setIsCashierReady(true)
        } else {
          setInitCode(undefined)
          throw new Error('Could not fetch User Data!')
        }
      } catch {
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000
          toast.loading('Retrying...', {
            id: 'retry-toast',
            description: `Attempt ${retryCount + 1} failed. Retrying in ${delay / 1000} seconds.`,
          })
          setTimeout(() => fetchUserData(retryCount + 1, maxRetries), delay)
        } else {
          toast.dismiss('retry-toast')
          toast.error(`All ${maxRetries + 1} attempts failed. Giving up.`)
          setInitCode(undefined)
          setRootContext((prev) => ({
            ...prev,
            userData: undefined,
            cashierData: undefined,
          }))
          setIsLoading(false)
        }
      }
    }

    fetchUserData()
  }, [i18n, initCode, loadCashierFromCache, saveCashierToCache])

  useEffect(() => {
    // Aspetta che sia initCode che cashier siano pronti prima di caricare gli eventi
    if (!initCode || !isCashierReady) return

    const fetchUpcomingRounds = async () => {
      // Controlla cache prima di fare la chiamata
      if (isCacheValid(CACHE_KEYS.LAST_SOCCER_FETCH_TIME)) {
        return
      }

      const response = await apiRequest<{
        schedules: {
          schedule: UpcomingRound[]
        }
      }>('/football/20/', {
        method: 'GET',
      })

      if (!response?.schedules?.schedule?.length) return

      const allEvents = response.schedules.schedule[0].mag_event.slice(4) || [] //TODO: remove .slice(4) when the API is fixed

      const eventsByGroup: Record<number, UpcomingMatch[]> = {}

      allEvents.forEach((event) => {
        const groupId = event.eventIdentity?.groupId
        if (groupId !== undefined) {
          if (!eventsByGroup[groupId]) {
            eventsByGroup[groupId] = []
          }
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

      setRootContext((prev) => ({
        ...prev,
        upcomingRounds: rounds,
      }))

      // Salva in cache
      saveToCache(CACHE_KEYS.SOCCER_EVENTS, rounds)
      localStorage.setItem(
        CACHE_KEYS.LAST_SOCCER_FETCH_TIME,
        Date.now().toString(),
      )
    }

    const fetchUpcomingHorseEvents = async () => {
      // Controlla cache prima di fare la chiamata
      if (isCacheValid(CACHE_KEYS.LAST_HORSES_FETCH_TIME)) {
        return
      }

      try {
        const response = await pgVirtualFetch('/api/event/list')

        if (!response.ok) {
          throw new Error(`Failed to fetch horse events: ${response.status}`)
        }

        const horseEvents = await response.json()
        const horseChannel = horseEvents.channels?.[1]

        if (!horseChannel?.next_events) {
          debugLog('ERROR', 'Invalid horse channel data')
          return
        }

        const upcomingHorseEvents: UpcomingEvent[] =
          horseChannel.next_events.map(
            (event: any, index: number): UpcomingEvent => {
              const startTime = new Date(event.time)
              const [hours, minutes] = event.start_time.split(':')
              startTime.setHours(parseInt(hours, 10), parseInt(minutes, 10))

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
              const res = await pgVirtualFetch(
                `/api/event/results/${event.ext_pal_id}/${event.int_event_id}`,
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

        setRootContext((prev) => ({
          ...prev,
          upcomingEvents: [
            ...(prev.upcomingEvents?.filter(
              (event) => event.discipline !== Discipline.HORSES,
            ) || []),
            ...upcomingHorseEvents,
          ],
          eventResults: [
            ...(prev.eventResults?.filter(
              (e) => e.discipline !== Discipline.HORSES,
            ) || []),
            ...horseEventResults,
          ],
        }))

        // Salva in cache
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

    const fetchUpcomingDogEvents = async () => {
      // Controlla cache prima di fare la chiamata
      if (isCacheValid(CACHE_KEYS.LAST_DOGS_FETCH_TIME)) {
        return
      }

      try {
        const response = await pgVirtualFetch('/api/event/list')

        if (!response.ok) {
          throw new Error(`Failed to fetch dog events: ${response.status}`)
        }

        const dogEvents = await response.json()
        const dogChannel = dogEvents.channels?.[0]

        if (!dogChannel?.next_events) {
          debugLog('ERROR', 'Invalid dog channel data')
          return
        }

        const upcomingDogEvents: UpcomingEvent[] = dogChannel.next_events.map(
          (event: any, index: number): UpcomingEvent => {
            const startTime = new Date(event.time)
            const [hours, minutes] = event.start_time.split(':')
            startTime.setHours(parseInt(hours, 10), parseInt(minutes, 10))

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
              const res = await pgVirtualFetch(
                `/api/event/results/${event.ext_pal_id}/${event.int_event_id}`,
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

        setRootContext((prev) => ({
          ...prev,
          upcomingEvents: [
            ...(prev.upcomingEvents?.filter(
              (event) => event.discipline !== Discipline.DOGS,
            ) || []),
            ...upcomingDogEvents,
          ],
          eventResults: [
            ...(prev.eventResults?.filter(
              (e) => e.discipline !== Discipline.DOGS,
            ) || []),
            ...dogEventResults,
          ],
        }))

        // Salva in cache
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

    // Carica dati dalla cache all'avvio (se disponibili)
    loadCachedSoccerEvents()
    loadCachedRacingEvents()

    // Poi fa le chiamate API (che verranno saltate se cache è valida)
    fetchUpcomingRounds()
    fetchUpcomingHorseEvents()
    fetchUpcomingDogEvents()

    // Refresh automatico ogni 5 minuti
    const refreshInterval = setInterval(
      () => {
        fetchUpcomingRounds()
        fetchUpcomingHorseEvents()
        fetchUpcomingDogEvents()
      },
      3 * 60 * 1000, // 5 minuti
    )

    return () => {
      clearInterval(refreshInterval)
    }
  }, [
    initCode,
    isCashierReady,
    apiRequest,
    pgVirtualFetch,
    isCacheValid,
    saveToCache,
    loadCachedSoccerEvents,
    loadCachedRacingEvents,
    CACHE_KEYS.LAST_SOCCER_FETCH_TIME,
    CACHE_KEYS.LAST_HORSES_FETCH_TIME,
    CACHE_KEYS.LAST_DOGS_FETCH_TIME,
    CACHE_KEYS.SOCCER_EVENTS,
    CACHE_KEYS.HORSES_EVENTS,
    CACHE_KEYS.HORSES_RESULTS,
    CACHE_KEYS.DOGS_EVENTS,
    CACHE_KEYS.DOGS_RESULTS,
  ])

  // Cleanup periodico degli eventi passati
  useEffect(() => {
    const cleanupExpiredEvents = () => {
      const now = new Date()

      setRootContext((prev) => ({
        ...prev,
        upcomingEvents:
          prev.upcomingEvents?.filter((event) => new Date(event.time) > now) ||
          [],
      }))
    }

    // Esegui cleanup ogni 30 secondi
    const cleanupInterval = setInterval(cleanupExpiredEvents, 30000)

    // Cleanup iniziale
    cleanupExpiredEvents()

    return () => clearInterval(cleanupInterval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!initCode) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="text-lg">Missing init_code</p>
      </div>
    )
  }

  if (!rootContext.userData) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="text-lg">Unable to fetch user data</p>
      </div>
    )
  }

  return (
    <RootContext.Provider
      value={{
        ...rootContext,
        initCode,
      }}
    >
      {props.children}
    </RootContext.Provider>
  )
}
