import { RootContext } from '@/retail-contexts/root-context'
import { Discipline, EventResult, RaceResult } from '@/retail-lib/types'
import { getRacerColors, createPGVirtualAPICall } from '@/retail-lib/utils'
import { format } from 'date-fns'
import { t } from 'i18next'
import Image from 'next/image'
import { X } from 'lucide-react'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import ReactPlayer from 'react-player/lazy'
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

// Detailed odds for a single race, fetched lazily on expand and cached
// so re-opening an already-viewed race doesn't refetch.
const raceDetailCache = new Map<string, RaceResult>()

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
        confirmedDiscipline === Discipline.DOGS
      ) {
        const fetchRacingResults = async () => {
          setIsLoading(true)
          try {
            if (!initCode || !operator) {
              setIsLoading(false)
              return
            }
            const today = new Date()
            const sevenDaysAgo = new Date(today)
            sevenDaysAgo.setDate(today.getDate() - 7)
            const dateStart = formatDateForAPI(sevenDaysAgo)
            const dateEnd = formatDateForAPI(today)
            const gameIds =
              confirmedDiscipline === Discipline.HORSES ? 'horses6' : 'dogs6'
            const requestBody = {
              gameIds: [gameIds],
              dateStart,
              dateEnd,
              timezone,
            }
            const response = await createPGVirtualAPICall(
              '/api/event/results/list',
              initCode,
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
            // Detailed odds/results are fetched lazily by EventResultDetails
            // when a race is actually expanded, so the list appears instantly.
            const results: EventResult[] = limitedItems.map((event: any) => {
              const palId = getPalId(event)
              const eventId = getEventId(event)
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
                id: Number(eventId),
                extId: palId,
                name: `${confirmedDiscipline === Discipline.DOGS ? 'Dog' : 'Horse'} Race ${eventId}`,
                startTime,
                discipline: confirmedDiscipline,
                track: event.track_name || event.track || '6',
                result: {
                  arrival:
                    event.arrival?.map((competitor: any) => ({
                      name: competitor.name,
                      number: competitor.number,
                    })) || [],
                  odds: {},
                },
              }
            })
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
        if (!initCode || !operator) {
          setIsLoading(false)
          return
        }
        const gameIds =
          discipline === Discipline.HORSES
            ? 'horses6'
            : discipline === Discipline.DOGS
              ? 'dogs6'
              : `${discipline.toLowerCase()}6`
        const requestBody: Record<string, any> = {
          gameIds: [gameIds],
          dateStart: date,
          dateEnd: date,
          timezone,
        }
        if (confirmedTimeSlot !== 'ALL') {
          const [startTimeStr, endTimeStr] = confirmedTimeSlot.split(' | ')
          requestBody.timeStart = startTimeStr.trim()
          requestBody.timeEnd = endTimeStr.trim()
        }
        const response = await createPGVirtualAPICall(
          '/api/event/results/list',
          initCode,
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
          discipline === Discipline.DOGS
        ) {
          let filteredItems = data.items
          // Client-side fallback filter in case backend doesn't support timeStart/timeEnd yet
          if (
            confirmedTimeSlot !== 'ALL' &&
            filteredItems.length === data.items.length
          ) {
            const [startTimeStr, endTimeStr] = confirmedTimeSlot.split(' | ')
            const [startHours, startMinutes] = startTimeStr
              .trim()
              .split(':')
              .map(Number)
            const [endHours, endMinutes] = endTimeStr
              .trim()
              .split(':')
              .map(Number)
            const startInMinutes = startHours * 60 + startMinutes
            const endInMinutes = endHours * 60 + endMinutes
            const filtered = data.items.filter((item: any) => {
              if (!item.start_time || !item.start_time.includes(':'))
                return false
              const [hours, minutes] = item.start_time.split(':').map(Number)
              const timeInMinutes = hours * 60 + minutes
              return (
                timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes
              )
            })
            if (filtered.length < data.items.length) {
              filteredItems = filtered
            }
          }

          // Detailed odds/results are fetched lazily by EventResultDetails
          // when a race is actually expanded, so the list appears instantly.
          results = filteredItems.map((result: any) => {
            const palId = getPalId(result)
            const eventId = getEventId(result)
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

            const raceResult: RaceResult = {
              arrival:
                (
                  result.arrival as Array<{ name: string; number: number }>
                )?.map((item: any) => ({
                  name: item.name,
                  number: item.number,
                })) || [],
              odds: {},
            } as RaceResult

            return {
              id: Number(eventId),
              extId: palId,
              name: result.track_name || `${discipline} Race ${eventId}`,
              startTime,
              discipline,
              track: result.track_name || result.track,
              result: raceResult,
            } as EventResult
          })
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
    initCode,
    operator,
    timezone,
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
    const effectiveTimeSlot =
      lastTenGames || selectedTimeSlot === 'TUTTE' ? 'ALL' : selectedTimeSlot
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
    if (!confirmedDate) return []
    return fetchedResults.filter(
      (result) => result.discipline === confirmedDiscipline,
    )
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

  return (
    <div className="flex h-full flex-col space-y-1">
      <div className="flex h-16 w-full items-center space-x-1 bg-accent px-[16px] min-[1400px]:space-x-2 min-[1400px]:px-[60px] min-[1600px]:px-[100px] min-[1750px]:px-[130px] min-[1920px]:px-[167px]">
        {/* DISCIPLINA */}
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
          <SelectTrigger className="mr-0 h-[46px] min-w-0 flex-1 border-none bg-background pl-[12px] pr-[4px] text-[16px] text-foreground tabular-nums min-[1400px]:mr-1 min-[1400px]:pl-[16px] min-[1400px]:pr-[5px]">
            <SelectValue placeholder={t('sport')} />
          </SelectTrigger>
          <SelectContent className="bg-white p-0">
            <SelectItem className="text-[14px]" value="NONE">
              {t('discipline').toUpperCase()}
            </SelectItem>
            {Object.values(Discipline)
              .filter((d) => d !== Discipline.SOCCER)
              .map((d) => {
                const translationKey =
                  d === 'DOGS'
                    ? 'dog_racing'
                    : d === 'HORSES'
                      ? 'horse_racing'
                      : 'football'
                return (
                  <SelectItem className="text-[14px]" key={d} value={d}>
                    {t(translationKey).toUpperCase()}
                  </SelectItem>
                )
              })}
          </SelectContent>
        </Select>

        {/* LAST 10 GAMES */}
        <div className="ml-0.5 flex shrink-0 flex-row items-center min-[1400px]:ml-1.5">
          <Checkbox
            id="last10"
            className="h-6 w-6 border-0 bg-background text-foreground"
            checked={lastTenGames}
            onCheckedChange={(value) => setLastTenGames(!!value)}
          />
          <label
            htmlFor="last10"
            className="mr-0 whitespace-nowrap px-1 py-3 text-[15px] font-semibold text-background min-[1400px]:mr-[-4px] min-[1400px]:px-2"
          >
            <span className="min-[1400px]:hidden">{t('last_10_short')}</span>
            <span className="hidden min-[1400px]:inline">{t('last_10_games')}</span>
          </label>
        </div>

        {/* DATA */}
        <Select
          value={selectedDate}
          onValueChange={(value) => setSelectedDate(value)}
          disabled={lastTenGames}
        >
          <SelectTrigger className="h-[46px] min-w-0 flex-1 border-none bg-background pl-[12px] pr-[4px] text-[16px] text-foreground tabular-nums disabled:opacity-95 min-[1400px]:pl-[17px] min-[1400px]:pr-[5px]">
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
          <SelectTrigger className="relative left-0 h-[46px] min-w-0 flex-1 border-none bg-background pl-[12px] pr-[4px] text-[16px] text-foreground tabular-nums disabled:opacity-95 min-[1400px]:left-[10px] min-[1400px]:pl-[17px] min-[1400px]:pr-[5px]">
            <SelectValue placeholder={t('time_slot')} />
          </SelectTrigger>
          <SelectContent className="bg-white p-0">
            <SelectItem className="text-[14px]" value="ALL">
              {t('time_slot').toUpperCase()}
            </SelectItem>
            <SelectItem className="text-[14px]" value="TUTTE">
              {t('all_time_slots').toUpperCase()}
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
          className="relative left-0 ml-0.5 mr-1.5 h-[46px] min-w-0 flex-1 bg-searchResButton text-[16px] font-bold text-bet-foreground hover:opacity-90 disabled:opacity-85 min-[1400px]:left-[26px] min-[1400px]:ml-2 min-[1400px]:mr-4"
          disabled={selectedDiscipline === 'NONE'}
          onClick={handleSearch}
        >
          {t('search').toUpperCase()}
        </Button>

        {/* RESET */}
        <Button
          className="relative left-0 h-[46px] min-w-0 flex-1 bg-searchResButton text-[15px] text-tertiary-foreground min-[1400px]:left-[42px]"
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
                                ? t('dog_races_label')
                                : eventResult.discipline === 'HORSES'
                                  ? t('horse_races_label')
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
                              : (eventResult.track || '6') && (
                                  <span className="whitespace-nowrap border-l border-l-white pl-4">
                                    {(() => {
                                      const trackValue =
                                        eventResult.track || '6'
                                      const numberMatch =
                                        trackValue.match(/\d+/)
                                      const trackNum = numberMatch
                                        ? numberMatch[0]
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
                        <div className="pointer-events-auto flex items-center justify-center">
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
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [showReplay, setShowReplay] = useState(false)
  const [replayUrl, setReplayUrl] = useState<string | null>(null)
  const [loadingReplay, setLoadingReplay] = useState(false)

  const fetchReplay = useCallback(async () => {
    if (!rootContext.initCode || !rootContext.operator || !eventResult.extId)
      return
    setLoadingReplay(true)
    try {
      const gameId =
        eventResult.discipline === Discipline.DOGS ? 'dogs6' : 'horses6'
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
      if (!response.ok) {
        setLoadingReplay(false)
        return
      }
      const data = await response.json()
      console.log('Replay response:', data)
      if (data.video?.src) {
        setReplayUrl(data.video.src)
        setShowReplay(true)
      } else {
        console.error('No video src in replay response:', data)
      }
    } catch (error) {
      console.error('Error fetching replay:', error)
    }
    setLoadingReplay(false)
  }, [
    rootContext.initCode,
    rootContext.operator,
    eventResult.extId,
    eventResult.id,
    eventResult.discipline,
  ])

  useEffect(() => {
    const existing = eventResult.result as RaceResult | undefined
    const hasOdds = !!existing?.odds && Object.keys(existing.odds).length > 0
    if (hasOdds) {
      setDetailedResult(existing)
      return
    }

    setDetailedResult(existing || null)

    const cacheKey = eventResult.extId && `${eventResult.extId}-${eventResult.id}`
    if (
      !cacheKey ||
      (eventResult.discipline !== Discipline.HORSES &&
        eventResult.discipline !== Discipline.DOGS) ||
      !rootContext.initCode ||
      !rootContext.operator
    ) {
      return
    }

    const cached = raceDetailCache.get(cacheKey)
    if (cached) {
      setDetailedResult(cached)
      return
    }

    let cancelled = false
    setIsLoadingDetail(true)
    createPGVirtualAPICall(
      `/api/event/results/${eventResult.extId}/${eventResult.id}`,
      rootContext.initCode,
      undefined,
      rootContext.operator,
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data || (data.ret_code && !data.odds && !data.arrival))
          return
        const merged: RaceResult = {
          ...data,
          arrival: data.arrival?.length ? data.arrival : existing?.arrival,
        }
        raceDetailCache.set(cacheKey, merged)
        setDetailedResult(merged)
      })
      .catch((error) => {
        console.error('Error fetching detailed result:', error)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDetail(false)
      })

    return () => {
      cancelled = true
    }
  }, [eventResult, rootContext.initCode, rootContext.operator])

  if (isLoadingDetail && (!detailedResult?.odds || Object.keys(detailedResult.odds).length === 0)) {
    return (
      <div className="flex justify-center p-4">
        <LoadingSpinner />
      </div>
    )
  }

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

      if (showReplay && replayUrl) {
        return (
          <div className="relative mb-[-48px] flex flex-col items-center">
            <button
              onClick={() => setShowReplay(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/60 text-foreground hover:bg-background/80"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex h-[660px] w-full items-center justify-center bg-black">
              <ReactPlayer
                key={replayUrl}
                url={replayUrl}
                controls
                playing
                playsinline
                muted
                width="100%"
                height="100%"
                style={{ backgroundColor: '#000' }}
                onEnded={() => setShowReplay(false)}
                onError={(e) => console.error('Video error:', e)}
              />
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
                          <div className="relative flex h-11 w-11 items-center justify-center tabular-nums">
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
                                eventResult.discipline as 'DOGS' | 'HORSES',
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
                                eventResult.discipline as 'DOGS' | 'HORSES',
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
                                eventResult.discipline as 'DOGS' | 'HORSES',
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
                                eventResult.discipline as 'DOGS' | 'HORSES',
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
                                  eventResult.discipline as 'DOGS' | 'HORSES',
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
                                  eventResult.discipline as 'DOGS' | 'HORSES',
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
                                  eventResult.discipline as 'DOGS' | 'HORSES',
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
                                  eventResult.discipline as 'DOGS' | 'HORSES',
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
            eventResult.discipline === Discipline.HORSES) && (
            <div className="flex justify-center pb-11 relative bottom-[23px] ">
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
        <div className="grid grid-cols-2 space-y-2">
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
