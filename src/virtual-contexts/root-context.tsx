'use client'

import LoadingSpinner from '@/virtual-components/loading-spinner'
import {
  Discipline,
  EventResult,
  LiveRound,
  MatchResult,
  PreviousChannelResult,
  RoundStatistics,
  TeamRanking,
  Ticket,
  UpcomingEvent,
  UpcomingMatch,
  UpcomingRound,
  User,
} from '@/virtual-lib/types'
import {
  BASE_API_URL,
  fetchCashierInit,
  fetchSoccerInit,
  getOperatorFromUrl,
  PGVIRTUAL_API_URL,
  withDerivedDoppiaChance,
  SOCCER_ROUNDS_TO_SHOW,
} from '@/virtual-lib/utils'
import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const DEBUG_ENABLED = true
const debugLog = (section: string, message: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[${section}] ${message}`, data || '')
  }
}

// Aggiornamento delle corse: abbastanza frequente da risincronizzare il conto
// alla rovescia con `since` e far comparire subito le nuove corse
const RACING_REFRESH_MS = 45 * 1000

// Canale di una disciplina riconosciuto da game_id o, in mancanza, dal nome
// (stesse regole della cassa: i cani a 8 sono un'altra disciplina)
function findRacingChannel(
  channels: any[],
  discipline: 'DOGS' | 'DOGS8' | 'HORSES',
) {
  const matches = (value: unknown) => {
    if (typeof value !== 'string') return false
    if (discipline === 'HORSES') return /horse|cavall/i.test(value)
    const isDog = /dog|grey|levrier|cani/i.test(value)
    return discipline === 'DOGS8'
      ? isDog && /8/.test(value)
      : isDog && !/8/.test(value)
  }
  return (
    channels.find((channel) => matches(channel?.game_id)) ??
    channels.find((channel) => !channel?.game_id && matches(channel?.name))
  )
}

// Orario di partenza: prima `since` (secondi mancanti, calcolati dal server:
// non dipende dall'orologio del dispositivo), poi start_time "HH:mm" sulla
// data di `time`, infine `time`
function resolveEventStartTime(event: any, fetchedAt: number): Date {
  const since = Number(event?.since)
  if (event?.since !== undefined && event?.since !== null && since > 0) {
    return new Date(fetchedAt + since * 1000)
  }
  const startTime = new Date(event?.time ?? fetchedAt)
  if (isNaN(startTime.getTime())) startTime.setTime(fetchedAt)
  if (typeof event?.start_time === 'string') {
    const [hours, minutes] = event.start_time.split(':')
    startTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
  }
  return startTime
}

// Dati scaricati da meno di maxAge (per non ripetere la chiamata)
function isRecentFetch(key: string, maxAge: number): boolean {
  const lastFetch = Number(localStorage.getItem(key))
  return lastFetch > 0 && Date.now() - lastFetch < maxAge
}

// Ultimi risultati del canale (prev_events), dal più recente
function sortPreviousResults(prevEvents: unknown): PreviousChannelResult {
  if (!Array.isArray(prevEvents)) return []
  return prevEvents
    .filter((event) => Array.isArray(event?.arrival))
    .sort(
      (a, b) =>
        (parseInt(b.ext_event_id) || 0) - (parseInt(a.ext_event_id) || 0),
    )
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
  /** ultimi risultati delle corse, da prev_events di /api/event/list */
  previousResults?: Partial<Record<Discipline, PreviousChannelResult>>
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
  // Niente dati finti: il riquadro live, le percentuali e la classifica si
  // riempiono con quelli veri del feed (classifica dal hub a fine giornata,
  // percentuali dalle quote della partita).
  liveRound: undefined,
  roundStatistics: undefined,
  teamRankings: undefined,
  betsHistory: [],
  matchResult: undefined,
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
    DOGS8_EVENTS: 'virtual_dogs8_events_cache',
    HORSES_EVENTS: 'virtual_horses_events_cache',
    SOCCER_EVENTS: 'virtual_soccer_events_cache',
    DOGS_PREV_RESULTS: 'virtual_dogs_prev_results_cache',
    DOGS8_PREV_RESULTS: 'virtual_dogs8_prev_results_cache',
    HORSES_PREV_RESULTS: 'virtual_horses_prev_results_cache',
    SOCCER_RESULTS: 'virtual_soccer_results_cache',
    LAST_DOGS_FETCH_TIME: 'virtual_dogs_last_fetch',
    LAST_DOGS8_FETCH_TIME: 'virtual_dogs8_last_fetch',
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
    const cachedDogsResults = loadFromCache(CACHE_KEYS.DOGS_PREV_RESULTS)
    const cachedHorsesResults = loadFromCache(CACHE_KEYS.HORSES_PREV_RESULTS)
    const cachedDogs8Events = loadFromCache(CACHE_KEYS.DOGS8_EVENTS)
    const cachedDogs8Results = loadFromCache(CACHE_KEYS.DOGS8_PREV_RESULTS)

    if (
      cachedDogsEvents ||
      cachedHorsesEvents ||
      cachedDogs8Events ||
      cachedDogsResults ||
      cachedHorsesResults ||
      cachedDogs8Results
    ) {
      setRootContext((prev) => ({
        ...prev,
        upcomingEvents: [
          ...(prev.upcomingEvents?.filter(
            (event) =>
              event.discipline !== Discipline.DOGS &&
              event.discipline !== Discipline.DOGS8 &&
              event.discipline !== Discipline.HORSES,
          ) || []),
          ...(cachedDogsEvents || []),
          ...(cachedDogs8Events || []),
          ...(cachedHorsesEvents || []),
        ],
        previousResults: {
          ...prev.previousResults,
          ...(cachedDogsResults
            ? { [Discipline.DOGS]: sortPreviousResults(cachedDogsResults) }
            : {}),
          ...(cachedHorsesResults
            ? { [Discipline.HORSES]: sortPreviousResults(cachedHorsesResults) }
            : {}),
          ...(cachedDogs8Results
            ? { [Discipline.DOGS8]: sortPreviousResults(cachedDogs8Results) }
            : {}),
        },
      }))

      return true
    }

    return false
  }, [
    loadFromCache,
    CACHE_KEYS.DOGS_EVENTS,
    CACHE_KEYS.HORSES_EVENTS,
    CACHE_KEYS.DOGS_PREV_RESULTS,
    CACHE_KEYS.HORSES_PREV_RESULTS,
    CACHE_KEYS.DOGS8_EVENTS,
    CACHE_KEYS.DOGS8_PREV_RESULTS,
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
      return fetch(`${PGVIRTUAL_API_URL}${endpoint}`, {
        ...options,
        headers: {
          accept: 'application/json',
          'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
          authorization: `Bearer ${initCode}`,
          operator: getOperatorFromUrl('sc'),
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

      // Calcio: stesso feed della cassa (init + next cashier/soccer PGVirtual).
      // Sostituisce il vecchio proxy /football/20/ (403/CORS) e i relativi hack.
      const response = await fetchSoccerInit().catch((error: unknown) => {
        debugLog('SOCCER', 'fetchSoccerInit failed', error)
        return null
      })

      if (!response?.schedules?.schedule?.length) return

      const scheduleArray = response.schedules.schedule as UpcomingRound[]
      const firstSchedule = scheduleArray[0]
      // Il feed distribuisce le giornate su più schedule/groupId: raccogli tutto.
      const allEvents = scheduleArray.flatMap((s) => s.mag_event || [])

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

      const rounds: UpcomingRound[] = Object.entries(eventsByGroup)
        .map(([groupId, events]) => {
          const firstEvent = events[0]

          return {
            ...firstSchedule,
            scheduleId: Number(groupId),
            scheduleName:
              firstEvent.eventIdentity.scheduleType ?? firstSchedule.scheduleName,
            mag_event: events.map((event) =>
              withDerivedDoppiaChance({
                ...event,
                startTime: new Date(
                  event.eventIdentity.startTime,
                ).toISOString(),
              }),
            ),
          }
        })
        .sort(
          (a, b) =>
            new Date(a.mag_event[0].startTime).getTime() -
            new Date(b.mag_event[0].startTime).getTime(),
        )
        .slice(0, SOCCER_ROUNDS_TO_SHOW)

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

    // Corse (cani e cavalli): una sola chiamata a /api/event/list per entrambe
    // le discipline. I canali si riconoscono da game_id (come la cassa); la
    // posizione nell'array resta solo come riserva.
    const fetchRacingEvents = async (force = false) => {
      if (
        !force &&
        isRecentFetch(CACHE_KEYS.LAST_DOGS_FETCH_TIME, RACING_REFRESH_MS) &&
        isRecentFetch(CACHE_KEYS.LAST_DOGS8_FETCH_TIME, RACING_REFRESH_MS) &&
        isRecentFetch(CACHE_KEYS.LAST_HORSES_FETCH_TIME, RACING_REFRESH_MS)
      ) {
        return
      }

      try {
        const response = await pgVirtualFetch('/api/event/list')
        if (!response.ok) {
          throw new Error(`Failed to fetch racing events: ${response.status}`)
        }
        const fetchedAt = Date.now()
        const data = await response.json()
        const channels: any[] = Array.isArray(data?.channels)
          ? data.channels
          : []

        const disciplines = [
          {
            discipline: Discipline.DOGS,
            channel: findRacingChannel(channels, 'DOGS') ?? channels[0],
            name: 'Dog Race',
            eventsKey: CACHE_KEYS.DOGS_EVENTS,
            resultsKey: CACHE_KEYS.DOGS_PREV_RESULTS,
            fetchKey: CACHE_KEYS.LAST_DOGS_FETCH_TIME,
          },
          {
            discipline: Discipline.HORSES,
            channel: findRacingChannel(channels, 'HORSES') ?? channels[1],
            name: 'Horse Race',
            eventsKey: CACHE_KEYS.HORSES_EVENTS,
            resultsKey: CACHE_KEYS.HORSES_PREV_RESULTS,
            fetchKey: CACHE_KEYS.LAST_HORSES_FETCH_TIME,
          },
          {
            // cani a 8: solo da game_id/nome (nessuna posizione di riserva)
            discipline: Discipline.DOGS8,
            channel: findRacingChannel(channels, 'DOGS8'),
            name: 'Dog Race 8',
            eventsKey: CACHE_KEYS.DOGS8_EVENTS,
            resultsKey: CACHE_KEYS.DOGS8_PREV_RESULTS,
            fetchKey: CACHE_KEYS.LAST_DOGS8_FETCH_TIME,
          },
        ]

        for (const item of disciplines) {
          const channel = item.channel
          if (!channel?.next_events) {
            debugLog('ERROR', `Invalid ${item.discipline} channel data`)
            continue
          }

          const events: UpcomingEvent[] = channel.next_events.map(
            (event: any, index: number): UpcomingEvent => ({
              id: parseInt(event.int_event_id),
              extId: event.ext_pal_id,
              duration: channel.duration?.[index],
              discipline: item.discipline,
              name: item.name,
              startTime: event.start_time,
              time: resolveEventStartTime(event, fetchedAt),
            }),
          )

          const previous = sortPreviousResults(channel.prev_events)

          setRootContext((prev) => ({
            ...prev,
            upcomingEvents: [
              ...(prev.upcomingEvents?.filter(
                (event) => event.discipline !== item.discipline,
              ) || []),
              ...events,
            ],
            previousResults: {
              ...prev.previousResults,
              [item.discipline]: previous,
            },
          }))

          saveToCache(item.eventsKey, events)
          saveToCache(item.resultsKey, previous)
          localStorage.setItem(item.fetchKey, fetchedAt.toString())
        }
      } catch (error) {
        console.error('Racing events fetch error:', error)
      }
    }

    // Carica dati dalla cache all'avvio (se disponibili)
    loadCachedSoccerEvents()
    loadCachedRacingEvents()

    // Poi fa le chiamate API (saltate se i dati sono ancora freschi)
    fetchUpcomingRounds()
    fetchRacingEvents()

    // Corse: aggiornamento frequente, così l'orario di partenza resta
    // allineato a `since` del server e le nuove corse compaiono subito
    const racingInterval = setInterval(
      () => fetchRacingEvents(true),
      RACING_REFRESH_MS,
    )
    // Calcio: ogni 3 minuti (saltato se la cache ha meno di 5 minuti)
    const soccerInterval = setInterval(fetchUpcomingRounds, 3 * 60 * 1000)

    return () => {
      clearInterval(racingInterval)
      clearInterval(soccerInterval)
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
    CACHE_KEYS.HORSES_PREV_RESULTS,
    CACHE_KEYS.DOGS_EVENTS,
    CACHE_KEYS.DOGS_PREV_RESULTS,
    CACHE_KEYS.LAST_DOGS8_FETCH_TIME,
    CACHE_KEYS.DOGS8_EVENTS,
    CACHE_KEYS.DOGS8_PREV_RESULTS,
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
