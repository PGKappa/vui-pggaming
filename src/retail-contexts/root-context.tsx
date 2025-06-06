'use client'

import LoadingSpinner from '@/retail-components/loading-spinner'
import {
  RoundResults,
  TeamRanking,
  Ticket,
  UpcomingMatch,
  UpcomingRound,
  User,
} from '@/retail-lib/types'
import { BASE_API_URL } from '@/retail-lib/utils'
import { createContext, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import upcomingRoundsJson from './upcoming-rounds.json'

export type RootContextType = {
  userData?: User
  apiRequest?: <T>(
    input: string | URL | globalThis.Request,
    init?: RequestInit,
    params?: Record<string, string>,
  ) => Promise<T>
  upcomingRounds?: UpcomingRound[]
  roundResults: RoundResults[]
  betsHistory: Ticket[]
  teamRankings?: TeamRanking[]
}

const defaultRootContext: RootContextType = {
  //TODO: remove mock data
  roundResults: [],
  betsHistory: [],
  teamRankings: [
    {
      position: 1,
      team: 'AST',
      played: 17,
      wins: 14,
      draws: 2,
      losses: 1,
      points: 44,
      goalsFor: 44,
      goalsAgainst: 44,
      last8: ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'L'],
    },
    {
      position: 2,
      team: 'WOL',
      played: 17,
      wins: 11,
      draws: 4,
      losses: 2,
      points: 37,
      goalsFor: 37,
      goalsAgainst: 37,
      last8: ['W', 'W', 'W', 'D', 'W', 'W', 'D', 'D'],
    },
    {
      position: 3,
      team: 'SOU',
      played: 17,
      wins: 11,
      draws: 1,
      losses: 5,
      points: 34,
      goalsFor: 34,
      goalsAgainst: 34,
      last8: ['W', 'W', 'W', 'L', 'W', 'L', 'W', 'D'],
    },
    {
      position: 4,
      team: 'TOT',
      played: 17,
      wins: 9,
      draws: 4,
      losses: 4,
      points: 31,
      goalsFor: 31,
      goalsAgainst: 31,
      last8: ['W', 'W', 'L', 'W', 'W', 'L', 'D', 'D'],
    },
    {
      position: 5,
      team: 'CHE',
      played: 17,
      wins: 9,
      draws: 4,
      losses: 4,
      points: 31,
      goalsFor: 31,
      goalsAgainst: 31,
      last8: ['W', 'L', 'L', 'D', 'D', 'D', 'W', 'W'],
    },
    {
      position: 6,
      team: 'BNF',
      played: 17,
      wins: 9,
      draws: 4,
      losses: 4,
      points: 31,
      goalsFor: 31,
      goalsAgainst: 31,
      last8: ['W', 'L', 'L', 'D', 'D', 'D', 'W', 'W'],
    },
    {
      position: 7,
      team: 'LEE',
      played: 17,
      wins: 9,
      draws: 4,
      losses: 4,
      points: 31,
      goalsFor: 31,
      goalsAgainst: 31,
      last8: ['W', 'L', 'L', 'D', 'D', 'D', 'W', 'W'],
    },
    {
      position: 8,
      team: 'BRE',
      played: 17,
      wins: 9,
      draws: 4,
      losses: 4,
      points: 31,
      goalsFor: 31,
      goalsAgainst: 31,
      last8: ['W', 'L', 'L', 'D', 'D', 'D', 'W', 'W'],
    },
  ],
}

export const RootContext = createContext<RootContextType>(defaultRootContext)

function getInitCodeFromUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined

  const params = new URLSearchParams(window.location.search)

  console.log('init_code: ', params.get('init_code'))

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

    const fetchUserData = async (retryCount = 0, maxRetries = 3) => {
      try {
        const userData = {
          status: '1024',
          description: 'Success',
          playerId: 'daniel1983-306#29',
          currency: 'EUR',
          lang: 'it-IT',
          level: 1,
          group: [],
        } as UserApiResponse

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
      const response = upcomingRoundsJson as unknown as {
        schedules: {
          schedule: UpcomingRound[]
        }
      }

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
              // Create a proper date from the event's startTime
              try {
                const eventDate = new Date(event.eventIdentity.startTime)
                const startTime = new Date()

                // Set hours and minutes from the event date
                startTime.setHours(eventDate.getHours())
                startTime.setMinutes(eventDate.getMinutes())
                startTime.setSeconds(0)
                startTime.setMilliseconds(0)

                return {
                  ...event,
                  startTime: startTime.toISOString(),
                }
              } catch {
                // If there's an error with the date, use the current time
                const fallbackTime = new Date()
                fallbackTime.setSeconds(0)
                fallbackTime.setMilliseconds(0)

                return {
                  ...event,
                  startTime: fallbackTime.toISOString(),
                }
              }
            }),
          }
        },
      )

      const roundResults: RoundResults[] = Array.from(
        { length: 12 },
        (_, index) => {
          const date = new Date(rounds[0].mag_event[0].startTime)
          date.setMinutes(date.getMinutes() - (index + 1) * 3)

          return {
            round: {
              name: 'Trident',
              number: 12 - index,
            },
            startTime: date,
            duration: 3,
            matchResults: [
              {
                teams: 'AST - WOL',
                score1: 2,
                score2: 1,
                odds: {
                  oneXTwo: {
                    odds: 1.95,
                  },
                  doubleChance: {
                    odds: 1.63,
                  },
                  firstScorer: {
                    teamLabel: 'WOL',
                    odds: 2.05,
                  },
                  sumGoals: {
                    value: 2,
                    odds: 1.63,
                  },
                  goalNoGoal: {
                    value: 1,
                    odds: 1.95,
                  },
                  redCard: {
                    value: 'WOL',
                    odds: 2.05,
                  },
                  winningCombo: {
                    value: 'WOL',
                    odds: 2.05,
                  },
                  exactGoals: {
                    value: 2,
                    odds: 1.63,
                  },
                },
              },
            ],
          }
        },
      )

      setRootContext((prev) => ({
        ...prev,
        upcomingRounds: rounds,
        roundResults,
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
