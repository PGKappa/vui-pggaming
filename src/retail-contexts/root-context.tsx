'use client'

import LoadingSpinner from '@/retail-components/loading-spinner'
import {
  Discipline,
  EventResult,
  TeamRanking,
  Ticket,
  UpcomingEvent,
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
  upcomingEvents?: UpcomingEvent[]
  last10GamesPerDiscipline: EventResult[]
  searchEventResults?: EventResult[]
  setSearchEventResults: (searchEventResults?: EventResult[]) => void
  betsHistory: Ticket[]
  teamRankings?: TeamRanking[]
  eventResults?: EventResult[]
}

const defaultRootContext: RootContextType = {
  //TODO: remove mock data
  last10GamesPerDiscipline: [],
  setSearchEventResults: () => {},
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
      goalsAgainst: 43,
      goalDifference: 1,
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
      goalsAgainst: 34,
      goalDifference: 3,
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
      goalsFor: 30,
      goalsAgainst: 34,
      goalDifference: 4,
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
      goalsFor: 25,
      goalsAgainst: 31,
      goalDifference: 6,
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
      goalsFor: 24,
      goalsAgainst: 31,
      goalDifference: 7,
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
      goalsFor: 23,
      goalsAgainst: 31,
      goalDifference: 8,
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
      goalsAgainst: 21,
      goalDifference: 10,
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
      goalsFor: 20,
      goalsAgainst: 31,
      goalDifference: 11,
      last8: ['W', 'L', 'L', 'D', 'D', 'D', 'W', 'W'],
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

  const setSearchEventResults = (searchEventResults?: EventResult[]) => {
    setRootContext((prev) => ({
      ...prev,
      searchEventResults: searchEventResults,
    }))
  }

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
              const startTime = new Date()

              // Hardcode Peru timezone hours and minutes instead of using eventDate
              // Get the current time and adjust it for Peru timezone (UTC-5)
              const peruHour = startTime.getUTCHours() - 5
              const peruMinutes = startTime.getUTCMinutes()

              // Adjust for negative hours (previous day)
              const adjustedHour = peruHour < 0 ? peruHour + 24 : peruHour

              startTime.setHours(adjustedHour)
              startTime.setMinutes(peruMinutes)
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

      const roundResults: EventResult[] = Array.from(
        { length: 12 },
        (_, index) => {
          const date = new Date(rounds[0].mag_event[0].startTime)
          date.setMinutes(date.getMinutes() - (index + 1) * 3)

          return {
            id: 12 - index,
            name: `Trident round ${12 - index}`,
            startTime: date,
            duration: 3,
            discipline: Discipline.SOCCER,
            result: {
              round: {
                name: 'Trident',
                number: 12 - index,
              },
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
          }
        },
      )

      setRootContext((prev) => ({
        ...prev,
        upcomingEvents: [
          ...(prev.upcomingEvents?.filter(
            (event) => event.discipline !== Discipline.SOCCER,
          ) || []),
          ...rounds.map((round) => ({
            id: round.scheduleId,
            name: round.scheduleName,
            startTime: new Date(
              round.mag_event[0].startTime,
            ).toLocaleTimeString('it-IT', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            time: new Date(round.mag_event[0].startTime),
            duration: 3,
            discipline: Discipline.SOCCER,
            ext_pal_id:
              round.mag_event[0].eventIdentity?.parentGroupIdSpecified || '',
            data: round,
          })),
        ],
        last10GamesPerDiscipline: [
          ...prev.last10GamesPerDiscipline.filter(
            (result) => result.discipline !== Discipline.SOCCER,
          ),
          ...roundResults,
        ],
        setSearchEventResults: setSearchEventResults,
      }))
    }

    const fetchUpcomingHorseEvents = async () => {
      const response = await fetch(
        'https://apidev.pgvirtual.eu/api/event/list',
        {
          headers: {
            accept: 'application/json',
            'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
            authorization: 'Bearer ffffffff-ffff-ffff-ffff-ffffffffffee',
            operator: 'pg',
            priority: 'u=1, i',
            'sec-ch-ua':
              '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
          },
          referrer: 'https://test.pgvirtual.eu/',
          referrerPolicy: 'strict-origin-when-cross-origin',
          body: null,
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
        },
      )

      if (!response.ok) {
        throw new Error('Failed to fetch horse events')
      }

      const horseEvents = await response.json()
      const upcomingHorseEvents: UpcomingEvent[] =
        horseEvents.channels[1].next_events.map(
          (
            event: {
              int_event_id: string
              ext_pal_id: string
              start_time: string
              time: string
            },
            index: number,
          ): UpcomingEvent => {
            const startTime = new Date(event.time)
            const hours = event.start_time.split(':')[0]
            const minutes = event.start_time.split(':')[1]
            startTime.setHours(parseInt(hours, 10))
            startTime.setMinutes(parseInt(minutes, 10))
            return {
              id: parseInt(event.int_event_id),
              extId: event.ext_pal_id,
              duration: horseEvents.channels[1].duration[index],
              name: `Horse `,
              startTime: event.start_time,
              time: startTime,
              discipline: Discipline.HORSES,
            }
          },
        )
      const horseEventResults: EventResult[] =
        horseEvents.channels[1].prev_events.map(
          (event: {
            arrival: {
              name: string
              number: number
            }[]
            int_event_id: number
            ext_pal_id: string
            start_time: string
            time: string
          }) =>
            ({
              id: event.int_event_id,
              extId: event.ext_pal_id,
              name: `Horse Race ${event.int_event_id}`,
              startTime: new Date(event.start_time),
              time: event.time,
              discipline: Discipline.HORSES,
            }) as EventResult,
        )

      setRootContext((prev) => ({
        ...prev,
        upcomingEvents: [
          ...(prev.upcomingEvents?.filter(
            (event) => event.discipline !== Discipline.HORSES,
          ) || []),
          ...upcomingHorseEvents,
        ],
        last10GamesPerDiscipline: [
          ...prev.last10GamesPerDiscipline.filter(
            (e) => e.discipline !== Discipline.HORSES,
          ),
          ...horseEventResults,
        ],
      }))
    }

    const fetchUpcomingDogEvents = async () => {
      const response = await fetch(
        'https://apidev.pgvirtual.eu/api/event/list',
        {
          headers: {
            accept: 'application/json',
            'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
            authorization: 'Bearer ffffffff-ffff-ffff-ffff-ffffffffffee',
            operator: 'pg',
            priority: 'u=1, i',
            'sec-ch-ua':
              '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
          },
          referrer: 'https://test.pgvirtual.eu/',
          referrerPolicy: 'strict-origin-when-cross-origin',
          body: null,
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
        },
      )

      if (!response.ok) {
        throw new Error('Failed to fetch horse events')
      }

      const dogEvents = await response.json()
      const upcomingDogEvents: UpcomingEvent[] =
        dogEvents.channels[1].next_events.map(
          (
            event: {
              int_event_id: string
              ext_pal_id: string
              start_time: string
              time: number
            },
            index: number,
          ): UpcomingEvent => {
            const startTime = new Date(event.time)
            const hours = event.start_time.split(':')[0]
            const minutes = event.start_time.split(':')[1]
            startTime.setHours(parseInt(hours, 10))
            startTime.setMinutes(parseInt(minutes, 10))
            return {
              id: parseInt(event.int_event_id),
              extId: event.ext_pal_id,
              duration: dogEvents.channels[1].duration[index],
              name: `Dog `,
              startTime: event.start_time,
              time: startTime,
              discipline: Discipline.DOGS,
            }
          },
        )
      const dogEventResults: EventResult[] =
        dogEvents.channels[1].prev_events.map(
          (event: {
            arrival: {
              name: string
              number: number
            }[]
            int_event_id: number
            start_time: string
            time: number
          }) =>
            ({
              id: event.int_event_id,
              name: `Dog Race ${event.int_event_id}`,
              result: {
                podium: event.arrival.map((dog) => ({
                  name: dog.name,
                  number: dog.number,
                })),
              },
              startTime: new Date(event.start_time),
              time: event.time,
              discipline: Discipline.DOGS,
            }) as EventResult,
        )

      setRootContext((prev) => ({
        ...prev,
        upcomingEvents: [
          ...(prev.upcomingEvents?.filter(
            (event) => event.discipline !== Discipline.DOGS,
          ) || []),
          ...upcomingDogEvents,
        ],
        eventResults: [...(prev.eventResults || []), ...dogEventResults],
      }))
    }

    fetchUpcomingRounds()
    fetchUpcomingHorseEvents()
    fetchUpcomingDogEvents()
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
