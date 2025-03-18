'use client'

import { Bet, BetEntry, Selection } from '@/lib/types'
import { createContext, useEffect, useState } from 'react'

export type BetsContextType = {
  betEntries: BetEntry[]
  lastId: number
  addBet: (market: string, bet: Bet) => void
  removeBet: (marketName: string, option: Selection, teams: string) => void
  removeMatchBets: (matchId: string) => void
  removeAllBets: () => void
  refreshBets: () => void
}

const defaultBetsContext: BetsContextType = {
  betEntries: [],
  lastId: 0,
  addBet: () => {},
  removeBet: () => {},
  removeMatchBets: () => {},
  removeAllBets: () => {},
  refreshBets: () => {},
}

export const BetsContext = createContext<BetsContextType>(defaultBetsContext)

function getBetsContext(): BetsContextType {
  try {
    const betsContext = localStorage.getItem('betsContext')
    return betsContext
      ? (JSON.parse(betsContext) as BetsContextType)
      : defaultBetsContext
  } catch (error) {
    console.error('Failed to parse betsContext from localStorage:', error)
    return defaultBetsContext
  }
}

export default function BetsContextProvider(props: {
  children: React.ReactNode
}) {
  const initialBetsContext = getBetsContext()
  const [betsContext, setBetsContext] =
    useState<BetsContextType>(initialBetsContext)

  const addBet = (market: string, bet: Bet) => {
    const lastId = betsContext.lastId
    setBetsContext((prev) => ({
      ...prev,
      betEntries: [...prev.betEntries, { id: prev.lastId + 1, bet, market }],
      lastId: prev.lastId + 1,
    }))
    return lastId + 1
  }

  const removeBet = (marketName: string, option: Selection, teams: string) => {
    setBetsContext((prev) => ({
      ...prev,
      betEntries: prev.betEntries.filter(
        (betEntry) =>
          betEntry.market !== marketName ||
          betEntry.bet.teams !== teams ||
          betEntry.bet.option.outcome !== option.outcome,
      ),
    }))
  }

  const removeMatchBets = (matchId: string) => {
    const [roundNumber, teams] = matchId.split('.')

    setBetsContext((prev) => ({
      ...prev,
      betEntries: prev.betEntries.filter(
        (betEntry) =>
          betEntry.bet.round.number !== parseInt(roundNumber) ||
          betEntry.bet.teams !== teams,
      ),
    }))
  }

  const removeAllBets = () => {
    setBetsContext((prev) => ({ ...prev, betEntries: [], lastId: 0 }))
  }

  const refreshBets = () => {
    setBetsContext(getBetsContext())
  }

  useEffect(() => {
    setBetsContext((prev) => ({
      ...prev,
      addBet,
      removeBet,
      removeMatchBets,
      removeAllBets,
      refreshBets,
    }))
  }, [])

  useEffect(() => {
    if (!betsContext) return
    localStorage.setItem('betsContext', JSON.stringify(betsContext))
  }, [betsContext])

  return (
    <BetsContext.Provider value={betsContext}>
      {props.children}
    </BetsContext.Provider>
  )
}
