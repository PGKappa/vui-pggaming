import { Discipline, EventResult, RaceResult } from '@/retail-lib/types'
import { format } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { RootContext } from '@/retail-contexts/root-context'
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

export default function SearchEventResults(props: { onClose: () => void }) {
  const { t } = useTranslation()
  const rootContext = useContext(RootContext)
  const [selectedDiscipline, setSelectedDiscipline] = useState<
    Discipline | 'NONE'
  >('NONE')
  const [selectedDate, setSelectedDate] = useState<string>()
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('ALL')
  const [lastTenGames, setLastTenGames] = useState<boolean>(false)
  const [eventResults, setEventResults] = useState<EventResult[]>([])

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
    if (selectedDiscipline === 'NONE' || !selectedDate) {
      setEventResults([])
      return
    }

    if (lastTenGames) {
      return
    }

    const fetchEventResults = async (discipline: Discipline, date: string) => {
      try {
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
              gameIds: [`${discipline.toLowerCase()}6`],
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
                  `Horse Race ${result.int_event_id}`,
                startTime,
                discipline: Discipline.HORSES,
              } as EventResult
            }),
          )
        } else {
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

        setEventResults(results)
      } catch (error: unknown) {
        const message =
          (error as { message: string }).message || 'Unknown error'
        toast.error(message)
      }
    }
    fetchEventResults(selectedDiscipline, selectedDate)
  }, [selectedDate, selectedDiscipline, lastTenGames])

  const filteredEventResults = useMemo(() => {
    if (selectedDiscipline === 'NONE') return []

    if (lastTenGames) {
      console.log(
        'Last 10 games mode - rootContext.last10GamesPerDiscipline:',
        rootContext.last10GamesPerDiscipline,
      )
      console.log('Selected discipline:', selectedDiscipline)
      const filtered = rootContext.last10GamesPerDiscipline
        .filter((result) => result.discipline === selectedDiscipline)
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
        .slice(0, 10)
      console.log('Filtered results:', filtered)
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
    rootContext.last10GamesPerDiscipline,
  ])

  const handleReset = () => {
    setSelectedDiscipline('NONE')
    setSelectedDate('ALL')
    setSelectedTimeSlot('ALL')
    setLastTenGames(false)
  }

  return (
    <div className="flex h-full flex-col gap-4">
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

      <div className="h-full">
        {!!selectedDiscipline ? (
          filteredEventResults.length > 0 ? (
            <ScrollArea className="pb-20">
              <Accordion type="multiple" className="space-y-4">
                {filteredEventResults.map((eventResult) => {
                  return (
                    <AccordionItem
                      key={eventResult.id}
                      value={eventResult.id.toString()}
                      className="gap-0"
                    >
                      <AccordionTrigger className="bg-accent p-2 text-base text-accent-foreground [&[data-state=open]>svg]:-rotate-90">
                        <div className="flex w-[600px] flex-row justify-between gap-2">
                          <div className="flex flex-row gap-2">
                            <span className="font-bold">
                              {format(
                                eventResult.startTime,
                                'dd-MM-yyyy HH:mm',
                              )}{' '}
                              {eventResult.name}
                              {' / '}
                            </span>
                            {eventResult.discipline === Discipline.SOCCER && (
                              <span>Soccer Match</span>
                            )}
                          </div>
                          <span className="font-bold">{t('completed')}</span>
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
    if (!eventResult.extId) return

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
  }, [eventResult.extId, eventResult.id])

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

  if (eventResult.discipline === Discipline.HORSES && detailedResult.odds) {
    const raceResult = detailedResult as RaceResult
    return (
      <div className="space-y-4">
        {/* Horse Racing Odds */}
        <div className="grid grid-cols-2 gap-4">
          {raceResult.odds.winner && (
            <div className="rounded bg-accent p-3">
              <div className="mb-2 text-sm font-bold">WINNER</div>
              {Object.entries(raceResult.odds.winner).map(([horse, odds]) => (
                <div key={horse} className="text-sm">
                  Horse {horse}: {odds}
                </div>
              ))}
            </div>
          )}
          {raceResult.odds.placed && (
            <div className="rounded bg-accent p-3">
              <div className="mb-2 text-sm font-bold">PLACED</div>
              {Object.entries(raceResult.odds.placed).map(([horse, odds]) => (
                <div key={horse} className="text-sm">
                  Horse {horse}: {odds}
                </div>
              ))}
            </div>
          )}
          {raceResult.odds.show && (
            <div className="rounded bg-accent p-3">
              <div className="mb-2 text-sm font-bold">SHOW</div>
              {Object.entries(raceResult.odds.show).map(([horse, odds]) => (
                <div key={horse} className="text-sm">
                  Horse {horse}: {odds}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Race Duration */}
        {raceResult.raceDuration && (
          <div className="rounded bg-muted p-3">
            <div className="mb-2 text-sm font-bold">Race Duration:</div>
            <div className="text-sm">{raceResult.raceDuration} seconds</div>
          </div>
        )}

        {/* Final Results */}
        {raceResult.podium && raceResult.podium.length > 0 && (
          <div className="rounded bg-muted p-3">
            <div className="mb-2 text-sm font-bold">Final Results:</div>
            <div className="space-y-1">
              {raceResult.podium.map((horse, index) => (
                <div key={horse.number} className="text-sm">
                  {index + 1}. {horse.name} (#{horse.number})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 text-center text-muted-foreground">
      Event completed - detailed results available for horse racing only
    </div>
  )
}
