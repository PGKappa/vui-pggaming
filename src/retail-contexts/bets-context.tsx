'use client'

import { Bet, BetEntry, Selection, SubmittedTicket } from '@/retail-lib/types'
import { BetMode } from '@/retail-components/betting-slip'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

export type BetsContextType = {
  betEntries: BetEntry[]
  betsByEvent: { [key: string]: BetEntry[] }
  lastId: number
  betMode: BetMode
  addBet: (market: string, bet: Bet) => void
  removeBet: (
    marketName: string,
    option: Selection,
    competitors: string,
  ) => void
  removeEventBets: (eventId: string) => void
  toggleEventBetsFixed: (eventId: string) => void
  removeAllBets: () => void
  restoreLastSubmittedTicket: () => void
  addBets: (market: string, bet: Bet[]) => void
  removeBets: (
    market: string,
    betIds: { option: Selection; competitors: string }[],
  ) => void
}

const defaultBetsContext: BetsContextType = {
  betEntries: [],
  betsByEvent: {},
  lastId: 0,
  betMode: 'SINGLE',
  addBet: () => {},
  removeBet: () => {},
  removeEventBets: () => {},
  toggleEventBetsFixed: () => {},
  removeAllBets: () => {},
  restoreLastSubmittedTicket: () => {},
  addBets: () => {},
  removeBets: () => {},
}

export const BetsContext = createContext<BetsContextType>(defaultBetsContext)

function getBetsByEvent(betEntries: BetEntry[]): { [key: string]: BetEntry[] } {
  return betEntries.reduce(
    (groupedBets: { [key: string]: BetEntry[] }, betEntry) => {
      const key = betEntry.bet.event.number.toString()
      if (!groupedBets[key]) {
        groupedBets[key] = []
      }
      groupedBets[key].push(betEntry)
      return groupedBets
    },
    {},
  )
}

function getBetsContext(): BetsContextType {
  try {
    const betsContext = localStorage.getItem('betsContext')
    return betsContext
      ? ({
          ...JSON.parse(betsContext),
          betEntries: JSON.parse(betsContext).betEntries.map(
            (betEntry: BetEntry) => ({
              ...betEntry,
              bet: {
                ...betEntry.bet,
                event: {
                  ...betEntry.bet.event,
                  startingAt: new Date(betEntry.bet.event.startingAt),
                },
              },
            }),
          ),
          betsByEvent: getBetsByEvent(JSON.parse(betsContext).betEntries),
        } as BetsContextType)
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

  const betMode: BetMode = useMemo(() => {
    if (betsContext.betEntries.length <= 1) return 'SINGLE'
    if (
      Object.keys(betsContext.betsByEvent).length > 1 &&
      Object.values(betsContext.betsByEvent).find((e) => e.length > 1)
    )
      return 'SYSTEM'
    return 'MULTIPLE'
  }, [betsContext.betEntries, betsContext.betsByEvent])

  const checkSystemLimits = useCallback(
    (newEntries: BetEntry[]): boolean => {
      if (betMode !== 'SYSTEM') return true

      const totalEntries = betsContext.betEntries.length + newEntries.length
      if (totalEntries > 50) {
        toast.error(
          'Cannot add more bets: Maximum 50 bet entries allowed for system betting',
        )
        return false
      }

      const allEntries = [...betsContext.betEntries, ...newEntries]
      const eventsSet = new Set<string>()
      allEntries.forEach((entry) => {
        const eventKey = entry.bet.event.number.toString()
        eventsSet.add(eventKey)
      })
      const eventsNumber = eventsSet.size

      if (eventsNumber > 15) {
        toast.error(
          'Cannot add more bets: Maximum 15 unique events allowed for system betting',
        )
        return false
      }

      return true
    },
    [betMode, betsContext.betEntries],
  )

  const addBet = useCallback(
    (market: string, bet: Bet) => {
      const newEntry = { id: betsContext.lastId + 1, bet, market }
      if (!checkSystemLimits([newEntry])) {
        return
      }

      setBetsContext((prev) => ({
        ...prev,
        betEntries: [...prev.betEntries, newEntry],
        lastId: prev.lastId + 1,
      }))
    },
    [betsContext.lastId, checkSystemLimits],
  )

  const removeBet = (marketName: string, option: Selection, teams: string) => {
    setBetsContext((prev) => ({
      ...prev,
      betEntries: prev.betEntries.filter(
        (betEntry) =>
          betEntry.market !== marketName ||
          betEntry.bet.competitors !== teams ||
          betEntry.bet.option.outcome !== option.outcome,
      ),
    }))
  }

  const removeEventBets = (eventId: string) => {
    const eventNumber = parseInt(eventId)
    setBetsContext((prev) => ({
      ...prev,
      betEntries: prev.betEntries.filter(
        (betEntry) => betEntry.bet.event.number !== eventNumber,
      ),
    }))
  }

  const toggleEventBetsFixed = (eventId: string) => {
    const eventNumber = parseInt(eventId)
    setBetsContext((prev) => ({
      ...prev,
      betEntries: prev.betEntries.map((betEntry) => {
        if (betEntry.bet.event.number === eventNumber) {
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

  const addBets = useCallback(
    (market: string, bets: Bet[]) => {
      const newEntries = bets.map((bet, index) => ({
        id: betsContext.lastId + index + 1,
        bet,
        market,
      }))

      if (!checkSystemLimits(newEntries)) {
        return
      }

      setBetsContext((prev) => {
        return {
          ...prev,
          betEntries: [...prev.betEntries, ...newEntries],
          lastId: prev.lastId + newEntries.length,
        }
      })
    },
    [betsContext.lastId, checkSystemLimits],
  )

  const removeBets = (
    market: string,
    betIds: { option: Selection; competitors: string }[],
  ) => {
    setBetsContext((prev) => ({
      ...prev,
      betEntries: prev.betEntries.filter(
        (betEntry) =>
          betEntry.market !== market ||
          !betIds.some(
            (id) =>
              betEntry.bet.option.outcome === id.option.outcome &&
              betEntry.bet.competitors === id.competitors,
          ),
      ),
    }))
  }

  useEffect(() => {
    setBetsContext((prev) => ({
      ...prev,
      betsByEvent: getBetsByEvent(betsContext.betEntries),
    }))
  }, [betsContext.betEntries])

  useEffect(() => {
    setBetsContext((prev) => ({
      ...prev,
      betMode,
      addBet,
      removeBet,
      removeEventBets,
      toggleEventBetsFixed,
      removeAllBets,
      restoreLastSubmittedTicket,
      addBets,
      removeBets,
    }))
  }, [addBet, addBets, betMode])

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
