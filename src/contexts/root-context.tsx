'use client'

import LoadingSpinner from '@/components/loading-spinner'
import {
  BetsHistory,
  LiveRound,
  MatchResult,
  RoundStatistics,
  TeamRanking,
  UpcomingRound,
  User,
} from '@/lib/types'
import { BASE_API_URL } from '@/lib/utils'
import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export type RootContextType = {
  userData?: User
  apiRequest?: <T>(
    input: string | URL | globalThis.Request,
    init?: RequestInit,
    params?: Record<string, string>,
  ) => Promise<T>
  liveRound?: LiveRound
  roundStatistics?: RoundStatistics[]
  teamRankings?: TeamRanking[]
  upcomingRounds?: UpcomingRound[]
  betsHistory: BetsHistory[]
  matchResult?: MatchResult[]
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
      name: 'Super League',
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
      team: 'NAP',
      played: 26,
      wins: 14,
      draws: 8,
      losses: 4,
      points: 50,
      last8: ['W', 'W', 'L', 'W', 'W', 'X', 'L', 'W'],
    },
    {
      position: 2,
      team: 'JUV',
      played: 26,
      wins: 14,
      draws: 8,
      losses: 4,
      points: 50,
      last8: ['W', 'W', 'L', 'W', 'W', 'X', 'L', 'L'],
    },
    {
      position: 3,
      team: 'GEN',
      played: 26,
      wins: 13,
      draws: 7,
      losses: 6,
      points: 46,
      last8: ['L', 'W', 'L', 'X', 'W', 'X', 'W', 'X'],
    },
    {
      position: 4,
      team: 'MIL',
      played: 26,
      wins: 13,
      draws: 7,
      losses: 6,
      points: 46,
      last8: ['L', 'W', 'L', 'X', 'W', 'X', 'W', 'W'],
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
  matchResult: [
    {
      round: { name: 'Super League', number: 28 },
      teams: 'NAP - GEN',
      score1: 2,
      score2: 0,
    },
  ],
}

export const RootContext = createContext<RootContextType>(defaultRootContext)

function getInitCodeFromUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined

  const params = new URLSearchParams(window.location.search)

  return params.get('init_code') || undefined
}

export default function RootContextProvider(props: {
  children: React.ReactNode
}) {
  const [initCode, setInitCode] = useState<string | undefined>(undefined)
  const [rootContext, setRootContext] =
    useState<RootContextType>(defaultRootContext)
  const { i18n } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const previousRoundNumber = useRef<number | undefined>(undefined)

  type UserApiResponse = {
    status: string
    description: string
    playerId: string
    currency: string
    lang: string
    level: number
    group: string[]
  }

  const apiRequest = useCallback(
    async <T,>(
      input: string | URL | globalThis.Request,
      init?: RequestInit,
      params?: Record<string, string>,
    ): Promise<T> => {
      let url = `${BASE_API_URL}${input}`

      const urlObj = new URL(url)
      urlObj.searchParams.set('init_code', initCode || '')
      if (params && Object.keys(params).length > 0) {
        Object.entries(params).forEach(([key, value]) => {
          urlObj.searchParams.append(key, value)
        })
      }
      url = urlObj.toString()

      return await fetch(url, init)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }
          return response.json()
        })
        .catch((error) => {
          toast.error('API request failed!', {
            description: error.message,
          })
        })
    },
    [initCode],
  )

  useEffect(() => {
    const initCode = getInitCodeFromUrl()

    if (initCode) {
      const storedInitCode = localStorage.getItem('initCode')
      if (storedInitCode && storedInitCode !== initCode) {
        localStorage.removeItem('betsContext')
      }

      localStorage.setItem('initCode', initCode)
    } else {
      setIsLoading(false)
      localStorage.removeItem('initCode')
    }

    setInitCode(initCode)
  }, [])

  useEffect(() => {
    if (!initCode) return

    const fetchUserData = async (retryCount = 0, maxRetries = 3) => {
      try {
        const response = await fetch(
          `${BASE_API_URL}/football/validate/?init_code=${initCode}`,
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
            userData,
          }))
          i18n.changeLanguage(userData.lang.substring(0, 2))
        } else {
          setInitCode(undefined)
        }
      } catch (error) {
        console.error(`Fetch attempt ${retryCount + 1} failed:`, error)

        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000
          console.log(`Retrying in ${delay}ms...`)

          setTimeout(() => fetchUserData(retryCount + 1, maxRetries), delay)
        } else {
          console.error(`All ${maxRetries + 1} attempts failed. Giving up.`)
          setInitCode(undefined)
          setRootContext((prev) => ({
            ...prev,
            userData: undefined,
          }))
        }
      } finally {
        setIsLoading(false)
        console.log('User data fetch completed')
      }
    }

    fetchUserData()
  }, [i18n, initCode])

  useEffect(() => {
    if (!initCode || !rootContext.liveRound?.number) return

    previousRoundNumber.current = rootContext.liveRound?.number

    const fetchUpcomingRounds = async () => {
      try {
        const { schedules } = await apiRequest<{
          schedules: {
            schedule: UpcomingRound[]
          }
        }>('/football/2/', {
          method: 'GET',
        })

        if (schedules && schedules.schedule) {
          setRootContext((prev) => ({
            ...prev,
            upcomingRounds: schedules.schedule.map((round) => ({
              ...round,
              mag_event: round.mag_event.slice(0, 4),
            })),
          }))
        }
      } catch (error) {
        console.error('Failed to fetch upcoming rounds:', error)
      }
    }

    fetchUpcomingRounds()
  }, [rootContext.liveRound?.number, initCode, apiRequest])

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!initCode) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="text-lg">Unable to fetch user data</p>
      </div>
    )
  }

  return (
    <RootContext.Provider value={rootContext}>
      {props.children}
    </RootContext.Provider>
  )
}
