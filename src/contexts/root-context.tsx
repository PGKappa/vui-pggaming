'use client'

import {
  Bet,
  BetOptionMarket,
  BetsHistory,
  BetType,
  LiveRound,
  RoundStatistics,
  TeamRanking,
  UpcomingRound,
} from '@/lib/types'
import { createContext, useEffect, useState } from 'react'

export type RootContextType = {
  currentUser?: string
  liveRound?: LiveRound
  roundStatistics?: RoundStatistics[]
  teamRankings?: TeamRanking[]
  upcomingRounds?: UpcomingRound[]
  bets: Bet[]
  betsHistory: BetsHistory[]
}

const defaultRootContext: RootContextType = {
  //TODO: remove mock data
  liveRound: {
    name: 'Super League',
    number: 28,
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
          teams: 'NAP - GEN',
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
        {
          teams: 'MCI - MUN',
          betOptions: [
            {
              market: BetOptionMarket.MAIN,
              options: [
                { betType: BetType.TEAM1, odd: 1.5 },
                { betType: BetType.DRAW, odd: 3.5 },
                { betType: BetType.TEAM2, odd: 2.5 },
              ],
            },
            {
              market: BetOptionMarket.NEXT_GOAL,
              options: [
                { betType: BetType.TEAM1, odd: 1.5 },
                { betType: BetType.DRAW, odd: 3.5 },
                { betType: BetType.TEAM2, odd: 2.5 },
              ],
            },
          ],
        },
        {
          teams: 'BUR - EVE',
          betOptions: [
            {
              market: BetOptionMarket.MAIN,
              options: [
                { betType: BetType.TEAM1, odd: 1.5 },
                { betType: BetType.DRAW, odd: 3.5 },
                { betType: BetType.TEAM2, odd: 2.5 },
              ],
            },
          ],
        },
        {
          teams: 'TOT - ARS',
          betOptions: [
            {
              market: BetOptionMarket.MAIN,
              options: [
                { betType: BetType.TEAM1, odd: 1.5 },
                { betType: BetType.DRAW, odd: 3.5 },
                { betType: BetType.TEAM2, odd: 2.5 },
              ],
            },
          ],
        },
        {
          teams: 'CHE - LIV',
          betOptions: [
            {
              market: BetOptionMarket.MAIN,
              options: [
                { betType: BetType.TEAM1, odd: 1.5 },
                { betType: BetType.DRAW, odd: 3.5 },
                { betType: BetType.TEAM2, odd: 2.5 },
              ],
            },
          ],
        },
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
      betType: BetType.TEAM1,
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
      betType: BetType.DRAW,
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
      betType: BetType.TEAM2,
      teams: 'MCI-LIV',
      selectedTeam: 'MCI',
      odd: 4.5,
    },
    {
      round: {
        name: 'Super League',
        number: 29,
        startingAt: new Date('2025-02-10T20:00:00Z'),
      },
      betType: BetType.TEAM2,
      teams: 'INT-MIL',
      selectedTeam: 'INT',
      odd: 6.5,
    },
  ],
  betsHistory: [
    {
      id: 1278,
      date: new Date('2025-02-24T15:15:11Z'),
      amount: 2.0,
      winning: 0.56,
      status: 'Vincente',
    },
    {
      id: 1269,
      date: new Date('2025-02-01T09:38:18Z'),
      amount: 1.5,
      winning: 0.0,
      status: 'Perdente',
    },
    {
      id: 1268,
      date: new Date('2025-02-01T09:20:15Z'),
      amount: 3.5,
      winning: 0.78,
      status: 'Vincente',
    },
    {
      id: 1240,
      date: new Date('2025-01-11T11:20:27Z'),
      amount: 1.8,
      winning: 0.0,
      status: 'Perdente',
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
