'use client'

import LoadingSpinner from '@/virtual-components/loading-spinner'
import {
  EventResult,
  LiveRound,
  MatchResult,
  RoundStatistics,
  TeamRanking,
  Ticket,
  UpcomingEvent,
  UpcomingRound,
  User,
} from '@/virtual-lib/types'
import { createContext, useContext, useMemo } from 'react'
import { CashierContext } from './cashier-context'
import { EventsContext } from './events-context'

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
  betsHistory: [],
}

export const RootContext = createContext<RootContextType>(defaultRootContext)

export default function RootContextProvider(props: {
  children: React.ReactNode
}) {
  const cashier = useContext(CashierContext)
  const events = useContext(EventsContext)

  const contextValue = useMemo<RootContextType>(
    () => ({
      // Cashier data
      initCode: cashier.initCode,
      userData: cashier.userData,
      cashierData: cashier.cashierData,
      apiRequest: cashier.apiRequest,
      getCurrencySymbol: cashier.getCurrencySymbol,
      getCurrencyCode: cashier.getCurrencyCode,
      getMinStakeIncrement: cashier.getMinStakeIncrement,
      getChannels: cashier.getChannels,
      getTrackName: cashier.getTrackName,
      getTranslation: cashier.getTranslation,

      // Events data
      upcomingEvents: events.upcomingEvents,
      eventResults: events.eventResults,
      upcomingRounds: events.upcomingRounds,
      liveRound: events.liveRound,
      roundStatistics: events.roundStatistics,
      teamRankings: events.teamRankings,
      matchResult: events.matchResult,

      // Placeholder — betsHistory lives in BetsContext
      betsHistory: [],
    }),
    [
      cashier.initCode,
      cashier.userData,
      cashier.cashierData,
      cashier.apiRequest,
      cashier.getCurrencySymbol,
      cashier.getCurrencyCode,
      cashier.getMinStakeIncrement,
      cashier.getChannels,
      cashier.getTrackName,
      cashier.getTranslation,
      events.upcomingEvents,
      events.eventResults,
      events.upcomingRounds,
      events.liveRound,
      events.roundStatistics,
      events.teamRankings,
      events.matchResult,
    ],
  )

  // Loading gate — mostra spinner finché cashier non è pronto
  if (cashier.isLoadingCashier) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!cashier.initCode) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="text-lg">Missing init_code</p>
      </div>
    )
  }

  if (!cashier.userData) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="text-lg">Unable to fetch user data</p>
      </div>
    )
  }

  return (
    <RootContext.Provider value={contextValue}>
      {props.children}
    </RootContext.Provider>
  )
}
