import { RootContext } from '@/retail-contexts/root-context'
import { Discipline, EventResult, RaceResult } from '@/retail-lib/types'
import { getRacerColors } from '@/retail-lib/utils'
import { format } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import LoadingSpinner from './loading-spinner'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { ScrollArea } from './ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { t } from 'i18next'

const dates = Array.from({ length: 10 }, (_, index) => {
  const date = new Date()
  date.setDate(date.getDate() - index)
  return date.toLocaleDateString('it-IT')
})

const timeSlots = [
  '00:00 | 03:00',
  '03:00 | 07:00',
  '07:00 | 09:00',
  '09:00 | 11:00',
  '11:00 | 13:00',
  '13:00 | 15:00',
  '15:00 | 17:00',
  '17:00 | 19:00',
  '19:00 | 21:00',
  '21:00 | 23:59',
]

export default function SearchEventResults() {
  const { t } = useTranslation()
  const rootContext = useContext(RootContext)
  const [selectedDiscipline, setSelectedDiscipline] = useState<
    Discipline | 'NONE'
  >('NONE')
  const [selectedDate, setSelectedDate] = useState<string>(dates[0])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('ALL')
  const [lastTenGames, setLastTenGames] = useState<boolean>(true)
  const [fetchedResults, setFetchedResults] = useState<EventResult[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const fetchDetailedEventResult = useCallback(
    async (extId: string, eventId: string) => {
      try {
        const response = await fetch(
          `https://apidev.pgvirtual.eu/api/event/results/${extId}/${eventId}`,
          {
            headers: {
              accept: 'application/json',
              'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
              authorization: `Bearer ${rootContext.initCode}`,
              'content-type': 'application/json',
              operator: 'pg',
              priority: 'u=1, i',
              'sec-ch-ua':
                '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
              'sec-ch-ua-mobile': '?1',
              'sec-ch-ua-platform': '"Android"',
              'sec-fetch-dest': 'empty',
              'sec-fetch-mode': 'cors',
              'sec-fetch-site': 'same-site',
            },
            referrer: 'https://test.pgvirtual.eu/',
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
          },
        )

        if (!response.ok) {
          return null
        }

        return await response.json()
      } catch {
        return null
      }
    },
    [rootContext.initCode],
  )

  useEffect(() => {
    if (selectedDiscipline === 'NONE') {
      setFetchedResults([])
      return
    }

    if (lastTenGames) {
      const existingResults = (rootContext.eventResults || []).filter(
        (result) => result.discipline === selectedDiscipline,
      )

      if (existingResults.length > 0) {
        return
      }

      if (
        selectedDiscipline === Discipline.HORSES ||
        selectedDiscipline === Discipline.DOGS
      ) {
        const fetchRacingResults = async () => {
          setIsLoading(true)
          try {
            const response = await fetch(
              'https://apidev.pgvirtual.eu/api/event/list',
              {
                headers: {
                  accept: 'application/json',
                  'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
                  authorization: `Bearer ${rootContext.initCode}`,
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

            if (!response.ok) {
              throw new Error('Failed to fetch racing events')
            }

            const racingEvents = await response.json()

            // Extract results based on selected discipline
            const channelIndex = selectedDiscipline === Discipline.DOGS ? 0 : 1
            const channel = racingEvents.channels?.[channelIndex]

            if (channel?.prev_events) {
              const results: EventResult[] = await Promise.all(
                channel.prev_events.map(async (event: any) => ({
                  id: event.int_event_id,
                  extId: event.ext_pal_id,
                  name: `${selectedDiscipline === Discipline.DOGS ? 'Dog' : 'Horse'} Race ${event.int_event_id}`,
                  startTime: new Date(event.time),
                  discipline: selectedDiscipline,
                  result: {
                    podium:
                      event.arrival?.map((competitor: any, index: number) => ({
                        name: competitor.name,
                        number: competitor.number,
                        position: index + 1,
                      })) || [],
                    odds: {},
                  },
                })),
              )

              setFetchedResults(results)
            }
          } catch (error) {
            console.error('Failed to fetch racing results:', error)
            setFetchedResults([])
          } finally {
            setIsLoading(false)
          }
        }

        fetchRacingResults()
      }
      return
    }

    if (!selectedDate) {
      setFetchedResults([])
      return
    }

    const fetchEventResults = async (discipline: Discipline, date: string) => {
      setIsLoading(true)

      try {
        const apiDateFormat = date

        const gameIds =
          discipline === Discipline.HORSES
            ? 'horses6'
            : discipline === Discipline.DOGS
              ? 'dogs6'
              : `${discipline.toLowerCase()}6`

        const requestBody = {
          gameIds: [gameIds],
          dateStart: apiDateFormat,
          dateEnd: apiDateFormat,
        }

        const response = await fetch(
          'https://apidev.pgvirtual.eu/api/event/results/list',
          {
            headers: {
              accept: 'application/json',
              'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
              authorization: `Bearer ${rootContext.initCode}`,
              'content-type': 'application/json',
              operator: 'pg',
              priority: 'u=1, i',
              'sec-ch-ua':
                '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
              'sec-ch-ua-mobile': '?1',
              'sec-ch-ua-platform': '"Android"',
              'sec-fetch-dest': 'empty',
              'sec-fetch-mode': 'cors',
              'sec-fetch-site': 'same-site',
            },
            referrer: 'https://test.pgvirtual.eu/',
            body: JSON.stringify(requestBody),
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
          },
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (!data.items || !Array.isArray(data.items)) {
          setFetchedResults([])
          return
        }

        let results: EventResult[]

        if (
          discipline === Discipline.HORSES ||
          discipline === Discipline.DOGS
        ) {
          results = await Promise.all(
            data.items.map(async (result: any) => {
              const detailedResult = await fetchDetailedEventResult(
                result.ext_pal_id,
                result.int_event_id.toString(),
              )

              let startTime: Date
              try {
                if (result.time) {
                  startTime = new Date(result.time)

                  if (result.start_time && result.start_time.includes(':')) {
                    const [hours, minutes] = result.start_time.split(':')
                    startTime.setHours(parseInt(hours, 10))
                    startTime.setMinutes(parseInt(minutes, 10))
                  }
                } else {
                  startTime = new Date(date.split('/').reverse().join('-'))
                  if (result.start_time && result.start_time.includes(':')) {
                    const [hours, minutes] = result.start_time.split(':')
                    startTime.setHours(parseInt(hours, 10))
                    startTime.setMinutes(parseInt(minutes, 10))
                  }
                }
              } catch {
                startTime = new Date()
              }

              let raceResult = detailedResult
              if (detailedResult && !detailedResult.arrival && result.arrival) {
                raceResult = {
                  ...detailedResult,
                  arrival: result.arrival,
                }
              }

              return {
                id: result.int_event_id,
                extId: result.ext_pal_id,
                name:
                  detailedResult?.track_name ||
                  result.track_name ||
                  `${discipline} Race ${result.int_event_id}`,
                startTime,
                discipline: discipline,
                result: raceResult,
              } as EventResult
            }),
          )
        } else if (discipline === Discipline.SOCCER) {
          results = data.items.map((result: any) => {
            let startTime: Date
            try {
              startTime = new Date(result.time)
              if (result.start_time && result.start_time.includes(':')) {
                const [hours, minutes] = result.start_time.split(':')
                startTime.setHours(parseInt(hours, 10))
                startTime.setMinutes(parseInt(minutes, 10))
              }
            } catch {
              startTime = new Date()
            }

            return {
              id: result.int_event_id,
              extId: result.ext_pal_id,
              name: result.round_name || `Soccer Match ${result.int_event_id}`,
              startTime,
              discipline: Discipline.SOCCER,
              result: {
                round: {
                  name: result.round_name || 'Unknown Round',
                  number: result.round_number || 0,
                },
                teams: result.teams || 'Team A - Team B',
                score1: result.score1 || 0,
                score2: result.score2 || 0,
                odds: result.odds || null,
              },
            } as EventResult
          })
        } else {
          results = data.items.map((result: any) => {
            let startTime: Date
            try {
              startTime = new Date(result.time)
              if (result.start_time && result.start_time.includes(':')) {
                const [hours, minutes] = result.start_time.split(':')
                startTime.setHours(parseInt(hours, 10))
                startTime.setMinutes(parseInt(minutes, 10))
              }
            } catch {
              startTime = new Date()
            }

            return {
              id: result.int_event_id,
              extId: result.ext_pal_id,
              name: result.name || `${discipline} Event ${result.int_event_id}`,
              startTime,
              discipline: discipline,
            } as EventResult
          })
        }

        setFetchedResults(results)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        toast.error(`Failed to fetch results: ${message}`)
        setFetchedResults([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventResults(selectedDiscipline, selectedDate)
  }, [
    selectedDate,
    selectedDiscipline,
    lastTenGames,
    fetchDetailedEventResult,
    rootContext.eventResults,
    rootContext.initCode,
  ])

  const filteredEventResults = useMemo(() => {
    if (selectedDiscipline === 'NONE') {
      return []
    }

    if (lastTenGames) {
      const allResults = rootContext.eventResults || []
      const disciplineResults = allResults.filter(
        (result) => result.discipline === selectedDiscipline,
      )

      const resultsToUse =
        disciplineResults.length > 0
          ? disciplineResults
          : fetchedResults.filter(
              (result) => result.discipline === selectedDiscipline,
            )

      const filtered = resultsToUse
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
        .slice(0, 10)

      return filtered
    }

    if (!selectedDate) {
      return []
    }

    const resultsToFilter = fetchedResults

    const filteredResults = resultsToFilter.filter((result) => {
      if (result.discipline !== selectedDiscipline) {
        return false
      }

      if (selectedTimeSlot !== 'ALL') {
        const [startTimeStr, endTimeStr] = selectedTimeSlot.split(' | ')
        const [startHours, startMinutes] = startTimeStr.split(':').map(Number)
        const [endHours, endMinutes] = endTimeStr.split(':').map(Number)
        const hours = result.startTime.getHours()
        const minutes = result.startTime.getMinutes()
        const timeInMinutes = hours * 60 + minutes
        const startInMinutes = startHours * 60 + startMinutes
        const endInMinutes = endHours * 60 + endMinutes

        if (timeInMinutes < startInMinutes || timeInMinutes > endInMinutes) {
          return false
        }
      }

      return true
    })

    return filteredResults
  }, [
    selectedDiscipline,
    selectedDate,
    lastTenGames,
    fetchedResults,
    selectedTimeSlot,
    rootContext.eventResults,
  ])

  const handleReset = () => {
    setSelectedDiscipline('NONE')
    setSelectedDate(dates[0])
    setSelectedTimeSlot('ALL')
    setLastTenGames(false)
  }

  const formatSafeDate = (date: any): string => {
    try {
      if (date instanceof Date && !isNaN(date.getTime())) {
        return format(date, 'dd-MM-yyyy HH:mm')
      }

      const parsedDate = new Date(date)
      if (!isNaN(parsedDate.getTime())) {
        return format(parsedDate, 'dd-MM-yyyy HH:mm')
      }

      return 'Invalid Date'
    } catch {
      return 'Invalid Date'
    }
  }

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="flex flex-col items-center bg-accent p-2">
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex flex-row items-center gap-2 bg-badge text-background">
            <span className="whitespace-nowrap pl-2 text-[16px] font-semibold">
              {t('discipline')}
            </span>
            <Select
              value={selectedDiscipline.toString()}
              onValueChange={(value) => {
                setSelectedDiscipline(
                  value === 'NONE'
                    ? 'NONE'
                    : Discipline[value as keyof typeof Discipline],
                )
              }}
            >
              <SelectTrigger className="w-[130px] bg-background text-[16px] text-foreground">
                <SelectValue placeholder={t('sport')} />
              </SelectTrigger>
              <SelectContent className="bg-white p-0">
                <SelectItem value="NONE">{t('none')}</SelectItem>
                {Object.values(Discipline).map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row items-center gap-2">
            <Checkbox
              id="last10"
              className="h-6 w-6 bg-background text-foreground"
              checked={lastTenGames}
              onCheckedChange={(value) => setLastTenGames(!!value)}
            />
            <label
              htmlFor="last10"
              className="px-2 py-1 text-[16px] font-semibold text-background"
            >
              {t('last_10_games')}
            </label>
          </div>

          <div className="flex flex-row items-center gap-2 bg-badge text-background">
            <span className="whitespace-nowrap pl-2 text-[16px] font-semibold">
              {t('date')}
            </span>
            <Select
              value={selectedDate}
              onValueChange={(value) => {
                setSelectedDate(value)
              }}
              disabled={lastTenGames}
            >
              <SelectTrigger className="w-[130px] bg-background text-[16px] text-foreground">
                <SelectValue placeholder={t('date')} />
              </SelectTrigger>
              <SelectContent className="bg-white p-0">
                {dates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {date}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row items-center gap-2 bg-badge text-background">
            <span className="whitespace-nowrap pl-2 text-[16px] font-semibold">
              {t('time_slot')}
            </span>
            <Select
              value={selectedTimeSlot}
              onValueChange={setSelectedTimeSlot}
              disabled={lastTenGames}
            >
              <SelectTrigger className="w-[150px] bg-background text-[16px] text-foreground">
                <SelectValue placeholder={t('time_slot')} />
              </SelectTrigger>
              <SelectContent className="bg-white p-0">
                <SelectItem value="ALL">{t('all')}</SelectItem>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row items-center gap-2">
            <Button
              className="text-bold w-[80px] bg-tertiary text-[16px] text-tertiary-foreground"
              disabled={
                !selectedDate && !selectedDiscipline && !selectedTimeSlot
              }
              onClick={handleReset}
            >
              {t('reset')}
            </Button>
          </div>
        </div>
      </div>

      <div className="h-full overflow-auto pb-2">
        {selectedDiscipline !== 'NONE' ? (
          isLoading || (lastTenGames && rootContext.isLoadingEvents) ? (
            <div className="flex h-full flex-col items-center justify-center pt-4">
              <LoadingSpinner />
              <p className="mt-4 text-[16px] text-muted-foreground">
                {t('loading')}...
              </p>
            </div>
          ) : filteredEventResults.length > 0 ? (
            (() => {
              return (
                <ScrollArea className="pb-20">
                  <Accordion type="multiple" className="space-y-4">
                    {filteredEventResults.map((eventResult, index) => {
                      const uniqueKey = `${eventResult.discipline}-${eventResult.id}-${eventResult.extId || index}`
                      return (
                        <AccordionItem
                          key={uniqueKey}
                          value={uniqueKey}
                          className="gap-0"
                        >
                          <AccordionTrigger className="bg-accent p-2 text-base text-accent-foreground [&[data-state=open]>svg]:-rotate-90">
                            <div className="flex w-[600px] flex-row justify-between gap-2">
                              <div className="flex flex-row gap-2">
                                <span className="font-bold">
                                  {formatSafeDate(eventResult.startTime)}{' '}
                                  {eventResult.name}
                                  {' / '}
                                </span>
                                {eventResult.discipline ===
                                  Discipline.SOCCER && (
                                  <span>Soccer Match</span>
                                )}
                              </div>
                              <span className="font-bold">
                                {t('completed').toUpperCase()}
                              </span>
                            </div>
                            <ChevronRight className="h-6 w-6 shrink-0 transition-transform duration-200" />
                          </AccordionTrigger>
                          <AccordionContent>
                            <EventResultDetails eventResult={eventResult} />
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </ScrollArea>
              )
            })()
          ) : (
            <div className="flex h-full flex-col items-center justify-start pt-4">
              {t('no_results_found')}
            </div>
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-start">
            <p className="pt-4 text-[16px] text-black">
              {t('select_param_for_research')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function EventResultDetails({ eventResult }: { eventResult: EventResult }) {
  const [detailedResult, setDetailedResult] = useState<any>(null)

  useEffect(() => {
    if (eventResult.result && eventResult.result.odds) {
      setDetailedResult(eventResult.result)
      return
    }

    if (!eventResult.extId) {
      setDetailedResult(eventResult.result || null)
      return
    }
    setDetailedResult(eventResult.result || null)
    return
  }, [eventResult])

  if (!detailedResult) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        {t('no_detailed_results')}
      </div>
    )
  }

  if (
    (eventResult.discipline === Discipline.HORSES ||
      eventResult.discipline === Discipline.DOGS) &&
    detailedResult
  ) {
    if (
      false &&
      detailedResult.arrival &&
      Array.isArray(detailedResult.arrival) &&
      detailedResult.arrival.length > 0 &&
      !detailedResult.odds
    ) {
      return (
        <div className="space-y-4">
          <div className="border">
            <div className="bg-accent py-2 text-center">
              <div className="text-[16px] font-bold uppercase text-accent-foreground">
                {t('arrival_order').toUpperCase()}
              </div>
            </div>
            <div className="space-y-3 p-4">
              {detailedResult.arrival
                .slice(0, 3)
                .map((competitor: any, index: number) => {
                  let imageSrc = ''
                  let medalNumber = ''

                  switch (index + 1) {
                    case 1:
                      imageSrc = '/cockade_gold.png'
                      medalNumber = '1'
                      break
                    case 2:
                      imageSrc = '/cockade_silver.png'
                      medalNumber = '2'
                      break
                    case 3:
                      imageSrc = '/cockade_bronze.png'
                      medalNumber = '3'
                      break
                  }

                  return (
                    <div
                      key={competitor.number}
                      className="flex items-center gap-4"
                    >
                      <div className="relative flex h-12 w-12 items-center justify-center">
                        <Image
                          src={imageSrc}
                          alt={medalNumber}
                          width={48}
                          height={48}
                          className="absolute"
                        />
                        <div className="relative text-[18px] font-bold text-black">
                          {medalNumber}
                        </div>
                      </div>

                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-md text-[16px] font-bold ${(() => {
                          const colors = getRacerColors(
                            competitor.number,
                            eventResult.discipline as 'DOGS' | 'HORSES',
                          )
                          return `${colors.bg} ${colors.text} ${colors.border}`
                        })()}`}
                        style={
                          getRacerColors(
                            competitor.number,
                            eventResult.discipline as 'DOGS' | 'HORSES',
                          ).style
                        }
                      >
                        {competitor.number}
                      </div>

                      <div className="text-[16px] font-semibold">
                        {competitor.name}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )
    }

    if (detailedResult.odds) {
      const raceResult = detailedResult as RaceResult
      const disciplineName =
        eventResult.discipline === Discipline.HORSES ? 'Horse' : 'Dog'

      const formatSafeDate = (date: any): string => {
        try {
          if (date instanceof Date && !isNaN(date.getTime())) {
            return format(date, 'dd-MM-yyyy HH:mm')
          }

          const parsedDate = new Date(date)
          if (!isNaN(parsedDate.getTime())) {
            return format(parsedDate, 'dd-MM-yyyy HH:mm')
          }

          return t('invalid_date')
        } catch {
          return t('invalid_date')
        }
      }

      const extractExacta = (exacta: any) => {
        const results: Array<{ combination: string; odds: string }> = []

        Object.entries(exacta).forEach(([first, secondObj]: [string, any]) => {
          if (typeof secondObj === 'object') {
            Object.entries(secondObj).forEach(
              ([second, odds]: [string, any]) => {
                results.push({
                  combination: `${first}-${second}`,
                  odds: String(odds),
                })
              },
            )
          }
        })

        return results
      }

      const extractQuinella = (quinella: any) => {
        const results: Array<{ combination: string; odds: string }> = []

        Object.entries(quinella).forEach(
          ([first, secondObj]: [string, any]) => {
            if (typeof secondObj === 'object') {
              Object.entries(secondObj).forEach(
                ([second, odds]: [string, any]) => {
                  results.push({
                    combination: `${first}-${second}`,
                    odds: String(odds),
                  })
                },
              )
            }
          },
        )

        return results
      }

      const extractTrifecta = (trifecta: any) => {
        const results: Array<{ combination: string; odds: string }> = []

        Object.entries(trifecta).forEach(
          ([first, secondObj]: [string, any]) => {
            if (typeof secondObj === 'object') {
              Object.entries(secondObj).forEach(
                ([second, thirdObj]: [string, any]) => {
                  if (typeof thirdObj === 'object') {
                    Object.entries(thirdObj).forEach(
                      ([third, odds]: [string, any]) => {
                        results.push({
                          combination: `${first}-${second}-${third}`,
                          odds: String(odds),
                        })
                      },
                    )
                  }
                },
              )
            }
          },
        )

        return results
      }

      const extractBoxedTrifecta = (boxedtrifecta: any) => {
        const results: Array<{ combination: string; odds: string }> = []

        Object.entries(boxedtrifecta).forEach(
          ([first, secondObj]: [string, any]) => {
            if (typeof secondObj === 'object') {
              Object.entries(secondObj).forEach(
                ([second, thirdObj]: [string, any]) => {
                  if (typeof thirdObj === 'object') {
                    Object.entries(thirdObj).forEach(
                      ([third, odds]: [string, any]) => {
                        results.push({
                          combination: `${first}-${second}-${third}`,
                          odds: String(odds),
                        })
                      },
                    )
                  }
                },
              )
            }
          },
        )

        return results
      }

      return (
        <div className="space-y-4">
          {/* ARRIVAL ORDER - Mostra SEMPRE se presente */}
          {detailedResult.arrival &&
            Array.isArray(detailedResult.arrival) &&
            detailedResult.arrival.length > 0 && (
              <div className="border">
                <div className="bg-accent py-2 text-center">
                  <div className="text-[16px] font-bold uppercase text-accent-foreground">
                    {t('arrival_order').toUpperCase()}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-8 p-4">
                  {detailedResult.arrival
                    .slice(0, 3)
                    .map((competitor, index) => {
                      let imageSrc = ''
                      let medalNumber = ''

                      switch (index + 1) {
                        case 1:
                          imageSrc = '/cockade_gold.png'
                          medalNumber = '1'
                          break
                        case 2:
                          imageSrc = '/cockade_silver.png'
                          medalNumber = '2'
                          break
                        case 3:
                          imageSrc = '/cockade_bronze.png'
                          medalNumber = '3'
                          break
                      }

                      return (
                        <div
                          key={competitor.number || index}
                          className="flex items-center gap-2"
                        >
                          {/* Medaglia con numero */}
                          <div className="relative flex h-11 w-11 items-center justify-center">
                            <Image
                              src={imageSrc}
                              alt={medalNumber}
                              width={48}
                              height={48}
                              className="absolute"
                            />
                            <div className="relative pb-2 text-[20px] font-bold">
                              {medalNumber}
                            </div>
                          </div>

                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-md text-[16px] font-bold"
                            style={
                              getRacerColors(
                                competitor.number,
                                eventResult.discipline as 'DOGS' | 'HORSES',
                              ).style
                            }
                          >
                            {competitor.number}
                          </div>

                          <div className="min-w-0 pr-10 text-[16px] font-semibold">
                            {competitor.name}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

          <div className="grid grid-cols-3 gap-2">
            {/* WINNER */}
            {raceResult.odds.winner && (
              <div className="border">
                <div className="bg-accent py-2 text-center">
                  <div className="text-[16px] font-bold uppercase text-accent-foreground">
                    {t('winner').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  {Object.entries(raceResult.odds.winner).map(
                    ([number, odds]) => (
                      <div
                        key={number}
                        className="flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-md text-[16px] font-bold"
                            style={
                              getRacerColors(
                                parseInt(number),
                                eventResult.discipline as 'DOGS' | 'HORSES',
                              ).style
                            }
                          >
                            {number}
                          </div>
                          <span className="text-[16px] font-semibold">
                            {odds}
                          </span>
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* PLACED */}
            {raceResult.odds.placed && (
              <div className="border">
                <div className="bg-accent py-2 text-center">
                  <div className="text-[16px] font-bold uppercase text-accent-foreground">
                    {t('place_2').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  {Object.entries(raceResult.odds.placed).map(
                    ([number, odds]) => (
                      <div
                        key={number}
                        className="flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-md text-[16px] font-bold"
                            style={
                              getRacerColors(
                                parseInt(number),
                                eventResult.discipline as 'DOGS' | 'HORSES',
                              ).style
                            }
                          >
                            {number}
                          </div>
                          <span className="text-[16px] font-semibold">
                            {odds}
                          </span>
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* SHOW */}
            {raceResult.odds.show && (
              <div className="border">
                <div className="bg-accent py-2 text-center">
                  <div className="text-[16px] font-bold uppercase text-accent-foreground">
                    {t('show_3').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  {Object.entries(raceResult.odds.show).map(
                    ([number, odds]) => (
                      <div
                        key={number}
                        className="flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-md text-[16px] font-bold"
                            style={
                              getRacerColors(
                                parseInt(number),
                                eventResult.discipline as 'DOGS' | 'HORSES',
                              ).style
                            }
                          >
                            {number}
                          </div>
                          <span className="text-[16px] font-semibold">
                            {odds}
                          </span>
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1">
            {/* EXACTA */}
            {raceResult.odds.exacta && (
              <div className="border">
                <div className="bg-accent py-2 text-center">
                  <div className="text-[16px] font-bold uppercase text-accent-foreground">
                    {t('exacta').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  {extractExacta(raceResult.odds.exacta).map(
                    ({ combination, odds }) => (
                      <div
                        key={combination}
                        className="flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1">
                          {combination.split('-').map((num, idx) => (
                            <div
                              key={idx}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-[16px] font-bold"
                              style={
                                getRacerColors(
                                  parseInt(num),
                                  eventResult.discipline as 'DOGS' | 'HORSES',
                                ).style
                              }
                            >
                              {num}
                            </div>
                          ))}
                        </span>
                        <span className="text-[16px] font-semibold">
                          {odds}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* QUINELLA */}
            {raceResult.odds.quinella && (
              <div className="border">
                <div className="bg-accent py-2 text-center">
                  <div className="text-[16px] font-bold uppercase text-accent-foreground">
                    {t('quinella').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  {extractQuinella(raceResult.odds.quinella).map(
                    ({ combination, odds }) => (
                      <div
                        key={combination}
                        className="flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1">
                          {combination.split('-').map((num, idx) => (
                            <div
                              key={idx}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-[16px] font-bold"
                              style={
                                getRacerColors(
                                  parseInt(num),
                                  eventResult.discipline as 'DOGS' | 'HORSES',
                                ).style
                              }
                            >
                              {num}
                            </div>
                          ))}
                        </span>
                        <span className="text-[16px] font-semibold">
                          {odds}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* TRIFECTA */}
            {raceResult.odds.trifecta && (
              <div className="border">
                <div className="bg-accent py-2 text-center">
                  <div className="text-[16px] font-bold uppercase text-accent-foreground">
                    {t('trifecta').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  {extractTrifecta(raceResult.odds.trifecta).map(
                    ({ combination, odds }) => (
                      <div
                        key={combination}
                        className="flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1">
                          {combination.split('-').map((num, idx) => (
                            <div
                              key={idx}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-[16px] font-bold"
                              style={
                                getRacerColors(
                                  parseInt(num),
                                  eventResult.discipline as 'DOGS' | 'HORSES',
                                ).style
                              }
                            >
                              {num}
                            </div>
                          ))}
                        </span>
                        <span className="text-[16px] font-semibold">
                          {odds}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* BOX TRIFECTA */}
            {raceResult.odds.boxedtrifecta && (
              <div className="border">
                <div className="bg-accent py-2 text-center">
                  <div className="text-[16px] font-bold uppercase text-accent-foreground">
                    {t('boxed_trifecta').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  {extractBoxedTrifecta(raceResult.odds.boxedtrifecta).map(
                    ({ combination, odds }) => (
                      <div
                        key={combination}
                        className="flex items-center justify-between"
                      >
                        <span className="flex items-center justify-center gap-1">
                          {combination.split('-').map((num, idx) => (
                            <div
                              key={idx}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-[16px] font-bold"
                              style={
                                getRacerColors(
                                  parseInt(num),
                                  eventResult.discipline as 'DOGS' | 'HORSES',
                                ).style
                              }
                            >
                              {num}
                            </div>
                          ))}
                        </span>
                        <span className="text-[16px] font-semibold">
                          {odds}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1">
            {/* EVEN/ODD */}
            {raceResult.odds.evenodd && (
              <div className="border">
                <div className="bg-accent py-2 text-center">
                  <div className="text-[16px] font-bold uppercase text-accent-foreground">
                    {t('even_odd').toUpperCase()}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  {raceResult.odds.evenodd.even && (
                    <div className="text-center">
                      <div className="py-2 text-[16px] font-semibold">
                        {t('even')}: {raceResult.odds.evenodd.even}
                      </div>
                    </div>
                  )}
                  {raceResult.odds.evenodd.odd && (
                    <div className="text-center">
                      <div className="py-2 text-[16px] font-semibold">
                        {t('odd')}: {raceResult.odds.evenodd.odd}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* UNDER/OVER */}
            {raceResult.odds.underover && (
              <div className="border">
                <div className="bg-accent py-2 text-center">
                  <div className="text-[16px] font-bold uppercase text-accent-foreground">
                    {t('under_over')} 3.5
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  {raceResult.odds.underover.under && (
                    <div className="text-center">
                      <div className="py-2 text-[16px] font-semibold">
                        {t('under')}: {raceResult.odds.underover.under}
                      </div>
                    </div>
                  )}
                  {raceResult.odds.underover.over && (
                    <div className="text-center">
                      <div className="py-2 text-[16px] font-semibold">
                        {t('over')}: {raceResult.odds.underover.over}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-1">
            {/* RACE DURATION */}
            {raceResult.raceDuration && (
              <div className="border">
                <div className="bg-accent py-2 text-center">
                  <div className="text-[16px] font-bold uppercase text-accent-foreground">
                    {t('race_duration').toUpperCase()}
                  </div>
                </div>
                <div className="p-3 text-center">
                  <div className="text-[16px] font-semibold">
                    {raceResult.raceDuration} {t('seconds')}
                  </div>
                </div>
              </div>
            )}

            {/* TRACK INFO */}
            <div className="border">
              <div className="bg-accent py-2 text-center">
                <div className="text-[16px] font-bold uppercase text-accent-foreground">
                  {disciplineName} RACING
                </div>
              </div>
              <div className="space-y-1 p-3">
                <div className="text-[16px]">
                  <span className="font-semibold">{t('track')}:</span>{' '}
                  {t('track')} {eventResult.extId}
                </div>
                <div className="text-[16px]">
                  <span className="font-semibold">{t('event')}:</span>{' '}
                  {eventResult.id}
                </div>
                <div className="text-[16px]">
                  <span className="font-semibold">{t('start_time')}:</span>{' '}
                  {formatSafeDate(eventResult.startTime)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Fallback se non ci sono né arrival né odds
    return (
      <div className="p-4 text-center text-muted-foreground">
        {t('event_completed_detailed_results')}
        <div className="mt-2 text-xs">
          DEBUG: {JSON.stringify(Object.keys(detailedResult))}
        </div>
      </div>
    )
  }

  // CALCIO
  if (eventResult.discipline === Discipline.SOCCER) {
    const formatSafeDate = (date: any): string => {
      try {
        if (date instanceof Date && !isNaN(date.getTime())) {
          return format(date, 'dd-MM-yyyy HH:mm')
        }

        const parsedDate = new Date(date)
        if (!isNaN(parsedDate.getTime())) {
          return format(parsedDate, 'dd-MM-yyyy HH:mm')
        }

        return 'Invalid Date'
      } catch {
        return 'Invalid Date'
      }
    }

    return (
      <div className="space-y-4">
        {/* Teams e Score */}
        <div className="border">
          <div className="bg-accent py-2 text-center">
            <div className="text-[16px] font-bold uppercase text-accent-foreground">
              {t('match_result').toUpperCase()}
            </div>
          </div>
          <div className="p-4 text-center">
            <div className="mb-2 text-[18px] font-bold">
              {detailedResult.teams}
            </div>
            <div className="text-[24px] font-bold">
              {detailedResult.score1} - {detailedResult.score2}
            </div>
          </div>
        </div>

        {/* Betting Markets */}
        <div className="grid grid-cols-2 gap-4">
          {/* 1X2 */}
          {detailedResult.odds?.oneXTwo && (
            <div className="border">
              <div className="bg-accent py-2 text-center">
                <div className="text-[16px] font-bold uppercase text-accent-foreground">
                  1X2
                </div>
              </div>
              <div className="p-3 text-center">
                <div className="text-[16px] font-semibold">
                  {t('odds')}: {detailedResult.odds.oneXTwo.odds}
                </div>
              </div>
            </div>
          )}

          {/* Double Chance */}
          {detailedResult.odds?.doubleChance && (
            <div className="border">
              <div className="bg-accent py-2 text-center">
                <div className="text-[16px] font-bold uppercase text-accent-foreground">
                  {t('double_chance').toUpperCase()}
                </div>
              </div>
              <div className="p-3 text-center">
                <div className="text-[16px] font-semibold">
                  {t('odds')}: {detailedResult.odds.doubleChance.odds}
                </div>
              </div>
            </div>
          )}

          {/* First Scorer */}
          {detailedResult.odds?.firstScorer && (
            <div className="border">
              <div className="bg-accent py-2 text-center">
                <div className="text-[16px] font-bold uppercase text-accent-foreground">
                  {t('first_scorer').toUpperCase()}
                </div>
              </div>
              <div className="p-3 text-center">
                <div className="mb-1 text-[14px]">
                  {t('team')}: {detailedResult.odds.firstScorer.teamLabel}
                </div>
                <div className="text-[16px] font-semibold">
                  {t('odds')}: {detailedResult.odds.firstScorer.odds}
                </div>
              </div>
            </div>
          )}

          {/* Sum Goals */}
          {detailedResult.odds?.sumGoals && (
            <div className="border">
              <div className="bg-accent py-2 text-center">
                <div className="text-[16px] font-bold uppercase text-accent-foreground">
                  {t('total_goals').toUpperCase()}
                </div>
              </div>
              <div className="p-3 text-center">
                <div className="mb-1 text-[14px]">
                  {t('goals')}: {detailedResult.odds.sumGoals.value}
                </div>
                <div className="text-[16px] font-semibold">
                  {t('odds')}: {detailedResult.odds.sumGoals.odds}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Round Info */}
        <div className="border">
          <div className="bg-accent py-2 text-center">
            <div className="text-[16px] font-bold uppercase text-accent-foreground">
              {t('match_info').toUpperCase()}
            </div>
          </div>
          <div className="space-y-1 p-3">
            <div className="text-[14px]">
              <span className="font-semibold">{t('round_name')}:</span>{' '}
              {detailedResult.round?.name}
            </div>
            <div className="text-[14px]">
              <span className="font-semibold">{t('match')}:</span> #
              {detailedResult.round?.number}
            </div>
            <div className="text-[14px]">
              <span className="font-semibold">{t('start_time')}:</span>{' '}
              {formatSafeDate(eventResult.startTime)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 text-center text-muted-foreground">
      {t('event_completed_detailed_results')}
    </div>
  )
}
