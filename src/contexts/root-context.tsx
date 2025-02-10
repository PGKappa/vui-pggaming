'use client'
import { LiveRound, TeamRanking, UpcomingRound } from '@/lib/types'
import { createContext, useEffect, useState } from 'react'

export type RootContextType = {
  currentUser?: string
  liveRound?: LiveRound
  teamRankings?: TeamRanking[]
  upcomingRounds?: UpcomingRound[]
}

export const RootContext = createContext<RootContextType>({})

function getRootContext(): RootContextType {
  try {
    const rootContext = localStorage.getItem('rootContext')
    return rootContext
      ? (JSON.parse(rootContext) as RootContextType)
      : {
          //TODO: remove mock data
          liveRound: {
            name: 'Super League',
            number: 1,
            scores: [
              { team1: 'BUR', team2: 'EVE', score1: 2, score2: 0 },
              { team1: 'MCI', team2: 'MUN', score1: 1, score2: 1 },
              { team1: 'TOT', team2: 'ARS', score1: 0, score2: 0 },
              { team1: 'CHE', team2: 'LIV', score1: 1, score2: 1 },
            ],
            startingAt: new Date('2025-02-10T20:00:00Z'),
          },
          teamRankings: [
            {
              position: 1,
              team: 'BNF',
              played: 26,
              wins: 14,
              draws: 8,
              losses: 4,
              points: 50,
              last8: ['W', 'W', 'L', 'W', 'W', 'X', 'L', 'W'],
            },
            {
              position: 2,
              team: 'WHM',
              played: 26,
              wins: 13,
              draws: 7,
              losses: 6,
              points: 46,
              last8: ['L', 'W', 'L', 'X', 'W', 'X', 'W', 'X'],
            },
          ],
          upcomingRounds: [
            {
              name: 'Super League',
              number: 2,
              startingAt: new Date('2025-02-10T14:00:00Z'),
              betAmounts: [2.84, 2.84, 2.84, 20],
            },
            {
              name: 'Super League',
              number: 3,
              startingAt: new Date('2025-10-10T18:00:00Z'),
              betAmounts: [2.84, 2.84, 2.84, 2.84],
            },
          ],
        }
  } catch (error) {
    console.error('Failed to parse rootContext from localStorage:', error)
    return {}
  }
}

export default function RootContextProvider(props: {
  children: React.ReactNode
}) {
  const [rootContext, setRootContext] = useState<RootContextType>({})

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
