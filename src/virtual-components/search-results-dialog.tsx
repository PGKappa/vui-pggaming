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

const dates = Array.from({ length: 10 }, (_, index) => {
  const date = new Date()
  date.setDate(date.getDate() - index)
  return date.toLocaleDateString('it-IT')
})

// Cache a livello modulo
const searchResultsCache = new Map<
  string,
  { timestamp: number; results: EventResult[] }
>()
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000

export default function SearchResultsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const rootContext = useContext(RootContext)

  const [selectedDiscipline, setSelectedDiscipline] = useState<
    Discipline | 'ALL'
  >('ALL')
  const [selectedDate, setSelectedDate] = useState<string>(dates[0])
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

    const cacheKey = `${selectedDiscipline}:${selectedDate}`
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

        const response = await createPGVirtualAPICall(
          '/api/event/results/list',
          rootContext.initCode,
          {
            method: 'POST',
            body: JSON.stringify({
              gameIds: [gameIds],
              dateStart: selectedDate,
              dateEnd: selectedDate,
            }),
          },
          rootContext.operator,
        )

        if (!response.ok) continue
        const data = await response.json()
        if (!data.items || !Array.isArray(data.items)) continue

        const results: EventResult[] = await Promise.all(
          data.items.map(async (event: any) => {
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
    }
  }, [open])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] w-[350px] !max-w-[440px] flex-col overflow-hidden bg-white p-0">
          <DialogHeader className="bg-accent p-4 text-accent-foreground">
            <DialogTitle>{t('search_results')}</DialogTitle>
          </DialogHeader>

          {/* Filtri */}
          <div className="flex items-center gap-3 px-4 pt-4">
            {/* Disciplina */}
            <Select
              value={selectedDiscipline}
              onValueChange={(v) =>
                setSelectedDiscipline(v === 'ALL' ? 'ALL' : (v as Discipline))
              }
            >
              <SelectTrigger
                className="h-10 flex-1 border border-gray-300 bg-white text-sm"
                style={{ color: '#111827' }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white" style={{ color: '#111827' }}>
                <SelectItem value={Discipline.DOGS}>
                  {t('dog_racing')}
                </SelectItem>
                <SelectItem value={Discipline.HORSES}>
                  {t('horse_racing')}
                </SelectItem>
                <SelectItem value="ALL">{t('all_disciplines')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Data */}
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger
                className="h-10 flex-1 border border-gray-300 bg-white text-sm"
                style={{ color: '#111827' }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white" style={{ color: '#111827' }}>
                {dates.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Risultati */}
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
                          ? eventResult.startTime.toLocaleTimeString('it-IT', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
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
                              <p
                                className="text-xs font-semibold"
                                style={{ color: '#111827' }}
                              >
                                {eventResult.discipline === Discipline.DOGS
                                  ? t('dog_races_label')
                                  : t('horse_races_label')}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: '#6b7280' }}
                              >
                                ID {eventResult.id}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs font-semibold"
                              style={{ color: '#111827' }}
                            >
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
                  <p
                    className="py-8 text-center text-sm"
                    style={{ color: '#6b7280' }}
                  >
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
        </DialogContent>
      </Dialog>

      {/* Dialog dettaglio risultato */}
      <Dialog
        open={!!selectedResult}
        onOpenChange={(o) => {
          if (!o) setSelectedResult(null)
        }}
      >
        <DialogContent className="flex max-h-[85vh] w-full !max-w-[440px] flex-col overflow-hidden bg-white p-0">
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
