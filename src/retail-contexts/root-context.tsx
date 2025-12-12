'use client'

import LoadingSpinner from '@/retail-components/loading-spinner'
import {
  Discipline,
  EventResult,
  TeamRanking,
  Ticket,
  UpcomingEvent,
  UpcomingMatch,
  UpcomingRound,
  User,
} from '@/retail-lib/types'
import {
  BASE_API_URL,
  createPGVirtualAPICall,
  SOCCER_API_URL,
  fetchCashierInit,
  parseAPIDate,
} from '@/retail-lib/utils'
import { t } from 'i18next'
import { createContext, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export type RootContextType = {
  initCode?: string
  userData?: User
  cashierData?: any
  apiRequest?: <T>(
    input: string | URL | globalThis.Request,
    init?: RequestInit,
    params?: Record<string, string>,
  ) => Promise<T>
  upcomingRounds?: UpcomingRound[]
  upcomingEvents?: UpcomingEvent[]
  searchEventResults?: EventResult[]
  setSearchEventResults: (searchEventResults?: EventResult[]) => void
  betsHistory: Ticket[]
  teamRankings?: TeamRanking[]
  eventResults?: EventResult[]
  isLoadingEvents: boolean
  getCurrencySymbol?: () => string
  getCurrencyCode?: () => string
  getMinStakeIncrement?: () => number
  getStakeButtons?: () => number[]
  getMinStake?: () => number
  getMinBet?: () => number
  getMaxWin?: () => number
  getTimezone?: () => string
  getChannels?: () => any[]
  getTrackName?: (channel?: number) => string
  getTranslation?: (key: string, fallback?: string) => string
  activeDrawerId?: string
  setActiveDrawer: (drawerId?: string) => void
}

const defaultRootContext: RootContextType = {
  setSearchEventResults: () => {},
  betsHistory: [],
  setActiveDrawer: () => {},
  eventResults: [],
  isLoadingEvents: false,
  getCurrencySymbol: () => '$',
  getCurrencyCode: () => 'USD',
  getChannels: () => [],
  getTrackName: (channel?: number) => `Track ${channel || 6}`,
  getTranslation: (key: string, fallback?: string) => fallback || key,
  teamRankings: [
    {
      position: 1,
      team: 'LEE',
      played: 17,
      wins: 14,
      draws: 2,
      losses: 1,
      points: 44,
      goalsFor: 42,
      goalsAgainst: 12,
      goalDifference: 30,
      last8: ['W', 'W', 'W', 'W', 'W', 'W', 'D', 'W'],
    },
    {
      position: 2,
      team: 'BUR',
      played: 17,
      wins: 11,
      draws: 4,
      losses: 2,
      points: 37,
      goalsFor: 35,
      goalsAgainst: 18,
      goalDifference: 17,
      last8: ['W', 'W', 'D', 'W', 'W', 'W', 'D', 'W'],
    },
    {
      position: 3,
      team: 'WAT',
      played: 17,
      wins: 11,
      draws: 1,
      losses: 5,
      points: 34,
      goalsFor: 32,
      goalsAgainst: 21,
      goalDifference: 11,
      last8: ['W', 'L', 'W', 'W', 'L', 'W', 'W', 'W'],
    },
    {
      position: 4,
      team: 'NOR',
      played: 17,
      wins: 10,
      draws: 3,
      losses: 4,
      points: 33,
      goalsFor: 28,
      goalsAgainst: 19,
      goalDifference: 9,
      last8: ['W', 'D', 'W', 'L', 'W', 'W', 'D', 'W'],
    },
    {
      position: 5,
      team: 'BRE',
      played: 17,
      wins: 9,
      draws: 4,
      losses: 4,
      points: 31,
      goalsFor: 26,
      goalsAgainst: 20,
      goalDifference: 6,
      last8: ['W', 'D', 'L', 'W', 'D', 'W', 'W', 'D'],
    },
    {
      position: 6,
      team: 'WOL',
      played: 17,
      wins: 8,
      draws: 6,
      losses: 3,
      points: 30,
      goalsFor: 24,
      goalsAgainst: 17,
      goalDifference: 7,
      last8: ['D', 'W', 'D', 'W', 'D', 'D', 'W', 'W'],
    },
    {
      position: 7,
      team: 'MCI',
      played: 17,
      wins: 8,
      draws: 5,
      losses: 4,
      points: 29,
      goalsFor: 31,
      goalsAgainst: 22,
      goalDifference: 9,
      last8: ['W', 'D', 'L', 'W', 'D', 'W', 'D', 'W'],
    },
    {
      position: 8,
      team: 'MUN',
      played: 17,
      wins: 8,
      draws: 4,
      losses: 5,
      points: 28,
      goalsFor: 23,
      goalsAgainst: 24,
      goalDifference: -1,
      last8: ['L', 'W', 'W', 'D', 'L', 'W', 'W', 'D'],
    },
    {
      position: 9,
      team: 'LIV',
      played: 17,
      wins: 7,
      draws: 6,
      losses: 4,
      points: 27,
      goalsFor: 25,
      goalsAgainst: 22,
      goalDifference: 3,
      last8: ['D', 'W', 'D', 'L', 'D', 'W', 'D', 'W'],
    },
    {
      position: 10,
      team: 'CHE',
      played: 17,
      wins: 7,
      draws: 5,
      losses: 5,
      points: 26,
      goalsFor: 22,
      goalsAgainst: 23,
      goalDifference: -1,
      last8: ['W', 'L', 'D', 'W', 'L', 'D', 'W', 'D'],
    },
    {
      position: 11,
      team: 'ARS',
      played: 17,
      wins: 7,
      draws: 4,
      losses: 6,
      points: 25,
      goalsFor: 21,
      goalsAgainst: 25,
      goalDifference: -4,
      last8: ['L', 'W', 'D', 'L', 'W', 'W', 'D', 'L'],
    },
    {
      position: 12,
      team: 'MCU',
      played: 17,
      wins: 6,
      draws: 6,
      losses: 5,
      points: 24,
      goalsFor: 20,
      goalsAgainst: 22,
      goalDifference: -2,
      last8: ['D', 'L', 'W', 'D', 'D', 'W', 'L', 'D'],
    },
    {
      position: 13,
      team: 'CIA',
      played: 17,
      wins: 6,
      draws: 5,
      losses: 6,
      points: 23,
      goalsFor: 19,
      goalsAgainst: 24,
      goalDifference: -5,
      last8: ['L', 'D', 'W', 'L', 'D', 'L', 'W', 'D'],
    },
    {
      position: 14,
      team: 'GBI',
      played: 17,
      wins: 5,
      draws: 7,
      losses: 5,
      points: 22,
      goalsFor: 18,
      goalsAgainst: 23,
      goalDifference: -5,
      last8: ['D', 'D', 'L', 'D', 'W', 'D', 'L', 'D'],
    },
    {
      position: 15,
      team: 'NSC',
      played: 17,
      wins: 5,
      draws: 6,
      losses: 6,
      points: 21,
      goalsFor: 17,
      goalsAgainst: 25,
      goalDifference: -8,
      last8: ['L', 'D', 'W', 'L', 'D', 'L', 'D', 'W'],
    },
    {
      position: 16,
      team: 'FBI',
      played: 17,
      wins: 4,
      draws: 8,
      losses: 5,
      points: 20,
      goalsFor: 16,
      goalsAgainst: 24,
      goalDifference: -8,
      last8: ['D', 'L', 'D', 'D', 'L', 'D', 'D', 'D'],
    },
    {
      position: 17,
      team: 'NAP',
      played: 17,
      wins: 4,
      draws: 6,
      losses: 7,
      points: 18,
      goalsFor: 15,
      goalsAgainst: 27,
      goalDifference: -12,
      last8: ['L', 'D', 'L', 'W', 'L', 'D', 'L', 'D'],
    },
    {
      position: 18,
      team: 'LOT',
      played: 17,
      wins: 3,
      draws: 7,
      losses: 7,
      points: 16,
      goalsFor: 14,
      goalsAgainst: 28,
      goalDifference: -14,
      last8: ['L', 'D', 'L', 'D', 'L', 'W', 'D', 'L'],
    },
    {
      position: 19,
      team: 'ARC',
      played: 17,
      wins: 2,
      draws: 6,
      losses: 9,
      points: 12,
      goalsFor: 12,
      goalsAgainst: 32,
      goalDifference: -20,
      last8: ['L', 'L', 'D', 'L', 'L', 'D', 'W', 'L'],
    },
    {
      position: 20,
      team: 'UDO',
      played: 17,
      wins: 1,
      draws: 4,
      losses: 12,
      points: 7,
      goalsFor: 9,
      goalsAgainst: 38,
      goalDifference: -29,
      last8: ['L', 'L', 'L', 'D', 'L', 'L', 'L', 'W'],
    },
  ],
}

export const RootContext = createContext<RootContextType>(defaultRootContext)

function getAreaFromUrl(): Discipline[] {
  if (typeof window === 'undefined') return []

  if (window.location.pathname.includes('dogs-horses')) {
    return [Discipline.DOGS, Discipline.HORSES]
  }
  if (window.location.pathname.includes('dogs')) {
    return [Discipline.DOGS]
  }
  if (window.location.pathname.includes('horses')) {
    return [Discipline.HORSES]
  }
  if (window.location.pathname.includes('calcio')) {
    return [Discipline.SOCCER]
  }
  return []
}

export default function RootContextProvider(props: {
  children: React.ReactNode
}) {
  const [initCode, setInitCode] = useState<string | undefined>(undefined)
  const [rootContext, setRootContext] =
    useState<RootContextType>(defaultRootContext)
  const { i18n } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [isCashierReady, setIsCashierReady] = useState(false)
  const [activeDrawerId, setActiveDrawerId] = useState<string | undefined>(
    undefined,
  )

  // Aggiorna la lingua quando userData cambia
  useEffect(() => {
    if (rootContext.userData?.lang) {
      const langCode = rootContext.userData.lang
      if (i18n.language !== langCode) {
        console.log(
          `🌐 Changing language from "${i18n.language}" to "${langCode}"`,
        )
        i18n.changeLanguage(langCode).then(() => {
          console.log(`✅ Language changed successfully to "${langCode}"`)
        })
      }
    }
  }, [rootContext.userData?.lang, i18n])

  // Funzione per gestire l'apertura di un drawer numerico
  const setActiveDrawer = useCallback((drawerId?: string) => {
    setActiveDrawerId(drawerId)
  }, [])

  // Cache keys for localStorage
  const CACHE_KEYS = {
    DOGS_EVENTS: 'dogs_events_cache',
    HORSES_EVENTS: 'horses_events_cache',
    SOCCER_EVENTS: 'soccer_events_cache',
    DOGS_RESULTS: 'dogs_results_cache',
    HORSES_RESULTS: 'horses_results_cache',
    SOCCER_RESULTS: 'soccer_results_cache',
    LAST_RACING_FETCH_TIME: 'racing_events_last_fetch',
    LAST_SOCCER_FETCH_TIME: 'soccer_events_last_fetch',
    CASHIER_DATA: 'cashier_data_cache',
    LAST_CASHIER_FETCH_TIME: 'cashier_last_fetch',
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

    // Prendi il timezone dalla cache o usa fallback
    const cachedTimezone =
      localStorage.getItem('cashier_timezone') || 'Europe/Rome'

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
            (event) => event.discipline === Discipline.SOCCER,
          ) || []),
          ...(cachedDogsEvents || []),
          ...(cachedHorsesEvents || []),
        ],
        eventResults: [
          ...(prev.eventResults?.filter(
            (result) => result.discipline === Discipline.SOCCER,
          ) || []),
          ...((cachedDogsResults as EventResult[])?.map((r) => ({
            ...r,
            startTime: parseAPIDate(r.startTime.toString(), cachedTimezone),
          })) || []),
          ...((cachedHorsesResults as EventResult[])?.map((r) => ({
            ...r,
            startTime: parseAPIDate(r.startTime.toString(), cachedTimezone),
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
    const cachedSoccerResults = loadFromCache(CACHE_KEYS.SOCCER_RESULTS)

    // Prendi il timezone dalla cache o usa fallback
    const cachedTimezone =
      localStorage.getItem('cashier_timezone') || 'Europe/Rome'

    if (cachedSoccerEvents || cachedSoccerResults) {
      setRootContext((prev) => ({
        ...prev,
        upcomingEvents: [
          ...(prev.upcomingEvents?.filter(
            (event) => event.discipline === Discipline.SOCCER,
          ) || []),
          ...(cachedSoccerEvents || []),
        ],
        eventResults: [
          ...(prev.eventResults?.filter(
            (result) => result.discipline === Discipline.SOCCER,
          ) || []),
          ...((cachedSoccerResults as EventResult[])?.map((r) => ({
            ...r,
            startTime: parseAPIDate(r.startTime.toString(), cachedTimezone),
          })) || []),
        ],
      }))

      return true
    }

    return false
  }, [loadFromCache, CACHE_KEYS.SOCCER_EVENTS, CACHE_KEYS.SOCCER_RESULTS])

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

  const setSearchEventResults = useCallback(
    (searchEventResults?: EventResult[]) => {
      setRootContext((prev) => ({
        ...prev,
        searchEventResults,
      }))
    },
    [],
  )

  useEffect(() => {
    setRootContext((prev) => ({
      ...prev,
      setSearchEventResults,
    }))
  }, [setSearchEventResults])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const initCode = params.get('init_code') || undefined

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

    const fetchUserData = async (retryCount = 0, maxRetries = 3) => {
      try {
        const cashierData = await fetchCashierInit(initCode)

        if (cashierData?.ret_code === 1024) {
          // Estrai i dati "utente" dai configs e intl
          const userData = {
            status: '1024',
            description: cashierData.description,
            playerId: `${cashierData.configs?.user_type}-${cashierData.configs?.terminals?.[0] || 'unknown'}`,
            currency: cashierData.intl?.currency || 'EUR',
            lang: cashierData.dictInfo?.lang || 'it',
            level: 1,
            group: [cashierData.configs?.ui_type || 'retail'],
          } as UserApiResponse

          // Crea funzioni helper per accedere ai dati cashier
          const getCurrencyCode = () => cashierData.intl?.currency || 'EUR'

          const getCurrencySymbol = () => {
            // Usa sempre il mapping basato sul currency code da intl.currency
            const currencyCode = cashierData.intl?.currency || 'EUR'
            const currencyMap: Record<string, string> = {
              USD: '$',
              EUR: '€',
              GBP: '£',
              JPY: '¥',
              CHF: 'CHF',
              CAD: 'C$',
              AUD: 'A$',
              COP: '$', // Peso Colombiano
            }
            return currencyMap[currencyCode] || '€'
          }

          const getChannels = () => cashierData.channels || []

          const getTrackName = (channel?: number) => {
            const channels = cashierData.channels || []

            if (channel !== undefined && channels[channel]) {
              const trackName =
                channels[channel].track_name || `${t('track')} ${channel + 1}`
              return trackName
            }
            // Fallback per il channel di default (6 diventa indice 5)
            const defaultChannel = channel ? channel - 1 : 5
            const fallbackTrackName =
              channels[defaultChannel]?.track_name ||
              `${t('track')} ${defaultChannel + 1}`
            return fallbackTrackName
          }

          const getTranslation = (key: string, fallback?: string) => {
            const keys = key.split('.')
            let value: any = cashierData.dict
            for (const k of keys) {
              value = value?.[k]
              if (value === undefined) break
            }
            return typeof value === 'string' ? value : fallback || key
          }

          const getMinStakeIncrement = () => {
            // Prende il min_stake_increment_step dal cashier data
            const minStakeIncrementStep =
              cashierData.intl?.min_stake_increment_step

            if (typeof minStakeIncrementStep === 'string') {
              const parsed = parseFloat(minStakeIncrementStep)
              if (!isNaN(parsed) && parsed > 0) {
                return parsed
              }
            }

            if (
              typeof minStakeIncrementStep === 'number' &&
              minStakeIncrementStep > 0
            ) {
              return minStakeIncrementStep
            }

            // Fallback
            return 50
          }

          const getStakeButtons = (): number[] => {
            // Prende i stake_buttons dal cashier data
            const stakeButtons = cashierData.intl?.stake_buttons

            if (Array.isArray(stakeButtons) && stakeButtons.length > 0) {
              return stakeButtons
            }

            // Fallback ai valori di default
            return [1000, 2000, 3000, 5000, 10000]
          }

          const getMinStake = (): number => {
            // Prende il min_stake dal cashier data
            const minStake = cashierData.intl?.min_stake

            if (typeof minStake === 'string') {
              const parsed = parseFloat(minStake)
              if (!isNaN(parsed) && parsed > 0) {
                return parsed
              }
            }

            if (typeof minStake === 'number' && minStake > 0) {
              return minStake
            }

            // Fallback
            return 50
          }

          const getMinBet = (): number => {
            // Prende il min_bet dal cashier data
            const minBet = cashierData.intl?.min_bet

            if (typeof minBet === 'string') {
              const parsed = parseFloat(minBet)
              if (!isNaN(parsed) && parsed >= 0) {
                return parsed
              }
            }

            if (typeof minBet === 'number' && minBet >= 0) {
              return minBet
            }

            // Fallback
            return 0
          }

          const getMaxWin = (): number => {
            // Prende il max_win dal cashier data
            const maxWin = cashierData.intl?.max_win

            if (typeof maxWin === 'string') {
              const parsed = parseFloat(maxWin)
              if (!isNaN(parsed) && parsed > 0) {
                return parsed
              }
            }

            if (typeof maxWin === 'number' && maxWin > 0) {
              return maxWin
            }

            // Fallback a 1 miliardo
            return 1000000000
          }

          const getTimezone = (): string => {
            // Prende il timezone dal cashier data
            return cashierData.intl?.timezone || 'Europe/Rome'
          }

          // Salva il timezone in localStorage per uso nelle funzioni cache
          localStorage.setItem(
            'cashier_timezone',
            cashierData.intl?.timezone || 'Europe/Rome',
          )

          const contextData = {
            userData,
            cashierData,
            getCurrencySymbol,
            getCurrencyCode,
            getMinStakeIncrement,
            getStakeButtons,
            getMinStake,
            getMinBet,
            getMaxWin,
            getTimezone,
            getChannels,
            getTrackName,
            getTranslation,
          }

          setRootContext((prev) => ({
            ...prev,
            ...contextData,
          }))

          // Salva i dati cashier in cache
          saveCashierToCache(initCode, cashierData, contextData)

          toast.success('Cashier data initialized successfully!')
          setIsLoading(false)
          setIsCashierReady(true)
        } else {
          console.error('Cashier API returned error:', cashierData)
          throw new Error(
            `Cashier API error: ${cashierData?.message || 'Unknown error'}`,
          )
        }
      } catch (error) {
        console.error('Cashier API error:', error)

        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000
          toast.loading('Retrying cashier API...', {
            id: 'retry-toast',
            description: `Attempt ${retryCount + 1} failed. Retrying in ${delay / 1000} seconds.`,
          })
          setTimeout(() => fetchUserData(retryCount + 1, maxRetries), delay)
        } else {
          toast.dismiss('retry-toast')

          // Fallback: usa dati mockup se l'API cashier fallisce
          console.warn('Cashier API failed, using fallback data')
          const fallbackUserData = {
            status: '1024',
            description: 'Fallback data - API cashier failed',
            playerId: `fallback-${initCode?.slice(-6)}`,
            currency: 'EUR',
            lang: 'it',
            level: 1,
            group: ['retail'],
          } as UserApiResponse

          const fallbackContextData = {
            userData: fallbackUserData,
            cashierData: null,
            getCurrencySymbol: () => '$',
            getCurrencyCode: () => 'USD',
            getStakeButtons: () => [1000, 2000, 3000, 5000, 10000],
            getMinStake: () => 50,
            getMinBet: () => 0,
            getMaxWin: () => 1000000000,
            getChannels: () => [],
            getTrackName: (channel?: number) => `Track ${channel || 6}`,
            getTranslation: (key: string, fallback?: string) => fallback || key,
          }

          setRootContext((prev) => ({
            ...prev,
            ...fallbackContextData,
          }))

          // Salva anche il fallback in cache (per evitare retry continui)
          saveCashierToCache(initCode, null, fallbackContextData)

          toast.warning(
            'Using fallback configuration - cashier API unavailable',
          )
          setIsLoading(false)
          setIsCashierReady(true)
        }
      }
    }

    fetchUserData()
  }, [initCode, loadCashierFromCache, saveCashierToCache])

  useEffect(() => {
    // Aspetta che sia initCode che cashier siano pronti prima di caricare gli eventi
    if (!initCode || !isCashierReady) return

    const fetchUpcomingRounds = async () => {
      if (isCacheValid(CACHE_KEYS.LAST_SOCCER_FETCH_TIME)) {
        return
      }

      const fetchResponse = await fetch(
        `${SOCCER_API_URL}?t=${new Date().getTime()}`,
      )
      if (!fetchResponse.ok) return
      const response = (await fetchResponse.json()) as {
        schedules: { schedule: UpcomingRound[] }
      }
      if (!response.schedules.schedule.length) return

      const allEvents = response.schedules.schedule[0].mag_event || []

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

      const roundResults: EventResult[] = Array.from(
        { length: 10 },
        (_, index) => {
          const date = new Date(rounds[0].mag_event[0].startTime)
          date.setMinutes(date.getMinutes() - (index + 1) * 3)

          return {
            id: 10 - index,
            name: ` Trident round ${10 - index}`,
            startTime: date,
            duration: 3,
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
      const apiTimezone = rootContext.getTimezone?.() || 'Europe/Rome'
      const upcomingSoccerEvents = rounds.map((round) => {
        const eventDate = parseAPIDate(
          round.mag_event[0].startTime,
          apiTimezone,
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
          ext_pal_id:
            round.mag_event[0].eventIdentity?.parentGroupIdSpecified || '',
          data: round,
        }
      })
      setRootContext((prev) => ({
        ...prev,
        upcomingEvents: [
          ...(prev.upcomingEvents?.filter(
            (event) => event.discipline !== Discipline.SOCCER,
          ) || []),
          ...upcomingSoccerEvents,
        ],
        eventResults: [
          ...(prev.eventResults || []).filter(
            (result) => result.discipline !== Discipline.SOCCER,
          ),
          ...roundResults,
        ],
        setSearchEventResults: setSearchEventResults,
      }))
      saveToCache(CACHE_KEYS.SOCCER_EVENTS, upcomingSoccerEvents)
      saveToCache(CACHE_KEYS.SOCCER_RESULTS, roundResults)
      localStorage.setItem(
        CACHE_KEYS.LAST_SOCCER_FETCH_TIME,
        Date.now().toString(),
      )
    }

    const fetchRacingEvents = async () => {
      if (isCacheValid(CACHE_KEYS.LAST_RACING_FETCH_TIME)) {
        return
      }

      try {
        const response = await createPGVirtualAPICall(
          '/api/event/list',
          initCode,
        )

        if (!response.ok) {
          throw new Error('Failed to fetch racing events')
        }

        const racingEvents = await response.json()

        const dogChannel = racingEvents.channels?.[0]
        const upcomingDogEvents: UpcomingEvent[] =
          dogChannel?.next_events?.map(
            (event: any, index: number): UpcomingEvent => {
              const apiTimezone = rootContext.getTimezone?.() || 'Europe/Rome'
              const startTime = parseAPIDate(event.time, apiTimezone)
              return {
                id: parseInt(event.int_event_id),
                extId: event.ext_pal_id,
                duration: racingEvents.channels[0]?.duration?.[index] || 3,
                name: 'Dog',
                startTime: event.start_time,
                time: startTime,
                discipline: Discipline.DOGS,
              }
            },
          ) || []

        const horseChannel = racingEvents.channels?.[1]
        const upcomingHorseEvents: UpcomingEvent[] =
          horseChannel?.next_events?.map(
            (event: any, index: number): UpcomingEvent => {
              const apiTimezone = rootContext.getTimezone?.() || 'Europe/Rome'
              const startTime = parseAPIDate(event.time, apiTimezone)
              return {
                id: parseInt(event.int_event_id),
                extId: event.ext_pal_id,
                duration: racingEvents.channels[1]?.duration?.[index] || 3,
                name: 'Horse',
                startTime: event.start_time,
                time: startTime,
                discipline: Discipline.HORSES,
              }
            },
          ) || []

        const dogEventResults: EventResult[] = dogChannel?.prev_events
          ? await Promise.all(
              dogChannel.prev_events.map(async (event: any) => {
                // Fetch dettagli completi come nel search-event-results
                let detailedResult = null
                try {
                  const response = await createPGVirtualAPICall(
                    `/api/event/results/${event.ext_pal_id}/${event.int_event_id}`,
                    initCode,
                  )

                  if (response.ok) {
                    detailedResult = await response.json()
                  }
                } catch (error) {
                  console.log('Failed to fetch dog details:', error)
                }

                const apiTimezone = rootContext.getTimezone?.() || 'Europe/Rome'
                return {
                  id: event.int_event_id,
                  extId: event.ext_pal_id,
                  name: `Dog Race ${event.int_event_id}`,
                  startTime: parseAPIDate(event.time, apiTimezone),
                  time: event.time,
                  discipline: Discipline.DOGS,
                  result: detailedResult || {
                    podium:
                      event.arrival?.map((dog: any, index: number) => ({
                        name: dog.name,
                        number: dog.number,
                        position: index + 1,
                      })) || [],
                    odds: {},
                  },
                }
              }),
            )
          : []

        const horseEventResults: EventResult[] = horseChannel?.prev_events
          ? await Promise.all(
              horseChannel.prev_events.map(async (event: any) => {
                // Fetch dettagli completi come nel search-event-results
                let detailedResult = null
                try {
                  const response = await createPGVirtualAPICall(
                    `/api/event/results/${event.ext_pal_id}/${event.int_event_id}`,
                    initCode,
                  )

                  if (response.ok) {
                    detailedResult = await response.json()
                  }
                } catch (error) {
                  console.log('Failed to fetch horse details:', error)
                }

                const apiTimezone = rootContext.getTimezone?.() || 'Europe/Rome'
                return {
                  id: event.int_event_id,
                  extId: event.ext_pal_id,
                  name: `Horse Race ${event.int_event_id}`,
                  startTime: parseAPIDate(event.time, apiTimezone),
                  time: event.time,
                  discipline: Discipline.HORSES,
                  result: detailedResult || {
                    podium:
                      event.arrival?.map((horse: any, index: number) => ({
                        name: horse.name,
                        number: horse.number,
                        position: index + 1,
                      })) || [],
                    odds: {},
                  },
                }
              }),
            )
          : []

        setRootContext((prev) => ({
          ...prev,
          upcomingEvents: [
            ...(prev.upcomingEvents?.filter(
              (event) => event.discipline === Discipline.SOCCER,
            ) || []),
            ...upcomingDogEvents,
            ...upcomingHorseEvents,
          ],
          eventResults: [
            ...(prev.eventResults?.filter(
              (result) => result.discipline === Discipline.SOCCER,
            ) || []),
            ...dogEventResults,
            ...horseEventResults,
          ],
        }))

        saveToCache(CACHE_KEYS.DOGS_EVENTS, upcomingDogEvents)
        saveToCache(CACHE_KEYS.HORSES_EVENTS, upcomingHorseEvents)
        saveToCache(CACHE_KEYS.DOGS_RESULTS, dogEventResults)
        saveToCache(CACHE_KEYS.HORSES_RESULTS, horseEventResults)
        localStorage.setItem(
          CACHE_KEYS.LAST_RACING_FETCH_TIME,
          Date.now().toString(),
        )
      } catch {
        toast.error('Error fetching racing events')
      }
    }

    setIsLoadingEvents(true)

    const fetchAllEvents = async () => {
      try {
        const areas = getAreaFromUrl()

        if (areas.length === 0) {
          return
        }

        if (
          areas.includes(Discipline.DOGS) ||
          areas.includes(Discipline.HORSES)
        ) {
          loadCachedRacingEvents()
        } else if (areas.includes(Discipline.SOCCER)) {
          loadCachedSoccerEvents()
        }

        if (areas.length === 1) {
          switch (areas[0]) {
            case Discipline.SOCCER:
              await fetchUpcomingRounds()
              return
            case Discipline.DOGS:
              await fetchRacingEvents()
              return
            case Discipline.HORSES:
              await fetchRacingEvents()
              return
          }
        }

        const promises: Promise<void>[] = []

        if (areas.includes(Discipline.SOCCER)) {
          promises.push(fetchUpcomingRounds())
        }

        if (
          areas.includes(Discipline.DOGS) ||
          areas.includes(Discipline.HORSES)
        ) {
          promises.push(fetchRacingEvents())
        }

        await Promise.all(promises)
      } catch {
        toast.error('Error fetching events')
      } finally {
        setIsLoadingEvents(false)
      }
    }

    fetchAllEvents()

    const refreshInterval = setInterval(
      () => {
        const areas = getAreaFromUrl()
        const racingAreas = areas.filter(
          (area) => area === Discipline.DOGS || area === Discipline.HORSES,
        )

        if (racingAreas.length > 0) {
          fetchRacingEvents()
        }
      },
      5 * 60 * 1000,
    )

    return () => {
      clearInterval(refreshInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initCode, isCashierReady, apiRequest, loadCachedRacingEvents])

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
        isLoadingEvents,
        activeDrawerId,
        setActiveDrawer,
      }}
    >
      {props.children}
    </RootContext.Provider>
  )
}
