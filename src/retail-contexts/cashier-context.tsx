'use client'

import LoadingSpinner from '@/retail-components/loading-spinner'
import { User } from '@/retail-lib/types'
import { BASE_API_URL, fetchCashierInit } from '@/retail-lib/utils'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export type CashierContextType = {
  initCode?: string
  operator?: string
  userData?: User
  cashierData?: any
  apiRequest?: <T>(
    input: string | URL | globalThis.Request,
    init?: RequestInit,
    params?: Record<string, string>,
  ) => Promise<T>
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
}

const defaultCashierContext: CashierContextType = {
  getCurrencySymbol: () => '$',
  getCurrencyCode: () => 'USD',
  getMinStakeIncrement: () => 0.05,
  getStakeButtons: () => [1, 2, 5, 10],
  getMinStake: () => 0.05,
  getMinBet: () => 0.05,
  getMaxWin: () => 1000000000,
  getTimezone: () => 'Europe/Rome',
  getChannels: () => [],
  getTrackName: (channel?: number) => `Track ${channel || 6}`,
  getTranslation: (key: string, fallback?: string) => fallback || key,
}

export const CashierContext = createContext<CashierContextType>(
  defaultCashierContext,
)

const CACHE_DURATION = 30 * 60 * 1000 // 30 minuti

function saveCashierToCache(initCode: string, data: any) {
  const cacheData = {
    data,
    timestamp: Date.now(),
  }
  localStorage.setItem(`cashier_cache_${initCode}`, JSON.stringify(cacheData))
}

function loadCashierFromCache(initCode: string): any | null {
  const cached = localStorage.getItem(`cashier_cache_${initCode}`)
  if (!cached) return null

  try {
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < CACHE_DURATION) {
      console.log('✅ Cashier caricato da cache (30min)')
      return data
    }
  } catch (e) {
    console.error('Cache parse error:', e)
  }
  return null
}

// Pulisce il localStorage dalla sessione precedente quando initCode cambia
function clearSessionStorageForNewInitCode(newInitCode: string) {
  try {
    const oldInitCode = localStorage.getItem('initCode')
    if (oldInitCode && oldInitCode !== newInitCode) {
      console.log(
        `🧹 Clearing session data: initCode changed from "${oldInitCode}" to "${newInitCode}"`,
      )

      // Rimuovi dati specifici della sessione precedente
      localStorage.removeItem('i18n.lang')
      localStorage.removeItem('cashier_timezone')
      localStorage.removeItem('betsContext')

      // Rimuovi cache cashier della sessione precedente
      localStorage.removeItem(`cashier_cache_${oldInitCode}`)

      // Rimuovi cache eventi della sessione precedente
      localStorage.removeItem('dogs_events_cache')
      localStorage.removeItem('horses_events_cache')
      localStorage.removeItem('soccer_events_cache')
      localStorage.removeItem('dogs_results_cache')
      localStorage.removeItem('horses_results_cache')
      localStorage.removeItem('soccer_results_cache')
      localStorage.removeItem('racing_events_last_fetch')
      localStorage.removeItem('soccer_events_last_fetch')
    }
  } catch (e) {
    console.error('Error clearing session storage:', e)
  }
}

export default function CashierContextProvider(props: {
  children: React.ReactNode
}) {
  const [initCode, setInitCode] = useState<string | undefined>(undefined)
  const [cashierContext, setCashierContext] = useState<CashierContextType>(
    defaultCashierContext,
  )
  const { i18n } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)

  // Leggi initCode da URL o localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlInitCode = params.get('init_code')

    console.log('🔍 CashierContext init - URL initCode:', urlInitCode)

    if (urlInitCode) {
      // Se l'initCode è cambiato, pulisci la sessione precedente
      clearSessionStorageForNewInitCode(urlInitCode)
      setInitCode(urlInitCode)
      localStorage.setItem('initCode', urlInitCode)
    } else {
      const storedInitCode = localStorage.getItem('initCode')
      console.log('🔍 CashierContext init - Stored initCode:', storedInitCode)
      if (storedInitCode) {
        setInitCode(storedInitCode)
      } else {
        setIsLoading(false)
      }
    }
  }, [])

  // Fetch cashier data (solo una volta, poi cache)
  useEffect(() => {
    if (!initCode) {
      console.log('⚠️ CashierContext: No initCode, skipping fetch')
      return
    }

    console.log(
      '🚀 CashierContext: initCode detected, starting fetch -',
      initCode,
    )

    // Controlla cache prima
    const cachedData = loadCashierFromCache(initCode)
    if (cachedData) {
      console.log('✅ Cashier caricato da cache (30min)')
      setCashierContext(cachedData)
      setIsLoading(false)
      return
    }

    console.log('🌐 Cashier API call - first initialization')

    const fetchUserData = async (retryCount = 0, maxRetries = 3) => {
      try {
        const cashierData = await fetchCashierInit(initCode)

        if (cashierData?.ret_code === 1024) {
          const userData: User = {
            status: '1024',
            description: cashierData.description,
            playerId: `${cashierData.configs?.user_type}-${cashierData.configs?.terminals?.[0] || 'unknown'}`,
            currency: cashierData.intl?.currency || 'EUR',
            lang: cashierData.dictInfo?.lang || 'it',
            level: 1,
            group: [cashierData.configs?.ui_type || 'retail'],
          } as User

          const getCurrencyCode = () => cashierData.intl?.currency || 'EUR'
          const getCurrencySymbol = () => {
            const apiSymbol = cashierData.dict?.misc?.currency?.symbol
            if (apiSymbol) return apiSymbol
            const currencyCode = cashierData.intl?.currency || 'EUR'
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
          const getChannels = () => cashierData.channels || []
          const getTrackName = (channel?: number) => {
            const channels = cashierData.channels || []
            if (channel !== undefined && channels[channel]) {
              return channels[channel].track_name || `Track ${channel + 1}`
            }
            const defaultChannel = channel ? channel - 1 : 5
            return (
              channels[defaultChannel]?.track_name ||
              `Track ${defaultChannel + 1}`
            )
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
          const getMinStakeIncrement = () => 0.05
          const getTimezone = () => cashierData.intl?.timezone || 'Europe/Rome'
          const getStakeButtons = () => {
            const buttons = cashierData.intl?.stake_buttons
            return Array.isArray(buttons) ? buttons : [1, 2, 5, 10]
          }
          const getMinStake = () => cashierData.intl?.min_stake || 0.05
          const getMinBet = () => cashierData.intl?.min_bet || 0.05
          const getMaxWin = () => cashierData.intl?.max_win || 1000000000

          const contextData: CashierContextType = {
            initCode,
            operator: cashierData.configs?.operator_name,
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

          setCashierContext(contextData)
          saveCashierToCache(initCode, contextData)

          // Aggiorna lingua e persisti per evitare fallback inattesi
          if (userData.lang && i18n.language !== userData.lang) {
            i18n.changeLanguage(userData.lang)
            try {
              localStorage.setItem('i18n.lang', userData.lang)
            } catch {}
          }

          toast.success('Cashier initialized')
          setIsLoading(false)
        } else {
          throw new Error(`Cashier error: ${cashierData?.message || 'Unknown'}`)
        }
      } catch (error) {
        console.error('Cashier error:', error)
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000
          toast.loading('Retrying cashier...', {
            id: 'retry-toast',
          })
          setTimeout(() => fetchUserData(retryCount + 1, maxRetries), delay)
        } else {
          toast.dismiss('retry-toast')
          toast.error('Cashier unavailable - using fallback')
          setIsLoading(false)
        }
      }
    }

    fetchUserData()
  }, [initCode, i18n])

  const apiRequest = useCallback(
    async <T,>(
      input: string | URL | globalThis.Request,
      init?: RequestInit,
      params?: Record<string, string>,
    ): Promise<T> => {
      const url = `${BASE_API_URL}${input}`
      const urlObj = new URL(url)
      urlObj.searchParams.set('init_code', initCode || '')
      if (params && Object.keys(params).length > 0) {
        Object.entries(params).forEach(([key, value]) => {
          urlObj.searchParams.set(key, value)
        })
      }
      const response = await fetch(urlObj.toString(), init)
      if (!response.ok) throw new Error(`API error: ${response.statusText}`)
      return response.json()
    },
    [initCode],
  )

  // Memoizza il context per evitare che le funzioni vengano ricreate ad ogni render
  const memoizedContext = useMemo(
    () => ({ ...cashierContext, apiRequest }),
    [cashierContext, apiRequest],
  )

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <CashierContext.Provider value={memoizedContext}>
      {props.children}
    </CashierContext.Provider>
  )
}
