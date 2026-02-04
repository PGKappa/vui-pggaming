'use client'

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
  hasCashierError?: boolean
  isLoadingCashier?: boolean
  apiRequest?: <T>(
    input: string | URL | globalThis.Request,
    init?: RequestInit,
    params?: Record<string, string>,
  ) => Promise<T>
  getCurrencySymbol?: () => string
  getCurrencyCode?: () => string
  getMinStakeIncrement?: () => number
  getStakeButtons?: () => (string | number)[]
  getMinStake?: () => number
  getMinBet?: () => number
  getMaxWin?: () => number
  getTimezone?: () => string
  getChannels?: () => any[]
  getTrackName?: (channel?: number) => string
  getTranslation?: (key: string, fallback?: string) => string
}

const defaultCashierContext: CashierContextType = {
  hasCashierError: false,
  isLoadingCashier: true,
  getCurrencySymbol: () => '€',
  getCurrencyCode: () => 'EUR',
  getMinStakeIncrement: () => 0.05,
  getStakeButtons: () => [5, 10, 20, 30, 50],
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

function saveCashierToCache(
  initCode: string,
  operator: string | undefined,
  data: any,
) {
  if (!operator) {
    console.error('Cannot save to cache: operator is required')
    return
  }
  const cacheKey = `cashier_cache_${initCode}_${operator}`
  const cacheData = {
    data,
    timestamp: Date.now(),
  }
  localStorage.setItem(cacheKey, JSON.stringify(cacheData))
}

function loadCashierFromCache(
  initCode: string,
  operator: string | undefined,
): any | null {
  if (!operator) {
    console.warn('Cannot load from cache: operator is required')
    return null
  }
  const cacheKey = `cashier_cache_${initCode}_${operator}`
  const cached = localStorage.getItem(cacheKey)
  if (!cached) return null

  try {
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < CACHE_DURATION) {
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
      // Rimuovi dati specifici della sessione precedente
      localStorage.removeItem('i18n.lang')
      localStorage.removeItem('cashier_timezone')
      localStorage.removeItem('betsContext')

      // Rimuovi TUTTE le cache cashier (qualsiasi initCode e operator)
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('cashier_cache_')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key))

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
  const [operator, setOperator] = useState<string | undefined>(undefined)
  const [cashierContext, setCashierContext] = useState<CashierContextType>(
    defaultCashierContext,
  )
  const { i18n, t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [hasCashierError, setHasCashierError] = useState(false)

  // Leggi initCode e operator da URL o localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlInitCode = params.get('init_code')
    const urlOperator = params.get('operator')

    if (urlInitCode) {
      // Se l'initCode è cambiato, pulisci la sessione precedente
      clearSessionStorageForNewInitCode(urlInitCode)
      setInitCode(urlInitCode)
      if (urlOperator) {
        setOperator(urlOperator)
        localStorage.setItem('operator', urlOperator)
      } else {
        console.error('Operator is required in URL params')
        toast.error(t('operator_missing'))
        setHasCashierError(true)
        setIsLoading(false)
        return
      }
      localStorage.setItem('initCode', urlInitCode)
    } else {
      const storedInitCode = localStorage.getItem('initCode')
      const storedOperator = localStorage.getItem('operator')
      if (storedInitCode && storedOperator) {
        setInitCode(storedInitCode)
        setOperator(storedOperator)
      } else {
        if (storedInitCode && !storedOperator) {
          console.error('Operator is missing from localStorage')
          toast.error(t('operator_not_found'))
          setHasCashierError(true)
        }
        setIsLoading(false)
      }
    }
  }, [t])

  // Fetch cashier data (solo una volta, poi cache)
  useEffect(() => {
    if (!initCode) {
      return
    }

    // Controlla cache prima
    const cachedData = loadCashierFromCache(initCode, operator)
    if (cachedData) {
      setCashierContext(cachedData)
      setIsLoading(false)
      return
    }

    const fetchUserData = async (retryCount = 0, maxRetries = 3) => {
      try {
        const cashierData = await fetchCashierInit(initCode, operator)

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
            const currencyCode = cashierData.intl?.currency || 'EUR'
            const currencyMap: Record<string, string> = {
              USD: '$',
              EUR: '€',
              GBP: '£',
              JPY: '¥',
              CHF: 'CHF',
              CAD: 'C$',
              AUD: 'A$',
              COP: '$',
              DOP: '$',
              MXN: '$',
              ARS: '$',
              BRL: 'R$',
            }
            const mapped = currencyMap[currencyCode]
            if (mapped) return mapped

            const apiSymbol = cashierData.dict?.misc?.currency?.symbol
            if (apiSymbol) return apiSymbol

            return '$'
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
          saveCashierToCache(initCode, operator, contextData)

          // Aggiorna lingua e persisti per evitare fallback inattesi
          if (userData.lang && i18n.language !== userData.lang) {
            i18n.changeLanguage(userData.lang)
            try {
              localStorage.setItem('i18n.lang', userData.lang)
            } catch {}
          }

          toast.success(t('cashier_initialized'))
          setIsLoading(false)
        } else {
          // Mostra il messaggio di errore specifico dall'API
          const errorMessage =
            cashierData?.description ||
            cashierData?.message ||
            `Error code: ${cashierData?.ret_code}`
          console.error('Cashier API error:', {
            ret_code: cashierData?.ret_code,
            description: cashierData?.description,
            message: cashierData?.message,
          })
          throw new Error(errorMessage)
        }
      } catch (error) {
        console.error('Cashier error:', error)
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000
          toast.loading(t('retrying_cashier'), {
            id: 'retry-toast',
          })
          setTimeout(() => fetchUserData(retryCount + 1, maxRetries), delay)
        } else {
          toast.dismiss('retry-toast')
          // Mostra il messaggio di errore specifico se disponibile
          const errorMsg =
            error instanceof Error ? error.message : t('cashier_unavailable')
          toast.error(errorMsg, { duration: 10000 })
          setHasCashierError(true)
          setIsLoading(false)
        }
      }
    }

    fetchUserData()
  }, [initCode, operator, i18n, t])

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
    () => ({
      ...cashierContext,
      initCode,
      operator,
      apiRequest,
      hasCashierError,
      isLoadingCashier: isLoading,
    }),
    [
      cashierContext,
      apiRequest,
      initCode,
      operator,
      hasCashierError,
      isLoading,
    ],
  )

  return (
    <CashierContext.Provider value={memoizedContext}>
      {props.children}
    </CashierContext.Provider>
  )
}
