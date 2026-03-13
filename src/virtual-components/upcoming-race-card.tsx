import { BetsContext } from '@/virtual-contexts/bets-context'
import { CashierContext } from '@/virtual-contexts/cashier-context'
import { UpcomingEvent, UpcomingRace } from '@/virtual-lib/types'
import { createPGVirtualAPICall, getRacerColors } from '@/virtual-lib/utils'
import { t } from 'i18next'
import { useContext, useEffect, useState } from 'react'
import BetCombinationsTable from './bet-combination-table'
import BetEntryToggle from './bet-entry-toggle'
import MedalsHistory from './medals-history'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Progress } from './ui/progress'
import { Toggle } from './ui/toggle'
import { Check } from 'lucide-react'

// Module-level cache: survives re-renders, no loading flash for already-fetched races
const raceInfoCache = new Map<string, UpcomingRace>()

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
  const cacheKey = `${race.extId}_${race.id}`
  const [raceInfo, setRaceInfo] = useState<UpcomingRace | undefined>(() =>
    raceInfoCache.get(cacheKey),
  )
  const [activeTab, setActiveTab] = useState<TabType>('main')

  const [position1Selection, setPosition1Selection] = useState<number[]>([])
  const [position2Selection, setPosition2Selection] = useState<number[]>([])
  const [position3Selection, setPosition3Selection] = useState<number[]>([])
  const [disorderSelection, setDisorderSelection] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { betEntries } = useContext(BetsContext)
  const { initCode } = useContext(CashierContext)

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
    const key = `${race.extId}_${race.id}`
    const cached = raceInfoCache.get(key)

    if (cached) {
      setRaceInfo(cached)
      setIsLoading(false)
      return
    }

    if (!initCode) return

    const fetchEventInfo = async () => {
      setIsLoading(true)
      try {
        const response = await createPGVirtualAPICall(
          `/api/event/info/${race.extId}/${race.id}`,
          initCode,
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
        setRaceInfo(upcomingRace)
      } catch (error) {
        console.error('Error fetching event info:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventInfo()
  }, [race.id, race.extId, initCode])

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

  const renderTableHeader = () => {
    return (
      <div
        className="grid h-12 items-center bg-card-header text-sm text-card-header-foreground"
        style={{
          gridTemplateColumns:
            activeTab === 'main'
              ? '200px 1px 200px 1px 200px 1px 181px 1px 181px 1px 181px'
              : activeTab === 'couples'
                ? '200px 1px 200px 1px 200px 1px 180px 180px 1px 183px'
                : '200px 1px 200px 1px 200px 1px 130px 130px 130px 1px 155px',
        }}
      >
        <div className="text-center font-bold">
          {t('starters').toUpperCase()}
        </div>
        <div className="bg-border" />

        <div className="text-center font-bold">
          {t('performance').toUpperCase()}
        </div>
        <div className="bg-border" />

        <div className="text-center font-bold">
          {t('history').toUpperCase()}
        </div>
        <div className="bg-border" />

        {activeTab === 'main' && (
          <>
            <div className="text-center font-bold">
              {t('winner').toUpperCase()}
            </div>
            <div className="bg-border" />
            <div className="text-center font-bold">
              {t('place_2').toUpperCase()}
            </div>
            <div className="bg-border" />
            <div className="text-center font-bold">
              {t('show_3').toUpperCase()}
            </div>
          </>
        )}

        {activeTab === 'couples' && (
          <>
            <div
              className="text-center font-bold"
              style={{ gridColumn: 'span 2' }}
            >
              {t('exacta').toUpperCase()}
            </div>
            <div className="bg-border" />
            <div className="text-center font-bold">
              {t('any_order').toUpperCase()}
            </div>
          </>
        )}

        {activeTab === 'triplets' && (
          <>
            <div className="text-center font-bold"></div>
            <div className="text-center font-bold">
              {t('trifecta').toUpperCase()}
            </div>
            <div className="text-center font-bold"></div>
            <div className="bg-border" />
            <div className="text-center font-bold">
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
              className="h-11 w-16 text-md"
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
              className="h-11 w-16 text-md"
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
              className="h-11 w-16 text-md"
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
              className={`h-11 w-16 border-betEntry-border text-sm data-[state=on]:bg-accent data-[state=on]:text-accent-foreground ${
                position1Selection.includes(racer.number)
                  ? 'bg-accent text-accent-foreground'
                  : ''
              }`}
            >
              <span className="text-md">1°</span>
            </Toggle>
          </div>

          <div
            className={`flex cursor-pointer items-center justify-center text-center ${isAnyOrderMode ? 'bg-gray-300' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position2Selection.includes(racer.number)}
              onPressedChange={() => togglePosition2Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className={`h-11 w-16 border-betEntry-border text-sm data-[state=on]:bg-accent data-[state=on]:text-accent-foreground ${
                position2Selection.includes(racer.number)
                  ? 'bg-accent text-accent-foreground'
                  : ''
              }`}
            >
              <span className="text-md">2°</span>
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
                  className={`h-11 w-16 border-betEntry-border text-sm data-[state=on]:bg-accent data-[state=on]:text-accent-foreground ${
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
              className={`h-11 w-16 border-betEntry-border text-sm data-[state=on]:bg-accent data-[state=on]:text-accent-foreground ${
                position1Selection.includes(racer.number)
                  ? 'bg-accent text-accent-foreground'
                  : ''
              }`}
            >
              <span className="text-md">1°</span>
            </Toggle>
          </div>

          <div
            className={`flex cursor-pointer items-center justify-center text-center ${isAnyOrderMode ? 'bg-gray-300' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position2Selection.includes(racer.number)}
              onPressedChange={() => togglePosition2Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className={`h-11 w-16 border-betEntry-border text-sm data-[state=on]:bg-accent data-[state=on]:text-accent-foreground ${
                position2Selection.includes(racer.number)
                  ? 'bg-accent text-accent-foreground'
                  : ''
              }`}
            >
              <span className="text-md">2°</span>
            </Toggle>
          </div>

          <div
            className={`flex cursor-pointer items-center justify-center text-center ${isAnyOrderMode ? 'bg-gray-300' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position3Selection.includes(racer.number)}
              onPressedChange={() => togglePosition3Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className={`h-11 w-16 border-betEntry-border text-sm data-[state=on]:bg-accent data-[state=on]:text-accent-foreground ${
                position3Selection.includes(racer.number)
                  ? 'bg-accent text-accent-foreground'
                  : ''
              }`}
            >
              <span className="text-md">3°</span>
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
                  className={`h-11 w-16 border-betEntry-border text-sm data-[state=on]:bg-accent data-[state=on]:text-accent-foreground ${
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
          <div className="flex items-center gap-2">
            {Object.entries(tabConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={activeTab === key ? 'marketSelected' : 'market'}
                className="h-10 w-24 border text-md font-semibold"
                onClick={() => handleTabChange(key as TabType)}
              >
                {config.name}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Pulsante Clear */}
            {(activeTab === 'couples' || activeTab === 'triplets') &&
              (position1Selection.length > 0 ||
                position2Selection.length > 0 ||
                position3Selection.length > 0 ||
                disorderSelection.length > 0) && (
                <Button
                  variant="ghost"
                  className="h-11 w-28 bg-secondary px-4 text-[14px] font-bold text-secondary-foreground"
                  onClick={clearSelections}
                >
                  {t('clear_all').toUpperCase()}
                </Button>
              )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {renderTableHeader()}

              <div className="">
                {!isLoading &&
                raceInfo?.racers &&
                raceInfo.racers.length > 0 ? (
                  raceInfo.racers.map((racer) => (
                    <div
                      key={racer.number}
                      className="grid items-center border-b border-border text-md"
                      style={{
                        gridTemplateColumns:
                          activeTab === 'main'
                            ? '200px 1px 200px 1px 200px 1px 181px 1px 181px 1px 181px'
                            : activeTab === 'couples'
                              ? '200px 1px 200px 1px 200px 1px 180px 180px 1px 183px'
                              : '200px 1px 200px 1px 200px 1px 130px 130px 130px 1px 155px',
                      }}
                    >
                      {/* Informazioni sul corridore */}
                      <div className="p-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-md text-xl font-bold"
                            style={
                              getRacerColors(
                                racer.number,
                                race.discipline as 'DOGS' | 'HORSES',
                              ).style
                            }
                          >
                            {racer.number}
                          </div>
                          <div>
                            <div className="font-semibold">{racer.name}</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-border" />

                      {/* Performance */}
                      <div className="p-2">
                        <div className="flex items-center justify-center gap-3">
                          <div className="flex space-x-1">
                            <div className="flex flex-col items-center justify-center gap-1">
                              {racer.performance}%
                              <Progress
                                value={racer.performance}
                                className="w-36 [&>div]:rounded-r-full [&>div]:bg-accent"
                                style={{ height: '8px' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-border" />

                      {/* Storico */}
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <MedalsHistory history={racer.history} />
                        </div>
                      </div>

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
    </>
  )
}
