'use client'

import { CashierContext } from '@/retail-contexts/cashier-context'
import type { NavbarConfig } from '@/retail-contexts/cashier-context'
import { EventsContext } from '@/retail-contexts/events-context'
import { EventResult, TeamRanking, UpcomingEvent } from '@/retail-lib/types'
import { User } from '@/retail-lib/types'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

export type RootContextType = {
  // === Da CashierContext ===
  initCode?: string
  operator?: string
  terminalId?: string
  userData?: User
  cashierData?: any
  hasCashierError?: boolean
  isLoadingCashier?: boolean
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
  getMaxEvents?: () => number
  getMaxSelections?: () => number
  getMaxCombinations?: () => number
  getActiveMixDisciplines?: () => string[]
  getNavbarConfig?: () => NavbarConfig
  // === Da EventsContext (per backward-compatibility) ===
  upcomingEvents?: UpcomingEvent[]
  searchEventResults?: EventResult[]
  setSearchEventResults: (searchEventResults?: EventResult[]) => void
  isLoadingEvents: boolean
  eventResults?: EventResult[]
  teamRankings?: TeamRanking[]
  // === State locale (UI-specific) ===
  activeDrawerId?: string
  setActiveDrawer: (drawerId?: string) => void
}

const defaultRootContext: RootContextType = {
  setSearchEventResults: () => {},
  activeDrawerId: undefined,
  setActiveDrawer: () => {},
  hasCashierError: false,
  isLoadingCashier: true,
  getCurrencySymbol: () => '$',
  getCurrencyCode: () => 'USD',
  getChannels: () => [],
  getTrackName: (channel?: number) => `Track ${channel || 6}`,
  getTranslation: (key: string, fallback?: string) => fallback || key,
  getVersion: () => 'v1.0',
  getSplashscreen: () => 'splashscreen-empty.png',
  getMaxEvents: () => 10,
  getMaxSelections: () => 100,
  getMaxCombinations: () => 512,
  getActiveMixDisciplines: () => ['DOGS', 'HORSES'],
  getNavbarConfig: () => ({
    showDogs6: true,
    showDogs8: true,
    showHorses: true,
    showMix: true,
    showFootball: true,
  }),
  isLoadingEvents: false,
  upcomingEvents: [],
  eventResults: [],
  teamRankings: [],
}

export const RootContext = createContext<RootContextType>(defaultRootContext)

export default function RootContextProvider(props: {
  children: React.ReactNode
}) {
  const cashierContext = useContext(CashierContext)
  const eventsContext = useContext(EventsContext)

  const [activeDrawerId, setActiveDrawerId] = useState<string | undefined>(
    undefined,
  )

  const handleSetActiveDrawer = useCallback((drawerId?: string) => {
    setActiveDrawerId(drawerId)
  }, [])

  // Aggrega i dati da CashierContext e EventsContext nel RootContext
  const rootContextValue = useMemo(
    () => ({
      initCode: cashierContext.initCode,
      operator: cashierContext.operator,
      terminalId: cashierContext.terminalId,
      userData: cashierContext.userData,
      cashierData: cashierContext.cashierData,
      hasCashierError: cashierContext.hasCashierError,
      isLoadingCashier: cashierContext.isLoadingCashier,
      getCurrencySymbol: cashierContext.getCurrencySymbol,
      getCurrencyCode: cashierContext.getCurrencyCode,
      getMinStakeIncrement: cashierContext.getMinStakeIncrement,
      getSystemStakeIncrement: cashierContext.getSystemStakeIncrement,
      getStakeButtons: cashierContext.getStakeButtons,
      getMinStake: cashierContext.getMinStake,
      getMinBet: cashierContext.getMinBet,
      getMaxWin: cashierContext.getMaxWin,
      getTimezone: cashierContext.getTimezone,
      getChannels: cashierContext.getChannels,
      getTrackName: cashierContext.getTrackName,
      getTranslation: cashierContext.getTranslation,
      getVersion: cashierContext.getVersion,
      getSplashscreen: cashierContext.getSplashscreen,
      getMaxEvents: cashierContext.getMaxEvents,
      getMaxSelections: cashierContext.getMaxSelections,
      getMaxCombinations: cashierContext.getMaxCombinations,
      getActiveMixDisciplines: cashierContext.getActiveMixDisciplines,
      getNavbarConfig: cashierContext.getNavbarConfig,
      upcomingEvents: eventsContext.upcomingEvents,
      searchEventResults: eventsContext.searchEventResults,
      setSearchEventResults: eventsContext.setSearchEventResults,
      isLoadingEvents: eventsContext.isLoadingEvents,
      eventResults: eventsContext.eventResults,
      teamRankings: [], // Mock data - non viene da EventsContext
      activeDrawerId,
      setActiveDrawer: handleSetActiveDrawer,
    }),
    // Dipende SOLO dai valori primitivi e callback specifiche, NON dai full objects
    [
      cashierContext.initCode,
      cashierContext.operator,
      cashierContext.terminalId,
      cashierContext.userData,
      cashierContext.cashierData,
      cashierContext.hasCashierError,
      cashierContext.isLoadingCashier,
      cashierContext.getCurrencySymbol,
      cashierContext.getCurrencyCode,
      cashierContext.getMinStakeIncrement,
      cashierContext.getSystemStakeIncrement,
      cashierContext.getStakeButtons,
      cashierContext.getMinStake,
      cashierContext.getMinBet,
      cashierContext.getMaxWin,
      cashierContext.getTimezone,
      cashierContext.getChannels,
      cashierContext.getTrackName,
      cashierContext.getTranslation,
      cashierContext.getVersion,
      cashierContext.getSplashscreen,
      cashierContext.getMaxEvents,
      cashierContext.getMaxSelections,
      cashierContext.getMaxCombinations,
      cashierContext.getActiveMixDisciplines,
      cashierContext.getNavbarConfig,
      eventsContext.upcomingEvents,
      eventsContext.searchEventResults,
      eventsContext.setSearchEventResults,
      eventsContext.isLoadingEvents,
      eventsContext.eventResults,
      activeDrawerId,
      handleSetActiveDrawer,
    ],
  )

  return (
    <RootContext.Provider value={rootContextValue}>
      {props.children}
    </RootContext.Provider>
  )
}
