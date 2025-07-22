'use client'

import { Bet, BetEntry, Selection, SubmittedTicket } from '@/retail-lib/types'
import { createContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

export type BetsContextType = {
  betEntries: BetEntry[]
  lastId: number
  addBet: (market: string, bet: Bet) => void
  removeBet: (marketName: string, option: Selection, competitors: string) => void
  removeEventBets: (eventId: string) => void
  toggleEventBetsFixed: (eventId: string) => void
  removeAllBets: () => void
  restoreLastSubmittedTicket: () => void
}

const defaultBetsContext: BetsContextType = {
  betEntries: [],
  lastId: 0,
  addBet: () => {},
  removeBet: () => {},
  removeEventBets: () => {},
  toggleEventBetsFixed: () => {},
  removeAllBets: () => {},
  restoreLastSubmittedTicket: () => {},
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
    setBetsContext((prev) => ({
      ...prev,
      betEntries: [...prev.betEntries, { id: prev.lastId + 1, bet, market }],
      lastId: prev.lastId + 1,
    }))
  }

  const removeBet = (marketName: string, option: Selection, teams: string) => {
    setBetsContext((prev) => ({
      ...prev,
      betEntries: prev.betEntries.filter(
        (betEntry) =>
          betEntry.market !== marketName ||
          betEntry.bet.competitor !== teams ||
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
          betEntry.bet.event.number !== parseInt(roundNumber) ||
          betEntry.bet.competitor !== teams,
      ),
    }))
  }

  const toggleMatchBetsFixed = (matchId: string) => {
    const [roundNumber, teams] = matchId.split('.')
    setBetsContext((prev) => ({
      ...prev,
      betEntries: prev.betEntries.map((betEntry) => {
        if (
          betEntry.bet.event.number === parseInt(roundNumber) &&
          betEntry.bet.competitor === teams
        ) {
          return { ...betEntry, fixed: !betEntry.fixed }
        }
        return betEntry
      }),
    }))
  }

  const removeAllBets = () => {
    setBetsContext((prev) => ({ ...prev, betEntries: [], lastId: 0 }))
  }

  const restoreLastSubmittedTicket = () => {
    const stored = localStorage.getItem('lastSubmittedTicket')
    if (!stored) {
      toast.error('There is no last ticket to restore!')
      return
    }

    const lastTicket: SubmittedTicket = JSON.parse(stored)
    if (!lastTicket) return

    setBetsContext((prev) => ({
      ...prev,
      betEntries: lastTicket.betEntries,
      lastId:
        lastTicket.betEntries.length > 0
          ? Math.max(...lastTicket.betEntries.map((b) => b.id))
          : 0,
    }))
  }

  useEffect(() => {
    setBetsContext((prev) => ({
      ...prev,
      addBet,
      removeBet,
      removeEventBets: removeMatchBets,
      toggleEventBetsFixed: toggleMatchBetsFixed,
      removeAllBets,
      restoreLastSubmittedTicket,
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
