import { BetsContext } from '@/virtual-contexts/bets-context'
import { UpcomingEvent, UpcomingRace } from '@/virtual-lib/types'
import { getOperatorFromUrl, getRacerColors } from '@/virtual-lib/utils'
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
  const [raceInfo, setRaceInfo] = useState<UpcomingRace>()
  const [activeTab, setActiveTab] = useState<TabType>('main')

  const [position1Selection, setPosition1Selection] = useState<number[]>([])
  const [position2Selection, setPosition2Selection] = useState<number[]>([])
  const [position3Selection, setPosition3Selection] = useState<number[]>([])
  const [disorderSelection, setDisorderSelection] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Aggiungi i contexts
  const { betEntries } = useContext(BetsContext)

  // Get initCode from localStorage (virtual pattern)
  const getInitCode = () => localStorage.getItem('initCode')

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
    const fetchEventInfo = async () => {
      const initCode = getInitCode()
      if (!initCode) return

      setIsLoading(true)
      try {
        const response = await fetch(
          `https://api-btprod.pgvirtual.eu/api/event/info/${race.extId}/${race.id}`,
          {
            headers: {
              accept: 'application/json',
              authorization: `Bearer ${initCode}`,
              operator: getOperatorFromUrl('sc'),
            },
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
          },
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        const upcomingRace: UpcomingRace = {
          ...data.current,
          id: parseInt(data.int_event_id),
        }
        setRaceInfo(upcomingRace)
      } catch (error) {
        console.error('Error fetching event info:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventInfo()
  }, [race.id, race.extId])

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

  const baseColumns =
    'minmax(170px, 1.3fr) 1px minmax(150px, 1fr) 1px minmax(180px, 1.2fr) 1px'
  const gridTemplateColumns =
    activeTab === 'main'
      ? `${baseColumns} 1fr 1px 1fr 1px 1fr`
      : activeTab === 'couples'
        ? `${baseColumns} 1fr 1fr 1px 1fr`
        : `${baseColumns} 1fr 1fr 1fr 1px 1fr`

  const renderTableHeader = () => {
    return (
      <div
        className="grid h-11 items-center bg-card-header text-xs uppercase tracking-wide text-card-header-foreground"
        style={{
          gridTemplateColumns: gridTemplateColumns,
        }}
      >
        <div className="text-center font-bold">
          {t('starters').toUpperCase()}
        </div>
        <div className="h-full bg-white/15" />

        <div className="text-center font-bold">
          {t('performance').toUpperCase()}
        </div>
        <div className="h-full bg-white/15" />

        <div className="text-center font-bold">
          {t('history').toUpperCase()}
        </div>
        <div className="h-full bg-white/15" />

        {activeTab === 'main' && (
          <>
            <div className="text-center font-bold">
              {t('winner').toUpperCase()}
            </div>
            <div className="h-full bg-white/15" />
            <div className="text-center font-bold">
              {t('place_2').toUpperCase()}
            </div>
            <div className="h-full bg-white/15" />
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
            <div className="h-full bg-white/15" />
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
            <div className="h-full bg-white/15" />
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
          <div className="flex items-center justify-center px-2 py-1.5">
            <BetEntryToggle
              marketName="Winner"
              bet={{
                discipline: race.discipline,
                event: {
                  name: race.name,
                  number: race.id,
                  startingAt: race.time,
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
              className="h-11 w-full max-w-[110px] text-md font-semibold tabular-nums"
            />
          </div>
          <div className="h-full bg-border" />

          <div className="flex items-center justify-center px-2 py-1.5">
            <BetEntryToggle
              marketName="Placed"
              bet={{
                discipline: race.discipline,
                event: {
                  name: race.name,
                  number: race.id,
                  startingAt: race.time,
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
              className="h-11 w-full max-w-[110px] text-md font-semibold tabular-nums"
            />
          </div>

          <div className="h-full bg-border" />

          <div className="flex items-center justify-center px-2 py-1.5">
            <BetEntryToggle
              marketName="Show"
              bet={{
                discipline: race.discipline,
                event: {
                  name: race.name,
                  number: race.id,
                  startingAt: race.time,
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
              className="h-11 w-full max-w-[110px] text-md font-semibold tabular-nums"
            />
          </div>
        </>
      )
    }
    if (activeTab === 'couples') {
      return (
        <>
          <div
            className={`flex h-12 cursor-pointer items-center justify-center px-2 text-center ${isAnyOrderMode ? 'bg-muted' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position1Selection.includes(racer.number)}
              onPressedChange={() => togglePosition1Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className={`h-11 w-full max-w-[90px] text-sm font-semibold ${
                position1Selection.includes(racer.number)
                  ? 'bg-bet text-bet-foreground'
                  : ''
              }`}
            >
              <span className="text-md">1°</span>
            </Toggle>
          </div>

          <div
            className={`flex cursor-pointer items-center justify-center px-2 text-center ${isAnyOrderMode ? 'bg-muted' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position2Selection.includes(racer.number)}
              onPressedChange={() => togglePosition2Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className={`h-11 w-full max-w-[90px] text-sm font-semibold ${
                position2Selection.includes(racer.number)
                  ? 'bg-bet text-bet-foreground'
                  : ''
              }`}
            >
              <span className="text-md">2°</span>
            </Toggle>
          </div>

          <div className="h-full bg-border" />

          <div className="p-0">
            <div
              className="flex h-full cursor-pointer flex-col text-center"
              onClick={handleMarketTypeToggle}
            >
              <div
                className={`flex flex-1 items-center justify-center p-1 ${!isAnyOrderMode ? 'bg-muted' : ''}`}
              >
                <Toggle
                  pressed={disorderSelection.includes(racer.number)}
                  onPressedChange={() => toggleDisorderSelection(racer.number)}
                  onClick={(e) => e.stopPropagation()}
                  className={`h-11 w-full max-w-[90px] text-sm font-semibold ${
                    disorderSelection.includes(racer.number)
                      ? 'bg-bet text-bet-foreground'
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
            className={`flex h-12 cursor-pointer items-center justify-center px-2 text-center ${isAnyOrderMode ? 'bg-muted' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position1Selection.includes(racer.number)}
              onPressedChange={() => togglePosition1Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className={`h-11 w-full max-w-[90px] text-sm font-semibold ${
                position1Selection.includes(racer.number)
                  ? 'bg-bet text-bet-foreground'
                  : ''
              }`}
            >
              <span className="text-md">1°</span>
            </Toggle>
          </div>

          <div
            className={`flex cursor-pointer items-center justify-center px-2 text-center ${isAnyOrderMode ? 'bg-muted' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position2Selection.includes(racer.number)}
              onPressedChange={() => togglePosition2Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className={`h-11 w-full max-w-[90px] text-sm font-semibold ${
                position2Selection.includes(racer.number)
                  ? 'bg-bet text-bet-foreground'
                  : ''
              }`}
            >
              <span className="text-md">2°</span>
            </Toggle>
          </div>

          <div
            className={`flex cursor-pointer items-center justify-center px-2 text-center ${isAnyOrderMode ? 'bg-muted' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position3Selection.includes(racer.number)}
              onPressedChange={() => togglePosition3Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className={`h-11 w-full max-w-[90px] text-sm font-semibold ${
                position3Selection.includes(racer.number)
                  ? 'bg-bet text-bet-foreground'
                  : ''
              }`}
            >
              <span className="text-md">3°</span>
            </Toggle>
          </div>

          <div className="h-full bg-border" />

          <div className="p-0">
            <div
              className="flex h-full cursor-pointer flex-col"
              onClick={handleMarketTypeToggle}
            >
              <div
                className={`flex flex-1 items-center justify-center p-1 ${!isAnyOrderMode ? 'bg-muted' : ''}`}
              >
                <Toggle
                  pressed={disorderSelection.includes(racer.number)}
                  onPressedChange={() => toggleDisorderSelection(racer.number)}
                  onClick={(e) => e.stopPropagation()}
                  className={`h-11 w-full max-w-[90px] text-sm font-semibold ${
                    disorderSelection.includes(racer.number)
                      ? 'bg-bet text-bet-foreground'
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
      <div className="mt-3 w-full border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-border">
          {/* Even/Odd Market */}
          <div>
            <div className="bg-card-header text-card-header-foreground">
              <div className="flex h-11 items-center justify-center text-sm font-bold tracking-wide">
                {t('even_odd').toUpperCase()}
              </div>
            </div>

            <div className="flex gap-3 p-3">
              <div className="flex flex-1 items-center">
                <BetEntryToggle
                  marketName="Even/Odd"
                  bet={{
                    discipline: race.discipline,
                    event: {
                      name: race.name,
                      number: race.id,
                      startingAt: race.time,
                    },
                    competitors: 'Even',
                    option: {
                      outcome: 'even',
                      decPrice: parseFloat(raceInfo.odds.evenodd?.even || '0'),
                    },
                    track: `${t('track')} 6`,
                  }}
                  variant="matchcard"
                  className="h-11 w-full text-md"
                />
              </div>

              <div className="flex flex-1 items-center">
                <BetEntryToggle
                  marketName="Even/Odd"
                  bet={{
                    discipline: race.discipline,
                    event: {
                      name: race.name,
                      number: race.id,
                      startingAt: race.time,
                    },
                    competitors: 'Odd',
                    option: {
                      outcome: 'odd',
                      decPrice: parseFloat(raceInfo.odds.evenodd?.odd || '0'),
                    },
                    track: `${t('track')} 6`,
                  }}
                  variant="matchcard"
                  className="h-11 w-full text-md"
                />
              </div>
            </div>
          </div>

          {/* Under/Over Market */}
          <div>
            <div className="bg-card-header text-card-header-foreground">
              <div className="flex h-11 items-center justify-center text-sm font-bold tracking-wide">
                {t('under_over').toUpperCase()} 3.5
              </div>
            </div>

            <div className="flex gap-3 p-3">
              <div className="flex flex-1 items-center">
                <BetEntryToggle
                  marketName="Under/Over"
                  bet={{
                    discipline: race.discipline,
                    event: {
                      name: race.name,
                      number: race.id,
                      startingAt: race.time,
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
                  className="h-11 w-full text-md"
                />
              </div>

              <div className="flex flex-1 items-center">
                <BetEntryToggle
                  marketName="Under/Over"
                  bet={{
                    discipline: race.discipline,
                    event: {
                      name: race.name,
                      number: race.id,
                      startingAt: race.time,
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
                  className="h-11 w-full text-md"
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
      <Card className="w-full overflow-hidden shadow-sm">
        <CardHeader className="flex h-14 flex-row items-center justify-between space-y-0 border-b border-white/10 px-3 py-0">
          <div className="flex items-center gap-2">
            {Object.entries(tabConfig).map(([key, config]) => (
              <Button
                key={key}
                className={`h-10 min-w-[90px] rounded-sm px-3 text-sm font-semibold uppercase shadow-none sm:min-w-[120px] sm:px-4 ${
                  activeTab === key
                    ? 'bg-white text-card-header hover:bg-white'
                    : 'border border-white/15 bg-secondary text-secondary-foreground hover:bg-tertiary'
                }`}
                onClick={() => handleTabChange(key as TabType)}
              >
                {config.name}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {renderTableHeader()}

              <div>
                {!isLoading &&
                raceInfo?.racers &&
                raceInfo.racers.length > 0 ? (
                  raceInfo.racers.map((racer) => (
                    <div
                      key={racer.number}
                      className="grid min-h-[56px] items-stretch border-b border-border text-md transition-colors hover:bg-muted/60"
                      style={{
                        gridTemplateColumns: gridTemplateColumns,
                      }}
                    >
                      {/* Informazioni sul corridore */}
                      <div className="flex items-center px-3 py-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-xl font-bold"
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
                            <div className="truncate font-semibold">
                              {racer.name}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="h-full bg-border" />

                      {/* Performance */}
                      <div className="flex items-center justify-center px-4 py-2">
                        <div className="flex w-full max-w-[180px] flex-col items-center gap-1">
                          <span className="text-sm font-semibold tabular-nums">
                            {racer.performance}%
                          </span>
                          <Progress
                            value={racer.performance}
                            className="h-2 w-full bg-border [&>div]:bg-tertiary"
                          />
                        </div>
                      </div>

                      <div className="h-full bg-border" />

                      {/* Storico */}
                      <div className="flex items-center justify-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <MedalsHistory history={racer.history} />
                        </div>
                      </div>

                      <div className="h-full bg-border" />

                      {renderTabSpecificCells(racer)}
                    </div>
                  ))
                ) : (
                  <div className="col-span-full border-0 py-10 text-center text-sm text-muted-foreground">
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
