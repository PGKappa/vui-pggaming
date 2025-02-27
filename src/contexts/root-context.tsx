'use client'

import {
  Bet,
  LiveRound,
  TeamRanking,
  UpcomingRound,
  RoundStatistics,
} from '@/lib/types'
import { createContext, useEffect, useState } from 'react'

export type RootContextType = {
  currentUser?: string
  liveRound?: LiveRound
  roundStatistics?: RoundStatistics[]
  teamRankings?: TeamRanking[]
  upcomingRounds?: UpcomingRound[]
  bets: Bet[]
}

const defaultRootContext: RootContextType = {
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
    streamUrl: 'https://st7.net4media.net:8082/PG/Dogs/1qasw5/playlist.m3u8',
  },
  roundStatistics: [
    {
      name: 'Statistics',
      number: 29,
      matches: [
        {
          teams: 'BUR - EVE',
          probabilities: [30, 50, 20],
          startTime: new Date('2025-02-10T00:01:00Z'),
        },
        {
          teams: 'CAT - ELE',
          probabilities: [30, 50, 20],
          startTime: new Date('2025-02-10T00:01:00Z'),
        },
        {
          teams: 'JUV - MIL',
          probabilities: [30, 50, 20],
          startTime: new Date('2025-02-10T00:01:00Z'),
        },
        {
          teams: 'INT - ROM',
          probabilities: [30, 50, 20],
          startTime: new Date('2025-02-10T00:01:00Z'),
        },
      ],
    },
  ],
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
      number: 30,
      startingAt: new Date('2025-02-13T14:00:00Z'),
      duration: 30,
      matches: [
        { teams: 'MCI - MUN', odds: [1.5, 3.5, 4.5] },
        { teams: 'TOT - ARS', odds: [2.5, 3.5, 2.5] },
        { teams: 'CHE - LIV', odds: [3.5, 3.5, 1.5] },
      ],
    },
    {
      name: 'Super League',
      number: 31,
      startingAt: new Date('2025-10-10T18:00:00Z'),
      duration: 30,
      matches: [
        { teams: 'MIL - JUV', odds: [2.8, 1.5, 2.5] },
        { teams: 'REA - NAP', odds: [1.5, 2.5, 3.5] },
        { teams: 'SAS - PIS', odds: [2.5, 3.5, 1.5] },
      ],
    },
  ],
  bets: [
    {
      round: {
        name: 'Super League',
        number: 29,
        startingAt: new Date('2025-02-10T20:00:00Z'),
      },
      betType: 0,
      teams: 'BNF-MIL',
      selectedTeam: 'BNF',
      odd: 1.5,
    },
    {
      round: {
        name: 'Super League',
        number: 29,
        startingAt: new Date('2025-02-10T20:00:00Z'),
      },
      betType: 1,
      teams: 'WHM-ARS',
      selectedTeam: 'ARS',
      odd: 3.5,
    },
    {
      round: {
        name: 'Super League',
        number: 29,
        startingAt: new Date('2025-02-10T20:00:00Z'),
      },
      betType: 2,
      teams: 'MCI-LIV',
      selectedTeam: 'MCI',
      odd: 4.5,
    },
  ],
}

export const RootContext = createContext<RootContextType>(defaultRootContext)

function getRootContext(): RootContextType {
  try {
    const rootContext = localStorage.getItem('rootContext')
    return rootContext
      ? (JSON.parse(rootContext) as RootContextType)
      : defaultRootContext
  } catch (error) {
    console.error('Failed to parse rootContext from localStorage:', error)
    return defaultRootContext
  }
}

export default function RootContextProvider(props: {
  children: React.ReactNode
}) {
  const [rootContext, setRootContext] =
    useState<RootContextType>(defaultRootContext)

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
