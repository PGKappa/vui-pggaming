import { RootContext } from '@/retail-contexts/root-context'
import { Discipline, EventResult, RaceResult } from '@/retail-lib/types'
import { getRacerColors, createPGVirtualAPICall } from '@/retail-lib/utils'
import { format } from 'date-fns'
import { t } from 'i18next'
import Image from 'next/image'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
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
import { getLayoutConfig } from '@/retail-lib/layout-config'

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

// Cache a livello modulo per i risultati di ricerca
const searchResultsCache = new Map<
  string,
  { timestamp: number; results: EventResult[] }
>()
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minuti

export default function SearchEventResults() {
  const { t } = useTranslation()
  const rootContext = useContext(RootContext)

  const currentLanguage = rootContext?.userData?.lang || 'en'
  const layoutConfig = getLayoutConfig(currentLanguage)
  const {
    disciplineSelectLeft,
    disciplineSelectMinWidth,
    searchBarPaddingRight,
  } = layoutConfig.searchEventResults

  // Stati per i parametri selezionati (UI)
  const [selectedDiscipline, setSelectedDiscipline] = useState<
    Discipline | 'NONE'
  >('NONE')
  const [selectedDate, setSelectedDate] = useState<string>('ALL')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('ALL')
  const [lastTenGames, setLastTenGames] = useState<boolean>(true)

  // Stati per i parametri confermati (usati per la ricerca)
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

  // Trigger per avviare la ricerca (incrementato quando l'utente clicca CERCA)
  const [searchTrigger, setSearchTrigger] = useState<number>(0)
  // Snapshot dei risultati del context al momento della ricerca
  const [contextResultsSnapshot, setContextResultsSnapshot] = useState<
    EventResult[]
  >([])

  const fetchDetailedEventResult = useCallback(
    async (extId: string, eventId: string) => {
      if (!rootContext.initCode || !rootContext.operator) {
        return null
      }
      try {
        const response = await createPGVirtualAPICall(
          `/api/event/results/${extId}/${eventId}`,
          rootContext.initCode,
          undefined,
          rootContext.operator,
        )

        if (!response.ok) {
          console.warn('Response not ok:', response.status)
          return null
        }

        const data = await response.json()

        // Controlla se è un errore API (ha ret_code senza dati reali)
        if (data.ret_code && !data.odds && !data.arrival) {
          return null
        }

        return data
      } catch (error) {
        console.error('Error fetching detailed result:', error)
        return null
      }
    },
    [rootContext.initCode, rootContext.operator],
  )

  useEffect(() => {
    // Esegui solo dopo che l'utente ha cliccato CERCA
    if (searchTrigger === 0) {
      return
    }

    if (confirmedDiscipline === 'NONE') {
      setFetchedResults([])
      return
    }

    // Genera cache key per questa ricerca
    const cacheKey = `${confirmedDiscipline}:${confirmedDate}:${confirmedTimeSlot}:${confirmedLastTenGames}`
    const cached = searchResultsCache.get(cacheKey)

    // Se abbiamo risultati in cache validi, usali
    if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL_MS) {
      setFetchedResults(cached.results)
      return
    }

    if (confirmedLastTenGames) {
      // Usa lo snapshot dei risultati del context (preso al momento del click su CERCA)
      const existingResults = contextResultsSnapshot.filter(
        (result) => result.discipline === confirmedDiscipline,
      )

      console.log('[SearchEvents] Context snapshot:', {
        discipline: confirmedDiscipline,
        totalSnapshotResults: contextResultsSnapshot.length,
        filteredCount: existingResults.length,
        allDisciplines: [
          ...new Set(contextResultsSnapshot.map((r) => r.discipline)),
        ],
      })

      if (existingResults.length > 0) {
        // Assicura che tutti i risultati abbiano un track (derivato dalla disciplina)
        const defaultTrack =
          confirmedDiscipline === Discipline.DOGS8 ? '8' : '6'
        const resultsWithTrack = existingResults.map((r) => ({
          ...r,
          track: r.track || defaultTrack,
        }))
        setFetchedResults(resultsWithTrack)
        // Salva in cache
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
            // Usa l'API /api/event/results/list anche per Last 10 Games
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

            const requestBody = {
              gameIds: [gameIds],
              dateStart: dateStart,
              dateEnd: dateEnd,
            }

            console.log('[SearchEvents] Fetching racing results:', {
              discipline: confirmedDiscipline,
              gameIds,
              requestBody,
            })

            const response = await createPGVirtualAPICall(
              '/api/event/results/list',
              rootContext.initCode,
              {
                method: 'POST',
                body: JSON.stringify(requestBody),
              },
              rootContext.operator,
            )

            if (!response.ok) {
              console.error('[SearchEvents] Response not ok:', response.status)
              throw new Error('Failed to fetch racing events')
            }

            const data = await response.json()
            console.log('[SearchEvents] API response data:', {
              discipline: confirmedDiscipline,
              itemsCount: data.items?.length,
              data,
            })

            if (!data.items || !Array.isArray(data.items)) {
              console.warn(
                '[SearchEvents] No items in response for',
                confirmedDiscipline,
              )
              setFetchedResults([])
              return
            }

            // LIMITA a 10 risultati PRIMA di fare fetch dettagli
            const limitedItems = data.items.slice(0, 10)

            const results: EventResult[] = await Promise.all(
              limitedItems.map(async (event: any) => {
                const detailedResult = await fetchDetailedEventResult(
                  event.ext_pal_id,
                  event.int_event_id.toString(),
                )

                let startTime: Date
                try {
                  // Se time non c'è, usa oggi; altrimenti usa event.time
                  startTime = event.time ? new Date(event.time) : new Date()

                  // Applica SEMPRE l'orario da start_time se disponibile
                  if (event.start_time && event.start_time.includes(':')) {
                    const [hours, minutes] = event.start_time.split(':')
                    startTime.setHours(parseInt(hours, 10))
                    startTime.setMinutes(parseInt(minutes, 10))
                    startTime.setSeconds(0) // Reset secondi per coerenza
                  }
                } catch {
                  startTime = new Date()
                }

                return {
                  id: event.int_event_id,
                  extId: event.ext_pal_id,
                  name: `${confirmedDiscipline === Discipline.DOGS || confirmedDiscipline === Discipline.DOGS8 ? 'Dog' : 'Horse'} Race ${event.int_event_id}`,
                  startTime: startTime,
                  discipline: confirmedDiscipline,
                  track:
                    event.track_name ||
                    event.track ||
                    (confirmedDiscipline === Discipline.DOGS8 ? '8' : '6'),
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

            console.log('[SearchEvents] Processed results:', {
              discipline: confirmedDiscipline,
              resultsCount: results.length,
              results,
            })
            setFetchedResults(results)
            // Salva in cache
            searchResultsCache.set(cacheKey, { timestamp: Date.now(), results })
          } catch (error) {
            console.error(
              '[SearchEvents] Error fetching racing results:',
              error,
            )
            setFetchedResults([])
          } finally {
            setIsLoading(false)
          }
        }

        fetchRacingResults()
      }
      // Non mettere return qui! Altrimenti quando lastTenGames è false non esegue fetchEventResults
    }

    // Se lastTenGames è false, esegue la fetch normale con data e fascia oraria
    if (!confirmedLastTenGames && !confirmedDate) {
      setFetchedResults([])
      return
    }

    if (confirmedLastTenGames) {
      // Se lastTenGames è true, abbiamo già fatto la fetch sopra
      return
    }

    const fetchEventResults = async (discipline: Discipline, date: string) => {
      setIsLoading(true)

      try {
        if (!rootContext.initCode || !rootContext.operator) {
          setIsLoading(false)
          return
        }
        const apiDateFormat = date

        const gameIds =
          discipline === Discipline.HORSES
            ? 'horses6'
            : discipline === Discipline.DOGS
              ? 'dogs6'
              : discipline === Discipline.DOGS8
                ? 'dogs8'
                : `${discipline.toLowerCase()}6`

        const requestBody = {
          gameIds: [gameIds],
          dateStart: apiDateFormat,
          dateEnd: apiDateFormat,
        }

        const response = await createPGVirtualAPICall(
          '/api/event/results/list',
          rootContext.initCode,
          {
            method: 'POST',
            body: JSON.stringify(requestBody),
          },
          rootContext.operator,
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
          discipline === Discipline.DOGS ||
          discipline === Discipline.DOGS8
        ) {
          // OTTIMIZZAZIONE: Filtra per fascia oraria PRIMA di fare fetchDetailedEventResult
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
              // Usa start_time direttamente (formato HH:MM)
              if (!item.start_time || !item.start_time.includes(':')) {
                return false
              }

              const [hours, minutes] = item.start_time.split(':').map(Number)
              const timeInMinutes = hours * 60 + minutes

              const isInRange =
                timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes

              return isInRange
            })
          }

          // Ora chiama fetchDetailedEventResult SOLO per gli eventi filtrati
          results = await Promise.all(
            filteredItems.map(async (result: any) => {
              const detailedResult = await fetchDetailedEventResult(
                result.ext_pal_id,
                result.int_event_id.toString(),
              )

              let startTime: Date
              try {
                // Se time non c'è, usa la data passata; altrimenti usa result.time
                if (result.time) {
                  startTime = new Date(result.time)
                } else {
                  startTime = new Date(date.split('/').reverse().join('-'))
                }

                // Applica SEMPRE l'orario da start_time se disponibile
                if (result.start_time && result.start_time.includes(':')) {
                  const [hours, minutes] = result.start_time.split(':')
                  startTime.setHours(parseInt(hours, 10))
                  startTime.setMinutes(parseInt(minutes, 10))
                  startTime.setSeconds(0) // Reset secondi per coerenza
                }
              } catch {
                startTime = new Date()
              }

              let raceResult = detailedResult

              // Se detailedResult è null o non ha dati, crea oggetto di fallback dai dati base
              if (!detailedResult) {
                // Se arrival è vuoto, ritorna null per filtrare il risultato
                if (!result.arrival || result.arrival.length === 0) {
                  return null
                }

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

              const trackValue =
                detailedResult?.track_name ||
                result.track_name ||
                result.track ||
                (discipline === Discipline.DOGS8 ? '8' : '6')

              return {
                id: result.int_event_id,
                extId: result.ext_pal_id,
                name:
                  detailedResult?.track_name ||
                  result.track_name ||
                  `${discipline === Discipline.DOGS || discipline === Discipline.DOGS8 ? 'Dog' : 'Horse'} Race ${result.int_event_id}`,
                startTime,
                discipline: discipline,
                track: trackValue,
                result: raceResult,
              } as EventResult
            }),
          )

          // FILTRA via i risultati null (quelli senza arrival disponibile)
          results = results.filter(
            (r: EventResult | null) => r !== null,
          ) as EventResult[]
        } else if (discipline === Discipline.SOCCER) {
          // OTTIMIZZAZIONE: Filtra per fascia oraria anche per SOCCER
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

              const hours = itemTime.getHours()
              const minutes = itemTime.getMinutes()
              const timeInMinutes = hours * 60 + minutes

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
              id: result.int_event_id,
              extId: result.ext_pal_id,
              name: result.round_name || `Soccer Match ${result.int_event_id}`,
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
          // OTTIMIZZAZIONE: Filtra per fascia oraria anche per altri sport
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

              const hours = itemTime.getHours()
              const minutes = itemTime.getMinutes()
              const timeInMinutes = hours * 60 + minutes

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
              id: result.int_event_id,
              extId: result.ext_pal_id,
              name: result.name || `${discipline} Event ${result.int_event_id}`,
              startTime,
              discipline: discipline,
            } as EventResult
          })
        }
        setFetchedResults(results)
        // Salva in cache
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

  // Funzione per avviare la ricerca
  const handleSearch = () => {
    setContextResultsSnapshot(rootContext.eventResults || [])
    setConfirmedDiscipline(selectedDiscipline)
    // Quando "Last 10 Games" è attivo, ignora data e fascia oraria
    const effectiveDate = lastTenGames ? 'ALL' : selectedDate
    const effectiveTimeSlot = lastTenGames ? 'ALL' : selectedTimeSlot
    setConfirmedDate(effectiveDate)
    setConfirmedTimeSlot(effectiveTimeSlot)
    setConfirmedLastTenGames(lastTenGames)
    // Azzera risultati precedenti per evitare di mostrare dati stantii
    setFetchedResults([])
    // Invalida cache per la prossima ricerca
    const nextCacheKey = `${selectedDiscipline}:${effectiveDate}:${effectiveTimeSlot}:${lastTenGames}`
    searchResultsCache.delete(nextCacheKey)
    setSearchTrigger((prev) => prev + 1)
  }

  const filteredEventResults = useMemo(() => {
    if (confirmedDiscipline === 'NONE') {
      return []
    }

    if (confirmedLastTenGames) {
      // Usa lo snapshot invece di rootContext.eventResults
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

      // Applica filtro fascia oraria se specificato
      let filtered = resultsToUse
      if (confirmedTimeSlot !== 'ALL') {
        const [startTimeStr, endTimeStr] = confirmedTimeSlot.split(' | ')
        const [startHours, startMinutes] = startTimeStr.split(':').map(Number)
        const [endHours, endMinutes] = endTimeStr.split(':').map(Number)
        const startInMinutes = startHours * 60 + startMinutes
        const endInMinutes = endHours * 60 + endMinutes

        filtered = filtered.filter((result) => {
          const hours = result.startTime.getHours()
          const minutes = result.startTime.getMinutes()
          const timeInMinutes = hours * 60 + minutes
          return (
            timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes
          )
        })
      }

      filtered = filtered
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
        .slice(0, 10)

      return filtered
    }

    if (!confirmedDate) {
      return []
    }

    // Il filtro per fascia oraria è già fatto nella fetch, quindi qui restituiamo solo i risultati
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
    // Reset anche i confirmed
    setConfirmedDiscipline('NONE')
    setConfirmedDate('ALL')
    setConfirmedTimeSlot('ALL')
    setConfirmedLastTenGames(false)
    // Reset searchTrigger e cache
    setSearchTrigger(0)
    setContextResultsSnapshot([])
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
      <div
        className="flex h-16 flex-col items-center bg-accent p-2"
        style={{ paddingRight: searchBarPaddingRight }}
      >
        <div className="flex flex-wrap items-center gap-8">
          <div className="mr-28 flex h-[48px] w-[0px] flex-row items-center gap-2 bg-badge text-background">
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
              <SelectTrigger
                className={`relative ${disciplineSelectLeft} ml-[-70px] h-[48px] ${disciplineSelectMinWidth} border-none bg-background pl-[16px] pr-[5px] text-[16px] text-foreground`}
              >
                <SelectValue placeholder={t('sport')} />
              </SelectTrigger>
              <SelectContent className="bg-white p-0">
                <SelectItem className="text-[14px]" value="NONE">
                  {t('discipline').toUpperCase()}
                </SelectItem>
                {[
                  Discipline.DOGS,
                  Discipline.DOGS8,
                  Discipline.HORSES,
                  Discipline.SOCCER,
                ].map((d) => {
                  const translationKey =
                    d === 'DOGS'
                      ? 'dog_racing'
                      : d === 'DOGS8'
                        ? 'dog8_racing'
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
          </div>

          <div className="relative bottom-[1px] left-1 flex flex-row items-center">
            <Checkbox
              id="last10"
              className="h-6 w-6 border-0 bg-background text-foreground"
              checked={lastTenGames}
              onCheckedChange={(value) => {
                setLastTenGames(!!value)
              }}
            />
            <label
              htmlFor="last10"
              className="relative right-[1px] top-[1px] px-2 py-3 text-[15px] font-semibold text-background"
            >
              {t('last_10_games')}
            </label>
          </div>

          <div className="relative right-[4px] flex h-[48px] w-[0px] flex-row items-center gap-2 bg-badge text-background">
            <Select
              value={selectedDate}
              onValueChange={(value) => {
                setSelectedDate(value)
              }}
              disabled={lastTenGames}
            >
              <SelectTrigger className="relative left-[19px] ml-[-34px] h-[48px] min-w-[186px] border-none bg-background pl-[17px] pr-[5px] text-[16px] text-foreground">
                <SelectValue placeholder={t('date')} />
              </SelectTrigger>
              <SelectContent className="bg-white p-0">
                <SelectItem className="text-[14px]" value="ALL">
                  {t('date').toUpperCase()}
                </SelectItem>
                {dates.map((date) => (
                  <SelectItem className="text-[14px]" key={date} value={date}>
                    {date}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative right-[11px] ml-[129px] flex h-[48px] w-[0px] flex-row items-center gap-2 bg-badge text-background">
            <Select
              value={selectedTimeSlot}
              onValueChange={setSelectedTimeSlot}
              disabled={lastTenGames}
            >
              <SelectTrigger className="relative left-[8px] ml-[27px] h-[48px] min-w-[186px] border-none bg-background pl-[17px] pr-[5px] text-[16px] text-foreground">
                <SelectValue placeholder={t('time_slot')} />
              </SelectTrigger>
              <SelectContent className="bg-white p-0">
                <SelectItem className="text-[14px]" value="ALL">
                  {t('time_slot').toUpperCase()}
                </SelectItem>
                {timeSlots.map((slot) => (
                  <SelectItem className="text-[14px]" key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row items-center gap-2">
            <Button
              className="text-bold relative left-[202px] mr-4 h-[48px] w-[186px] bg-tertiary text-[16px] text-bet-foreground hover:opacity-90"
              disabled={selectedDiscipline === 'NONE'}
              onClick={handleSearch}
            >
              {t('search').toUpperCase()}
            </Button>
            <Button
              className="text-bold relative left-[202px] h-[48px] w-[186px] bg-tertiary text-[15px] text-tertiary-foreground"
              disabled={
                !selectedDate && !selectedDiscipline && !selectedTimeSlot
              }
              onClick={handleReset}
            >
              {t('reset').toUpperCase()}
            </Button>
          </div>
        </div>
      </div>

      <div className="relative top-1 h-full overflow-auto pb-2">
        {confirmedDiscipline !== 'NONE' ? (
          isLoading ||
          (confirmedLastTenGames && rootContext.isLoadingEvents) ? (
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
                            <div className="relative top-1.5 mb-[7px] flex h-[46px] w-full flex-row items-center justify-between gap-4 pl-[9px] uppercase tabular-nums text-white">
                              <div className="flex flex-row items-center gap-4 pb-[5px] text-[16px] font-semibold">
                                {/* Discipline Name */}
                                <span className="whitespace-nowrap text-[16px]">
                                  {eventResult.discipline === 'DOGS'
                                    ? t('dog_races_label')
                                    : eventResult.discipline === 'DOGS8'
                                      ? t('dog8_races_label')
                                      : eventResult.discipline === 'HORSES'
                                        ? t('horse_races_label')
                                        : eventResult.discipline === 'SOCCER'
                                          ? t('football_label')
                                          : eventResult.discipline}
                                </span>

                                {/* Track/Jornada */}
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
                                          // Estrai il numero dalla stringa
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

                                {/* Event ID */}
                                <span className="whitespace-nowrap border-l border-l-white pl-4">
                                  ID {eventResult.id}
                                </span>

                                {/* Date and Time */}
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
      eventResult.discipline === Discipline.DOGS ||
      eventResult.discipline === Discipline.DOGS8) &&
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
        <div className="mb-[-48px] space-y-4">
          {/* ARRIVAL ORDER - Mostra SEMPRE se presente */}
          {detailedResult.arrival &&
            Array.isArray(detailedResult.arrival) &&
            detailedResult.arrival.length > 0 && (
              <div className="mb-[-8px] border-b">
                <div className="mt-[7px] h-[45px] bg-accent py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
                    {t('arrival_order').toUpperCase()}
                  </div>
                </div>
                <div className="mr-[40px] flex h-[79px] items-center justify-center gap-[147px] p-4">
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
                          className="flex items-center gap-3"
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
            {/* WINNER */}
            {raceResult.odds.winner && (
              <div className="border-b">
                <div className="h-[45px] bg-accent py-2 text-center">
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
                        <span className="ml-3 flex items-center gap-3">
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

            {/* PLACED */}
            {raceResult.odds.placed && (
              <div className="border-b border-l">
                <div className="h-[45px] bg-accent py-2 text-center">
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
                        <span className="ml-3 flex items-center gap-3">
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

            {/* SHOW */}
            {raceResult.odds.show && (
              <div className="border-b border-l">
                <div className="h-[45px] bg-accent py-2 text-center">
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
                        <span className="ml-3 flex items-center gap-3">
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
            {/* EXACTA */}
            {raceResult.odds.exacta && (
              <div className="relative bottom-2 border-b">
                <div className="h-[45px] bg-accent py-2 text-center">
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
                        <span className="ml-3 flex items-center gap-3">
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

            {/* QUINELLA */}
            {raceResult.odds.quinella && (
              <div className="relative bottom-2 border-b border-l">
                <div className="h-[45px] bg-accent py-2 text-center">
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
                        <span className="ml-3 flex items-center gap-3">
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

            {/* TRIFECTA */}
            {raceResult.odds.trifecta && (
              <div className="relative bottom-2 border-b border-l">
                <div className="h-[45px] bg-accent py-2 text-center">
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
                        <span className="ml-3 flex items-center gap-3">
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

            {/* BOX TRIFECTA */}
            {raceResult.odds.boxedtrifecta && (
              <div className="relative bottom-2 border-b border-l">
                <div className="h-[45px] bg-accent py-2 text-center">
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
                        <span className="ml-3 flex items-center justify-center gap-3">
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
            {/* EVEN/ODD */}
            {raceResult.odds.evenodd && (
              <div className="relative bottom-4 border-b">
                <div className="h-[45px] bg-accent py-2 text-center">
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
                      <div></div>
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

            {/* UNDER/OVER */}
            {raceResult.odds.underover && (
              <div className="relative bottom-4 border-b border-l">
                <div className="h-[45px] bg-accent py-2 text-center">
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
    return (
      <div className="mb-[-16px] space-y-4">
        {/* Teams e Score */}
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

        {/* Betting Markets */}
        <div className="grid grid-cols-2 gap-y-2">
          {/* 1X2 */}
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

          {/* Double Chance */}
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

          {/* First Scorer */}
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

          {/* Sum Goals */}
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
