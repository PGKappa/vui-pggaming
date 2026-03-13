'use client'

import { User } from '@/virtual-lib/types'
import { BASE_API_URL, fetchCashierInit } from '@/virtual-lib/utils'
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
  getSystemStakeIncrement?: () => number
  getStakeButtons?: () => number[]
  getMinStake?: () => number
  getMinBet?: () => number
  getMaxWin?: () => number
  getTimezone?: () => string
  getChannels?: (type?: 'calcio' | 'dogs' | 'horses') => any[]
  getTrackName?: (channel?: number) => string
  getTranslation?: (key: string, fallback?: string) => string
  getVersion?: () => string
  getSplashscreen?: () => string
}

const defaultCashierContext: CashierContextType = {
  hasCashierError: false,
  isLoadingCashier: true,
  getCurrencySymbol: () => '€',
  getCurrencyCode: () => 'EUR',
  getMinStakeIncrement: () => 0.5,
  getSystemStakeIncrement: () => 0.1,
  getStakeButtons: () => [5, 10, 20, 50, 100],
  getMinStake: () => 0.5,
  getMinBet: () => 0,
  getMaxWin: () => 10000,
  getTimezone: () => 'Europe/Rome',
  getChannels: () => [],
  getTrackName: () => '',
  getTranslation: (key: string, fallback?: string) => fallback || key,
  getVersion: () => 'v1.0',
  getSplashscreen: () => 'splashscreen.png',
}

export const CashierContext = createContext<CashierContextType>(
  defaultCashierContext,
)

const CACHE_DURATION = 30 * 60 * 1000 // 30 minuti

function createContextDataFromCashierData(
  cashierData: any,
  initCode: string,
): CashierContextType {
  const userData: User = {
    playerId: `${cashierData.configs?.user_type || 'user'}-${cashierData.configs?.terminals?.[0] || 'unknown'}`,
    currency: cashierData.intl?.currency || 'EUR',
    lang: cashierData.dictInfo?.lang || cashierData.intl?.lang || 'en-US',
    level: 1,
    group: [cashierData.configs?.ui_type || 'web'],
  }

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
    const channels: { id?: number; name?: string; description?: string }[] = []
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
    const track = magTracks?.find((t: any) => t.id === channel)
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
    const step = cashierData.intl?.min_stake_increment_step
    if (step) {
      const parsed = typeof step === 'string' ? parseFloat(step) : step
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
    return 0.5
  }
  const getSystemStakeIncrement = () => {
    const step = cashierData.intl?.min_stake_increment_step_sys
    if (step) {
      const parsed = typeof step === 'string' ? parseFloat(step) : step
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
    return 0.5
  }
  const getTimezone = () => cashierData.intl?.timezone || 'Europe/Rome'
  const getStakeButtons = () => {
    const buttons = cashierData.intl?.stake_buttons
    return Array.isArray(buttons) ? buttons : [5, 10, 20, 50, 100]
  }
  const getMinStake = () => {
    const minStake = cashierData.intl?.min_stake
    if (minStake) {
      const parsed =
        typeof minStake === 'string' ? parseFloat(minStake) : minStake
      if (!isNaN(parsed) && parsed >= 0) return parsed
    }
    return 0.5
  }
  const getMinBet = () => {
    const minBet = cashierData.intl?.min_bet
    if (minBet !== undefined) {
      const parsed = typeof minBet === 'string' ? parseFloat(minBet) : minBet
      if (!isNaN(parsed) && parsed >= 0) return parsed
    }
    return 0
  }
  const getMaxWin = () => {
    const maxWin = cashierData.intl?.max_win
    if (maxWin) {
      const parsed = typeof maxWin === 'string' ? parseFloat(maxWin) : maxWin
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
    return 10000
  }
  const getVersion = () => cashierData.intl?.version || 'v1.0'
  const getSplashscreen = () =>
    cashierData.intl?.splashscreen || 'splashscreen.png'

  return {
    initCode,
    operator: cashierData.configs?.operator_name,
    userData,
    cashierData,
    getCurrencySymbol,
    getCurrencyCode,
    getMinStakeIncrement,
    getSystemStakeIncrement,
    getStakeButtons,
    getMinStake,
    getMinBet,
    getMaxWin,
    getTimezone,
    getChannels,
    getTrackName,
    getTranslation,
    getVersion,
    getSplashscreen,
  }
}

function saveCashierToCache(initCode: string, cashierData: any) {
  try {
    localStorage.setItem(
      `virtual_cashier_cache_${initCode}`,
      JSON.stringify({ cashierData, timestamp: Date.now() }),
    )
  } catch {}
}

function loadCashierFromCache(initCode: string): CashierContextType | null {
  try {
    const cached = localStorage.getItem(`virtual_cashier_cache_${initCode}`)
    if (!cached) return null

    const { cashierData, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp >= CACHE_DURATION) return null

    return createContextDataFromCashierData(cashierData, initCode)
  } catch {
    return null
  }
}

function clearSessionStorageForNewInitCode(newInitCode: string) {
  try {
    const oldInitCode = localStorage.getItem('initCode')
    if (oldInitCode && oldInitCode !== newInitCode) {
      localStorage.removeItem('betsContext')
      localStorage.removeItem(`virtual_cashier_cache_${oldInitCode}`)
    }
  } catch {}
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
  const [hasCashierError, setHasCashierError] = useState(false)

  // Leggi initCode da URL o localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlInitCode = params.get('init_code') || undefined

    if (urlInitCode) {
      clearSessionStorageForNewInitCode(urlInitCode)
      setInitCode(urlInitCode)
      localStorage.setItem('initCode', urlInitCode)
    } else {
      const storedInitCode = localStorage.getItem('initCode')
      if (storedInitCode) {
        setInitCode(storedInitCode)
      } else {
        setIsLoading(false)
      }
    }
  }, [])

  // Fetch cashier data
  useEffect(() => {
    if (!initCode) return

    // Controlla cache prima
    const cachedData = loadCashierFromCache(initCode)
    if (cachedData) {
      setCashierContext(cachedData)
      if (cachedData.userData?.lang) {
        i18n.changeLanguage(cachedData.userData.lang.substring(0, 2))
      }
      setIsLoading(false)
      return
    }

    const fetchUserData = async (retryCount = 0, maxRetries = 3) => {
      try {
        const cashierData = await fetchCashierInit(initCode)

        if (cashierData?.ret_code === 1024) {
          const contextData = createContextDataFromCashierData(
            cashierData,
            initCode,
          )

          setCashierContext(contextData)
          saveCashierToCache(initCode, cashierData)

          const lang =
            cashierData.dictInfo?.lang || cashierData.intl?.lang || 'en-US'
          i18n.changeLanguage(lang.substring(0, 2))

          setIsLoading(false)
        } else {
          throw new Error('Could not fetch cashier data')
        }
      } catch {
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000
          toast.loading('Retrying...', {
            id: 'retry-toast',
            description: `Attempt ${retryCount + 1} failed. Retrying in ${delay / 1000}s.`,
          })
          setTimeout(() => fetchUserData(retryCount + 1, maxRetries), delay)
        } else {
          toast.dismiss('retry-toast')
          toast.error('Cashier initialization failed.')
          setHasCashierError(true)
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
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          urlObj.searchParams.append(key, value)
        })
      }

      const response = await fetch(urlObj.toString(), init)
      if (!response.ok) throw new Error(`API error: ${response.statusText}`)
      return response.json()
    },
    [initCode],
  )

  const memoizedContext = useMemo(
    () => ({
      ...cashierContext,
      initCode,
      apiRequest,
      hasCashierError,
      isLoadingCashier: isLoading,
    }),
    [cashierContext, apiRequest, initCode, hasCashierError, isLoading],
  )

  return (
    <CashierContext.Provider value={memoizedContext}>
      {props.children}
    </CashierContext.Provider>
  )
}
