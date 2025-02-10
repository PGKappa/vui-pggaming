'use client'
import { Round, RoundStatus, Score } from '@/lib/types'
import { createContext, useEffect, useState } from 'react'

export type RootContextType = {
  currentUser?: string
  liveRound?: Round
}

export const RootContext = createContext<RootContextType>({})

function getRootContext(): RootContextType {
  try {
    const rootContext = localStorage.getItem('rootContext')
    return rootContext
      ? (JSON.parse(rootContext) as RootContextType)
      : {//TODO: remove mock data
          liveRound: {
            name: 'Super League',
            number: 1,
            scores: [
              { team1: 'BUR', team2: 'EVE', score1: 2, score2: 0 },
              { team1: 'MCI', team2: 'MUN', score1: 1, score2: 1 },
              { team1: 'TOT', team2: 'ARS', score1: 0, score2: 0 },
              { team1: 'CHE', team2: 'LIV', score1: 1, score2: 1 },
            ],
            status: RoundStatus.LIVE,
          },
        }
  } catch (error) {
    console.error('Failed to parse rootContext from localStorage:', error)
    return {}
  }
}

export default function RootContextProvider(props: {
  children: React.ReactNode
}) {
  const [rootContext, setRootContext] =
    useState<RootContextType>({})

  useEffect(() => {
    setRootContext(getRootContext())
  }, [])

  useEffect(() => {
    localStorage.setItem('rootContext', JSON.stringify(rootContext))
  }, [rootContext])

  return (
    <RootContext.Provider value={rootContext}>
      {props.children}
    </RootContext.Provider>
  )
}
