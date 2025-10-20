'use client'

import { Bet, BetEntry, Selection, SubmittedTicket } from '@/virtual-lib/types'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

export type BetMode = 'SINGLE' | 'MULTIPLE' | 'SYSTEM'

export type BetsContextType = {
  betEntries: BetEntry[]
  betsByEvent: { [key: string]: BetEntry[] }
  lastId: number
  betMode: BetMode
  isSystemToggleEnabled: boolean
  systemToggleMode: 'multiple' | 'system'
  setSystemToggleMode: (mode: 'multiple' | 'system') => void
  addBet: (market: string, bet: Bet) => void
  removeBet: (marketName: string, option: Selection, teams: string) => void
  removeEventBets: (eventId: string) => void
  toggleEventBetsFixed: (eventId: string) => void
  removeAllBets: () => void
  restoreLastSubmittedTicket: () => void
  addBets: (market: string, bet: Bet[]) => void
  removeBets: (
    market: string,
    betIds: { option: Selection; teams: string }[],
  ) => void
}

const defaultBetsContext: BetsContextType = {
  betEntries: [],
  betsByEvent: {},
  lastId: 0,
  betMode: 'SINGLE',
  isSystemToggleEnabled: false,
  systemToggleMode: 'multiple',
  setSystemToggleMode: () => {},
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

// Raggruppa le scommesse per evento
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

// Carica il context dal localStorage
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

  // Stato per il toggle Multiple/System
  const [systemToggleMode, setSystemToggleMode] = useState<
    'multiple' | 'system'
  >('multiple')

  // Calcola se il toggle System è abilitato
  const isSystemToggleEnabled = useMemo(() => {
    const eventGroups = Object.values(betsContext.betsByEvent)

    // Se almeno un evento ha 2+ bet -> SOLO SYSTEM (no toggle)
    const hasEventWithMultipleBets = eventGroups.some(
      (group) => group.length > 1,
    )
    if (hasEventWithMultipleBets) {
      return false
    }

    // Toggle abilitato solo se: esattamente 1 bet per evento su 2+ eventi diversi
    const eventsWithSingleBet = eventGroups.filter(
      (group) => group.length === 1,
    )
    return eventsWithSingleBet.length >= 2
  }, [betsContext.betsByEvent])

  // Determina la modalità di betting
  const betMode: BetMode = useMemo(() => {
    if (betsContext.betEntries.length <= 1) return 'SINGLE'
    if (
      Object.keys(betsContext.betsByEvent).length > 1 &&
      Object.values(betsContext.betsByEvent).find((e) => e.length > 1)
    )
      return 'SYSTEM'
    return 'MULTIPLE'
  }, [betsContext.betEntries, betsContext.betsByEvent])

  // Controlli limiti per sistema
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

  // Aggiungi scommessa
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

  // Rimuovi scommessa
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

  // Rimuovi scommesse di un evento
  const removeEventBets = (eventId: string) => {
    const eventNumber = parseInt(eventId)
    setBetsContext((prev) => ({
      ...prev,
      betEntries: prev.betEntries.filter(
        (betEntry) => betEntry.bet.event.number !== eventNumber,
      ),
    }))
  }

  // Toggle fixed per evento
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

  // Rimuovi tutte le scommesse
  const removeAllBets = () => {
    setBetsContext((prev) => ({ ...prev, betEntries: [], lastId: 0 }))
  }

  // Ripristina ultimo ticket
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

  // Aggiungi multiple scommesse
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

  // Rimuovi multiple scommesse
  const removeBets = (
    market: string,
    betIds: { option: Selection; teams: string }[],
  ) => {
    setBetsContext((prev) => ({
      ...prev,
      betEntries: prev.betEntries.filter(
        (betEntry) =>
          betEntry.market !== market ||
          !betIds.some(
            (id) =>
              betEntry.bet.option.outcome === id.option.outcome &&
              betEntry.bet.competitors === id.teams,
          ),
      ),
    }))
  }

  // Aggiorna betsByEvent quando cambiano le scommesse
  useEffect(() => {
    setBetsContext((prev) => ({
      ...prev,
      betsByEvent: getBetsByEvent(betsContext.betEntries),
    }))
  }, [betsContext.betEntries])

  // Aggiorna il context con le funzioni
  useEffect(() => {
    setBetsContext((prev) => ({
      ...prev,
      betMode,
      isSystemToggleEnabled,
      systemToggleMode,
      setSystemToggleMode,
      addBet,
      removeBet,
      removeEventBets,
      toggleEventBetsFixed,
      removeAllBets,
      restoreLastSubmittedTicket,
      addBets,
      removeBets,
    }))
  }, [
    addBet,
    addBets,
    betMode,
    isSystemToggleEnabled,
    systemToggleMode,
    setSystemToggleMode,
  ])

  // Salva nel localStorage
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
