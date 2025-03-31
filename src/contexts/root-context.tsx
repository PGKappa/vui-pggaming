'use client'

import LoadingSpinner from '@/components/loading-spinner'
import {
  Ticket,
  LiveRound,
  MatchResult,
  RoundStatistics,
  TeamRanking,
  UpcomingMatch,
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
  betsHistory: Ticket[]
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
    streamUrl:
      'https://st12.net4media.net:8082/nuvometa/c510a754-V140-Trident-Football-492d2a7a15b5/playlist.m3u8',
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
  betsHistory: [],
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
  const processedRoundIdRef = useRef<number | undefined>(undefined)

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
      localStorage.removeItem('initCode')
      setIsLoading(false)
    }

    setInitCode(initCode)
  }, [])

  useEffect(() => {
    if (!initCode) return

    const checkRoundTransition = () => {
      const upcomingRounds = rootContext.upcomingRounds

      if (upcomingRounds?.length) {
        const currentDate = new Date()
        const nextRound = upcomingRounds.find((round) => {
          const startTime = new Date(round.mag_event[0]?.startTime)
          return currentDate >= startTime
        })

        if (nextRound) {
          if (processedRoundIdRef.current === nextRound.scheduleId) {
            return
          }

          processedRoundIdRef.current = nextRound.scheduleId

          setRootContext((prev) => ({
            ...prev,
            liveRound: {
              name: nextRound.scheduleName,
              number: nextRound.scheduleId,
              scores: prev.liveRound?.scores || [],
              startingAt: new Date(nextRound.mag_event[0]?.startTime),
              streamUrl: prev.liveRound?.streamUrl || '',
            },
            upcomingRounds: prev.upcomingRounds?.slice(1) || [],
          }))
        }
      }
    }

    checkRoundTransition()

    const intervalId = setInterval(checkRoundTransition, 60000)

    return () => clearInterval(intervalId)
  }, [initCode, rootContext.upcomingRounds])

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
          i18n.changeLanguage(userData.lang.substring(0, 2))
          setRootContext((prev) => ({
            ...prev,
            userData,
          }))
          toast.success('User data fetched successfully!')
          setIsLoading(false)
        } else {
          setInitCode(undefined)
          throw new Error('Could not fetch User Data!')
        }
      } catch {
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000
          toast.loading('Retrying...', {
            id: 'retry-toast',
            description: `Attempt ${retryCount + 1} failed. Retrying in ${delay / 1000} seconds.`,
          })
          setTimeout(() => fetchUserData(retryCount + 1, maxRetries), delay)
        } else {
          toast.dismiss('retry-toast')
          toast.error(`All ${maxRetries + 1} attempts failed. Giving up.`)
          setInitCode(undefined)
          setRootContext((prev) => ({
            ...prev,
            userData: undefined,
          }))
          setIsLoading(false)
        }
      }
    }

    fetchUserData()
  }, [i18n, initCode])

  useEffect(() => {
    if (!initCode) return

    const fetchUpcomingRounds = async () => {
      const response = await apiRequest<{
        schedules: {
          schedule: UpcomingRound[]
        }
      }>('/football/20/', {
        method: 'GET',
      })

      if (!response?.schedules?.schedule?.length) return

      const allEvents = response.schedules.schedule[0].mag_event.slice(4) || [] //TODO: remove .slice(4) when the API is fixed

      const eventsByGroup: Record<number, UpcomingMatch[]> = {}

      allEvents.forEach((event) => {
        const groupId = event.eventIdentity?.groupId
        if (groupId !== undefined) {
          if (!eventsByGroup[groupId]) {
            eventsByGroup[groupId] = []
          }
          eventsByGroup[groupId].push(event)
        }
      })

      const rounds: UpcomingRound[] = Object.entries(eventsByGroup).map(
        ([groupId, events]) => {
          const firstEvent = events[0]

          return {
            ...response.schedules.schedule[0],
            scheduleId: Number(groupId),
            scheduleName:
              firstEvent.eventIdentity.scheduleType ??
              response.schedules.schedule[0].scheduleName,
            mag_event: events.map((event) => {
              //TODO: replace this events.map() with events when the API is fixed
              const startTime = new Date()
              startTime.setMinutes(new Date(event.startTime).getMinutes())
              startTime.setSeconds(0)
              startTime.setMilliseconds(0)

              return {
                ...event,
                startTime: startTime.toISOString(),
              }
            }),
          }
        },
      )

      setRootContext((prev) => ({
        ...prev,
        upcomingRounds: rounds,
      }))
    }

    fetchUpcomingRounds()
  }, [initCode, apiRequest])

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
        <p className="text-lg">Missing init_code</p>
      </div>
    )
  }

  if (!rootContext.userData) {
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
