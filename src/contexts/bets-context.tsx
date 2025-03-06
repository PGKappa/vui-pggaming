'use client'

import { Bet, BetOption } from '@/lib/types'
import { createContext, useEffect, useState } from 'react'

export type BetsContextType = {
  bets: Bet[]
  lastId: number
  addBet: (bet: {
    round: {
      name: string
      number: number
      startingAt: Date
    }
    teams: string
    option: BetOption
  }) => void
  removeBet: (id: number) => void
  removeMatchBets: (matchId: string) => void
  removeAllBets: () => void
}

const defaultBetsContext: BetsContextType = {
  bets: [],
  lastId: 0,
  addBet: () => {},
  removeBet: () => {},
  removeMatchBets: () => {},
  removeAllBets: () => {},
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
  const [betsContext, setBetsContext] =
    useState<BetsContextType>(defaultBetsContext)

  const addBet = (bet: {
    round: {
      name: string
      number: number
      startingAt: Date
    }
    teams: string
    option: BetOption
  }) => {
    setBetsContext((prev) => ({
      ...prev,
      bets: [...prev.bets, { id: prev.lastId + 1, ...bet }],
      lastId: prev.lastId + 1,
    }))
  }

  const removeBet = (id: number) => {
    setBetsContext((prev) => ({
      ...prev,
      bets: prev.bets.filter((bet) => bet.id !== id),
    }))
  }

  const removeMatchBets = (matchId: string) => {
    const [roundNumber, teams] = matchId.split('.')
    console.log(roundNumber, teams)
    setBetsContext((prev) => ({
      ...prev,
      bets: prev.bets.filter(
        (bet) =>
          bet.round.number !== parseInt(roundNumber) || bet.teams !== teams,
      ),
    }))
  }

  const removeAllBets = () => {
    setBetsContext((prev) => ({ ...prev, bets: [] }))
  }

  useEffect(() => {
    const betsContext = getBetsContext()
    setBetsContext({
      ...betsContext,
      lastId: Math.max(...betsContext.bets.map((bet) => bet.id), 0),
      addBet,
      removeBet,
      removeMatchBets,
      removeAllBets,
    })
  }, [])

  useEffect(() => {
    localStorage.setItem('betsContext', JSON.stringify(betsContext))
  }, [betsContext])

  return (
    <BetsContext.Provider value={betsContext}>
      {props.children}
    </BetsContext.Provider>
  )
}
