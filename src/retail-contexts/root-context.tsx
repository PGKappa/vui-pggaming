'use client'

import LoadingSpinner from '@/retail-components/loading-spinner'
import {
  Discipline,
  EventResult,
  RaceResult,
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
  searchEventResults?: EventResult[]
  setSearchEventResults: (searchEventResults?: EventResult[]) => void
  betsHistory: Ticket[]
  teamRankings?: TeamRanking[]
  eventResults?: EventResult[]
}

const defaultRootContext: RootContextType = {
  setSearchEventResults: () => {},
  betsHistory: [],
  eventResults: [],
  teamRankings: [
    {
      position: 1,
      team: 'LEE',
      played: 17,
      wins: 14,
      draws: 2,
      losses: 1,
      points: 44,
      goalsFor: 42,
      goalsAgainst: 12,
      goalDifference: 30,
      last8: ['W', 'W', 'W', 'W', 'W', 'W', 'D', 'W'],
    },
    {
      position: 2,
      team: 'BUR',
      played: 17,
      wins: 11,
      draws: 4,
      losses: 2,
      points: 37,
      goalsFor: 35,
      goalsAgainst: 18,
      goalDifference: 17,
      last8: ['W', 'W', 'D', 'W', 'W', 'W', 'D', 'W'],
    },
    {
      position: 3,
      team: 'WAT',
      played: 17,
      wins: 11,
      draws: 1,
      losses: 5,
      points: 34,
      goalsFor: 32,
      goalsAgainst: 21,
      goalDifference: 11,
      last8: ['W', 'L', 'W', 'W', 'L', 'W', 'W', 'W'],
    },
    {
      position: 4,
      team: 'NOR',
      played: 17,
      wins: 10,
      draws: 3,
      losses: 4,
      points: 33,
      goalsFor: 28,
      goalsAgainst: 19,
      goalDifference: 9,
      last8: ['W', 'D', 'W', 'L', 'W', 'W', 'D', 'W'],
    },
    {
      position: 5,
      team: 'BRE',
      played: 17,
      wins: 9,
      draws: 4,
      losses: 4,
      points: 31,
      goalsFor: 26,
      goalsAgainst: 20,
      goalDifference: 6,
      last8: ['W', 'D', 'L', 'W', 'D', 'W', 'W', 'D'],
    },
    {
      position: 6,
      team: 'WOL',
      played: 17,
      wins: 8,
      draws: 6,
      losses: 3,
      points: 30,
      goalsFor: 24,
      goalsAgainst: 17,
      goalDifference: 7,
      last8: ['D', 'W', 'D', 'W', 'D', 'D', 'W', 'W'],
    },
    {
      position: 7,
      team: 'MCI',
      played: 17,
      wins: 8,
      draws: 5,
      losses: 4,
      points: 29,
      goalsFor: 31,
      goalsAgainst: 22,
      goalDifference: 9,
      last8: ['W', 'D', 'L', 'W', 'D', 'W', 'D', 'W'],
    },
    {
      position: 8,
      team: 'MUN',
      played: 17,
      wins: 8,
      draws: 4,
      losses: 5,
      points: 28,
      goalsFor: 23,
      goalsAgainst: 24,
      goalDifference: -1,
      last8: ['L', 'W', 'W', 'D', 'L', 'W', 'W', 'D'],
    },
    {
      position: 9,
      team: 'LIV',
      played: 17,
      wins: 7,
      draws: 6,
      losses: 4,
      points: 27,
      goalsFor: 25,
      goalsAgainst: 22,
      goalDifference: 3,
      last8: ['D', 'W', 'D', 'L', 'D', 'W', 'D', 'W'],
    },
    {
      position: 10,
      team: 'CHE',
      played: 17,
      wins: 7,
      draws: 5,
      losses: 5,
      points: 26,
      goalsFor: 22,
      goalsAgainst: 23,
      goalDifference: -1,
      last8: ['W', 'L', 'D', 'W', 'L', 'D', 'W', 'D'],
    },
    {
      position: 11,
      team: 'ARS',
      played: 17,
      wins: 7,
      draws: 4,
      losses: 6,
      points: 25,
      goalsFor: 21,
      goalsAgainst: 25,
      goalDifference: -4,
      last8: ['L', 'W', 'D', 'L', 'W', 'W', 'D', 'L'],
    },
    {
      position: 12,
      team: 'MCU',
      played: 17,
      wins: 6,
      draws: 6,
      losses: 5,
      points: 24,
      goalsFor: 20,
      goalsAgainst: 22,
      goalDifference: -2,
      last8: ['D', 'L', 'W', 'D', 'D', 'W', 'L', 'D'],
    },
    {
      position: 13,
      team: 'CIA',
      played: 17,
      wins: 6,
      draws: 5,
      losses: 6,
      points: 23,
      goalsFor: 19,
      goalsAgainst: 24,
      goalDifference: -5,
      last8: ['L', 'D', 'W', 'L', 'D', 'L', 'W', 'D'],
    },
    {
      position: 14,
      team: 'GBI',
      played: 17,
      wins: 5,
      draws: 7,
      losses: 5,
      points: 22,
      goalsFor: 18,
      goalsAgainst: 23,
      goalDifference: -5,
      last8: ['D', 'D', 'L', 'D', 'W', 'D', 'L', 'D'],
    },
    {
      position: 15,
      team: 'NSC',
      played: 17,
      wins: 5,
      draws: 6,
      losses: 6,
      points: 21,
      goalsFor: 17,
      goalsAgainst: 25,
      goalDifference: -8,
      last8: ['L', 'D', 'W', 'L', 'D', 'L', 'D', 'W'],
    },
    {
      position: 16,
      team: 'FBI',
      played: 17,
      wins: 4,
      draws: 8,
      losses: 5,
      points: 20,
      goalsFor: 16,
      goalsAgainst: 24,
      goalDifference: -8,
      last8: ['D', 'L', 'D', 'D', 'L', 'D', 'D', 'D'],
    },
    {
      position: 17,
      team: 'NAP',
      played: 17,
      wins: 4,
      draws: 6,
      losses: 7,
      points: 18,
      goalsFor: 15,
      goalsAgainst: 27,
      goalDifference: -12,
      last8: ['L', 'D', 'L', 'W', 'L', 'D', 'L', 'D'],
    },
    {
      position: 18,
      team: 'LOT',
      played: 17,
      wins: 3,
      draws: 7,
      losses: 7,
      points: 16,
      goalsFor: 14,
      goalsAgainst: 28,
      goalDifference: -14,
      last8: ['L', 'D', 'L', 'D', 'L', 'W', 'D', 'L'],
    },
    {
      position: 19,
      team: 'ARC',
      played: 17,
      wins: 2,
      draws: 6,
      losses: 9,
      points: 12,
      goalsFor: 12,
      goalsAgainst: 32,
      goalDifference: -20,
      last8: ['L', 'L', 'D', 'L', 'L', 'D', 'W', 'L'],
    },
    {
      position: 20,
      team: 'UDO',
      played: 17,
      wins: 1,
      draws: 4,
      losses: 12,
      points: 7,
      goalsFor: 9,
      goalsAgainst: 38,
      goalDifference: -29,
      last8: ['L', 'L', 'L', 'D', 'L', 'L', 'L', 'W'],
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

      // Extract and set language from URL immediately
      const parts = initCode.split('-')
      console.log('Root context - parsing init code:', initCode, parts)

      if (parts.length >= 4) {
        // Format: TEST-USD-en-US
        const langPart = parts[2].toLowerCase() // 'en'
        console.log('Setting language from URL (4 parts):', langPart)
        i18n.changeLanguage(langPart)
      } else if (parts.length >= 3) {
        // Format: TEST-RUS-ru-RU
        const langPart = parts[2].toLowerCase() // 'ru'
        console.log('Setting language from URL (3 parts):', langPart)
        i18n.changeLanguage(langPart)
      }
    } else {
      localStorage.removeItem('initCode')
      setIsLoading(false)
    }

    setInitCode(initCode)
  }, [i18n])

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
        } as UserApiResponse

        if (userData?.status === '1024') {
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
        { length: 10 },
        (_, index) => {
          const date = new Date(rounds[0].mag_event[0].startTime)
          date.setMinutes(date.getMinutes() - (index + 1) * 3)

          return {
            id: 10 - index,
            name: ` Trident round ${10 - index}`,
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
        eventResults: [
          ...(prev.eventResults || []).filter(
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

      const horseChannel = horseEvents.channels?.[1]

      const upcomingHorseEvents: UpcomingEvent[] = horseChannel.next_events.map(
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

      // ✅ Chiamate API parallele per ottenere i dettagli di ogni evento
      const horseEventResults: EventResult[] = await Promise.all(
        horseChannel.prev_events.map(
          async (event: {
            arrival: {
              name: string
              number: number
            }[]
            int_event_id: number
            ext_pal_id: string
            start_time: string
            time: string
          }) => {
            let startTime: Date
            try {
              startTime = new Date(event.time)

              if (isNaN(startTime.getTime()) && event.start_time) {
                startTime = new Date()
                const [hours, minutes] = event.start_time.split(':')
                if (hours && minutes) {
                  startTime.setHours(parseInt(hours, 10))
                  startTime.setMinutes(parseInt(minutes, 10))
                  startTime.setSeconds(0)
                  startTime.setMilliseconds(0)
                }
              }

              if (isNaN(startTime.getTime())) {
                startTime = new Date()
              }
            } catch {
              startTime = new Date()
            }

            // ✅ Chiama l'API per ottenere i dettagli completi dell'evento
            let detailedResult = null
            try {
              const response = await fetch(
                `https://apidev.pgvirtual.eu/api/event/results/${event.ext_pal_id}/${event.int_event_id}`,
                {
                  headers: {
                    accept: 'application/json',
                    'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
                    authorization:
                      'Bearer ffffffff-ffff-ffff-ffff-ffffffffffee',
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
                  method: 'GET',
                  mode: 'cors',
                  credentials: 'include',
                },
              )

              if (response.ok) {
                detailedResult = await response.json()
              }
            } catch (error) {
              console.warn('Failed to fetch detailed horse result:', error)
            }

            return {
              id: event.int_event_id,
              extId: event.ext_pal_id,
              name: ` Horse Race ${event.int_event_id}`,
              startTime,
              time: event.time,
              discipline: Discipline.HORSES,
              result: {
                podium: event.arrival.map((horse, index) => ({
                  name: horse.name,
                  number: horse.number,
                  position: index + 1,
                })),
                odds: (detailedResult as any)?.odds || {
                  winner: {},
                  placed: {},
                  show: {},
                  exacta: {},
                  quinella: {},
                  trifecta: {},
                  boxedtrifecta: {},
                  evenodd: {},
                  underover: {},
                },
              } as RaceResult,
            } as EventResult
          },
        ),
      )

      setRootContext((prev) => ({
        ...prev,
        upcomingEvents: [
          ...(prev.upcomingEvents?.filter(
            (event) => event.discipline !== Discipline.HORSES,
          ) || []),
          ...upcomingHorseEvents,
        ],
        eventResults: [
          ...(prev.eventResults || []).filter(
            (e) => e.discipline !== Discipline.HORSES,
          ),
          ...horseEventResults,
        ],
      }))
    }

    const fetchUpcomingDogEvents = async () => {
      try {
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
          throw new Error('Failed to fetch dog events')
        }

        const dogEvents = await response.json()
        const dogChannel = dogEvents.channels?.[0]

        // Controlli di sicurezza
        if (
          !dogChannel ||
          !dogChannel.next_events ||
          !Array.isArray(dogChannel.next_events)
        ) {
          console.warn('Invalid dog channel data:', dogChannel)
          return
        }

        const upcomingDogEvents: UpcomingEvent[] = dogChannel.next_events.map(
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
              duration: dogEvents.channels[1]?.duration?.[index] || 3,
              name: `Dog `,
              startTime: event.start_time,
              time: startTime,
              discipline: Discipline.DOGS,
            }
          },
        )

        // Controllo per prev_events
        const dogEventResults: EventResult[] =
          dogChannel.prev_events && Array.isArray(dogChannel.prev_events)
            ? await Promise.all(
                dogChannel.prev_events.map(
                  async (event: {
                    arrival: {
                      name: string
                      number: number
                    }[]
                    int_event_id: number
                    ext_pal_id: string
                    start_time: string
                    time: number
                  }) => {
                    let startTime: Date
                    try {
                      if (typeof event.time === 'number') {
                        startTime =
                          event.time > 1000000000000
                            ? new Date(event.time)
                            : new Date(event.time * 1000)
                      } else {
                        startTime = new Date(event.time)
                      }

                      if (event.start_time && !isNaN(startTime.getTime())) {
                        const [hours, minutes] = event.start_time.split(':')
                        if (hours && minutes) {
                          startTime.setHours(parseInt(hours, 10))
                          startTime.setMinutes(parseInt(minutes, 10))
                        }
                      }

                      if (isNaN(startTime.getTime())) {
                        startTime = new Date()
                      }
                    } catch {
                      startTime = new Date()
                    }

                    // ✅ Chiama l'API per ottenere i dettagli completi dell'evento
                    let detailedResult = null
                    try {
                      const response = await fetch(
                        `https://apidev.pgvirtual.eu/api/event/results/${event.ext_pal_id}/${event.int_event_id}`,
                        {
                          headers: {
                            accept: 'application/json',
                            'accept-language':
                              'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
                            authorization:
                              'Bearer ffffffff-ffff-ffff-ffff-ffffffffffee',
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
                          method: 'GET',
                          mode: 'cors',
                          credentials: 'include',
                        },
                      )

                      if (response.ok) {
                        detailedResult = await response.json()
                      }
                    } catch (error) {
                      console.warn(
                        'Failed to fetch detailed dog result:',
                        error,
                      )
                    }

                    return {
                      id: event.int_event_id,
                      extId: event.ext_pal_id,
                      name: ` Dog Race ${event.int_event_id}`,
                      startTime,
                      time: event.time,
                      discipline: Discipline.DOGS,
                      result: {
                        podium:
                          event.arrival?.map((dog, index) => ({
                            name: dog.name,
                            number: dog.number,
                            position: index + 1,
                          })) || [],
                        odds: (detailedResult as any)?.odds || {
                          winner: {},
                          placed: {},
                          show: {},
                          exacta: {},
                          quinella: {},
                          trifecta: {},
                          boxedtrifecta: {},
                          evenodd: {},
                          underover: {},
                        },
                      } as RaceResult,
                    } as EventResult
                  },
                ),
              )
            : []

        setRootContext((prev) => ({
          ...prev,
          upcomingEvents: [
            ...(prev.upcomingEvents?.filter(
              (event) => event.discipline !== Discipline.DOGS,
            ) || []),
            ...upcomingDogEvents,
          ],
          eventResults: [
            ...(prev.eventResults || []).filter(
              (e) => e.discipline !== Discipline.DOGS,
            ),
            ...dogEventResults,
          ],
        }))
      } catch (error) {
        console.error('Error fetching dog events:', error)
      }
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
