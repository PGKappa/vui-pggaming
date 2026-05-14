import { BetsContext } from '@/virtual-contexts/bets-context'
import { CashierContext } from '@/virtual-contexts/cashier-context'
import { UpcomingEvent, UpcomingRace } from '@/virtual-lib/types'
import {
  raceInfoCache,
  moduleHasLoadedOnce,
  lastRaceInfo,
  setModuleHasLoadedOnce,
  setLastRaceInfo,
  getCacheKey,
} from '@/virtual-lib/race-info-cache'
import { createPGVirtualAPICall, getRacerColors } from '@/virtual-lib/utils'
import { t } from 'i18next'
import { Discipline } from '@/virtual-lib/types'
import { useContext, useEffect, useRef, useState } from 'react'
import BetCombinationsTable from './bet-combination-table'
import BetEntryToggle from './bet-entry-toggle'
import LatecomersDialog from './latecomers-dialog'
import MedalsHistory from './medals-history'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Progress } from './ui/progress'
import { Toggle } from './ui/toggle'
import { Check } from 'lucide-react'

type UpcomingRaceCardProps = {
  race: UpcomingEvent
  onSelectionChange?: (
    raceInfo: UpcomingRace | undefined,
    position1Selection: number[],
    position2Selection: number[],
    position3Selection: number[],
    disorderSelection: number[],
  ) => void
}

type TabType = 'main' | 'couples' | 'triplets'

export default function UpcomingRaceCard({
  race,
  onSelectionChange,
}: UpcomingRaceCardProps) {
  const cacheKey = getCacheKey(race.extId!, race.id)
  const [raceInfo, setRaceInfo] = useState<UpcomingRace | undefined>(
    () => raceInfoCache.get(cacheKey) || lastRaceInfo,
  )
  const [activeTab, setActiveTab] = useState<TabType>('main')

  const [position1Selection, setPosition1Selection] = useState<number[]>([])
  const [position2Selection, setPosition2Selection] = useState<number[]>([])
  const [position3Selection, setPosition3Selection] = useState<number[]>([])
  const [disorderSelection, setDisorderSelection] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(!moduleHasLoadedOnce)
  const [isLatecomersDialogOpen, setIsLatecomersDialogOpen] = useState(false)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)

  const { betEntries } = useContext(BetsContext)
  const { initCode, operator } = useContext(CashierContext)

  // Inizializzazione corretta del marketType basata su activeTab
  const [marketType, setMarketType] = useState<
    'exacta' | 'quinella' | 'trifecta' | 'boxtrifecta'
  >(() => {
    return activeTab === 'triplets' ? 'trifecta' : 'exacta'
  })

  // Reset marketType quando cambia activeTab
  useEffect(() => {
    if (activeTab === 'couples') {
      setMarketType('exacta')
    } else if (activeTab === 'triplets') {
      setMarketType('trifecta')
    }
    clearSelections()
  }, [activeTab])

  // useEffect per cambio automatico tab da FastBet (SENZA activeTab nelle dependencies)
  useEffect(() => {
    const raceEntries = betEntries.filter(
      (entry) =>
        entry.bet.discipline === race.discipline &&
        entry.bet.event.number === race.id,
    )

    if (raceEntries.length > 0) {
      raceEntries.forEach((entry) => {
        const market = entry.market

        // Cambia automaticamente il tab basato sul market FastBet
        if (market === 'Exacta') {
          setActiveTab('couples')
          setMarketType('exacta')
        } else if (market === 'Quinella') {
          setActiveTab('couples')
          setMarketType('quinella')
        } else if (market === 'Trifecta') {
          setActiveTab('triplets')
          setMarketType('trifecta')
        } else if (market === 'Box Trifecta') {
          setActiveTab('triplets')
          setMarketType('boxtrifecta')
        }
      })
    }
  }, [betEntries, race.id, race.discipline])

  const handleMarketTypeToggle = () => {
    if (activeTab === 'couples') {
      setMarketType((prev) => (prev === 'exacta' ? 'quinella' : 'exacta'))
    } else if (activeTab === 'triplets') {
      setMarketType((prev) =>
        prev === 'trifecta' ? 'boxtrifecta' : 'trifecta',
      )
    }
    clearSelections()
  }

  const isAnyOrderMode =
    marketType === 'quinella' || marketType === 'boxtrifecta'

  const tabConfig = {
    main: {
      name: t('main'),
      showCombinations: false,
      columns: [
        'starters',
        'performance',
        'history',
        'winner',
        'place2',
        'place3',
      ],
    },
    couples: {
      name: t('couples'),
      showCombinations: true,
      columns: [
        'starters',
        'performance',
        'history',
        'first',
        'second',
        'anyOrder',
      ],
    },
    triplets: {
      name: t('triplets'),
      showCombinations: true,
      columns: [
        'starters',
        'performance',
        'history',
        'first',
        'second',
        'third',
        'anyOrder',
      ],
    },
  }

  useEffect(() => {
    const key = getCacheKey(race.extId!, race.id)
    const cached = raceInfoCache.get(key)

    if (cached) {
      setRaceInfo(cached)
      setIsLoading(false)
      return
    }

    if (!initCode) return

    const fetchEventInfo = async () => {
      // Solo il primo caricamento mostra il loading — dopo mostra dati stale
      if (!moduleHasLoadedOnce) {
        setIsLoading(true)
      }
      try {
        const response = await createPGVirtualAPICall(
          `/api/event/info/${race.extId}/${race.id}`,
          initCode,
          undefined,
          operator,
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        const upcomingRace: UpcomingRace = {
          ...data.current,
          id: parseInt(data.int_event_id),
        }
        raceInfoCache.set(key, upcomingRace)
        setLastRaceInfo(upcomingRace)
        setModuleHasLoadedOnce(true)
        setRaceInfo(upcomingRace)
      } catch (error) {
        console.error('Error fetching event info:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventInfo()
  }, [race.id, race.extId, initCode, operator])

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(
        raceInfo,
        position1Selection,
        position2Selection,
        position3Selection,
        disorderSelection,
      )
    }
  }, [
    raceInfo,
    activeTab,
    position1Selection,
    position2Selection,
    position3Selection,
    disorderSelection,
    onSelectionChange,
  ])

  useEffect(() => {
    const el = tableContainerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
  }

  const togglePosition1Selection = (competitorId: number) => {
    if (isAnyOrderMode) {
      if (activeTab === 'couples') {
        setMarketType('exacta')
      } else if (activeTab === 'triplets') {
        setMarketType('trifecta')
      }
      setDisorderSelection([])
    }

    setPosition1Selection((current) => {
      const isRemoving = current.includes(competitorId)
      const newSelection = isRemoving
        ? current.filter((id) => id !== competitorId)
        : [...current, competitorId]

      if (newSelection.length > 0) {
        setDisorderSelection([])
      }

      return newSelection
    })
  }

  const togglePosition2Selection = (competitorId: number) => {
    if (isAnyOrderMode) {
      if (activeTab === 'couples') {
        setMarketType('exacta')
      } else if (activeTab === 'triplets') {
        setMarketType('trifecta')
      }
      setDisorderSelection([])
    }

    setPosition2Selection((current) => {
      const isRemoving = current.includes(competitorId)
      const newSelection = isRemoving
        ? current.filter((id) => id !== competitorId)
        : [...current, competitorId]

      if (newSelection.length > 0) {
        setDisorderSelection([])
      }

      return newSelection
    })
  }

  const togglePosition3Selection = (competitorId: number) => {
    if (isAnyOrderMode) {
      if (activeTab === 'triplets') {
        setMarketType('trifecta')
      }
      setDisorderSelection([])
    }

    setPosition3Selection((current) => {
      const isRemoving = current.includes(competitorId)
      const newSelection = isRemoving
        ? current.filter((id) => id !== competitorId)
        : [...current, competitorId]

      if (newSelection.length > 0) {
        setDisorderSelection([])
      }

      return newSelection
    })
  }

  const toggleDisorderSelection = (competitorId: number) => {
    if (!isAnyOrderMode) {
      if (activeTab === 'couples') {
        setMarketType('quinella')
      } else if (activeTab === 'triplets') {
        setMarketType('boxtrifecta')
      }
      setPosition1Selection([])
      setPosition2Selection([])
      setPosition3Selection([])
    }

    setDisorderSelection((current) => {
      if (!current.includes(competitorId)) {
        const maxSelections = activeTab === 'couples' ? 2 : 3

        if (current.length >= maxSelections) {
          return current
        }
      }

      const isRemoving = current.includes(competitorId)
      const newSelection = isRemoving
        ? current.filter((id) => id !== competitorId)
        : [...current, competitorId]

      if (newSelection.length > 0) {
        setPosition1Selection([])
        setPosition2Selection([])
        setPosition3Selection([])
      }

      return newSelection
    })
  }

  const clearSelections = () => {
    setPosition1Selection([])
    setPosition2Selection([])
    setPosition3Selection([])
    setDisorderSelection([])
  }

  // breakpoints basati sulla larghezza reale del container (non viewport)
  // >= 700px → mostra HISTORY, >= 450px → mostra PERFORMANCE
  const showHistory = containerWidth >= 700
  const showPerformance = containerWidth >= 450

  const getGridColumns = (): string => {
    if (activeTab === 'main') {
      // S | W | P | SH  (3 separatori)
      if (!showPerformance) {
        const avail = containerWidth - 3
        const s = Math.round(avail * 0.35)
        const b = Math.round((avail - s) / 3)
        return `${s}px 1px ${b}px 1px ${b}px 1px ${b}px`
      }
      // S | PERF | W | P | SH  (4 separatori)
      if (!showHistory) {
        const avail = containerWidth - 4
        const s = Math.round(avail * 0.28)
        const p = Math.round(avail * 0.22)
        const b = Math.round((avail - s - p) / 3)
        return `${s}px 1px ${p}px 1px ${b}px 1px ${b}px 1px ${b}px`
      }
      // S | PERF | HIST | W | P | SH  (5 separatori)
      const avail = containerWidth - 5
      const s = Math.round(avail * 0.22)
      const p = Math.round(avail * 0.17)
      const h = Math.round(avail * 0.17)
      const b = Math.round((avail - s - p - h) / 3)
      return `${s}px 1px ${p}px 1px ${h}px 1px ${b}px 1px ${b}px 1px ${b}px`
    }
    if (activeTab === 'couples') {
      // S | 1° | 2° | DUO  (separatore tra ogni colonna)
      if (!showPerformance) {
        const avail = containerWidth - 3
        const s = Math.round(avail * 0.35)
        const b = Math.round(avail * 0.22)
        const ao = avail - s - 2 * b
        return `${s}px 1px ${b}px 1px ${b}px 1px ${ao}px`
      }
      // S | PERF | 1° | 2° | DUO
      if (!showHistory) {
        const avail = containerWidth - 4
        const s = Math.round(avail * 0.26)
        const p = Math.round(avail * 0.2)
        const b = Math.round(avail * 0.18)
        const ao = avail - s - p - 2 * b
        return `${s}px 1px ${p}px 1px ${b}px 1px ${b}px 1px ${ao}px`
      }
      // S | PERF | HIST | 1° | 2° | DUO
      const avail = containerWidth - 5
      const s = Math.round(avail * 0.2)
      const p = Math.round(avail * 0.16)
      const h = Math.round(avail * 0.16)
      const b = Math.round(avail * 0.16)
      const ao = avail - s - p - h - 2 * b
      return `${s}px 1px ${p}px 1px ${h}px 1px ${b}px 1px ${b}px 1px ${ao}px`
    }
    // triplets — S | 1° | 2° | 3° | TRIO  (separatore tra ogni colonna)
    if (!showPerformance) {
      const avail = containerWidth - 4
      const s = Math.round(avail * 0.33)
      const b = Math.round(avail * 0.18)
      const ao = avail - s - 3 * b
      return `${s}px 1px ${b}px 1px ${b}px 1px ${b}px 1px ${ao}px`
    }
    if (!showHistory) {
      const avail = containerWidth - 5
      const s = Math.round(avail * 0.25)
      const p = Math.round(avail * 0.19)
      const b = Math.round(avail * 0.155)
      const ao = avail - s - p - 3 * b
      return `${s}px 1px ${p}px 1px ${b}px 1px ${b}px 1px ${b}px 1px ${ao}px`
    }
    const avail = containerWidth - 6
    const s = Math.round(avail * 0.19)
    const p = Math.round(avail * 0.155)
    const h = Math.round(avail * 0.155)
    const b = Math.round(avail * 0.135)
    const ao = avail - s - p - h - 3 * b
    return `${s}px 1px ${p}px 1px ${h}px 1px ${b}px 1px ${b}px 1px ${b}px 1px ${ao}px`
  }

  const renderTableHeader = () => {
    return (
      <div
        className="grid h-12 items-center bg-card-header text-card-header-foreground"
        style={{ gridTemplateColumns: getGridColumns() }}
      >
        <div className="text-center text-xs font-bold sm:text-sm">
          {t('starters').toUpperCase()}
        </div>

        {showPerformance && (
          <>
            <div className="bg-border" />
            <div className="text-center text-xs font-bold sm:text-sm">
              {t('performance').toUpperCase()}
            </div>
          </>
        )}

        {showHistory && (
          <>
            <div className="bg-border" />
            <div className="text-center text-xs font-bold sm:text-sm">
              {t('history').toUpperCase()}
            </div>
          </>
        )}

        <div className="bg-border" />

        {activeTab === 'main' && (
          <>
            <div className="text-center text-xs font-bold sm:text-sm">
              {t('winner').toUpperCase()}
            </div>
            <div className="bg-border" />
            <div className="text-center text-xs font-bold sm:text-sm">
              {t('place_2').toUpperCase()}
            </div>
            <div className="bg-border" />
            <div className="text-center text-xs font-bold sm:text-sm">
              {t('show_3').toUpperCase()}
            </div>
          </>
        )}

        {activeTab === 'couples' && (
          <>
            <div className="text-center text-xs font-bold sm:text-sm">1°</div>
            <div className="bg-border" />
            <div className="text-center text-xs font-bold sm:text-sm">2°</div>
            <div className="bg-border" />
            <div className="text-center text-xs font-bold sm:text-sm">
              {t('any_order').toUpperCase()}
            </div>
          </>
        )}

        {activeTab === 'triplets' && (
          <>
            <div className="text-center text-xs font-bold sm:text-sm">1°</div>
            <div className="bg-border" />
            <div className="text-center text-xs font-bold sm:text-sm">2°</div>
            <div className="bg-border" />
            <div className="text-center text-xs font-bold sm:text-sm">3°</div>
            <div className="bg-border" />
            <div className="text-center text-xs font-bold sm:text-sm">
              {t('any_order').toUpperCase()}
            </div>
          </>
        )}
      </div>
    )
  }

  const renderTabSpecificCells = (racer: UpcomingRace['racers'][number]) => {
    if (activeTab === 'main') {
      return (
        <>
          <div className="p-1 text-center">
            <BetEntryToggle
              marketName="Winner"
              bet={{
                discipline: race.discipline,
                event: {
                  name: race.name,
                  number: race.id,
                  startingAt: race.time,
                  extId: race.extId,
                },
                competitors: racer.number.toString(),
                option: {
                  outcome: racer.number.toString(),
                  decPrice: parseFloat(
                    raceInfo?.odds?.winner?.[racer.number.toString()] || '0',
                  ),
                },
                track: `${t('track')} 6`,
              }}
              variant="racecard"
              className="h-9 w-12 text-sm sm:h-11 sm:w-16 sm:text-md"
            />
          </div>
          <div className="bg-border" />

          <div className="p-1 text-center">
            <BetEntryToggle
              marketName="Placed"
              bet={{
                discipline: race.discipline,
                event: {
                  name: race.name,
                  number: race.id,
                  startingAt: race.time,
                  extId: race.extId,
                },
                competitors: racer.number.toString(),
                option: {
                  outcome: racer.number.toString(),
                  decPrice: parseFloat(
                    raceInfo?.odds?.placed?.[racer.number.toString()] || '0',
                  ),
                },
                track: `${t('track')} 6`,
              }}
              variant="racecard"
              className="h-9 w-12 text-sm sm:h-11 sm:w-16 sm:text-md"
            />
          </div>

          <div className="bg-border" />

          <div className="p-1 text-center">
            <BetEntryToggle
              marketName="Show"
              bet={{
                discipline: race.discipline,
                event: {
                  name: race.name,
                  number: race.id,
                  startingAt: race.time,
                  extId: race.extId,
                },
                competitors: racer.number.toString(),
                option: {
                  outcome: racer.number.toString(),
                  decPrice: parseFloat(
                    raceInfo?.odds?.show?.[racer.number.toString()] || '0',
                  ),
                },
                track: `${t('track')} 6`,
              }}
              variant="racecard"
              className="h-9 w-12 text-sm sm:h-11 sm:w-16 sm:text-md"
            />
          </div>
        </>
      )
    }
    if (activeTab === 'couples') {
      return (
        <>
          <div
            className={`flex h-12 cursor-pointer items-center justify-center text-center ${isAnyOrderMode ? 'bg-gray-300' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position1Selection.includes(racer.number)}
              onPressedChange={() => togglePosition1Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className={`h-9 w-12 text-sm data-[state=on]:bg-accent data-[state=on]:text-accent-foreground sm:h-11 sm:w-16 sm:text-md ${
                position1Selection.includes(racer.number)
                  ? 'bg-accent text-accent-foreground'
                  : ''
              }`}
            >
              1°
            </Toggle>
          </div>

          <div className="bg-border" />

          <div
            className={`flex cursor-pointer items-center justify-center text-center ${isAnyOrderMode ? 'bg-gray-300' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position2Selection.includes(racer.number)}
              onPressedChange={() => togglePosition2Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className={`h-9 w-12 text-sm data-[state=on]:bg-accent data-[state=on]:text-accent-foreground sm:h-11 sm:w-16 sm:text-md ${
                position2Selection.includes(racer.number)
                  ? 'bg-accent text-accent-foreground'
                  : ''
              }`}
            >
              2°
            </Toggle>
          </div>

          <div className="bg-border" />

          <div className="p-0">
            <div
              className="flex h-full cursor-pointer flex-col text-center"
              onClick={handleMarketTypeToggle}
            >
              <div
                className={`flex flex-1 items-center justify-center p-1 ${!isAnyOrderMode ? 'bg-gray-300' : ''}`}
              >
                <Toggle
                  pressed={disorderSelection.includes(racer.number)}
                  onPressedChange={() => toggleDisorderSelection(racer.number)}
                  onClick={(e) => e.stopPropagation()}
                  className={`h-9 w-12 text-sm data-[state=on]:bg-accent data-[state=on]:text-accent-foreground sm:h-11 sm:w-16 sm:text-md ${
                    disorderSelection.includes(racer.number)
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }`}
                >
                  {disorderSelection.includes(racer.number) && (
                    <Check className="h-4 w-4 text-current" />
                  )}
                </Toggle>
              </div>
            </div>
          </div>
        </>
      )
    }
    if (activeTab === 'triplets') {
      return (
        <>
          <div
            className={`flex h-12 cursor-pointer items-center justify-center text-center ${isAnyOrderMode ? 'bg-gray-300' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position1Selection.includes(racer.number)}
              onPressedChange={() => togglePosition1Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className={`h-9 w-12 text-sm data-[state=on]:bg-accent data-[state=on]:text-accent-foreground sm:h-11 sm:w-16 sm:text-md ${
                position1Selection.includes(racer.number)
                  ? 'bg-accent text-accent-foreground'
                  : ''
              }`}
            >
              1°
            </Toggle>
          </div>

          <div className="bg-border" />

          <div
            className={`flex cursor-pointer items-center justify-center text-center ${isAnyOrderMode ? 'bg-gray-300' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position2Selection.includes(racer.number)}
              onPressedChange={() => togglePosition2Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className={`h-9 w-12 text-sm data-[state=on]:bg-accent data-[state=on]:text-accent-foreground sm:h-11 sm:w-16 sm:text-md ${
                position2Selection.includes(racer.number)
                  ? 'bg-accent text-accent-foreground'
                  : ''
              }`}
            >
              2°
            </Toggle>
          </div>

          <div className="bg-border" />

          <div
            className={`flex cursor-pointer items-center justify-center text-center ${isAnyOrderMode ? 'bg-gray-300' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position3Selection.includes(racer.number)}
              onPressedChange={() => togglePosition3Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className={`h-9 w-12 text-sm data-[state=on]:bg-accent data-[state=on]:text-accent-foreground sm:h-11 sm:w-16 sm:text-md ${
                position3Selection.includes(racer.number)
                  ? 'bg-accent text-accent-foreground'
                  : ''
              }`}
            >
              3°
            </Toggle>
          </div>

          <div className="bg-border" />

          <div className="p-0">
            <div
              className="flex h-full cursor-pointer flex-col"
              onClick={handleMarketTypeToggle}
            >
              <div
                className={`flex flex-1 items-center justify-center p-1 ${!isAnyOrderMode ? 'bg-gray-300' : ''}`}
              >
                <Toggle
                  pressed={disorderSelection.includes(racer.number)}
                  onPressedChange={() => toggleDisorderSelection(racer.number)}
                  onClick={(e) => e.stopPropagation()}
                  className={`h-9 w-12 text-sm data-[state=on]:bg-accent data-[state=on]:text-accent-foreground sm:h-11 sm:w-16 sm:text-md ${
                    disorderSelection.includes(racer.number)
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }`}
                >
                  {disorderSelection.includes(racer.number) && (
                    <Check className="h-4 w-4 text-current" />
                  )}
                </Toggle>
              </div>
            </div>
          </div>
        </>
      )
    }
    return null
  }

  const renderSpecialMarkets = () => {
    if (activeTab !== 'main' || !raceInfo?.odds) {
      return null
    }

    return (
      <div className="mt-4 w-full">
        <div className="grid grid-cols-2 gap-0.5">
          {/* Even/Odd Market */}
          <div>
            <div className="bg-card-header text-card-header-foreground">
              <div className="flex h-12 items-center justify-center text-md font-bold">
                {t('even_odd').toUpperCase()}
              </div>
            </div>

            <div className="flex h-12">
              <div className="flex flex-1 items-center justify-between p-2">
                <BetEntryToggle
                  marketName="Even/Odd"
                  bet={{
                    discipline: race.discipline,
                    event: {
                      name: race.name,
                      number: race.id,
                      startingAt: race.time,
                      extId: race.extId,
                    },
                    competitors: 'Even',
                    option: {
                      outcome: 'even',
                      decPrice: parseFloat(raceInfo.odds.evenodd?.even || '0'),
                    },
                    track: `${t('track')} 6`,
                  }}
                  variant="matchcard"
                  className="h-10 w-full text-md text-white"
                />
              </div>

              <div className="flex flex-1 items-center justify-between p-2">
                <BetEntryToggle
                  marketName="Even/Odd"
                  bet={{
                    discipline: race.discipline,
                    event: {
                      name: race.name,
                      number: race.id,
                      startingAt: race.time,
                      extId: race.extId,
                    },
                    competitors: 'Odd',
                    option: {
                      outcome: 'odd',
                      decPrice: parseFloat(raceInfo.odds.evenodd?.odd || '0'),
                    },
                    track: `${t('track')} 6`,
                  }}
                  variant="matchcard"
                  className="h-10 w-full text-md text-white"
                />
              </div>
            </div>
          </div>

          {/* Under/Over Market */}
          <div>
            <div className="bg-card-header text-card-header-foreground">
              <div className="flex h-12 items-center justify-center text-md font-bold">
                {t('under_over').toUpperCase()} 3.5
              </div>
            </div>

            <div className="flex h-12">
              <div className="flex flex-1 items-center justify-between p-2">
                <BetEntryToggle
                  marketName="Under/Over"
                  bet={{
                    discipline: race.discipline,
                    event: {
                      name: race.name,
                      number: race.id,
                      startingAt: race.time,
                      extId: race.extId,
                    },
                    competitors: 'Under',
                    option: {
                      outcome: 'under',
                      decPrice: parseFloat(
                        raceInfo.odds.underover?.under || '0',
                      ),
                    },
                    track: `${t('track')} 6`,
                  }}
                  variant="matchcard"
                  className="h-10 w-full text-md text-white"
                />
              </div>

              <div className="flex flex-1 items-center justify-between p-2">
                <BetEntryToggle
                  marketName="Under/Over"
                  bet={{
                    discipline: race.discipline,
                    event: {
                      name: race.name,
                      number: race.id,
                      startingAt: race.time,
                      extId: race.extId,
                    },
                    competitors: 'Over',
                    option: {
                      outcome: 'over',
                      decPrice: parseFloat(
                        raceInfo.odds.underover?.over || '0',
                      ),
                    },
                    track: `${t('track')} 6`,
                  }}
                  variant="matchcard"
                  className="h-10 w-full text-md text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card className="h-full w-full">
        <CardHeader className="flex h-12 flex-row items-center justify-between rounded-sm pr-2">
          <div className="flex items-center gap-1">
            {Object.entries(tabConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={activeTab === key ? 'marketSelected' : 'market'}
                className="h-8 w-[68px] border text-xs font-semibold sm:h-10 sm:w-24 sm:text-md"
                onClick={() => handleTabChange(key as TabType)}
              >
                {config.name}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Event ID */}
            <span className="text-xs font-semibold text-muted-foreground sm:text-sm">
              {'ID'} {race.id}
            </span>

            {/* Pulsante Clear */}
            {(activeTab === 'couples' || activeTab === 'triplets') &&
              (position1Selection.length > 0 ||
                position2Selection.length > 0 ||
                position3Selection.length > 0 ||
                disorderSelection.length > 0) && (
                <Button
                  variant="ghost"
                  className="h-8 bg-secondary px-2 text-xs font-bold text-secondary-foreground sm:h-11 sm:w-28 sm:px-4 sm:text-[14px]"
                  onClick={clearSelections}
                >
                  {t('clear_all').toUpperCase()}
                </Button>
              )}

            {/* Pulsante Latecomers (solo per cani e cavalli) */}
            {(race.discipline === Discipline.DOGS ||
              race.discipline === Discipline.HORSES) && (
              <Button
                variant="ghost"
                className="h-8 bg-secondary px-2 text-xs font-bold text-secondary-foreground sm:h-11 sm:px-4 sm:text-[14px]"
                onClick={() => setIsLatecomersDialogOpen(true)}
              >
                {t('latecomers')}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div ref={tableContainerRef}>
            <div>
              {renderTableHeader()}

              <div className="">
                {!isLoading &&
                raceInfo?.racers &&
                raceInfo.racers.length > 0 ? (
                  raceInfo.racers.map((racer) => (
                    <div
                      key={racer.number}
                      className="grid items-center border-b border-border text-md"
                      style={{ gridTemplateColumns: getGridColumns() }}
                    >
                      {/* Informazioni sul corridore */}
                      <div className="p-1 sm:p-2">
                        <div className="flex items-center gap-1 sm:gap-3">
                          <div
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-base font-bold sm:h-8 sm:w-8 sm:text-xl"
                            style={
                              getRacerColors(
                                racer.number,
                                race.discipline as 'DOGS' | 'HORSES',
                              ).style
                            }
                          >
                            {racer.number}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold sm:text-base">
                              {racer.name}
                            </div>
                          </div>
                        </div>
                      </div>

                      {showPerformance && (
                        <>
                          <div className="bg-border" />
                          {/* Performance */}
                          <div className="flex flex-col items-center justify-center gap-1 px-3 py-2">
                            {racer.performance}%
                            <Progress
                              value={racer.performance}
                              className="w-full [&>div]:rounded-r-full [&>div]:bg-accent"
                              style={{ height: '8px' }}
                            />
                          </div>
                        </>
                      )}

                      {showHistory && (
                        <>
                          <div className="bg-border" />
                          {/* Storico */}
                          <div>
                            <div className="flex items-center justify-center gap-1">
                              <MedalsHistory history={racer.history} />
                            </div>
                          </div>
                        </>
                      )}

                      <div className="bg-border" />

                      {renderTabSpecificCells(racer)}
                    </div>
                  ))
                ) : (
                  <div className="col-span-full border-0 py-6 text-center text-sm">
                    {isLoading
                      ? `${t('loading')}...`
                      : raceInfo
                        ? `${t('no_racers_available')}`
                        : `${t('load_failed')}`}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Render combination table for couples and triplets tabs */}
          {(activeTab === 'couples' || activeTab === 'triplets') &&
            raceInfo && (
              <BetCombinationsTable
                race={{ ...race, data: raceInfo }}
                position1Selection={position1Selection}
                position2Selection={position2Selection}
                position3Selection={position3Selection}
                disorderSelection={disorderSelection}
                marketType={
                  activeTab === 'couples'
                    ? (marketType as 'exacta' | 'quinella')
                    : (marketType as 'trifecta' | 'boxtrifecta')
                }
              />
            )}

          {renderSpecialMarkets()}
        </CardContent>
      </Card>

      <LatecomersDialog
        isOpen={isLatecomersDialogOpen}
        onOpenChange={setIsLatecomersDialogOpen}
        raceInfo={raceInfo}
        discipline={race.discipline as 'DOGS' | 'HORSES'}
      />
    </>
  )
}
