'use client'

import { Bet, BetEntry, Selection, SubmittedTicket } from '@/retail-lib/types'
import { BetMode } from '@/retail-components/betting-slip'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const getEventStatus = (event: any): 'active' | 'expired' => {
  if (!event?.startingAt) return 'active'

  const now = new Date()
  const eventTime = new Date(event.startingAt)

  return now >= eventTime ? 'expired' : 'active'
}

export type BetsContextType = {
  betEntries: BetEntry[]
  betsByEvent: { [key: string]: BetEntry[] }
  lastId: number
  betMode: BetMode
  isSystemToggleEnabled: boolean
  systemToggleMode: 'MULTIPLE' | 'SYSTEM'
  setSystemToggleMode: (mode: 'MULTIPLE' | 'SYSTEM') => void
  addBet: (market: string, bet: Bet) => void
  removeBet: (
    marketName: string,
    option: Selection,
    competitors: string,
    eventNumber?: number,
    discipline?: string,
  ) => void
  removeEventBets: (eventId: string) => void
  toggleEventBetsFixed: (eventId: string) => void
  removeAllBets: () => void
  restoreLastSubmittedTicket: () => void
  addBets: (market: string, bet: Bet[]) => number
  removeBets: (
    market: string,
    betIds: { option: Selection; competitors: string }[],
  ) => void
  addBetsWithMarket: (bets: { marketName: string; bet: Bet }[]) => void
}

const defaultBetsContext: BetsContextType = {
  betEntries: [],
  betsByEvent: {},
  lastId: 0,
  betMode: 'SINGLE',
  isSystemToggleEnabled: false,
  systemToggleMode: 'MULTIPLE',
  setSystemToggleMode: () => {},
  addBet: () => {},
  removeBet: () => {},
  removeEventBets: () => {},
  toggleEventBetsFixed: () => {},
  removeAllBets: () => {},
  restoreLastSubmittedTicket: () => {},
  addBets: () => 0,
  removeBets: () => {},
  addBetsWithMarket: () => {},
}

export const BetsContext = createContext<BetsContextType>(defaultBetsContext)

function getBetsByEvent(betEntries: BetEntry[]): { [key: string]: BetEntry[] } {
  return betEntries.reduce(
    (groupedBets: { [key: string]: BetEntry[] }, betEntry) => {
      // Includiamo la disciplina nella chiave per evitare conflitti
      const key = `${betEntry.bet.discipline}-${betEntry.bet.event.number}`
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
    if (!betsContext) return defaultBetsContext

    const parsed = JSON.parse(betsContext)

    // MIGRATION: Se non c'è la versione, reset del localStorage
    if (!parsed.version || parsed.version < 2) {
      localStorage.removeItem('betsContext')
      return defaultBetsContext
    }

    const rehydratedEntries = parsed.betEntries.map((betEntry: BetEntry) => ({
      ...betEntry,
      bet: {
        ...betEntry.bet,
        event: {
          ...betEntry.bet.event,
          startingAt: new Date(betEntry.bet.event.startingAt),
        },
      },
    }))

    return {
      ...parsed,
      betEntries: rehydratedEntries,
      betsByEvent: getBetsByEvent(rehydratedEntries),
    } as BetsContextType
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
  const [systemToggleMode, setSystemToggleMode] = useState<
    'MULTIPLE' | 'SYSTEM'
  >('MULTIPLE')

  // Determina se il toggle Multiple/System è abilitato
  const isSystemToggleEnabled = useMemo(() => {
    const numEvents = Object.keys(betsContext.betsByEvent).length
    const hasMultipleBetsInSameEvent = Object.values(
      betsContext.betsByEvent,
    ).some((bets) => bets.length > 1)

    // Toggle abilitato SOLO quando ci sono 2+ eventi E una singola bet per evento
    return numEvents >= 2 && !hasMultipleBetsInSameEvent
  }, [betsContext.betsByEvent])

  const betMode: BetMode = useMemo(() => {
    if (betsContext.betEntries.length <= 1) return 'SINGLE'

    // Se ci sono multiple bet nello stesso evento → automaticamente SYSTEM
    const hasMultipleBetsInSameEvent = Object.values(
      betsContext.betsByEvent,
    ).some((bets) => bets.length > 1)

    if (
      Object.keys(betsContext.betsByEvent).length > 1 &&
      hasMultipleBetsInSameEvent
    ) {
      return 'SYSTEM'
    }

    // Se il toggle è abilitato, usa la modalità selezionata dall'utente
    if (isSystemToggleEnabled) {
      return systemToggleMode
    }

    return 'MULTIPLE'
  }, [
    betsContext.betEntries,
    betsContext.betsByEvent,
    isSystemToggleEnabled,
    systemToggleMode,
  ])

  // Cleanup automatico di scommesse scadute ogni 5 secondi
  useEffect(() => {
    const cleanupExpiredBets = () => {
      const activeBets = betsContext.betEntries.filter((entry) => {
        return getEventStatus(entry.bet.event) === 'active'
      })

      if (activeBets.length !== betsContext.betEntries.length) {
        const removedCount = betsContext.betEntries.length - activeBets.length
        setBetsContext((prev) => ({
          ...prev,
          betEntries: activeBets,
          betsByEvent: getBetsByEvent(activeBets),
        }))
        toast.info(
          `Removed ${removedCount} expired bet${removedCount > 1 ? 's' : ''}`,
        )
      }
    }

    const interval = setInterval(cleanupExpiredBets, 5000)
    return () => clearInterval(interval)
  }, [betsContext.betEntries])

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
        const eventKey = `${entry.bet.discipline}-${entry.bet.event.number}`
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

  const removeBet = (
    marketName: string,
    option: Selection,
    teams: string,
    eventNumber?: number,
    discipline?: string,
  ) => {
    setBetsContext((prev) => {
      const filtered = prev.betEntries.filter((betEntry) => {
        // Rimuovi SOLO se TUTTI i parametri corrispondono (incluso evento e disciplina)
        const shouldRemove =
          betEntry.market === marketName &&
          betEntry.bet.competitors === teams &&
          betEntry.bet.option.outcome === option.outcome &&
          (eventNumber ? betEntry.bet.event.number === eventNumber : true) &&
          (discipline ? betEntry.bet.discipline === discipline : true)

        return !shouldRemove
      })

      return {
        ...prev,
        betEntries: filtered,
      }
    })
  }

  const removeEventBets = (eventId: string) => {
    setBetsContext((prev) => ({
      ...prev,
      betEntries: prev.betEntries.filter((betEntry) => {
        const entryKey = `${betEntry.bet.discipline}-${betEntry.bet.event.number}`
        return entryKey !== eventId
      }),
    }))
  }

  const toggleEventBetsFixed = (eventId: string) => {
    setBetsContext((prev) => ({
      ...prev,
      betEntries: prev.betEntries.map((betEntry) => {
        const entryKey = `${betEntry.bet.discipline}-${betEntry.bet.event.number}`
        if (entryKey === eventId) {
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
      // Check for duplicates before adding
      const filteredBets: Bet[] = []

      for (const bet of bets) {
        // Create a unique identifier for this bet using the correct Bet structure
        const betIdentifier = `${bet.event.number}-${bet.discipline}-${bet.competitors}-${bet.option.outcome}-${bet.option.decPrice}`

        // Check if this bet already exists in current entries
        const existsInCurrent = betsContext.betEntries.some((entry) => {
          const existingId = `${entry.bet.event.number}-${entry.bet.discipline}-${entry.bet.competitors}-${entry.bet.option.outcome}-${entry.bet.option.decPrice}`
          return existingId === betIdentifier
        })

        if (!existsInCurrent) {
          filteredBets.push(bet)
        }
      }

      if (filteredBets.length === 0) {
        return 0
      }

      const newEntries = filteredBets.map((bet, index) => ({
        id: betsContext.lastId + index + 1,
        bet,
        market,
      }))

      if (!checkSystemLimits(newEntries)) {
        return 0
      }

      setBetsContext((prev) => {
        return {
          ...prev,
          betEntries: [...prev.betEntries, ...newEntries],
          lastId: prev.lastId + newEntries.length,
        }
      })

      return filteredBets.length
    },
    [betsContext.lastId, betsContext.betEntries, checkSystemLimits],
  )

  const addBetsWithMarket = useCallback(
    (bets: { marketName: string; bet: Bet }[]) => {
      const newEntries: BetEntry[] = []

      bets.forEach((bet, index) => {
        const existingEntry = betsContext.betEntries.find(
          (entry) =>
            entry.bet.discipline === bet.bet.discipline &&
            entry.bet.event.number === bet.bet.event.number &&
            entry.bet.option.outcome === bet.bet.option.outcome,
        )
        if (existingEntry) {
          toast.error('Duplicate bet found')
          return
        }

        newEntries.push({
          id: betsContext.lastId + index + 1,
          bet: bet.bet,
          market: bet.marketName,
        })
      })

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
    [betsContext.betEntries, betsContext.lastId, checkSystemLimits],
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
      addBetsWithMarket,
    }))
  }, [
    addBet,
    addBets,
    addBetsWithMarket,
    betMode,
    isSystemToggleEnabled,
    systemToggleMode,
  ])

  useEffect(() => {
    if (!betsContext) return
    // VERSIONING: Salviamo con numero di versione per future migrazioni
    const toSave = { ...betsContext, version: 2 }
    localStorage.setItem('betsContext', JSON.stringify(toSave))
  }, [betsContext])

  return (
    <BetsContext.Provider value={betsContext}>
      {props.children}
    </BetsContext.Provider>
  )
}
