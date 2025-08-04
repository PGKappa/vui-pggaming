import { RootContext } from '@/retail-contexts/root-context'
import { Discipline, EventResult, RaceResult } from '@/retail-lib/types'
import { format } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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

export default function SearchEventResults(props: {
  onClose: () => void
  eventResults: EventResult[]
}) {
  const { t } = useTranslation()
  const rootContext = useContext(RootContext)
  const [selectedDiscipline, setSelectedDiscipline] = useState<
    Discipline | 'NONE'
  >('NONE')
  const [selectedDate, setSelectedDate] = useState<string>()
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('ALL')
  const [lastTenGames, setLastTenGames] = useState<boolean>(true)

  const eventResults = props.eventResults

  const fetchDetailedEventResult = async (extId: string, eventId: string) => {
    try {
      const response = await fetch(
        `https://apidev.pgvirtual.eu/api/event/results/${extId}/${eventId}`,
        {
          headers: {
            accept: 'application/json',
            'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
            authorization: 'Bearer ffffffff-ffff-ffff-ffff-ffffffffffee',
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
        console.warn(`Failed to fetch detailed results for event ${eventId}`)
        return null
      }

      return await response.json()
    } catch (error) {
      console.warn(
        `Error fetching detailed results for event ${eventId}:`,
        error,
      )
      return null
    }
  }

  useEffect(() => {
    if (selectedDiscipline === 'NONE') {
      return
    }

    if (lastTenGames) {
      return
    }

    if (selectedDiscipline === Discipline.SOCCER) {
      return
    }

    if (!selectedDate) {
      return
    }

    const fetchEventResults = async (discipline: Discipline, date: string) => {
      try {
        const gameIds =
          discipline === Discipline.HORSES
            ? 'horses6'
            : discipline === Discipline.DOGS
              ? 'dogs6'
              : `${discipline.toLowerCase()}6`

        const response = await fetch(
          'https://apidev.pgvirtual.eu/api/event/results/list',
          {
            headers: {
              accept: 'application/json',
              'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
              authorization: 'Bearer ffffffff-ffff-ffff-ffff-ffffffffffee',
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
            body: JSON.stringify({
              gameIds: [gameIds],
              dateStart: date,
              dateEnd: date,
            }),
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
          },
        )

        if (!response.ok) {
          throw new Error('Failed to fetch event results')
        }
        const data = await response.json()

        let results: EventResult[]

        if (discipline === Discipline.HORSES) {
          console.log('Processing HORSES')
          results = await Promise.all(
            data.items.map(async (result: any) => {
              const detailedResult = await fetchDetailedEventResult(
                result.ext_pal_id,
                result.int_event_id.toString(),
              )

              const startTime = new Date(result.time)
              const hours = result.start_time.split(':')[0]
              const minutes = result.start_time.split(':')[1]
              startTime.setHours(parseInt(hours, 10))
              startTime.setMinutes(parseInt(minutes, 10))

              return {
                id: result.int_event_id,
                extId: result.ext_pal_id,
                name:
                  detailedResult?.track_name ||
                  result.track_name ||
                  `${result.discipline} Race ${result.int_event_id}`,
                startTime,
                discipline: Discipline.HORSES,
              } as EventResult
            }),
          )
        } else if (discipline === Discipline.DOGS) {
          console.log('Processing DOGS')
          results = await Promise.all(
            data.items.map(async (result: any) => {
              const detailedResult = await fetchDetailedEventResult(
                result.ext_pal_id,
                result.int_event_id.toString(),
              )

              const startTime = new Date(result.time)
              const hours = result.start_time.split(':')[0]
              const minutes = result.start_time.split(':')[1]
              startTime.setHours(parseInt(hours, 10))
              startTime.setMinutes(parseInt(minutes, 10))

              return {
                id: result.int_event_id,
                extId: result.ext_pal_id,
                name:
                  detailedResult?.track_name ||
                  result.track_name ||
                  `${result.discipline} Race ${result.int_event_id}`,
                startTime,
                discipline: Discipline.DOGS,
              } as EventResult
            }),
          )
        } else {
          console.log('Processing the OTHER')
          results = data.items.map((result: any) => {
            const startTime = new Date(result.time)
            const hours = result.start_time.split(':')[0]
            const minutes = result.start_time.split(':')[1]
            startTime.setHours(parseInt(hours, 10))
            startTime.setMinutes(parseInt(minutes, 10))

            return {
              id: result.int_event_id,
              extId: result.ext_pal_id,
              name:
                result.track_name ||
                `${discipline} Event ${result.int_event_id}`,
              startTime,
              discipline: discipline,
            } as EventResult
          })
        }

        return results
      } catch (error: unknown) {
        const message =
          (error as { message: string }).message || 'Unknown error'
        toast.error(message)
      }
    }
    fetchEventResults(selectedDiscipline, selectedDate)
  }, [selectedDate, selectedDiscipline, lastTenGames, rootContext.eventResults])

  const filteredEventResults = useMemo(() => {
    if (selectedDiscipline !== 'NONE') {
      console.log('🔍 Filtering Results:', {
        discipline: selectedDiscipline,
        date: selectedDate,
        lastTenGames,
        resultsCount: eventResults.length,
      })
    }

    if (selectedDiscipline === 'NONE') return []

    if (lastTenGames) {
      const filtered = (rootContext.eventResults || [])
        .filter((result) => result.discipline === selectedDiscipline)
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
        .slice(0, 10)
      return filtered
    }

    if (!selectedDate) return []

    const filteredResults = eventResults.filter((result) => {
      if (selectedTimeSlot !== 'ALL') {
        const [startTimeStr, endTimeStr] = selectedTimeSlot.split(' | ')
        const [startHours, startMinutes] = startTimeStr.split(':').map(Number)
        const [endHours, endMinutes] = endTimeStr.split(':').map(Number)
        const hours = result.startTime.getHours()
        const minutes = result.startTime.getMinutes()
        const timeInMinutes = hours * 60 + minutes
        const startInMinutes = startHours * 60 + startMinutes
        const endInMinutes = endHours * 60 + endMinutes
        if (timeInMinutes < startInMinutes || timeInMinutes > endInMinutes)
          return false
      }
      return true
    })
    return filteredResults
  }, [
    selectedDiscipline,
    selectedDate,
    lastTenGames,
    eventResults,
    selectedTimeSlot,
    rootContext.eventResults,
  ])

  const handleReset = () => {
    setSelectedDiscipline('NONE')
    setSelectedDate('ALL')
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
    } catch (error) {
      console.error('Error formatting date:', error)
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
                <SelectItem value="ALL">{t('all')}</SelectItem>
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
              <SelectTrigger className="w-[130px] bg-background text-[16px] text-foreground">
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
              className="text-bold w-[80px] bg-tertiary text-[16px] text-tertiary-foreground hover:bg-tertiary/70"
              disabled={
                !selectedDate && !selectedDiscipline && !selectedTimeSlot
              }
              onClick={handleReset}
            >
              {t('reset')}
            </Button>

            <Button
              variant="outline"
              className="text-bold w-[80px] bg-muted text-[16px] text-muted-foreground hover:bg-muted/70"
              onClick={() => {
                handleReset()
                props.onClose()
              }}
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      </div>

      <div className="h-full overflow-auto pb-2">
        {selectedDiscipline !== 'NONE' ? (
          filteredEventResults.length > 0 ? (
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
                                  {formatSafeDate(eventResult.startTime)}
                                  {eventResult.name}
                                  {' / '}
                                </span>
                                {eventResult.discipline ===
                                  Discipline.SOCCER && (
                                  <span>Soccer Match</span>
                                )}
                              </div>
                              <span className="font-bold">
                                {t('completed')}
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
            <div className="flex h-full flex-col items-center justify-start">
              {t('no_results_found')}
            </div>
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center">
            <p className="text-lg text-muted-foreground">
              {t('search_for_results')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function EventResultDetails({ eventResult }: { eventResult: EventResult }) {
  const [detailedResult, setDetailedResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (eventResult.result) {
      setDetailedResult(eventResult.result)
      return
    }

    if (!eventResult.extId) {
      setDetailedResult(null)
      return
    }

    const fetchDetails = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `https://apidev.pgvirtual.eu/api/event/results/${eventResult.extId}/${eventResult.id}`,
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
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
          },
        )

        if (response.ok) {
          const data = await response.json()
          setDetailedResult(data)
        }
      } catch (error) {
        console.warn('Failed to fetch detailed results:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [eventResult])

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading detailed results...
      </div>
    )
  }

  if (!detailedResult) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No detailed results available
      </div>
    )
  }

  if (
    (eventResult.discipline === Discipline.HORSES ||
      eventResult.discipline === Discipline.DOGS) &&
    detailedResult
  ) {
    if (eventResult.result && detailedResult.podium && !detailedResult.odds) {
      return (
        <div className="space-y-4">
          {/* PODIUM per dati mockati */}
          <div className="border">
            <div className="bg-accent py-2 text-center">
              <div className="text-[16px] font-bold uppercase text-accent-foreground">
                ARRIVAL ORDER
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 p-4">
              {detailedResult.podium
                .slice(0, 3)
                .map((competitor: any, index: number) => {
                  let imageSrc = ''
                  let alt = ''

                  switch (index + 1) {
                    case 1:
                      imageSrc = '/cockade_gold.png'
                      alt = '1'
                      break
                    case 2:
                      imageSrc = '/cockade_silver.png'
                      alt = '2'
                      break
                    case 3:
                      imageSrc = '/cockade_bronze.png'
                      alt = '3'
                      break
                  }

                  return (
                    <div
                      key={competitor.number}
                      className="flex flex-col items-center gap-2"
                    >
                      {/* Medaglia */}
                      <div className="relative flex h-12 w-12 items-center justify-center">
                        <Image
                          src={imageSrc}
                          alt={alt}
                          width={48}
                          height={48}
                          className="absolute"
                        />
                        <div className="relative">
                          <div
                            className={
                              'flex h-7 w-7 items-center justify-center rounded-md font-bold text-white ' +
                              (competitor.number === 1
                                ? 'bg-red-500'
                                : competitor.number === 2
                                  ? 'bg-blue-500'
                                  : competitor.number === 3
                                    ? 'bg-orange-500'
                                    : competitor.number === 4
                                      ? 'bg-green-500'
                                      : competitor.number === 5
                                        ? 'bg-yellow-500'
                                        : competitor.number === 6
                                          ? 'bg-purple-500'
                                          : 'border border-gray-300 bg-white text-black')
                            }
                          >
                            {competitor.number}
                          </div>
                        </div>
                      </div>
                      <div className="text-center text-sm font-semibold">
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

          return 'Invalid Date'
        } catch (error) {
          console.error('Error formatting date:', error)
          return 'Invalid Date'
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
          {raceResult.podium && raceResult.podium.length > 0 && (
            <div className="border">
              <div className="bg-accent py-2 text-center">
                <div className="text-[16px] font-bold uppercase text-accent-foreground">
                  ARRIVAL ORDER
                </div>
              </div>
              <div className="flex items-center justify-center gap-6 p-4">
                {raceResult.podium.slice(0, 3).map((competitor, index) => {
                  let imageSrc = ''
                  let alt = ''

                  switch (index + 1) {
                    case 1:
                      imageSrc = '/cockade_gold.png'
                      alt = '1'
                      break
                    case 2:
                      imageSrc = '/cockade_silver.png'
                      alt = '2'
                      break
                    case 3:
                      imageSrc = '/cockade_bronze.png'
                      alt = '3'
                      break
                  }

                  return (
                    <div
                      key={competitor.number}
                      className="flex flex-col items-center gap-2"
                    >
                      {/* Medaglia con numero */}
                      <div className="relative flex h-12 w-12 items-center justify-center">
                        <Image
                          src={imageSrc}
                          alt={alt}
                          width={48}
                          height={48}
                          className="absolute"
                        />
                        <div className="relative text-[18px] font-bold text-black">
                          <div
                            className={
                              'flex h-7 w-7 items-center justify-center rounded-md font-bold text-white ' +
                              (competitor.number === 1
                                ? 'bg-red-500'
                                : competitor.number === 2
                                  ? 'bg-blue-500'
                                  : competitor.number === 3
                                    ? 'bg-orange-500'
                                    : competitor.number === 4
                                      ? 'bg-green-500'
                                      : competitor.number === 5
                                        ? 'bg-yellow-500'
                                        : competitor.number === 6
                                          ? 'bg-purple-500'
                                          : 'border border-gray-300 bg-white text-black')
                            }
                          >
                            {competitor.number}
                          </div>
                        </div>
                      </div>
                      <div className="text-center text-sm font-semibold">
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
                    WINNER
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
                            className={
                              'flex h-8 w-8 items-center justify-center rounded-md text-[16px] font-bold text-white ' +
                              (parseInt(number) === 1
                                ? 'bg-red-500'
                                : parseInt(number) === 2
                                  ? 'bg-blue-500'
                                  : parseInt(number) === 3
                                    ? 'bg-orange-500'
                                    : parseInt(number) === 4
                                      ? 'bg-green-500'
                                      : parseInt(number) === 5
                                        ? 'bg-yellow-500'
                                        : parseInt(number) === 6
                                          ? 'bg-purple-500'
                                          : 'border border-gray-300 bg-white text-black')
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
                    PLACED
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
                            className={
                              'flex h-8 w-8 items-center justify-center rounded-md text-[16px] font-bold text-white ' +
                              (parseInt(number) === 1
                                ? 'bg-red-500'
                                : parseInt(number) === 2
                                  ? 'bg-blue-500'
                                  : parseInt(number) === 3
                                    ? 'bg-orange-500'
                                    : parseInt(number) === 4
                                      ? 'bg-green-500'
                                      : parseInt(number) === 5
                                        ? 'bg-yellow-500'
                                        : parseInt(number) === 6
                                          ? 'bg-purple-500'
                                          : 'border border-gray-300 bg-white text-black')
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
                    SHOW
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
                            className={
                              'flex h-8 w-8 items-center justify-center rounded-md text-[16px] font-bold text-white ' +
                              (parseInt(number) === 1
                                ? 'bg-red-500'
                                : parseInt(number) === 2
                                  ? 'bg-blue-500'
                                  : parseInt(number) === 3
                                    ? 'bg-orange-500'
                                    : parseInt(number) === 4
                                      ? 'bg-green-500'
                                      : parseInt(number) === 5
                                        ? 'bg-yellow-500'
                                        : parseInt(number) === 6
                                          ? 'bg-purple-500'
                                          : 'border border-gray-300 bg-white text-black')
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
                    EXACTA
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
                              className={
                                'flex h-8 w-8 items-center justify-center rounded-md text-[16px] font-bold text-accent-foreground ' +
                                (parseInt(num) === 1
                                  ? 'bg-red-500'
                                  : parseInt(num) === 2
                                    ? 'bg-blue-500'
                                    : parseInt(num) === 3
                                      ? 'bg-orange-500'
                                      : parseInt(num) === 4
                                        ? 'bg-green-500'
                                        : parseInt(num) === 5
                                          ? 'bg-yellow-500'
                                          : parseInt(num) === 6
                                            ? 'bg-purple-500'
                                            : 'border border-gray-300 bg-white text-black')
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
                    QUINELLA
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
                              className={
                                'flex h-8 w-8 items-center justify-center rounded-md text-[16px] font-bold text-accent-foreground ' +
                                (parseInt(num) === 1
                                  ? 'bg-red-500'
                                  : parseInt(num) === 2
                                    ? 'bg-blue-500'
                                    : parseInt(num) === 3
                                      ? 'bg-orange-500'
                                      : parseInt(num) === 4
                                        ? 'bg-green-500'
                                        : parseInt(num) === 5
                                          ? 'bg-yellow-500'
                                          : parseInt(num) === 6
                                            ? 'bg-purple-500'
                                            : 'border border-gray-300 bg-white text-black')
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
                    TRIFECTA
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
                              className={
                                'flex h-8 w-8 items-center justify-center rounded-md text-[16px] font-bold text-accent-foreground ' +
                                (parseInt(num) === 1
                                  ? 'bg-red-500'
                                  : parseInt(num) === 2
                                    ? 'bg-blue-500'
                                    : parseInt(num) === 3
                                      ? 'bg-orange-500'
                                      : parseInt(num) === 4
                                        ? 'bg-green-500'
                                        : parseInt(num) === 5
                                          ? 'bg-yellow-500'
                                          : parseInt(num) === 6
                                            ? 'bg-purple-500'
                                            : 'border border-gray-300 bg-white text-black')
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
                    BOX TRIFECTA
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
                              className={
                                'flex h-8 w-8 items-center justify-center rounded-md text-[16px] font-bold text-accent-foreground ' +
                                (parseInt(num) === 1
                                  ? 'bg-red-500'
                                  : parseInt(num) === 2
                                    ? 'bg-blue-500'
                                    : parseInt(num) === 3
                                      ? 'bg-orange-500'
                                      : parseInt(num) === 4
                                        ? 'bg-green-500'
                                        : parseInt(num) === 5
                                          ? 'bg-yellow-500'
                                          : parseInt(num) === 6
                                            ? 'bg-purple-500'
                                            : 'border border-gray-300 bg-white text-black')
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
                    EVEN / ODD
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  {raceResult.odds.evenodd.even && (
                    <div className="text-center">
                      <div className="py-2 text-[16px] font-semibold">
                        Even: {raceResult.odds.evenodd.even}
                      </div>
                    </div>
                  )}
                  {raceResult.odds.evenodd.odd && (
                    <div className="text-center">
                      <div className="py-2 text-[16px] font-semibold">
                        Odd: {raceResult.odds.evenodd.odd}
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
                    UNDER / OVER 3.5
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  {raceResult.odds.underover.under && (
                    <div className="text-center">
                      <div className="py-2 text-[16px] font-semibold">
                        Under: {raceResult.odds.underover.under}
                      </div>
                    </div>
                  )}
                  {raceResult.odds.underover.over && (
                    <div className="text-center">
                      <div className="py-2 text-[16px] font-semibold">
                        Over: {raceResult.odds.underover.over}
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
                    RACE DURATION
                  </div>
                </div>
                <div className="p-3 text-center">
                  <div className="text-[16px] font-semibold">
                    {raceResult.raceDuration} seconds
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
                  <span className="font-semibold">Track:</span> Track{' '}
                  {eventResult.extId}
                </div>
                <div className="text-[16px]">
                  <span className="font-semibold">Event:</span> {eventResult.id}
                </div>
                <div className="text-[16px]">
                  <span className="font-semibold">Start Time:</span>{' '}
                  {formatSafeDate(eventResult.startTime)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
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
      } catch (error) {
        console.error('Error formatting date:', error)
        return 'Invalid Date'
      }
    }

    return (
      <div className="space-y-4">
        {/* Teams e Score */}
        <div className="border">
          <div className="bg-accent py-2 text-center">
            <div className="text-[16px] font-bold uppercase text-accent-foreground">
              MATCH RESULT
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
                  Odds: {detailedResult.odds.oneXTwo.odds}
                </div>
              </div>
            </div>
          )}

          {/* Double Chance */}
          {detailedResult.odds?.doubleChance && (
            <div className="border">
              <div className="bg-accent py-2 text-center">
                <div className="text-[16px] font-bold uppercase text-accent-foreground">
                  DOUBLE CHANCE
                </div>
              </div>
              <div className="p-3 text-center">
                <div className="text-[16px] font-semibold">
                  Odds: {detailedResult.odds.doubleChance.odds}
                </div>
              </div>
            </div>
          )}

          {/* First Scorer */}
          {detailedResult.odds?.firstScorer && (
            <div className="border">
              <div className="bg-accent py-2 text-center">
                <div className="text-[16px] font-bold uppercase text-accent-foreground">
                  FIRST SCORER
                </div>
              </div>
              <div className="p-3 text-center">
                <div className="mb-1 text-[14px]">
                  Team: {detailedResult.odds.firstScorer.teamLabel}
                </div>
                <div className="text-[16px] font-semibold">
                  Odds: {detailedResult.odds.firstScorer.odds}
                </div>
              </div>
            </div>
          )}

          {/* Sum Goals */}
          {detailedResult.odds?.sumGoals && (
            <div className="border">
              <div className="bg-accent py-2 text-center">
                <div className="text-[16px] font-bold uppercase text-accent-foreground">
                  TOTAL GOALS
                </div>
              </div>
              <div className="p-3 text-center">
                <div className="mb-1 text-[14px]">
                  Goals: {detailedResult.odds.sumGoals.value}
                </div>
                <div className="text-[16px] font-semibold">
                  Odds: {detailedResult.odds.sumGoals.odds}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Round Info */}
        <div className="border">
          <div className="bg-accent py-2 text-center">
            <div className="text-[16px] font-bold uppercase text-accent-foreground">
              MATCH INFO
            </div>
          </div>
          <div className="space-y-1 p-3">
            <div className="text-[14px]">
              <span className="font-semibold">Round:</span>{' '}
              {detailedResult.round?.name}
            </div>
            <div className="text-[14px]">
              <span className="font-semibold">Match:</span> #
              {detailedResult.round?.number}
            </div>
            <div className="text-[14px]">
              <span className="font-semibold">Start Time:</span>{' '}
              {formatSafeDate(eventResult.startTime)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback per altre discipline
  return (
    <div className="p-4 text-center text-muted-foreground">
      Event completed - detailed results available for horse and dog racing only
    </div>
  )
}
