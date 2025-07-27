import { UpcomingEvent, UpcomingRace } from '@/retail-lib/types'
import { t } from 'i18next'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import BetCombinationsTable from './bet-combination-table'
import BetEntryToggle from './bet-entry-toggle'
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

type UpcomingRaceCardProps = {
  race: UpcomingEvent
  onSelectionChange?: (
    raceInfo: UpcomingRace | undefined,
    isTris: boolean,
    position1Selection: number | null,
    position2Selection: number | null,
    position3Selection: number | null,
    disorderSelection: number[],
  ) => void
}

type TabType = 'main' | 'couples' | 'triplets'

export default function UpcomingRaceCard({
  race,
  onSelectionChange,
}: UpcomingRaceCardProps) {
  const [raceInfo, setRaceInfo] = useState<UpcomingRace>()
  const [isTris /* setIsTris */] = useState(false)

  const [activeTab, setActiveTab] = useState<TabType>('main')

  const [position1Selection, setPosition1Selection] = useState<number | null>(
    null,
  )
  const [position2Selection, setPosition2Selection] = useState<number | null>(
    null,
  )
  const [position3Selection, setPosition3Selection] = useState<number | null>(
    null,
  )
  const [disorderSelection, setDisorderSelection] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const tabConfig = {
    main: {
      name: t('main'),
      showCombinations: false,
      isTris: false,
      columns: [
        'starters',
        'performance',
        'history',
        'winner',
        'place2',
        'place3' /* 
        'evenodd',
        'underover', */,
      ],
    },
    couples: {
      name: t('couples'),
      showCombinations: true,
      isTris: false,
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
      isTris: true,
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
      setIsLoading(true)
      try {
        const response = await fetch(
          `https://apidev.pgvirtual.eu/api/event/info/${race.extId}/${race.id}`,
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
  }, [race.id, race.extId])

  // Notifica le modifiche alle selezioni
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(
        raceInfo,
        isTris,
        position1Selection,
        position2Selection,
        position3Selection,
        disorderSelection,
      )
    }
  }, [
    raceInfo,
    isTris,
    activeTab,
    position1Selection,
    position2Selection,
    position3Selection,
    disorderSelection,
    onSelectionChange,
  ])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    clearSelections()
  }

  const togglePosition1Selection = (competitorId: number) => {
    setPosition1Selection((current) =>
      current === competitorId ? null : competitorId,
    )
  }

  const togglePosition2Selection = (competitorId: number) => {
    setPosition2Selection((current) =>
      current === competitorId ? null : competitorId,
    )
  }

  const togglePosition3Selection = (competitorId: number) => {
    setPosition3Selection((current) =>
      current === competitorId ? null : competitorId,
    )
  }

  const toggleDisorderSelection = (competitorId: number) => {
    setDisorderSelection((current) => {
      if (current.includes(competitorId)) {
        return current.filter((id) => id !== competitorId)
      }
      return [...current, competitorId]
    })
  }

  const clearSelections = () => {
    setPosition1Selection(null)
    setPosition2Selection(null)
    setPosition3Selection(null)
    setDisorderSelection([])
  }

  const renderTableHeader = () => {
    return (
      <TableHeader className="h-14 bg-card-header text-[16px] text-card-header-foreground">
        <TableRow>
          <TableHead className="w-[245px] text-center font-bold">
            {t('starters_list')}
          </TableHead>
          <TableHead className="w-[1px] bg-border p-0" />

          <TableHead className="w-[225px] text-center font-bold">
            {t('performance')}
          </TableHead>
          <TableHead className="w-[1px] bg-border p-0" />

          <TableHead className="w-[225px] text-center font-bold">
            {t('history')}
          </TableHead>
          <TableHead className="w-[1px] bg-border p-0" />

          {activeTab === 'main' && (
            <>
              <TableHead className="text-center font-bold">
                {t('winner')}
              </TableHead>
              <TableHead className="w-[1px] bg-border p-0" />
              <TableHead className="text-center font-bold">
                {t('place_2')}
              </TableHead>
              <TableHead className="w-[1px] bg-border p-0" />
              <TableHead className="text-center font-bold">
                {t('show_3')}
              </TableHead>
            </>
          )}

          {activeTab === 'couples' && (
            <>
              <TableHead className="text-center font-bold">
                {t('first')}
              </TableHead>
              <TableHead className="text-center font-bold">
                {t('second')}
              </TableHead>
              <TableHead className="w-[1px] bg-border p-0" />
              <TableHead className="text-center font-bold">
                {t('any_order')}
              </TableHead>
            </>
          )}

          {activeTab === 'triplets' && (
            <>
              <TableHead className="text-center font-bold">
                {t('first')}
              </TableHead>
              <TableHead className="text-center font-bold">
                {t('second')}
              </TableHead>
              <TableHead className="text-center font-bold">
                {t('third')}
              </TableHead>
              <TableHead className="w-[1px] bg-border p-0" />
              <TableHead className="text-center font-bold">
                {t('any_order')}
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
              marketName="Vincente"
              bet={{
                discipline: race.discipline,
                event: {
                  name: race.name,
                  number: race.id,
                  startingAt: race.time,
                },
                competitors: racer.name,
                option: {
                  outcome: racer.number.toString(),
                  decPrice: parseFloat(
                    raceInfo?.odds?.winner?.[racer.number.toString()] || '0',
                  ),
                },
              }}
              variant="racecard"
              className="h-12 w-[100px] bg-betEntry text-betEntry-foreground"
            />
          </TableCell>
          <TableCell className="w-[1px] bg-border p-0" />

          <TableCell className="p-2 text-center">
            <BetEntryToggle
              marketName="Piazzato su 2"
              bet={{
                discipline: race.discipline,
                event: {
                  name: race.name,
                  number: race.id,
                  startingAt: race.time,
                },
                competitors: racer.name,
                option: {
                  outcome: racer.number.toString(),
                  decPrice: parseFloat(
                    raceInfo?.odds?.placed?.[racer.number.toString()] || '0',
                  ),
                },
              }}
              variant="racecard"
              className="h-12 w-[100px] bg-betEntry text-betEntry-foreground"
            />
          </TableCell>

          <TableCell className="w-[1px] bg-border p-0" />

          <TableCell className="p-2 text-center">
            <BetEntryToggle
              marketName="Piazzato su 3"
              bet={{
                discipline: race.discipline,
                event: {
                  name: race.name,
                  number: race.id,
                  startingAt: race.time,
                },
                competitors: racer.name,
                option: {
                  outcome: racer.number.toString(),
                  decPrice: parseFloat(
                    raceInfo?.odds?.show?.[racer.number.toString()] || '0',
                  ),
                },
              }}
              variant="racecard"
              className="h-12 w-[100px] bg-betEntry text-betEntry-foreground"
            />
          </TableCell>
        </>
      )
    }
    if (activeTab === 'couples') {
      return (
        <>
          <TableCell className="h-16 text-center">
            <Toggle
              pressed={position1Selection === racer.number}
              onPressedChange={() => togglePosition1Selection(racer.number)}
              className="h-10 w-20 border-betEntry-border"
            >
              <Check className="text-black" />
            </Toggle>
          </TableCell>

          <TableCell className="text-center">
            <Toggle
              pressed={position2Selection === racer.number}
              onPressedChange={() => togglePosition2Selection(racer.number)}
              className="h-10 w-20 border-betEntry-border"
            >
              <Check className="text-black" />
            </Toggle>
          </TableCell>

          <TableCell className="w-[1px] bg-border p-0" />

          <TableCell className="p-2 text-center">
            <Toggle
              pressed={disorderSelection.includes(racer.number)}
              onPressedChange={() => toggleDisorderSelection(racer.number)}
              className="h-10 w-20 border-betEntry-border"
            >
              <Check className="text-black" />
            </Toggle>
          </TableCell>
        </>
      )
    }
    if (activeTab === 'triplets') {
      return (
        <>
          <TableCell className="h-16 text-center">
            <Toggle
              pressed={position1Selection === racer.number}
              onPressedChange={() => togglePosition1Selection(racer.number)}
              className="h-10 w-20 border-betEntry-border"
            >
              <Check className="text-black" />
            </Toggle>
          </TableCell>

          <TableCell className="text-center">
            <Toggle
              pressed={position2Selection === racer.number}
              onPressedChange={() => togglePosition2Selection(racer.number)}
              className="h-10 w-20 border-betEntry-border"
            >
              <Check className="text-black" />
            </Toggle>
          </TableCell>

          <TableCell className="text-center">
            <Toggle
              pressed={position3Selection === racer.number}
              onPressedChange={() => togglePosition3Selection(racer.number)}
              className="h-10 w-20 border-betEntry-border"
            >
              <Check className="text-black" />
            </Toggle>
          </TableCell>

          <TableCell className="w-[1px] bg-border p-0" />

          <TableCell className="p-2 text-center">
            <Toggle
              pressed={disorderSelection.includes(racer.number)}
              onPressedChange={() => toggleDisorderSelection(racer.number)}
              className="h-10 w-20 border-betEntry-border"
            >
              <Check className="text-black" />
            </Toggle>
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
        <div className="grid grid-cols-2 gap-1 border border-card-foreground">
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
                  }}
                  variant="matchcard"
                  className="h-[45px] w-full text-[16px] font-bold text-black"
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
                  }}
                  variant="matchcard"
                  className="h-[45px] w-full text-[16px] font-bold text-black"
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
                    competitors: 'Under 3.5',
                    option: {
                      outcome: 'Under',
                      decPrice: parseFloat(
                        raceInfo.odds.underover?.under || '0',
                      ),
                    },
                  }}
                  variant="matchcard"
                  className="h-[45px] w-full text-[16px] font-bold text-black"
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
                    competitors: 'Over 3.5',
                    option: {
                      outcome: 'Over',
                      decPrice: parseFloat(
                        raceInfo.odds.underover?.over || '0',
                      ),
                    },
                  }}
                  variant="matchcard"
                  className="h-[45px] w-full text-[16px] font-bold text-black"
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
          <div className="flex w-full items-center justify-between">
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
                          className={
                            'flex h-7 w-7 items-center justify-center rounded-md font-bold text-white ' +
                            (racer.number === 1
                              ? 'bg-red-500'
                              : racer.number === 2
                                ? 'bg-blue-500'
                                : racer.number === 3
                                  ? 'bg-orange-500'
                                  : racer.number === 4
                                    ? 'bg-green-500'
                                    : racer.number === 5
                                      ? 'bg-yellow-500'
                                      : racer.number === 6
                                        ? 'bg-purple-500'
                                        : 'border border-gray-300 bg-white text-black')
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
                    <TableCell className="p-2">
                      <div className="flex items-center justify-center gap-3">
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
          isTris={tabConfig[activeTab].isTris}
          position1Selection={position1Selection}
          position2Selection={position2Selection}
          position3Selection={position3Selection}
          disorderSelection={disorderSelection}
        />
      )}
    </>
  )
}
