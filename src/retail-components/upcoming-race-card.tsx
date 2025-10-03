import { BetsContext } from '@/retail-contexts/bets-context'
import { RootContext } from '@/retail-contexts/root-context'
import { UpcomingEvent, UpcomingRace } from '@/retail-lib/types'
import { getRacerColors } from '@/retail-lib/utils'
import { t } from 'i18next'
import { useContext, useEffect, useState } from 'react'
import BetCombinationsTable from './bet-combination-table'
import BetEntryToggle from './bet-entry-toggle'
import LatecomersDialog from './latecomers-dialog'
import MedalsHistory from './medals-history'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Progress } from './ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Toggle } from './ui/toggle'
import { Check, Clock } from 'lucide-react'

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
  const [isLatecomersDialogOpen, setIsLatecomersDialogOpen] = useState(false)

  // Aggiungi il context
  const { betEntries } = useContext(BetsContext)
  const rootContext = useContext(RootContext)

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

  // Helper per determinare se mostrare il pulsante info (solo per cani e cavalli)
  const shouldShowInfoButton = () => {
    return race.discipline === 'DOGS' || race.discipline === 'HORSES'
  }

  useEffect(() => {
    const fetchEventInfo = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `https://apidev.pgvirtual.eu/api/event/info/${race.extId}/${race.id}`,
          {
            headers: {
              accept: 'application/json',
              'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
              authorization: `Bearer ${rootContext.initCode}`,
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
            body: null,
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
  }, [race.id, race.extId, rootContext.initCode])

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
      <TableHeader className="h-14 bg-card-header text-[16px] text-card-header-foreground">
        <TableRow>
          <TableHead className="w-[249px] text-center font-bold">
            {t('starters_list').toUpperCase()}
          </TableHead>
          <TableHead className="w-[1px] bg-border p-0" />

          <TableHead className="w-[249px] text-center font-bold">
            {t('performance').toUpperCase()}
          </TableHead>
          <TableHead className="w-[1px] bg-border p-0" />

          <TableHead className="w-[249px] text-center font-bold">
            {t('history').toUpperCase()}
          </TableHead>
          <TableHead className="w-[1px] bg-border p-0" />

          {activeTab === 'main' && (
            <>
              <TableHead className="w-[249px] text-center font-bold">
                {t('winner').toUpperCase()}
              </TableHead>
              <TableHead className="w-[1px] bg-border p-0" />
              <TableHead className="w-[249px] text-center font-bold">
                {t('place_2').toUpperCase()}
              </TableHead>
              <TableHead className="w-[1px] bg-border p-0" />
              <TableHead className="w-[249px] text-center font-bold">
                {t('show_3').toUpperCase()}
              </TableHead>
            </>
          )}

          {activeTab === 'couples' && (
            <>
              <TableHead className="text-center font-bold" colSpan={2}>
                {t('exacta').toUpperCase()}
              </TableHead>
              <TableHead className="w-[1px] bg-border p-0" />
              <TableHead className="w-[249px] text-center font-bold">
                {t('any_order').toUpperCase()}
              </TableHead>
            </>
          )}

          {activeTab === 'triplets' && (
            <>
              <TableHead className="text-center font-bold" colSpan={3}>
                {t('trifecta').toUpperCase()}
              </TableHead>
              <TableHead className="w-[1px] bg-border p-0" />
              <TableHead className="w-[187px] text-center font-bold">
                {t('any_order').toUpperCase()}
              </TableHead>
            </>
          )}
        </TableRow>
      </TableHeader>
    )
  }

  const renderTabSpecificCells = (racer: UpcomingRace['racers'][number]) => {
    if (activeTab === 'main') {
      return (
        <>
          <TableCell className="p-2 text-center">
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
                track: `Track  6`,
              }}
              variant="racecard"
              className="h-12 w-24 bg-betEntry text-betEntry-foreground"
            />
          </TableCell>
          <TableCell className="w-[1px] bg-border p-0" />

          <TableCell className="p-2 text-center">
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
                track: `Track  6`,
              }}
              variant="racecard"
              className="h-12 w-24 bg-betEntry text-betEntry-foreground"
            />
          </TableCell>

          <TableCell className="w-[1px] bg-border p-0" />

          <TableCell className="p-2 text-center">
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
                track: `Track  6`,
              }}
              variant="racecard"
              className="h-12 w-24 bg-betEntry text-betEntry-foreground"
            />
          </TableCell>
        </>
      )
    }
    if (activeTab === 'couples') {
      return (
        <>
          <TableCell
            className={`h-16 cursor-pointer !pr-0 pl-10 text-center ${isAnyOrderMode ? 'bg-gray-300' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position1Selection.includes(racer.number)}
              onPressedChange={() => togglePosition1Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className="h-12 w-24 border-betEntry-border"
            >
              <span className="text-[19px]">1°</span>
            </Toggle>
          </TableCell>

          <TableCell
            className={`cursor-pointer !pl-0 pr-10 text-center ${isAnyOrderMode ? 'bg-gray-300' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position2Selection.includes(racer.number)}
              onPressedChange={() => togglePosition2Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className="h-12 w-24 border-betEntry-border"
            >
              <span className="text-[19px]">2°</span>
            </Toggle>
          </TableCell>

          <TableCell className="w-[1px] bg-border p-0" />

          <TableCell className="p-0">
            <div
              className="flex h-full cursor-pointer flex-col text-center"
              onClick={handleMarketTypeToggle}
            >
              <div
                className={`flex flex-1 items-center justify-center p-2 ${!isAnyOrderMode ? 'bg-gray-300' : ''}`}
              >
                <Toggle
                  pressed={disorderSelection.includes(racer.number)}
                  onPressedChange={() => toggleDisorderSelection(racer.number)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-12 w-24 border-betEntry-border"
                >
                  {disorderSelection.includes(racer.number) && (
                    <Check
                      className="h-12 w-12 text-accent"
                      style={{ scale: 1.5 }}
                    />
                  )}
                </Toggle>
              </div>
            </div>
          </TableCell>
        </>
      )
    }
    if (activeTab === 'triplets') {
      return (
        <>
          <TableCell
            className={`h-16 cursor-pointer !pr-0 pl-10 text-center ${isAnyOrderMode ? 'bg-gray-300' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position1Selection.includes(racer.number)}
              onPressedChange={() => togglePosition1Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className="h-12 w-24 border-betEntry-border"
            >
              <span className="text-[19px]">1°</span>
            </Toggle>
          </TableCell>

          <TableCell
            className={`cursor-pointer text-center ${isAnyOrderMode ? 'bg-gray-300' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position2Selection.includes(racer.number)}
              onPressedChange={() => togglePosition2Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className="h-12 w-24 border-betEntry-border"
            >
              <span className="text-[19px]">2°</span>
            </Toggle>
          </TableCell>

          <TableCell
            className={`cursor-pointer !pl-0 pr-10 text-center ${isAnyOrderMode ? 'bg-gray-300' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position3Selection.includes(racer.number)}
              onPressedChange={() => togglePosition3Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className="h-12 w-24 border-betEntry-border"
            >
              <span className="text-[19px]">3°</span>
            </Toggle>
          </TableCell>

          <TableCell className="w-[1px] bg-border p-0" />

          <TableCell className="p-0">
            <div
              className="flex h-full cursor-pointer flex-col"
              onClick={handleMarketTypeToggle}
            >
              <div
                className={`flex flex-1 items-center justify-center p-2 ${!isAnyOrderMode ? 'bg-gray-300' : ''}`}
              >
                <Toggle
                  pressed={disorderSelection.includes(racer.number)}
                  onPressedChange={() => toggleDisorderSelection(racer.number)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-12 w-24 border-betEntry-border"
                >
                  {disorderSelection.includes(racer.number) && (
                    <Check
                      className="h-12 w-12 text-accent"
                      style={{ scale: 1.5 }}
                    />
                  )}
                </Toggle>
              </div>
            </div>
          </TableCell>
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
        <div className="grid grid-cols-2 gap-0.5 border border-card-foreground">
          {/* Even/Odd Market */}
          <div>
            <div className="bg-accent text-accent-foreground">
              <div className="flex h-16 items-center justify-center text-[19px] font-bold">
                {t('even_odd')}
              </div>
            </div>

            <div className="flex h-16">
              <div className="flex flex-1 items-center justify-between p-2">
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
                      outcome: 'Even',
                      decPrice: parseFloat(raceInfo.odds.evenodd?.even || '0'),
                    },
                    track: `Track  6`,
                  }}
                  variant="matchcard"
                  className="h-[45px] w-full text-[19px] text-black"
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
                    },
                    competitors: 'Odd',
                    option: {
                      outcome: 'Odd',
                      decPrice: parseFloat(raceInfo.odds.evenodd?.odd || '0'),
                    },
                    track: `Track  6`,
                  }}
                  variant="matchcard"
                  className="h-[45px] w-full text-[19px] text-black"
                />
              </div>
            </div>
          </div>

          {/* Under/Over Market */}
          <div>
            <div className="bg-accent text-accent-foreground">
              <div className="flex h-16 items-center justify-center text-[19px] font-bold">
                {t('under_over')} 3.5
              </div>
            </div>

            <div className="flex h-16">
              <div className="flex flex-1 items-center justify-between p-2">
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
                      outcome: 'Under',
                      decPrice: parseFloat(
                        raceInfo.odds.underover?.under || '0',
                      ),
                    },
                    track: `Track  6`,
                  }}
                  variant="matchcard"
                  className="h-[45px] w-full text-[19px] text-black"
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
                    },
                    competitors: 'Over',
                    option: {
                      outcome: 'Over',
                      decPrice: parseFloat(
                        raceInfo.odds.underover?.over || '0',
                      ),
                    },
                    track: `Track  6`,
                  }}
                  variant="matchcard"
                  className="h-[45px] w-full text-[19px] text-black"
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
        <CardHeader className="flex h-16 flex-row items-center justify-between px-5">
          <div className="flex items-center gap-2">
            {Object.entries(tabConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={activeTab === key ? 'marketSelected' : 'market'}
                className="h-12 w-28 border px-4 text-[19px] font-semibold"
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
                  className="h-11 w-28 bg-secondary px-4 text-[16px] font-bold text-secondary-foreground"
                  onClick={clearSelections}
                >
                  {t('clear_all').toUpperCase()}
                </Button>
              )}

            {/* Pulsante Latecomers (solo per cani e cavalli) */}
            {shouldShowInfoButton() && (
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 border-border bg-secondary text-secondary-foreground"
                onClick={() => setIsLatecomersDialogOpen(true)}
              >
                <Clock style={{ scale: 1.5 }} />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            {renderTableHeader()}

            <TableBody>
              {!isLoading && raceInfo?.racers && raceInfo.racers.length > 0 ? (
                raceInfo.racers.map((racer) => (
                  <TableRow
                    key={racer.number}
                    className="border-b border-border text-[19px]"
                  >
                    {/* Informazioni sul corridore */}
                    <TableCell className="p-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-md text-[19px] font-bold"
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
                    </TableCell>

                    <TableCell className="w-[1px] bg-border p-0" />

                    {/* Performance */}
                    <TableCell className="p-2">
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
                    </TableCell>

                    <TableCell className="w-[1px] bg-border p-0" />

                    {/* Storico */}
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <MedalsHistory history={racer.history} />
                      </div>
                    </TableCell>

                    <TableCell className="w-[1px] bg-border p-0" />

                    {renderTabSpecificCells(racer)}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="py-6 text-center text-[19px]"
                  >
                    {isLoading
                      ? `${t('loading')}...`
                      : raceInfo
                        ? `${t('no_racers_available')}`
                        : `${t('load_failed')}`}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {renderSpecialMarkets()}
        </CardContent>
      </Card>

      {/* Tabella delle combinazioni - sempre mostrata quando abbiamo i dati */}
      {!isLoading && raceInfo && tabConfig[activeTab].showCombinations && (
        <BetCombinationsTable
          race={{ ...race, data: raceInfo }}
          position1Selection={position1Selection}
          position2Selection={position2Selection}
          position3Selection={position3Selection}
          disorderSelection={disorderSelection}
          marketType={marketType}
          onClearSelections={clearSelections}
        />
      )}

      {/* Dialog per i Latecomers */}
      <LatecomersDialog
        isOpen={isLatecomersDialogOpen}
        onOpenChange={setIsLatecomersDialogOpen}
        raceInfo={raceInfo}
        discipline={race.discipline as 'DOGS' | 'HORSES'}
      />
    </>
  )
}
