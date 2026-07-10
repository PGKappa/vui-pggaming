import { RootContext } from '@/retail-contexts/root-context'
import { Discipline, EventResult, RaceResult } from '@/retail-lib/types'
import { getRacerColors, createPGVirtualAPICall, cn } from '@/retail-lib/utils'
import { format } from 'date-fns'
import { t } from 'i18next'
import Image from 'next/image'
import { X } from 'lucide-react'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import LoadingSpinner from './loading-spinner'
import ReactPlayer from 'react-player/lazy'
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

function formatDateForAPI(date: Date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const dates = Array.from({ length: 10 }, (_, index) => {
  const date = new Date()
  date.setDate(date.getDate() - index)
  return formatDateForAPI(date)
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

const searchResultsCache = new Map<
  string,
  { timestamp: number; results: EventResult[] }
>()
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000

function getPalId(item: any): string {
  return String(item?.ext_pal_id ?? item?.int_pal_id ?? item?.pal_id ?? '')
}

function getEventId(item: any): string {
  return String(item?.int_event_id ?? item?.event_id ?? item?.id ?? '')
}

export default function SearchEventResults() {
  const { t } = useTranslation()
  const rootContext = useContext(RootContext)
  const initCode = rootContext.initCode
  const operator = rootContext.operator
  const timezone = rootContext.getTimezone?.() || 'Europe/Rome'

  const [selectedDiscipline, setSelectedDiscipline] = useState<
    Discipline | 'NONE'
  >('NONE')
  const [selectedDate, setSelectedDate] = useState<string>('ALL')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('ALL')
  const [lastTenGames, setLastTenGames] = useState<boolean>(true)

  const [confirmedDiscipline, setConfirmedDiscipline] = useState<
    Discipline | 'NONE'
  >('NONE')
  const [confirmedDate, setConfirmedDate] = useState<string>('ALL')
  const [confirmedTimeSlot, setConfirmedTimeSlot] = useState<string>('ALL')
  const [confirmedLastTenGames, setConfirmedLastTenGames] =
    useState<boolean>(true)

  const [fetchedResults, setFetchedResults] = useState<EventResult[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [openResults, setOpenResults] = useState<string[]>([])

  const [searchTrigger, setSearchTrigger] = useState<number>(0)
  const [contextResultsSnapshot, setContextResultsSnapshot] = useState<
    EventResult[]
  >([])

  const fetchDetailedEventResult = useCallback(
    async (extId: string, eventId: string) => {
      if (!initCode || !operator) return null
      try {
        const response = await createPGVirtualAPICall(
          `/api/event/results/${extId}/${eventId}`,
          initCode,
          undefined,
          operator,
        )
        if (!response.ok) {
          console.warn('Response not ok:', response.status)
          return null
        }
        const data = await response.json()
        if (data.ret_code && !data.odds && !data.arrival) return null
        return data
      } catch (error) {
        console.error('Error fetching detailed result:', error)
        return null
      }
    },
    [initCode, operator],
  )

  useEffect(() => {
    if (searchTrigger === 0) return
    if (confirmedDiscipline === 'NONE') {
      setFetchedResults([])
      return
    }

    const cacheKey = `${confirmedDiscipline}:${confirmedDate}:${confirmedTimeSlot}:${confirmedLastTenGames}`
    const cached = searchResultsCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL_MS) {
      setFetchedResults(cached.results)
      return
    }

    if (confirmedLastTenGames) {
      const existingResults = contextResultsSnapshot.filter(
        (result) => result.discipline === confirmedDiscipline,
      )
      if (existingResults.length > 0) {
        const resultsWithTrack = existingResults.map((r) => ({
          ...r,
          track: r.track || '6',
        }))
        setFetchedResults(resultsWithTrack)
        searchResultsCache.set(cacheKey, {
          timestamp: Date.now(),
          results: resultsWithTrack,
        })
        return
      }

      if (
        confirmedDiscipline === Discipline.HORSES ||
        confirmedDiscipline === Discipline.DOGS ||
        confirmedDiscipline === Discipline.DOGS8
      ) {
        const fetchRacingResults = async () => {
          setIsLoading(true)
          try {
            if (!rootContext.initCode || !rootContext.operator) {
              setIsLoading(false)
              return
            }
            const today = new Date()
            const sevenDaysAgo = new Date(today)
            sevenDaysAgo.setDate(today.getDate() - 7)
            const dateStart = sevenDaysAgo.toLocaleDateString('it-IT')
            const dateEnd = today.toLocaleDateString('it-IT')
            const gameIds =
              confirmedDiscipline === Discipline.HORSES
                ? 'horses6'
                : confirmedDiscipline === Discipline.DOGS8
                  ? 'dogs8'
                  : 'dogs6'
            const requestBody = { gameIds: [gameIds], dateStart, dateEnd }
            const response = await createPGVirtualAPICall(
              '/api/event/results/list',
              rootContext.initCode,
              { method: 'POST', body: JSON.stringify(requestBody) },
              operator,
            )
            if (!response.ok) throw new Error('Failed to fetch racing events')
            const data = await response.json()
            if (!data.items || !Array.isArray(data.items)) {
              setFetchedResults([])
              return
            }
            const limitedItems = data.items.slice(0, 10)
            const results: EventResult[] = await Promise.all(
              limitedItems.map(async (event: any) => {
                const detailedResult = await fetchDetailedEventResult(
                  event.ext_pal_id,
                  event.int_event_id.toString(),
                )
                let startTime: Date
                try {
                  startTime = event.time ? new Date(event.time) : new Date()
                  if (event.start_time && event.start_time.includes(':')) {
                    const [hours, minutes] = event.start_time.split(':')
                    startTime.setHours(parseInt(hours, 10))
                    startTime.setMinutes(parseInt(minutes, 10))
                    startTime.setSeconds(0)
                  }
                } catch {
                  startTime = new Date()
                }
                return {
                  id: event.int_event_id,
                  extId: event.ext_pal_id,
                  name: `${confirmedDiscipline === Discipline.DOGS || confirmedDiscipline === Discipline.DOGS8 ? 'Dog' : 'Horse'} Race ${event.int_event_id}`,
                  startTime,
                  discipline: confirmedDiscipline,
                  track: event.track_name || event.track || '6',
                  result: detailedResult || {
                    podium:
                      event.arrival?.map((competitor: any, index: number) => ({
                        name: competitor.name,
                        number: competitor.number,
                        position: index + 1,
                      })) || [],
                    odds: {},
                  },
                }
              }),
            )
            setFetchedResults(results)
            searchResultsCache.set(cacheKey, { timestamp: Date.now(), results })
          } catch {
            setFetchedResults([])
          } finally {
            setIsLoading(false)
          }
        }
        fetchRacingResults()
      }
    }

    if (confirmedLastTenGames) return
    if (!confirmedLastTenGames && !confirmedDate) {
      setFetchedResults([])
      return
    }

    const fetchEventResults = async (discipline: Discipline, date: string) => {
      setIsLoading(true)
      try {
        if (!rootContext.initCode || !rootContext.operator) {
          setIsLoading(false)
          return
        }
        const gameIds =
          discipline === Discipline.HORSES
            ? 'horses6'
            : discipline === Discipline.DOGS
              ? 'dogs6'
              : discipline === Discipline.DOGS8
                ? 'dogs8'
                : `${discipline.toLowerCase()}6`
        const requestBody: Record<string, any> = {
          gameIds: [gameIds],
          dateStart: date,
          dateEnd: date,
        }
        if (confirmedTimeSlot !== 'ALL') {
          const [startTimeStr, endTimeStr] = confirmedTimeSlot.split(' | ')
          requestBody.timeStart = startTimeStr.trim()
          requestBody.timeEnd = endTimeStr.trim()
        }
        const response = await createPGVirtualAPICall(
          '/api/event/results/list',
          rootContext.initCode,
          { method: 'POST', body: JSON.stringify(requestBody) },
          operator,
        )
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        if (!data.items || !Array.isArray(data.items)) {
          setFetchedResults([])
          return
        }

        let results: EventResult[]

        if (
          discipline === Discipline.HORSES ||
          discipline === Discipline.DOGS ||
          discipline === Discipline.DOGS8
        ) {
          const filteredItems = data.items

          results = await Promise.all(
            filteredItems.map(async (result: any) => {
              // Only fetch detailed result if the list item doesn't already have arrival data
              const detailedResult =
                result.arrival && result.arrival.length > 0
                  ? null
                  : await fetchDetailedEventResult(
                      result.ext_pal_id,
                      result.int_event_id.toString(),
                    )
              let startTime: Date
              try {
                startTime = result.time
                  ? new Date(result.time)
                  : new Date(date.split('/').reverse().join('-'))
                if (result.start_time && result.start_time.includes(':')) {
                  const [hours, minutes] = result.start_time.split(':')
                  startTime.setHours(parseInt(hours, 10))
                  startTime.setMinutes(parseInt(minutes, 10))
                  startTime.setSeconds(0)
                }
              } catch {
                startTime = new Date()
              }

              let raceResult = detailedResult
              if (!detailedResult) {
                raceResult = {
                  arrival:
                    (
                      result.arrival as Array<{ name: string; number: number }>
                    )?.map((item: any) => ({
                      name: item.name,
                      number: item.number,
                    })) || [],
                  odds: {},
                } as RaceResult
              } else if (
                detailedResult &&
                !detailedResult.arrival &&
                result.arrival
              ) {
                raceResult = {
                  ...detailedResult,
                  arrival:
                    (
                      result.arrival as Array<{ name: string; number: number }>
                    )?.map((item: any) => ({
                      name: item.name,
                      number: item.number,
                    })) || [],
                } as RaceResult
              }

              return {
                id: result.int_event_id,
                extId: result.ext_pal_id,
                name:
                  detailedResult?.track_name ||
                  result.track_name ||
                  `${discipline === Discipline.DOGS || discipline === Discipline.DOGS8 ? 'Dog' : 'Horse'} Race ${result.int_event_id}`,
                startTime,
                discipline,
                track:
                  detailedResult?.track_name ||
                  result.track_name ||
                  result.track,
                result: raceResult,
              } as EventResult
            }),
          )
          results = results.filter(
            (r: EventResult | null) => r !== null,
          ) as EventResult[]
        } else if (discipline === Discipline.SOCCER) {
          let filteredItems = data.items
          if (confirmedTimeSlot !== 'ALL') {
            const [startTimeStr, endTimeStr] = confirmedTimeSlot.split(' | ')
            const [startHours, startMinutes] = startTimeStr
              .split(':')
              .map(Number)
            const [endHours, endMinutes] = endTimeStr.split(':').map(Number)
            const startInMinutes = startHours * 60 + startMinutes
            const endInMinutes = endHours * 60 + endMinutes
            filteredItems = data.items.filter((item: any) => {
              let itemTime: Date
              try {
                itemTime = new Date(item.time)
                if (item.start_time && item.start_time.includes(':')) {
                  const [hours, minutes] = item.start_time.split(':')
                  itemTime.setHours(parseInt(hours, 10))
                  itemTime.setMinutes(parseInt(minutes, 10))
                }
              } catch {
                return false
              }
              const timeInMinutes =
                itemTime.getHours() * 60 + itemTime.getMinutes()
              return (
                timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes
              )
            })
          }
          results = filteredItems.map((result: any) => {
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
              id: Number(getEventId(result)),
              extId: getPalId(result),
              name: result.round_name || `Soccer Match ${getEventId(result)}`,
              startTime,
              discipline: Discipline.SOCCER,
              jornada: result.round_number,
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
          let filteredItems = data.items
          if (confirmedTimeSlot !== 'ALL') {
            const [startTimeStr, endTimeStr] = confirmedTimeSlot.split(' | ')
            const [startHours, startMinutes] = startTimeStr
              .split(':')
              .map(Number)
            const [endHours, endMinutes] = endTimeStr.split(':').map(Number)
            const startInMinutes = startHours * 60 + startMinutes
            const endInMinutes = endHours * 60 + endMinutes
            filteredItems = data.items.filter((item: any) => {
              let itemTime: Date
              try {
                itemTime = new Date(item.time)
                if (item.start_time && item.start_time.includes(':')) {
                  const [hours, minutes] = item.start_time.split(':')
                  itemTime.setHours(parseInt(hours, 10))
                  itemTime.setMinutes(parseInt(minutes, 10))
                }
              } catch {
                return false
              }
              const timeInMinutes =
                itemTime.getHours() * 60 + itemTime.getMinutes()
              return (
                timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes
              )
            })
          }
          results = filteredItems.map((result: any) => {
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
              id: Number(getEventId(result)),
              extId: getPalId(result),
              name: result.name || `${discipline} Event ${getEventId(result)}`,
              startTime,
              discipline,
            } as EventResult
          })
        }

        setFetchedResults(results)
        searchResultsCache.set(cacheKey, { timestamp: Date.now(), results })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        toast.error(`${t('failed_fetch_results')}: ${message}`)
        setFetchedResults([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventResults(confirmedDiscipline, confirmedDate)
  }, [
    searchTrigger,
    confirmedDate,
    confirmedDiscipline,
    confirmedLastTenGames,
    confirmedTimeSlot,
    contextResultsSnapshot,
    fetchDetailedEventResult,
    rootContext.initCode,
    rootContext.operator,
    t,
  ])

  const handleSearch = () => {
    if (!lastTenGames) {
      if (selectedDate === 'ALL' && selectedTimeSlot === 'ALL') {
        toast.error(t('select_date_and_time_slot'))
        return
      }
      if (selectedDate === 'ALL') {
        toast.error(t('select_date'))
        return
      }
      if (selectedTimeSlot === 'ALL') {
        toast.error(t('select_time_slot'))
        return
      }
    }
    setContextResultsSnapshot(rootContext.eventResults || [])
    setConfirmedDiscipline(selectedDiscipline)
    const effectiveDate = lastTenGames ? 'ALL' : selectedDate
    const effectiveTimeSlot = lastTenGames ? 'ALL' : selectedTimeSlot
    setConfirmedDate(effectiveDate)
    setConfirmedTimeSlot(effectiveTimeSlot)
    setConfirmedLastTenGames(lastTenGames)
    setFetchedResults([])
    const nextCacheKey = `${selectedDiscipline}:${effectiveDate}:${effectiveTimeSlot}:${lastTenGames}`
    searchResultsCache.delete(nextCacheKey)
    setSearchTrigger((prev) => prev + 1)
  }

  const filteredEventResults = useMemo(() => {
    if (confirmedDiscipline === 'NONE') return []
    if (confirmedLastTenGames) {
      const allResults = contextResultsSnapshot
      const disciplineResults = allResults.filter(
        (result) => result.discipline === confirmedDiscipline,
      )
      const resultsToUse =
        disciplineResults.length > 0
          ? disciplineResults
          : fetchedResults.filter(
              (result) => result.discipline === confirmedDiscipline,
            )
      let filtered = resultsToUse
      if (confirmedTimeSlot !== 'ALL') {
        const [startTimeStr, endTimeStr] = confirmedTimeSlot.split(' | ')
        const [startHours, startMinutes] = startTimeStr.split(':').map(Number)
        const [endHours, endMinutes] = endTimeStr.split(':').map(Number)
        const startInMinutes = startHours * 60 + startMinutes
        const endInMinutes = endHours * 60 + endMinutes
        filtered = filtered.filter((result) => {
          const timeInMinutes =
            result.startTime.getHours() * 60 + result.startTime.getMinutes()
          return (
            timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes
          )
        })
      }
      return filtered
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
        .slice(0, 10)
    }
    if (!confirmedDate) {
      return []
    }
    const dateFiltered = fetchedResults.filter(
      (result) => result.discipline === confirmedDiscipline,
    )
    return dateFiltered
  }, [
    confirmedDiscipline,
    confirmedDate,
    confirmedLastTenGames,
    confirmedTimeSlot,
    fetchedResults,
    contextResultsSnapshot,
  ])

  const handleReset = () => {
    setSelectedDiscipline('NONE')
    setSelectedDate('ALL')
    setSelectedTimeSlot('ALL')
    setLastTenGames(false)
    setConfirmedDiscipline('NONE')
    setConfirmedDate('ALL')
    setConfirmedTimeSlot('ALL')
    setConfirmedLastTenGames(false)
    setSearchTrigger(0)
    setContextResultsSnapshot([])
  }

  const formatSafeDate = (date: any): string => {
    try {
      if (date instanceof Date && !isNaN(date.getTime()))
        return format(date, 'dd-MM-yyyy HH:mm')
      const parsedDate = new Date(date)
      if (!isNaN(parsedDate.getTime()))
        return format(parsedDate, 'dd-MM-yyyy HH:mm')
      return 'Invalid Date'
    } catch {
      return 'Invalid Date'
    }
  }

  const disciplineOptions = useMemo(
    () => [
      { value: 'NONE' as const, label: t('discipline').toUpperCase() },
      { value: Discipline.DOGS, label: t('dog6_racing').toUpperCase() },
      { value: Discipline.DOGS8, label: t('dog8_racing').toUpperCase() },
      { value: Discipline.HORSES, label: t('horse6_racing').toUpperCase() },
    ],
    [t],
  )

  const widestDisciplineLabel = useMemo(
    () =>
      disciplineOptions.reduce(
        (longest, option) =>
          option.label.length > longest.length ? option.label : longest,
        '',
      ),
    [disciplineOptions],
  )

  return (
    <div className="flex h-full flex-col space-y-1">
      <div className="flex h-16 w-full min-w-0 flex-nowrap items-center space-x-2 overflow-hidden bg-accent px-[24px] min-[1400px]:px-[60px] min-[1600px]:px-[100px] min-[1750px]:px-[130px] min-[1920px]:px-[167px]">
        {/* DISCIPLINA — larghezza piena sottomenu solo ≥1400px; sotto flex-1 compatto */}
        <div
          className={cn(
            'mr-1 min-w-0',
            'max-[1399px]:flex-1 max-[1399px]:basis-0',
            'min-[1400px]:inline-grid min-[1400px]:shrink-0',
          )}
        >
          <span
            className="invisible col-start-1 row-start-1 hidden whitespace-nowrap pl-[16px] pr-8 text-[14px] min-[1400px]:block"
            aria-hidden
          >
            {widestDisciplineLabel}
          </span>
          <div className="w-full min-w-0 min-[1400px]:col-start-1 min-[1400px]:row-start-1">
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
              <SelectTrigger className="h-[46px] w-full min-w-0 border-none bg-background pl-[16px] pr-[5px] text-[16px] text-foreground tabular-nums max-[1399px]:text-[14px] min-[1400px]:text-[16px]">
                <SelectValue placeholder={t('sport')} />
              </SelectTrigger>
              <SelectContent className="bg-white p-0">
                {disciplineOptions.map((option) => (
                  <SelectItem
                    className="text-[14px]"
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* LAST 10 GAMES */}
        <div className="ml-1.5 flex shrink-0 flex-row items-center max-[1399px]:ml-1">
          <Checkbox
            id="last10"
            className="h-6 w-6 border-0 bg-background text-foreground"
            checked={lastTenGames}
            onCheckedChange={(value) => setLastTenGames(!!value)}
          />
          <label
            htmlFor="last10"
            className="mr-[-4px] whitespace-nowrap px-2 py-3 text-[15px] font-semibold text-background max-[1399px]:px-1 max-[1399px]:text-[14px]"
          >
            <span className="min-[1400px]:hidden">{t('last_10_games_short')}</span>
            <span className="hidden min-[1400px]:inline">{t('last_10_games')}</span>
          </label>
        </div>

        {/* DATA */}
        <Select
          value={selectedDate}
          onValueChange={(value) => setSelectedDate(value)}
          disabled={lastTenGames}
        >
          <SelectTrigger className="h-[46px] min-w-0 flex-1 border-none bg-background pl-[17px] pr-[5px] text-[16px] text-foreground tabular-nums disabled:opacity-95 max-[1399px]:pl-3 max-[1399px]:text-[14px]">
            <SelectValue placeholder={t('date')} />
          </SelectTrigger>
          <SelectContent className="bg-white p-0">
            <SelectItem className="text-[14px]" value="ALL">
              {t('date').toUpperCase()}
            </SelectItem>
            {dates.map((date) => (
              <SelectItem className="text-[14px] tabular-nums" key={date} value={date}>
                {date}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* FASCIA ORARIA */}
        <Select
          value={selectedTimeSlot}
          onValueChange={setSelectedTimeSlot}
          disabled={lastTenGames}
        >
          <SelectTrigger className="h-[46px] min-w-0 flex-1 border-none bg-background pl-[17px] pr-[5px] text-[16px] text-foreground tabular-nums disabled:opacity-95 max-[1399px]:left-0 max-[1399px]:pl-3 max-[1399px]:text-[14px] min-[1400px]:relative min-[1400px]:left-[10px]">
            <SelectValue placeholder={t('time_slot')} />
          </SelectTrigger>
          <SelectContent className="bg-white p-0">
            <SelectItem className="text-[14px]" value="ALL">
              {t('time_slot').toUpperCase()}
            </SelectItem>
            {timeSlots.map((slot) => (
              <SelectItem className="text-[14px] tabular-nums" key={slot} value={slot}>
                {slot}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* CERCA */}
        <Button
          className="h-[46px] min-w-0 flex-1 bg-searchResButton text-[16px] font-bold text-bet-foreground hover:opacity-90 disabled:opacity-85 max-[1399px]:text-[14px] min-[1400px]:relative min-[1400px]:left-[26px] min-[1400px]:ml-2 min-[1400px]:mr-4"
          disabled={selectedDiscipline === 'NONE'}
          onClick={handleSearch}
        >
          {t('search').toUpperCase()}
        </Button>

        {/* RESET */}
        <Button
          className="h-[46px] min-w-0 flex-1 bg-searchResButton text-[15px] text-tertiary-foreground max-[1399px]:text-[14px] min-[1400px]:relative min-[1400px]:left-[42px]"
          disabled={!selectedDate && !selectedDiscipline && !selectedTimeSlot}
          onClick={handleReset}
        >
          {t('reset').toUpperCase()}
        </Button>
      </div>

      <div className="relative top-1 h-full overflow-auto pb-2">
        {confirmedDiscipline !== 'NONE' ? (
          isLoading ||
          (confirmedLastTenGames && rootContext.isLoadingEvents) ? (
            <div className="flex h-full flex-col items-center justify-center pt-4">
              <LoadingSpinner />
              <p className="mt-4 text-[16px] text-black">
                {t('loading')}...
              </p>
            </div>
          ) : filteredEventResults.length > 0 ? (
            <ScrollArea className="pb-20">
              <Accordion
                type="multiple"
                className="space-y-2"
                value={openResults}
                onValueChange={setOpenResults}
              >
                {filteredEventResults.map((eventResult, index) => {
                  const uniqueKey = `${eventResult.discipline}-${eventResult.id}-${eventResult.extId || index}`
                  return (
                    <AccordionItem
                      key={uniqueKey}
                      value={uniqueKey}
                      className="gap-0"
                    >
                      <AccordionTrigger className="pointer-events-none border-b-0 bg-accent p-0 pl-2 text-base text-accent-foreground hover:no-underline [&[data-state=open]>svg]:-rotate-90">
                        <div className="relative top-1.5 mb-[7px] flex h-[46px] w-full flex-row items-center justify-between space-x-4 pl-[9px] uppercase tabular-nums text-white">
                          <div className="flex flex-row items-center space-x-4 pb-[5px] text-[16px] font-semibold">
                            <span className="whitespace-nowrap text-[16px]">
                              {eventResult.discipline === 'DOGS'
                                ? t('dog6_races_label')
                                : eventResult.discipline === 'DOGS8'
                                  ? t('dog8_races_label')
                                  : eventResult.discipline === 'HORSES'
                                    ? t('horse6_races_label')
                                    : eventResult.discipline === 'SOCCER'
                                      ? t('football_label')
                                      : eventResult.discipline}
                            </span>
                            {eventResult.discipline === Discipline.SOCCER
                              ? eventResult.jornada && (
                                  <span className="whitespace-nowrap border-l border-l-white pl-4">
                                    {t('round')} {eventResult.jornada}
                                  </span>
                                )
                              : eventResult.track && (
                                  <span className="whitespace-nowrap border-l border-l-white pl-4">
                                    {(() => {
                                      const trackValue = eventResult.track
                                      const numberMatch =
                                        trackValue.match(/\d+/)
                                      const trackNum = numberMatch
                                        ? numberMatch[0]
                                        : eventResult.discipline ===
                                            Discipline.DOGS8
                                          ? '8'
                                          : '6'
                                      return `${t('track')} ${trackNum}`
                                    })()}
                                  </span>
                                )}
                            <span className="whitespace-nowrap border-l border-l-white pl-4">
                              ID {eventResult.id}
                            </span>
                            <span className="whitespace-nowrap border-l border-l-white pl-4">
                              {formatSafeDate(eventResult.startTime)}
                            </span>
                          </div>
                        </div>
                        <div className="pointer-events-auto flex shrink-0 items-center justify-center">
                          <svg
                            width="25"
                            height="25"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-[13px] h-[25px] w-[25px] shrink-0 cursor-pointer text-background transition-transform duration-200"
                            style={{
                              animation: openResults.includes(uniqueKey)
                                ? 'chevron-rotate-open 0.2s ease-out forwards'
                                : 'chevron-rotate-close 0.2s ease-out forwards',
                            }}
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </div>
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
  const rootContext = useContext(RootContext)
  const [detailedResult, setDetailedResult] = useState<any>(null)
  const [showReplay, setShowReplay] = useState(false)
  const [replayUrl, setReplayUrl] = useState<string | null>(null)
  const [loadingReplay, setLoadingReplay] = useState(false)
  const [replayError, setReplayError] = useState<string | null>(null)

  const extractReplayUrl = (payload: any): string | null => {
    if (typeof payload === 'string' && payload.trim()) return payload.trim()

    const candidates = [
      payload?.video?.src,
      payload?.video?.url,
      payload?.replayUrl,
      payload?.replay_url,
      payload?.videoUrl,
      payload?.video_url,
      payload?.streamUrl,
      payload?.stream_url,
      payload?.url,
      payload?.playlist,
      payload?.hls,
      payload?.data?.video?.src,
      payload?.data?.replayUrl,
      payload?.data?.videoUrl,
      payload?.data?.url,
      payload?.result?.replayUrl,
      payload?.result?.videoUrl,
      payload?.result?.url,
    ]

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim()
      }
    }

    return null
  }

  const fetchReplay = useCallback(async () => {
    if (!rootContext.initCode || !rootContext.operator) {
      setReplayError(t('login_required'))
      setShowReplay(true)
      return
    }
    if (!eventResult.extId) {
      setReplayError(t('no_detailed_results'))
      setShowReplay(true)
      return
    }

    setShowReplay(true)
    setReplayError(null)
    setReplayUrl(null)
    setLoadingReplay(true)

    try {
      const gameId =
        eventResult.discipline === Discipline.HORSES
          ? 'horses6'
          : eventResult.discipline === Discipline.DOGS8
            ? 'dogs8'
            : 'dogs6'
      const response = await createPGVirtualAPICall(
        '/api/event/results/replay',
        rootContext.initCode,
        {
          method: 'POST',
          body: JSON.stringify({
            channelId: '',
            eventId: String(eventResult.id),
            gameId,
            palimpsestId: eventResult.extId,
          }),
        },
        rootContext.operator,
      )

      const rawText = await response.text()
      let data: any = null
      try {
        data = rawText ? JSON.parse(rawText) : null
      } catch {
        data = null
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      if (data?.ret_code !== undefined && data.ret_code !== 1024) {
        throw new Error(data?.description || `API error ${data.ret_code}`)
      }

      const url = extractReplayUrl(data) || extractReplayUrl(rawText)
      if (!url) {
        throw new Error('Replay URL not found in API response')
      }

      setReplayUrl(url)
    } catch (error) {
      console.error('Error fetching replay:', error)
      setReplayError(t('failed_fetch_results'))
    } finally {
      setLoadingReplay(false)
    }
  }, [
    rootContext.initCode,
    rootContext.operator,
    eventResult.extId,
    eventResult.id,
    eventResult.discipline,
  ])

  useEffect(() => {
    setShowReplay(false)
    setReplayUrl(null)
    setReplayError(null)
    setLoadingReplay(false)
  }, [eventResult.id, eventResult.extId, eventResult.discipline])

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
      eventResult.discipline === Discipline.DOGS ||
      eventResult.discipline === Discipline.DOGS8) &&
    detailedResult
  ) {
    if (detailedResult.odds) {
      const raceResult = detailedResult as RaceResult

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

      if (showReplay) {
        return (
          <div className="relative mb-[-48px] flex flex-col items-center">
            <button
              onClick={() => {
                setShowReplay(false)
                setReplayUrl(null)
                setReplayError(null)
              }}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/60 text-foreground hover:bg-background/80"
              aria-label="Close replay"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex h-[660px] w-full items-center justify-center bg-black">
              {loadingReplay ? (
                <LoadingSpinner />
              ) : replayError ? (
                <div className="flex flex-col items-center gap-3 p-6 text-center text-neutral-300">
                  <div>{replayError}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 text-white"
                    onClick={fetchReplay}
                  >
                    RETRY
                  </Button>
                </div>
              ) : replayUrl ? (
                <ReactPlayer
                  url={replayUrl}
                  controls
                  playing
                  width="100%"
                  height="100%"
                  muted
                  style={{ backgroundColor: '#000' }}
                  onError={(error) => {
                    console.error('Video playback error:', error)
                    setReplayError(t('failed_fetch_results'))
                  }}
                />
              ) : (
                <div className="text-neutral-300">{t('no_detailed_results')}</div>
              )}
            </div>
          </div>
        )
      }

      return (
        <div className="mb-[-70px] space-y-4 tabular-nums">
          {detailedResult.arrival &&
            Array.isArray(detailedResult.arrival) &&
            detailedResult.arrival.length > 0 && (
              <div className="mb-[-8px] border-b">
                <div className="mt-[7px] h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
                    {t('arrival_order').toUpperCase()}
                  </div>
                </div>
                <div className="mr-[40px] flex h-[79px] items-center justify-center space-x-[147px] p-4">
                  {detailedResult.arrival
                    .slice(0, 3)
                    .map((competitor: any, index: number) => {
                      const imageSrc =
                        index === 0
                          ? '/cockade_gold.png'
                          : index === 1
                            ? '/cockade_silver.png'
                            : '/cockade_bronze.png'
                      const medalNumber = String(index + 1)
                      return (
                        <div
                          key={competitor.number || index}
                          className="flex items-center space-x-3"
                        >
                          <div className="relative flex h-11 w-11 items-center justify-center">
                            <Image
                              src={imageSrc}
                              alt={medalNumber}
                              width={48}
                              height={48}
                              className="absolute"
                            />
                            <div className="relative pb-[11px] text-[23px] font-bold">
                              {medalNumber}
                            </div>
                          </div>
                          <div
                            className="flex h-[33px] w-[33px] items-center justify-center rounded-md text-[21px] font-semibold"
                            style={
                              getRacerColors(
                                competitor.number,
                                eventResult.discipline as
                                  | 'DOGS'
                                  | 'DOGS8'
                                  | 'HORSES',
                              ).style
                            }
                          >
                            {competitor.number}
                          </div>
                          <div className="relative right-[1px] max-w-0 pr-10 pt-[1px] text-[17px] font-semibold">
                            {competitor.name}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

          <div className="grid grid-cols-3">
            {raceResult.odds.winner && (
              <div className="border-b">
                <div className="h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
                    {t('winner').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-3 p-3">
                  {Object.entries(raceResult.odds.winner).map(
                    ([number, odds]) => (
                      <div
                        key={number}
                        className="flex items-center justify-between"
                      >
                        <span className="ml-3 flex items-center space-x-3">
                          <div
                            className="flex h-[33px] w-[33px] items-center justify-center rounded-md text-[21px] font-semibold"
                            style={
                              getRacerColors(
                                parseInt(number),
                                eventResult.discipline as
                                  | 'DOGS'
                                  | 'DOGS8'
                                  | 'HORSES',
                              ).style
                            }
                          >
                            {number}
                          </div>
                          <span className="text-[17px] font-semibold">
                            {odds}
                          </span>
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {raceResult.odds.placed && (
              <div className="border-b border-l">
                <div className="h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
                    {t('place_2').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-3 p-3">
                  {Object.entries(raceResult.odds.placed).map(
                    ([number, odds]) => (
                      <div
                        key={number}
                        className="flex items-center justify-between"
                      >
                        <span className="ml-3 flex items-center space-x-3">
                          <div
                            className="flex h-[33px] w-[33px] items-center justify-center rounded-md text-[21px] font-semibold"
                            style={
                              getRacerColors(
                                parseInt(number),
                                eventResult.discipline as
                                  | 'DOGS'
                                  | 'DOGS8'
                                  | 'HORSES',
                              ).style
                            }
                          >
                            {number}
                          </div>
                          <span className="text-[17px] font-semibold">
                            {odds}
                          </span>
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {raceResult.odds.show && (
              <div className="border-b border-l">
                <div className="h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
                    {t('show_3').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-3 p-3">
                  {Object.entries(raceResult.odds.show).map(
                    ([number, odds]) => (
                      <div
                        key={number}
                        className="flex items-center justify-between"
                      >
                        <span className="ml-3 flex items-center space-x-3">
                          <div
                            className="flex h-[33px] w-[33px] items-center justify-center rounded-md text-[21px] font-semibold"
                            style={
                              getRacerColors(
                                parseInt(number),
                                eventResult.discipline as
                                  | 'DOGS'
                                  | 'DOGS8'
                                  | 'HORSES',
                              ).style
                            }
                          >
                            {number}
                          </div>
                          <span className="text-[17px] font-semibold">
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

          <div className="grid grid-cols-4">
            {raceResult.odds.exacta && (
              <div className="relative bottom-2 border-b">
                <div className="h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
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
                        <span className="ml-3 flex items-center space-x-3">
                          {combination.split('-').map((num, idx) => (
                            <div
                              key={idx}
                              className="flex h-[33px] w-[33px] items-center justify-center rounded-md text-[21px] font-semibold"
                              style={
                                getRacerColors(
                                  parseInt(num),
                                  eventResult.discipline as
                                    | 'DOGS'
                                    | 'DOGS8'
                                    | 'HORSES',
                                ).style
                              }
                            >
                              {num}
                            </div>
                          ))}
                        </span>
                        <span className="mr-3 text-[17px] font-semibold">
                          {odds}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {raceResult.odds.quinella && (
              <div className="relative bottom-2 border-b border-l">
                <div className="h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
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
                        <span className="ml-3 flex items-center space-x-3">
                          {combination.split('-').map((num, idx) => (
                            <div
                              key={idx}
                              className="flex h-[33px] w-[33px] items-center justify-center rounded-md text-[21px] font-semibold"
                              style={
                                getRacerColors(
                                  parseInt(num),
                                  eventResult.discipline as
                                    | 'DOGS'
                                    | 'DOGS8'
                                    | 'HORSES',
                                ).style
                              }
                            >
                              {num}
                            </div>
                          ))}
                        </span>
                        <span className="mr-3 text-[17px] font-semibold">
                          {odds}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {raceResult.odds.trifecta && (
              <div className="relative bottom-2 border-b border-l">
                <div className="h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
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
                        <span className="ml-3 flex items-center space-x-3">
                          {combination.split('-').map((num, idx) => (
                            <div
                              key={idx}
                              className="flex h-[33px] w-[33px] items-center justify-center rounded-md text-[21px] font-semibold"
                              style={
                                getRacerColors(
                                  parseInt(num),
                                  eventResult.discipline as
                                    | 'DOGS'
                                    | 'DOGS8'
                                    | 'HORSES',
                                ).style
                              }
                            >
                              {num}
                            </div>
                          ))}
                        </span>
                        <span className="mr-3 text-[17px] font-semibold">
                          {odds}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {raceResult.odds.boxedtrifecta && (
              <div className="relative bottom-2 border-b border-l">
                <div className="h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
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
                        <span className="ml-3 flex items-center justify-center space-x-3">
                          {combination.split('-').map((num, idx) => (
                            <div
                              key={idx}
                              className="flex h-[33px] w-[33px] items-center justify-center rounded-md text-[21px] font-semibold"
                              style={
                                getRacerColors(
                                  parseInt(num),
                                  eventResult.discipline as
                                    | 'DOGS'
                                    | 'DOGS8'
                                    | 'HORSES',
                                ).style
                              }
                            >
                              {num}
                            </div>
                          ))}
                        </span>
                        <span className="mr-3 text-[17px] font-semibold">
                          {odds}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2">
            {raceResult.odds.evenodd && (
              <div className="relative bottom-4 border-b">
                <div className="h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
                    {t('even_odd').toUpperCase()}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  {raceResult.odds.evenodd.even && (
                    <div className="text-center">
                      <div className="py-2 text-[16px] font-semibold">
                        <span className="relative left-[6px] mr-[644px]">
                          {t('even').toUpperCase()}
                        </span>{' '}
                        <span className="relative right-[6px]">
                          {raceResult.odds.evenodd.even}
                        </span>
                      </div>
                    </div>
                  )}
                  {raceResult.odds.evenodd.odd && (
                    <div className="text-center">
                      <div className="py-2 text-[16px] font-semibold">
                        <span className="relative right-[5px] mr-[586px]">
                          {t('odd').toUpperCase()}
                        </span>{' '}
                        <span className="relative left-[22px] mr-[17px]">
                          {raceResult.odds.evenodd.odd}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {raceResult.odds.underover && (
              <div className="relative bottom-4 border-b border-l">
                <div className="h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
                    {t('under_over')} 3.5
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  {raceResult.odds.underover.under && (
                    <div className="text-center">
                      <div className="py-2 text-[16px] font-semibold">
                        <span className="relative left-[2px] mr-[591px]">
                          {t('under_full').toUpperCase()}
                        </span>{' '}
                        <span className="relative left-[14px] mr-4">
                          {raceResult.odds.underover.under}
                        </span>
                      </div>
                    </div>
                  )}
                  {raceResult.odds.underover.over && (
                    <div className="text-center">
                      <div className="py-2 text-[16px] font-semibold">
                        <span className="relative left-1 mr-[635px]">
                          {t('over_full').toUpperCase()}
                        </span>{' '}
                        <span className="relative right-[6px]">
                          {raceResult.odds.underover.over}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 space-x-1">
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
          </div>

          {(eventResult.discipline === Discipline.DOGS ||
            eventResult.discipline === Discipline.DOGS8 ||
            eventResult.discipline === Discipline.HORSES) && (
            <div className="relative bottom-[23px] flex justify-center pb-11">
              <Button
                onClick={fetchReplay}
                disabled={loadingReplay}
                className="h-[50px] w-[300px] bg-green-600 text-[18px] font-bold text-white shadow-lg hover:bg-green-700"
              >
                {loadingReplay ? <LoadingSpinner /> : t('show_replay')}
              </Button>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="p-4 text-center text-muted-foreground">
        {t('event_completed_detailed_results')}
        <div className="mt-2 text-xs">
          DEBUG: {JSON.stringify(Object.keys(detailedResult))}
        </div>
      </div>
    )
  }

  if (eventResult.discipline === Discipline.SOCCER) {
    return (
      <div className="mb-[-16px] space-y-4">
        <div className="pt-[7px]">
          <div className="bg-accent py-2 text-center">
            <div className="text-[16px] font-bold uppercase text-accent-foreground">
              {t('match_result').toUpperCase()}
            </div>
          </div>
          <div className="pt-4 text-center">
            <div className="mb-1 text-[18px] font-bold">
              {detailedResult.teams}
            </div>
            <div className="text-[24px] font-bold">
              {detailedResult.score1} - {detailedResult.score2}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-y-2">
          {detailedResult.odds?.oneXTwo && (
            <div className="border border-l-0 border-r-0">
              <div className="bg-accent py-2 text-center">
                <div className="text-[16px] font-bold uppercase text-accent-foreground">
                  1X2
                </div>
              </div>
              <div className="p-3 text-center">
                <div className="text-[17px] font-semibold">
                  {detailedResult.odds.oneXTwo.odds}
                </div>
              </div>
            </div>
          )}
          {detailedResult.odds?.doubleChance && (
            <div className="border border-r-0">
              <div className="bg-accent py-2 text-center">
                <div className="text-[16px] font-bold uppercase text-accent-foreground">
                  {t('double_chance').toUpperCase()}
                </div>
              </div>
              <div className="p-3 text-center">
                <div className="text-[17px] font-semibold">
                  {detailedResult.odds.doubleChance.odds}
                </div>
              </div>
            </div>
          )}
          {detailedResult.odds?.firstScorer && (
            <div className="border border-l-0 border-r-0">
              <div className="bg-accent py-2 text-center">
                <div className="text-[16px] font-bold uppercase text-accent-foreground">
                  {t('first_scorer').toUpperCase()}
                </div>
              </div>
              <div className="p-3 text-center">
                <div className="mb-1 text-[16px]">
                  {detailedResult.odds.firstScorer.teamLabel}
                </div>
                <div className="text-[17px] font-semibold">
                  {detailedResult.odds.firstScorer.odds}
                </div>
              </div>
            </div>
          )}
          {detailedResult.odds?.sumGoals && (
            <div className="border border-r-0">
              <div className="bg-accent py-2 text-center">
                <div className="text-[16px] font-bold uppercase text-accent-foreground">
                  {t('total_goals').toUpperCase()}
                </div>
              </div>
              <div className="p-3 text-center">
                <div className="mb-1 text-[16px]">
                  {detailedResult.odds.sumGoals.value}
                </div>
                <div className="text-[17px] font-semibold">
                  {detailedResult.odds.sumGoals.odds}
                </div>
              </div>
            </div>
          )}
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
