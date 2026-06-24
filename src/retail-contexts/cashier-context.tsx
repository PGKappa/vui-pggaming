'use client'

import { User } from '@/retail-lib/types'
import {
  BASE_API_URL,
  fetchCashierInit,
  setRetailHeaders,
} from '@/retail-lib/utils'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export type CashierContextType = {
  initCode?: string
  operator?: string
  terminalId?: string
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
  getChannels?: () => any[]
  getTrackName?: (channel?: number) => string
  getTranslation?: (key: string, fallback?: string) => string
  getVersion?: () => string
  getSplashscreen?: () => string
  getMaxCombinations?: () => number
  getActiveMixDisciplines?: () => string[]
  getNavbarConfig?: () => NavbarConfig
}

export type NavbarConfig = {
  showDogs6: boolean
  showDogs8: boolean
  showHorses: boolean
  /** Show the dogs-horses mix button (true when ≥2 racing disciplines are present) */
  showMix: boolean
  showFootball: boolean
}

const defaultCashierContext: CashierContextType = {
  hasCashierError: false,
  isLoadingCashier: true,
  getCurrencySymbol: () => '$',
  getCurrencyCode: () => 'USD',
  getMinStakeIncrement: () => 0.05,
  getSystemStakeIncrement: () => 0.1,
  getStakeButtons: () => [1, 2, 5, 10],
  getMinStake: () => 0.05,
  getMinBet: () => 0.05,
  getMaxWin: () => 1000000000,
  getTimezone: () => 'Europe/Rome',
  getChannels: () => [],
  getTrackName: (channel?: number) => `Track ${channel || 6}`,
  getTranslation: (key: string, fallback?: string) => fallback || key,
  getVersion: () => 'v1.0',
  getSplashscreen: () => 'splashscreen-empty.png',
  getMaxCombinations: () => 2048,
  getActiveMixDisciplines: () => ['DOGS', 'HORSES'],
  // Default: show everything before cashier data is loaded
  getNavbarConfig: () => ({
    showDogs6: true,
    showDogs8: true,
    showHorses: true,
    showMix: true,
    showFootball: true,
  }),
}

export const CashierContext = createContext<CashierContextType>(
  defaultCashierContext,
)

const CACHE_DURATION = 30 * 60 * 1000 // 30 minuti

// Helper function to create context data with all getter functions from raw cashierData
function createContextDataFromCashierData(
  cashierData: any,
  initCode: string,
): CashierContextType {
  const userData: User = {
    status: '1024',
    description: cashierData.description,
    playerId: `${cashierData.configs?.user_type}-${cashierData.configs?.terminals?.[0] || 'unknown'}`,
    currency: cashierData.intl?.currency || 'EUR',
    lang: cashierData.dictInfo?.lang || 'it',
    level: cashierData.configs?.user_type === 'operator' ? 1 : 2,
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
    return channels[defaultChannel]?.track_name || `Track ${defaultChannel + 1}`
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
    const step = cashierData.intl?.min_stake_increment_step
    if (step) {
      const parsed = typeof step === 'string' ? parseFloat(step) : step
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
    return 0.05
  }
  const getSystemStakeIncrement = () => {
    const step = cashierData.intl?.min_stake_increment_step_sys
    if (step) {
      const parsed = typeof step === 'string' ? parseFloat(step) : step
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
    return 0.1
  }
  const getTimezone = () => cashierData.intl?.timezone || 'Europe/Rome'
  const getStakeButtons = () => {
    const buttons = cashierData.intl?.stake_buttons
    if (Array.isArray(buttons)) {
      return buttons
        .map((v: string | number) =>
          typeof v === 'number'
            ? v
            : parseFloat(
                String(v)
                  .replace(/[^0-9.,]/g, '')
                  .replace(',', '.'),
              ),
        )
        .filter((n: number) => !isNaN(n) && n > 0)
    }
    if (typeof buttons === 'string') {
      return buttons
        .split(',')
        .map((s: string) =>
          parseFloat(s.replace(/[^0-9.,]/g, '').replace(',', '.')),
        )
        .filter((n: number) => !isNaN(n) && n > 0)
    }
    return [1, 2, 5, 10]
  }
  const getMinStake = () => {
    const minStake = cashierData.intl?.min_stake
    if (minStake) {
      const parsed =
        typeof minStake === 'string' ? parseFloat(minStake) : minStake
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
    return 0.05
  }
  const getMinBet = () => {
    const minBet = cashierData.intl?.min_bet
    if (minBet !== undefined && minBet !== null) {
      const parsed = typeof minBet === 'string' ? parseFloat(minBet) : minBet
      if (!isNaN(parsed) && parsed >= 0) return parsed
    }
    return 0.05
  }
  const getMaxWin = () => {
    const maxWin = cashierData.intl?.max_win
    if (maxWin) {
      const parsed = typeof maxWin === 'string' ? parseFloat(maxWin) : maxWin
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
    return 1000000000
  }
  const getVersion = () => cashierData.intl?.version || 'v1.0'
  const getSplashscreen = () =>
    cashierData.intl?.splashscreen || 'splashscreen-empty.png'
  const getMaxCombinations = () => {
    const val = cashierData.intl?.max_combination
    if (val !== undefined && val !== null) {
      const parsed = typeof val === 'string' ? parseInt(val, 10) : val
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
    return 2048
  }
  // Returns which disciplines are actually present in the cashier channels
  // for the mixed dogs-horses page. Falls back to ['DOGS','HORSES'] when no
  // recognised channels are found (e.g. before cashier data is loaded).
  const getActiveMixDisciplines = (): string[] => {
    const channels: any[] = cashierData.channels || []
    const result: string[] = []
    const hasDogs = channels.some(
      (c) =>
        (typeof c?.game_id === 'string' && /dogs?6|dog[^8]/i.test(c.game_id)) ||
        (typeof c?.name === 'string' &&
          /dog|grey/i.test(c.name) &&
          !/8/.test(c.name) &&
          !/8/.test(c.game_id || '')),
    )
    if (hasDogs) result.push('DOGS')
    const hasDogs8 = channels.some(
      (c) =>
        (typeof c?.game_id === 'string' && /dogs?8/i.test(c.game_id)) ||
        (typeof c?.name === 'string' && /dog.*8|grey.*8/i.test(c.name)),
    )
    if (hasDogs8) result.push('DOGS8')
    const hasHorses = channels.some(
      (c) =>
        (typeof c?.game_id === 'string' && /horse/i.test(c.game_id)) ||
        (typeof c?.name === 'string' && /horse|cavall/i.test(c.name)),
    )
    if (hasHorses) result.push('HORSES')
    // Fallback: nothing matched yet → return the minimum expected set
    if (result.length === 0) return ['DOGS', 'HORSES']
    return result
  }

  const getNavbarConfig = (): NavbarConfig => {
    const channels: any[] = cashierData.channels || []

    const hasDogs6 = channels.some(
      (c) =>
        (typeof c?.game_id === 'string' && /^dogs?(?!8)/i.test(c.game_id)) ||
        (typeof c?.name === 'string' &&
          /dog|grey/i.test(c.name) &&
          !/8/.test(c.name) &&
          !/8/.test(c.game_id || '')),
    )
    const hasDogs8 = channels.some(
      (c) =>
        (typeof c?.game_id === 'string' && /dogs?8/i.test(c.game_id)) ||
        (typeof c?.name === 'string' && /dog.*8|grey.*8/i.test(c.name)),
    )
    const hasHorses = channels.some(
      (c) =>
        (typeof c?.game_id === 'string' && /horse/i.test(c.game_id)) ||
        (typeof c?.name === 'string' && /horse|cavall/i.test(c.name)),
    )

    // Show the mix button when at least 2 racing disciplines are present
    const racingCount = [hasDogs6, hasDogs8, hasHorses].filter(Boolean).length
    const showMix = racingCount >= 2

    // Football flag: checked in multiple possible locations in the cashier response
    const showFootball =
      cashierData.football === true ||
      cashierData.configs?.football === true ||
      cashierData.intl?.football === true

    // If no channel game_ids are recognised (cashier doesn't expose them yet),
    // fall back to showing all buttons so the navbar is never empty.
    if (!hasDogs6 && !hasDogs8 && !hasHorses) {
      return {
        showDogs6: true,
        showDogs8: true,
        showHorses: true,
        showMix: true,
        showFootball,
      }
    }

    return {
      showDogs6: hasDogs6,
      showDogs8: hasDogs8,
      showHorses: hasHorses,
      showMix,
      showFootball,
    }
  }

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
    getMaxCombinations,
    getActiveMixDisciplines,
    getNavbarConfig,
  }
}

function saveCashierToCache(
  initCode: string,
  operator: string | undefined,
  cashierData: any,
) {
  if (!operator) {
    console.error('Cannot save to cache: operator is required')
    return
  }
  const cacheKey = `cashier_cache_${initCode}_${operator}`
  const cacheData = {
    cashierData, // Save only raw API data, not functions
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
    const { cashierData, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < CACHE_DURATION) {
      // Recreate context with functions from raw cashierData
      return createContextDataFromCashierData(cashierData, initCode)
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
  const [operator, setOperator] = useState<string | undefined>(undefined)
  const [terminalId, setTerminalId] = useState<string | undefined>(undefined)
  const [cashierContext, setCashierContext] = useState<CashierContextType>(
    defaultCashierContext,
  )
  const { i18n, t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [hasCashierError, setHasCashierError] = useState(false)

  // Leggi initCode e operator/partner da URL o localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlInitCode = params.get('init_code')
    // Accetta sia 'operator' che 'partner' come parametro URL (operator ha precedenza)
    const urlOperator = params.get('operator') || params.get('partner')
    const urlShopId = params.get('shopID')
    const urlTerminalId = params.get('terminalID')

    // Salva Shop-Id e Terminal-Id per tutte le API call
    const effectiveShopId =
      urlShopId || localStorage.getItem('shopId') || undefined
    const effectiveTerminalId =
      urlTerminalId || localStorage.getItem('terminalId') || undefined
    setRetailHeaders(effectiveShopId, effectiveTerminalId)
    setTerminalId(effectiveTerminalId)

    if (!effectiveShopId) {
      console.warn('Shop-Id is missing from URL and localStorage')
    }
    if (!effectiveTerminalId) {
      console.warn('Terminal-Id is missing from URL and localStorage')
    }

    if (urlInitCode) {
      // Se l'initCode è cambiato, pulisci la sessione precedente
      clearSessionStorageForNewInitCode(urlInitCode)
      setInitCode(urlInitCode)
      if (urlShopId) localStorage.setItem('shopId', urlShopId)
      if (urlTerminalId) localStorage.setItem('terminalId', urlTerminalId)
      if (urlOperator) {
        setOperator(urlOperator)
        localStorage.setItem('operator', urlOperator)
      } else {
        console.error('Operator/Partner is required in URL params')
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
          // Use the helper function to create context with all getter functions
          const contextData = createContextDataFromCashierData(
            cashierData,
            initCode,
          )

          setCashierContext(contextData)
          // Save only raw cashierData to cache (functions will be recreated on load)
          saveCashierToCache(initCode, operator, cashierData)

          // Aggiorna lingua e persisti per evitare fallback inattesi
          const lang = cashierData.dictInfo?.lang || 'it'
          if (lang && i18n.language !== lang) {
            i18n.changeLanguage(lang)
            try {
              localStorage.setItem('i18n.lang', lang)
            } catch {}
          }

          toast.success(t('cashier_initialized'))
          setIsLoading(false)
        } else {
          throw new Error(`Cashier error: ${cashierData?.message || 'Unknown'}`)
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
          toast.error(t('cashier_unavailable'))
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
      terminalId,
      apiRequest,
      hasCashierError,
      isLoadingCashier: isLoading,
    }),
    [
      cashierContext,
      apiRequest,
      initCode,
      operator,
      terminalId,
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
