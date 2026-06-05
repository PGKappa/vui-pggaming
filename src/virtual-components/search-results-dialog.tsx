'use client'

import { RootContext } from '@/virtual-contexts/root-context'
import { Discipline, EventResult, RaceResult } from '@/virtual-lib/types'
import { createPGVirtualAPICall, getRacerColors } from '@/virtual-lib/utils'
import Image from 'next/image'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { ScrollArea } from './ui/scroll-area'
import LoadingSpinner from './loading-spinner'

const searchResultsCache = new Map<
  string,
  { timestamp: number; results: EventResult[] }
>()
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000

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

export default function SearchResultsDialog({
  open,
  onOpenChange,
  discipline: disciplineProp,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  discipline?: Discipline
}) {
  const { t } = useTranslation()
  const rootContext = useContext(RootContext)
  const [activeTab, setActiveTab] = useState<'latest' | 'search'>('latest')

  const timezone = rootContext.getTimezone?.() || 'Europe/Rome'
  const dates = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => {
        const d = new Date()
        d.setDate(d.getDate() - index)
        return new Intl.DateTimeFormat('it-IT', {
          timeZone: timezone,
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(d)
      }),
    [timezone],
  )

  const [selectedDiscipline, setSelectedDiscipline] = useState<
    Discipline | 'ALL'
  >('ALL')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('ALL')
  const [fetchedResults, setFetchedResults] = useState<EventResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedResult, setSelectedResult] = useState<EventResult | null>(null)

  const fetchDetailedEventResult = useCallback(
    async (extId: string, eventId: string) => {
      if (!rootContext.initCode || !rootContext.operator) return null
      try {
        const response = await createPGVirtualAPICall(
          `/api/event/results/${extId}/${eventId}`,
          rootContext.initCode,
          undefined,
          rootContext.operator,
        )
        if (!response.ok) return null
        const data = await response.json()
        if (data.ret_code && !data.odds && !data.arrival) return null
        return data
      } catch {
        return null
      }
    },
    [rootContext.initCode, rootContext.operator],
  )

  const handleSearch = async () => {
    setHasSearched(true)
    setFetchedResults([])

    const disciplines: Discipline[] =
      selectedDiscipline === 'ALL'
        ? [Discipline.DOGS, Discipline.HORSES]
        : [selectedDiscipline]

    const cacheKey = `${selectedDiscipline}:${selectedDate}:${selectedTimeSlot}`
    const cached = searchResultsCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL_MS) {
      setFetchedResults(cached.results)
      return
    }

    setIsLoading(true)
    try {
      if (!rootContext.initCode || !rootContext.operator) return

      const allResults: EventResult[] = []

      for (const discipline of disciplines) {
        const gameIds = discipline === Discipline.HORSES ? 'horses6' : 'dogs6'

        const payload = {
          gameIds: [gameIds],
          dateStart: selectedDate || dates[0],
          dateEnd: selectedDate || dates[0],
          ...(selectedTimeSlot !== 'ALL'
            ? (() => {
                const [startTimeStr, endTimeStr] = selectedTimeSlot.split(' | ')
                return {
                  timeStart: startTimeStr.trim(),
                  timeEnd: endTimeStr.trim(),
                }
              })()
            : {}),
        }
        const response = await createPGVirtualAPICall(
          '/api/event/results/list',
          rootContext.initCode,
          {
            method: 'POST',
            body: JSON.stringify(payload),
          },
          rootContext.operator,
        )

        if (!response.ok) continue
        const data = await response.json()
        if (!data.items || !Array.isArray(data.items)) continue

        const filteredItems =
          selectedTimeSlot !== 'ALL'
            ? data.items.filter((item: any) => {
                if (!item.start_time || !item.start_time.includes(':'))
                  return true
                const [startTimeStr, endTimeStr] = selectedTimeSlot.split(' | ')
                const [sh, sm] = startTimeStr.trim().split(':').map(Number)
                const [eh, em] = endTimeStr.trim().split(':').map(Number)
                const startInMinutes = sh * 60 + sm
                const endInMinutes = eh * 60 + em
                const [hours, minutes] = item.start_time.split(':').map(Number)
                const timeInMinutes = hours * 60 + minutes
                return (
                  timeInMinutes >= startInMinutes &&
                  timeInMinutes <= endInMinutes
                )
              })
            : data.items

        const results: EventResult[] = await Promise.all(
          filteredItems.map(async (event: any) => {
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
              name: `${discipline === Discipline.DOGS ? 'Dog' : 'Horse'} Race ${event.int_event_id}`,
              startTime,
              discipline,
              result: detailedResult || {
                podium:
                  event.arrival?.map((c: any, i: number) => ({
                    name: c.name,
                    number: c.number,
                    position: i + 1,
                  })) || [],
                odds: {},
              },
            } as EventResult
          }),
        )

        allResults.push(...results)
      }

      // Ordina per ora decrescente
      allResults.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())

      setFetchedResults(allResults)
      searchResultsCache.set(cacheKey, {
        timestamp: Date.now(),
        results: allResults,
      })
    } catch {
      setFetchedResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Reset quando si chiude
  useEffect(() => {
    if (!open) {
      setHasSearched(false)
      setFetchedResults([])
      setSelectedResult(null)
      setSelectedTimeSlot('ALL')
      setActiveTab('latest')
    }
  }, [open])

  // Latest results from context (already fetched with full detail)
  const latestResults = useMemo(() => {
    const all = rootContext.eventResults ?? []
    const filtered = disciplineProp
      ? all.filter((r) => r.discipline === disciplineProp)
      : all
    return [...filtered].sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    )
  }, [rootContext.eventResults, disciplineProp])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex max-h-[85vh] flex-col overflow-hidden bg-white p-0"
          style={{ width: 'min(440px, 95vw)', maxWidth: '440px' }}
        >
          <DialogHeader className="bg-accent p-4 text-accent-foreground">
            <DialogTitle>{t('search_results')}</DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="grid grid-cols-2 border-b text-center text-sm font-semibold">
            <button
              className={`py-2 transition-colors ${activeTab === 'latest' ? 'border-b-2 border-accent text-accent' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('latest')}
            >
              {t('latest_results')}
            </button>
            <button
              className={`py-2 transition-colors ${activeTab === 'search' ? 'border-b-2 border-accent text-accent' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('search')}
            >
              {t('search_results')}
            </button>
          </div>

          {activeTab === 'latest' ? (
            /* ── LATEST RESULTS ── */
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Header row */}
              <div className="bg-card-header px-3 py-2 text-xs font-bold text-card-header-foreground">
                <div className="flex text-center">
                  <span className="w-12 shrink-0">
                    {t('time').toUpperCase()}
                  </span>
                  <span className="w-12 shrink-0">{t('id').toUpperCase()}</span>
                  <span className="flex-1">
                    {t('arrival').toUpperCase()} 1°-2°-3°
                  </span>
                </div>
              </div>
              <ScrollArea className="flex-1">
                {latestResults.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">
                    {t('no_results_found')}
                  </p>
                ) : (
                  <div>
                    {latestResults.map((eventResult, index) => {
                      const uniqueKey = `latest-${eventResult.discipline}-${eventResult.id}-${index}`
                      const st = eventResult.startTime
                      const timeStr = st
                        ? new Date(st).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '--:--'
                      const podium =
                        eventResult.result && 'podium' in eventResult.result
                          ? eventResult.result.podium
                          : []
                      return (
                        <div
                          key={uniqueKey}
                          className="flex items-center border-b border-gray-200 px-3 py-1"
                        >
                          <div className="w-12 shrink-0 text-center text-xs font-bold text-gray-900">
                            {timeStr}
                          </div>
                          <div className="w-12 shrink-0 text-center text-xs text-gray-700">
                            {eventResult.id}
                          </div>
                          <div className="grid flex-1 grid-cols-3">
                            {podium.slice(0, 3).map((competitor, i) => (
                              <div
                                key={`${competitor.number}-${i}`}
                                className="flex flex-col items-center"
                              >
                                <span className="text-sm font-bold text-gray-900">
                                  {competitor.number}
                                </span>
                                <span
                                  className="w-full truncate text-center text-xs text-gray-600"
                                  title={competitor.name}
                                >
                                  {competitor.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            /* ── SEARCH ── */
            <>
              {/* Filtri */}
              <div className="grid grid-cols-2 gap-2 px-4 pt-4 sm:flex sm:items-center sm:gap-2">
                {/* Disciplina */}
                <div className="min-w-0">
                  <Select
                    value={selectedDiscipline}
                    onValueChange={(v) =>
                      setSelectedDiscipline(
                        v === 'ALL' ? 'ALL' : (v as Discipline),
                      )
                    }
                  >
                    <SelectTrigger
                      className="h-9 w-full border border-gray-300 bg-white px-2 text-sm"
                      style={{ color: 'hsl(var(--table-foreground))' }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      className="bg-white"
                      style={{ color: 'hsl(var(--table-foreground))' }}
                    >
                      <SelectItem value={Discipline.DOGS}>
                        {t('dog_racing')}
                      </SelectItem>
                      <SelectItem value={Discipline.HORSES}>
                        {t('horse_racing')}
                      </SelectItem>
                      <SelectItem value="ALL">
                        {t('all_disciplines')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Data */}
                <div className="min-w-0">
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger
                      className="h-9 w-full border border-gray-300 bg-white px-2 text-sm"
                      style={{ color: 'hsl(var(--table-foreground))' }}
                    >
                      <SelectValue placeholder={t('date')} />
                    </SelectTrigger>
                    <SelectContent
                      className="bg-white"
                      style={{ color: 'hsl(var(--table-foreground))' }}
                    >
                      {dates.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fascia Oraria */}
                <div className="col-span-2 min-w-0 sm:flex-1">
                  <Select
                    value={selectedTimeSlot}
                    onValueChange={setSelectedTimeSlot}
                  >
                    <SelectTrigger
                      className="h-9 w-full border border-gray-300 bg-white px-2 text-sm"
                      style={{ color: 'hsl(var(--table-foreground))' }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      className="bg-white"
                      style={{ color: 'hsl(var(--table-foreground))' }}
                    >
                      <SelectItem value="ALL">{t('time_slot')}</SelectItem>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Risultati ricerca */}
              <div className="flex min-h-0 flex-1 flex-col px-4 pb-2">
                {hasSearched && (
                  <ScrollArea className="mt-3 flex-1">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : fetchedResults.length > 0 ? (
                      <div className="space-y-1">
                        {fetchedResults.map((eventResult, index) => {
                          const uniqueKey = `${eventResult.discipline}-${eventResult.id}-${index}`
                          const timeStr =
                            eventResult.startTime instanceof Date &&
                            !isNaN(eventResult.startTime.getTime())
                              ? eventResult.startTime.toLocaleTimeString(
                                  'it-IT',
                                  { hour: '2-digit', minute: '2-digit' },
                                )
                              : '--:--'
                          const icon =
                            eventResult.discipline === Discipline.DOGS
                              ? '/dog-image.png'
                              : '/horse-image.png'
                          return (
                            <div
                              key={uniqueKey}
                              className="flex items-center justify-between border-b border-gray-100 px-2 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <Image
                                  src={icon}
                                  alt={eventResult.discipline}
                                  width={22}
                                  height={22}
                                  className="object-contain"
                                />
                                <div>
                                  <p className="text-xs font-semibold text-gray-900">
                                    {eventResult.discipline === Discipline.DOGS
                                      ? t('dog_races_label')
                                      : t('horse_races_label')}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    ID {eventResult.id}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-900">
                                  {timeStr}
                                </span>
                                <Button
                                  size="sm"
                                  className="h-8 bg-secondary px-3 text-xs text-secondary-foreground hover:bg-secondary/90"
                                  onClick={() => setSelectedResult(eventResult)}
                                >
                                  {t('show_results')}
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="py-8 text-center text-sm text-gray-500">
                        {t('no_results_found')}
                      </p>
                    )}
                  </ScrollArea>
                )}
              </div>

              {/* Pulsante Cerca */}
              <div className="flex justify-center px-4 pb-4 pt-2">
                <Button
                  className="h-10 w-40 bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={handleSearch}
                >
                  {t('accept').toUpperCase()}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog dettaglio risultato */}
      <Dialog
        open={!!selectedResult}
        onOpenChange={(o) => {
          if (!o) setSelectedResult(null)
        }}
      >
        <DialogContent
          className="flex max-h-[85vh] flex-col overflow-hidden bg-white p-0"
          style={{ width: 'min(440px, 95vw)', maxWidth: '440px' }}
        >
          <DialogHeader className="bg-secondary p-4 text-secondary-foreground">
            <DialogTitle>
              {selectedResult?.discipline === Discipline.DOGS
                ? t('dog_races_label')
                : t('horse_races_label')}{' '}
              — ID {selectedResult?.id}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            {selectedResult && (
              <EventResultDetails eventResult={selectedResult} />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}

function EventResultDetails({ eventResult }: { eventResult: EventResult }) {
  const { t } = useTranslation()
  const detailedResult = eventResult.result as RaceResult | undefined

  if (!detailedResult) {
    return (
      <div className="p-3 text-center text-sm text-gray-500">
        {t('no_results_found')}
      </div>
    )
  }

  const raceResult = detailedResult as RaceResult

  // Arrival order
  const arrival = (detailedResult as any).arrival as
    | Array<{ name: string; number: number }>
    | undefined

  return (
    <div className="space-y-2 bg-white p-2">
      {/* Arrival order */}
      {arrival && arrival.length > 0 && (
        <div className="border-b pb-2">
          <div className="bg-secondary py-1.5 text-center text-xs font-semibold text-secondary-foreground">
            {t('arrival_order').toUpperCase()}
          </div>
          <div className="flex items-center justify-center gap-6 py-2">
            {arrival.slice(0, 3).map((competitor, index) => {
              const medals = [
                '/cockade_gold.png',
                '/cockade_silver.png',
                '/cockade_bronze.png',
              ]
              return (
                <div
                  key={competitor.number}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex h-8 w-8 items-center justify-center">
                    <Image
                      src={medals[index]}
                      alt={`${index + 1}`}
                      width={32}
                      height={32}
                      className="absolute"
                    />
                    <span className="relative pb-1.5 text-sm font-bold">
                      {index + 1}
                    </span>
                  </div>
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded text-sm font-semibold"
                    style={
                      getRacerColors(
                        competitor.number,
                        eventResult.discipline as 'DOGS' | 'HORSES',
                      ).style
                    }
                  >
                    {competitor.number}
                  </div>
                  <span className="text-xs font-semibold">
                    {competitor.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Odds grids */}
      {raceResult.odds && (
        <>
          {/* Winner / Placed / Show */}
          <div className="grid grid-cols-3 gap-px border">
            {raceResult.odds.winner && (
              <OddsColumn
                title={t('winner').toUpperCase()}
                entries={Object.entries(raceResult.odds.winner)}
                discipline={eventResult.discipline as 'DOGS' | 'HORSES'}
              />
            )}
            {raceResult.odds.placed && (
              <OddsColumn
                title={t('place_2_short').toUpperCase()}
                entries={Object.entries(raceResult.odds.placed)}
                discipline={eventResult.discipline as 'DOGS' | 'HORSES'}
              />
            )}
            {raceResult.odds.show && (
              <OddsColumn
                title={t('show_3_short').toUpperCase()}
                entries={Object.entries(raceResult.odds.show)}
                discipline={eventResult.discipline as 'DOGS' | 'HORSES'}
              />
            )}
          </div>

          {/* Exacta / Quinella */}
          <div className="grid grid-cols-2 gap-px border">
            {raceResult.odds.exacta && (
              <CombinationColumn
                title={t('exacta').toUpperCase()}
                data={raceResult.odds.exacta}
                depth={2}
                discipline={eventResult.discipline as 'DOGS' | 'HORSES'}
              />
            )}
            {raceResult.odds.quinella && (
              <CombinationColumn
                title={t('quinella').toUpperCase()}
                data={raceResult.odds.quinella}
                depth={2}
                discipline={eventResult.discipline as 'DOGS' | 'HORSES'}
              />
            )}
          </div>

          {/* Trifecta / Boxed Trifecta */}
          <div className="grid grid-cols-2 gap-px border">
            {raceResult.odds.trifecta && (
              <CombinationColumn
                title={t('trifecta').toUpperCase()}
                data={raceResult.odds.trifecta}
                depth={3}
                discipline={eventResult.discipline as 'DOGS' | 'HORSES'}
              />
            )}
            {raceResult.odds.boxedtrifecta && (
              <CombinationColumn
                title={t('boxed_trifecta').toUpperCase()}
                data={raceResult.odds.boxedtrifecta}
                depth={3}
                discipline={eventResult.discipline as 'DOGS' | 'HORSES'}
              />
            )}
          </div>

          {/* Even/Odd - Under/Over */}
          <div className="grid grid-cols-2 gap-px border">
            {raceResult.odds.evenodd && (
              <div>
                <div className="bg-secondary py-1.5 text-center text-xs font-semibold text-secondary-foreground">
                  {t('even_odd').toUpperCase()}
                </div>
                <div className="space-y-1 p-2 text-xs">
                  {Object.entries(raceResult.odds.evenodd).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <span className="font-semibold">
                          {key === 'even' ? t('even') : t('odd')}
                        </span>
                        <span>{value}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {raceResult.odds.underover && (
              <div>
                <div className="bg-secondary py-1.5 text-center text-xs font-semibold text-secondary-foreground">
                  {t('under_over').toUpperCase()}
                </div>
                <div className="space-y-1 p-2 text-xs">
                  {Object.entries(raceResult.odds.underover).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <span className="font-semibold">
                          {key.toUpperCase()}
                        </span>
                        <span>{value}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function OddsColumn({
  title,
  entries,
  discipline,
}: {
  title: string
  entries: [string, string][]
  discipline: 'DOGS' | 'HORSES'
}) {
  return (
    <div>
      <div className="bg-secondary py-1.5 text-center text-xs font-semibold text-secondary-foreground">
        {title}
      </div>
      <div className="space-y-1 p-2">
        {entries.map(([number, odds]) => (
          <div key={number} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded text-xs font-semibold"
                style={getRacerColors(parseInt(number), discipline).style}
              >
                {number}
              </div>
            </div>
            <span className="text-xs font-semibold">{odds}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CombinationColumn({
  title,
  data,
  depth,
  discipline,
}: {
  title: string
  data: any
  depth: number
  discipline: 'DOGS' | 'HORSES'
}) {
  const combinations = useMemo(() => {
    const results: Array<{ combination: string; odds: string }> = []
    if (depth === 2) {
      Object.entries(data).forEach(([first, secondObj]: [string, any]) => {
        if (typeof secondObj === 'object') {
          Object.entries(secondObj).forEach(([second, odds]: [string, any]) => {
            results.push({
              combination: `${first}-${second}`,
              odds: String(odds),
            })
          })
        }
      })
    } else {
      Object.entries(data).forEach(([first, secondObj]: [string, any]) => {
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
      })
    }
    return results
  }, [data, depth])

  return (
    <div>
      <div className="bg-secondary py-1.5 text-center text-xs font-semibold text-secondary-foreground">
        {title}
      </div>
      <div className="space-y-1 p-2">
        {combinations.map(({ combination, odds }) => (
          <div key={combination} className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {combination.split('-').map((num, idx) => (
                <div
                  key={idx}
                  className="flex h-6 w-6 items-center justify-center rounded text-xs font-semibold"
                  style={getRacerColors(parseInt(num), discipline).style}
                >
                  {num}
                </div>
              ))}
            </div>
            <span className="text-xs font-semibold">{odds}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
