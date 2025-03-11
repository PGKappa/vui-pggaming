'use client'

import {
  BetOptionMarket,
  BetsHistory,
  BetType,
  LiveRound,
  RoundStatistics,
  TeamRanking,
  UpcomingRound,
  User,
} from '@/lib/types'
import { BASE_API_URL } from '@/lib/utils'
import { createContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export type RootContextType = {
  initCode: string
  currentUser?: User
  liveRound?: LiveRound
  roundStatistics?: RoundStatistics[]
  teamRankings?: TeamRanking[]
  upcomingRounds?: UpcomingRound[]
  betsHistory: BetsHistory[]
}

const defaultRootContext: RootContextType = {
  initCode: 'TEST-EUR-it-IT',
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
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.TEAM1,
                  odd: 1.5,
                },
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.DRAW,
                  odd: 3.5,
                },
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.TEAM2,
                  odd: 2.5,
                },
              ],
            },
            {
              market: BetOptionMarket.NEXT_GOAL,
              options: [
                {
                  market: BetOptionMarket.NEXT_GOAL,
                  betType: BetType.TEAM1,
                  odd: 1.5,
                },
                {
                  market: BetOptionMarket.NEXT_GOAL,
                  betType: BetType.DRAW,
                  odd: 3.5,
                },
                {
                  market: BetOptionMarket.NEXT_GOAL,
                  betType: BetType.TEAM2,
                  odd: 2.5,
                },
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
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.TEAM1,
                  odd: 1.5,
                },
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.DRAW,
                  odd: 3.5,
                },
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.TEAM2,
                  odd: 2.5,
                },
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
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.TEAM1,
                  odd: 1.5,
                },
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.DRAW,
                  odd: 3.5,
                },
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.TEAM2,
                  odd: 2.5,
                },
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
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.TEAM1,
                  odd: 1.5,
                },
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.DRAW,
                  odd: 3.5,
                },
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.TEAM2,
                  odd: 2.5,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'Super League',
      number: 31,
      startingAt: new Date('2025-02-20T14:00:00Z'),
      duration: 30,
      matches: [
        {
          teams: 'SPE - NAP',
          betOptions: [
            {
              market: BetOptionMarket.MAIN,
              options: [
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.TEAM1,
                  odd: 2.84,
                },
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.DRAW,
                  odd: 3.52,
                },
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.TEAM2,
                  odd: 1.55,
                },
              ],
            },
          ],
        },
        {
          teams: 'CAG - CAT',
          betOptions: [
            {
              market: BetOptionMarket.MAIN,
              options: [
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.TEAM1,
                  odd: 2.84,
                },
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.DRAW,
                  odd: 3.52,
                },
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.TEAM2,
                  odd: 1.55,
                },
              ],
            },
          ],
        },
        {
          teams: 'VER - STA',
          betOptions: [
            {
              market: BetOptionMarket.MAIN,
              options: [
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.TEAM1,
                  odd: 2.84,
                },
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.DRAW,
                  odd: 3.52,
                },
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.TEAM2,
                  odd: 1.55,
                },
              ],
            },
          ],
        },
        {
          teams: 'LOC - MAN',
          betOptions: [
            {
              market: BetOptionMarket.MAIN,
              options: [
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.TEAM1,
                  odd: 2.84,
                },
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.DRAW,
                  odd: 3.52,
                },
                {
                  market: BetOptionMarket.MAIN,
                  betType: BetType.TEAM2,
                  odd: 1.55,
                },
              ],
            },
          ],
        },
      ],
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
  const { i18n } = useTranslation()

  type UserApiResponse = {
    status: string
    description: string
    playerId: string
    currency: string
    lang: string
    level: number
    group: string[]
  }

  useEffect(() => {
    setRootContext(getRootContext())
  }, [])

  useEffect(() => {
    if (!rootContext.initCode) return

    const fetchUserData = async () => {
      try {
        const response = await fetch(
          `${BASE_API_URL}/football/validate/?init_code=${rootContext.initCode}`,
          {
            method: 'GET',
            mode: 'cors',
          },
        )

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const userData = (await response.json()) as UserApiResponse

        if (userData?.status === '1024') {
          setRootContext((prev) => ({
            ...prev,
            initCode: rootContext.initCode,
            currentUser: {
              playerId: userData.playerId,
              currency: userData.currency,
              lang: userData.lang,
              level: userData.level,
              group: userData.group,
            },
          }))
          i18n.changeLanguage(userData.lang.substring(0, 2))
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }

    fetchUserData()
  }, [i18n, rootContext.initCode])

  useEffect(() => {
    localStorage.setItem('rootContext', JSON.stringify(rootContext))
  }, [rootContext])

  return (
    <RootContext.Provider value={rootContext}>
      {props.children}
    </RootContext.Provider>
  )
}
