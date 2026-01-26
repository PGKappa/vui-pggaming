import { BetsContext } from '@/retail-contexts/bets-context'
import { RootContext } from '@/retail-contexts/root-context'
import { UpcomingEvent, UpcomingRace } from '@/retail-lib/types'
import {
  getRacerColors,
  createPGVirtualAPICall,
  normalizeMarketName,
} from '@/retail-lib/utils'
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
  const [fixedSelection, setFixedSelection] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLatecomersDialogOpen, setIsLatecomersDialogOpen] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false) // ← Aggiungo questo

  // Aggiungi il context
  const { betEntries } = useContext(BetsContext)
  const rootContext = useContext(RootContext)
  const getTrackName =
    rootContext?.getTrackName || ((channel?: number) => `Track ${channel || 6}`)

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

    // NON cancellare le selezioni se ci sono bet da fastbet per questa race
    const hasRaceBets = betEntries.some(
      (entry) =>
        entry.bet.discipline === race.discipline &&
        entry.bet.event.number === race.id,
    )

    if (!hasRaceBets) {
      clearSelections()
    }
  }, [activeTab, betEntries, race.discipline, race.id])

  // useEffect per cambio automatico tab da FastBet
  useEffect(() => {
    const raceEntries = betEntries.filter(
      (entry) =>
        entry.bet.discipline === race.discipline &&
        entry.bet.event.number === race.id,
    )

    if (raceEntries.length > 0) {
      const newPosition1: number[] = []
      const newPosition2: number[] = []
      const newPosition3: number[] = []

      raceEntries.forEach((entry) => {
        const market = entry.market
        const competitors = entry.bet.competitors
        const outcome = entry.bet.option.outcome

        // Normalizza il market per riconoscere tutte le lingue
        const normalized = normalizeMarketName(market)

        // Cambia automaticamente il tab basato sul market FastBet
        if (
          normalized === 'winner' ||
          normalized === 'placed' ||
          normalized === 'show'
        ) {
          // Per mercati singoli: outcome contiene il numero, competitors contiene il nome
          const competitorNum = parseInt(outcome)
          if (!isNaN(competitorNum) && !newPosition1.includes(competitorNum)) {
            newPosition1.push(competitorNum)
          }
        } else if (normalized === 'exacta' || normalized === 'quinella') {
          const parts = competitors
            .split('-')
            .map((n: string) => parseInt(n.trim()))
          if (parts.length >= 2) {
            const [first, second] = parts
            if (!isNaN(first) && !newPosition1.includes(first)) {
              newPosition1.push(first)
            }
            if (!isNaN(second) && !newPosition2.includes(second)) {
              newPosition2.push(second)
            }
          }
          setActiveTab('couples')
          setMarketType(normalized === 'exacta' ? 'exacta' : 'quinella')
        } else if (
          normalized === 'trifecta' ||
          normalized === 'boxed_trifecta'
        ) {
          const parts = competitors
            .split('-')
            .map((n: string) => parseInt(n.trim()))
          if (parts.length >= 3) {
            const [first, second, third] = parts
            if (!isNaN(first) && !newPosition1.includes(first)) {
              newPosition1.push(first)
            }
            if (!isNaN(second) && !newPosition2.includes(second)) {
              newPosition2.push(second)
            }
            if (!isNaN(third) && !newPosition3.includes(third)) {
              newPosition3.push(third)
            }
          }
          setActiveTab('triplets')
          setMarketType(normalized === 'trifecta' ? 'trifecta' : 'boxtrifecta')
        }
      })

      // Aggiorna le selezioni usando functional updater (come il toggle manuale)
      if (newPosition1.length > 0) {
        setPosition1Selection(() => newPosition1)
      }
      if (newPosition2.length > 0) {
        setPosition2Selection(() => newPosition2)
      }
      if (newPosition3.length > 0) {
        setPosition3Selection(() => newPosition3)
      }
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
      // Mostra loading solo al primo caricamento; gli aggiornamenti successivi sono silenziosi
      if (!hasLoadedOnce) {
        setIsLoading(true)
      }

      // Stop se manca initCode/operator per evitare errori hard
      if (!rootContext.initCode || !rootContext.operator) {
        console.warn('⚠️ Missing initCode/operator, skip fetchEventInfo')
        setIsLoading(false)
        return
      }
      try {
        const response = await createPGVirtualAPICall(
          `/api/event/info/${race.extId}/${race.id}`,
          rootContext.initCode,
          undefined,
          rootContext.operator,
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
        setHasLoadedOnce(true)
      } catch (error) {
        console.error('Error fetching event info:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventInfo()
  }, [
    race.id,
    race.extId,
    rootContext.initCode,
    rootContext.operator,
    hasLoadedOnce,
  ])

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
      // 🎯 RIMOSSO LIMITATORE - Ora permette selezione illimitata di corridori!

      const isRemoving = current.includes(competitorId)
      const newSelection = isRemoving
        ? current.filter((id) => id !== competitorId)
        : [...current, competitorId]

      // Se rimuovo checkbox, rimuovo anche la fissa
      if (isRemoving) {
        setFixedSelection((fixed) => fixed.filter((id) => id !== competitorId))
      }

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
    setFixedSelection([])
  }

  const toggleFixedSelection = (competitorId: number) => {
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

    setFixedSelection((current) => {
      const isRemoving = current.includes(competitorId)

      if (isRemoving) {
        // Se rimuovo la fissa, non tocco la checkbox (può rimanere selezionata)
        return current.filter((id) => id !== competitorId)
      } else {
        // Se aggiungo la fissa, seleziono automaticamente anche la checkbox any order
        setDisorderSelection((disorder) => {
          if (!disorder.includes(competitorId)) {
            return [...disorder, competitorId]
          }
          return disorder
        })
        return [...current, competitorId]
      }
    })
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
              <TableHead className="w-249px] text-center font-bold">
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
              <TableHead className="text-center font-bold" colSpan={2}>
                {t('quinella').toUpperCase()}
              </TableHead>
            </>
          )}

          {activeTab === 'triplets' && (
            <>
              <TableHead className="text-center font-bold" colSpan={3}>
                {t('trifecta').toUpperCase()}
              </TableHead>
              <TableHead className="w-[1px] bg-border p-0" />
              <TableHead className="text-center font-bold" colSpan={2}>
                {t('boxed_trifecta').toUpperCase()}
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
              marketName={t('winner')}
              apiMarketName="winner"
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
                track: getTrackName(6),
              }}
              variant="racecard"
              className="h-[49px] w-[120px] bg-betEntry pt-[0px] text-[18px] tabular-nums text-betEntry-foreground hover:opacity-85"
            />
          </TableCell>
          <TableCell className="w-[1px] bg-border p-0" />

          <TableCell className="p-2 text-center">
            <BetEntryToggle
              marketName={t('placed')}
              apiMarketName="placed"
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
                track: getTrackName(6),
              }}
              variant="racecard"
              className="h-[49px] w-[120px] bg-betEntry pt-[0px] text-[18px] tabular-nums text-betEntry-foreground hover:opacity-85"
            />
          </TableCell>

          <TableCell className="w-[1px] bg-border p-0" />

          <TableCell className="p-2 text-center">
            <BetEntryToggle
              marketName={t('show')}
              apiMarketName="show"
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
                track: getTrackName(6),
              }}
              variant="racecard"
              className="h-[49px] w-[120px] bg-betEntry pt-[0px] text-[18px] tabular-nums text-betEntry-foreground hover:opacity-85"
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
              className="relative right-[2px] h-12 w-[117px] border-betEntry-border pt-[2px] tabular-nums"
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
              className="relative left-[2px] h-12 w-[118px] border-betEntry-border pt-[2px]"
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
                  pressed={fixedSelection.includes(racer.number)}
                  onPressedChange={() => toggleFixedSelection(racer.number)}
                  onClick={(e) => e.stopPropagation()}
                  className={`relative left-[17px] h-12 w-[56px] border-betEntry-border pt-[2px] ${
                    fixedSelection.includes(racer.number) ? 'text-white' : ''
                  }`}
                >
                  <span className="text-[19px]">F</span>
                </Toggle>
              </div>
            </div>
          </TableCell>

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
                  className="relative right-[4px] h-12 w-[117px] border-betEntry-border pt-[2px]"
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
            className={`h-16 cursor-pointer px-0 text-center ${isAnyOrderMode ? 'bg-gray-300' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position1Selection.includes(racer.number)}
              onPressedChange={() => togglePosition1Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className="relative left-[11px] h-12 w-[116px] border-betEntry-border pt-[2px] tabular-nums"
            >
              <span className="text-[19px]">1°</span>
            </Toggle>
          </TableCell>

          <TableCell
            className={`cursor-pointer px-0 text-center ${isAnyOrderMode ? 'bg-gray-300' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position2Selection.includes(racer.number)}
              onPressedChange={() => togglePosition2Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className="relative h-12 w-[116px] border-betEntry-border pt-[2px] tabular-nums"
            >
              <span className="text-[19px]">2°</span>
            </Toggle>
          </TableCell>

          <TableCell
            className={`cursor-pointer px-0 text-center ${isAnyOrderMode ? 'bg-gray-300' : ''}`}
            onClick={handleMarketTypeToggle}
          >
            <Toggle
              pressed={position3Selection.includes(racer.number)}
              onPressedChange={() => togglePosition3Selection(racer.number)}
              onClick={(e) => e.stopPropagation()}
              className="relative right-[12px] h-12 w-[116px] border-betEntry-border pt-[2px] tabular-nums"
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
                className={`flex flex-1 items-center justify-center py-2 pl-[2px] ${!isAnyOrderMode ? 'bg-gray-300' : ''}`}
              >
                <Toggle
                  pressed={fixedSelection.includes(racer.number)}
                  onPressedChange={() => toggleFixedSelection(racer.number)}
                  onClick={(e) => e.stopPropagation()}
                  className={`relative left-[17px] h-12 w-[56px] border-betEntry-border pt-[2px] ${
                    fixedSelection.includes(racer.number) ? 'text-white' : ''
                  }`}
                >
                  <span className="text-[19px]">F</span>
                </Toggle>
              </div>
            </div>
          </TableCell>

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
                  className="relative left-[3px] h-12 w-[116px] border-betEntry-border pt-[2px] tabular-nums"
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
      <div className="mt-2 w-full">
        <div className="grid grid-cols-2 gap-0 border-b-0 border-t-0 border-card-foreground">
          {/* Even/Odd Market */}
          <div>
            <div className="bg-accent text-accent-foreground">
              <div className="border-slate flex h-[64px] items-center justify-center text-[16px] font-bold">
                {t('even_odd').toUpperCase()}
              </div>
            </div>

            <div className="flex h-[66px]">
              <div className="flex flex-1 items-center justify-between border-b pl-16 text-[1px]">
                <BetEntryToggle
                  marketName={t('even_odd')}
                  apiMarketName="even/odd"
                  bet={{
                    discipline: race.discipline,
                    event: {
                      name: race.name,
                      number: race.id,
                      startingAt: race.time,
                    },
                    competitors: t('even'),
                    option: {
                      outcome: t('even'),
                      decPrice: parseFloat(raceInfo.odds.evenodd?.even || '0'),
                    },
                    track: getTrackName(6),
                  }}
                  variant="matchcard"
                  className="h-[49px] w-full text-[16px] text-black"
                />
              </div>

              <div className="flex flex-1 items-center justify-between border-b border-r border-black pl-16 pr-16">
                <BetEntryToggle
                  marketName={t('even_odd')}
                  apiMarketName="even/odd"
                  bet={{
                    discipline: race.discipline,
                    event: {
                      name: race.name,
                      number: race.id,
                      startingAt: race.time,
                    },
                    competitors: t('odd'),
                    option: {
                      outcome: t('odd'),
                      decPrice: parseFloat(raceInfo.odds.evenodd?.odd || '0'),
                    },
                    track: getTrackName(6),
                  }}
                  variant="matchcard"
                  className="h-[49px] w-full text-[16px] text-black"
                />
              </div>
            </div>
          </div>

          {/* Under/Over Market */}
          <div>
            <div className="bg-accent text-accent-foreground">
              <div className="flex h-16 items-center justify-center text-[16px] font-bold">
                {t('under_over').toUpperCase()} 3.5
              </div>
            </div>

            <div className="flex h-[66px]">
              <div className="flex flex-1 items-center justify-between border-b pl-16">
                <BetEntryToggle
                  marketName={t('under_over')}
                  apiMarketName="under/over"
                  bet={{
                    discipline: race.discipline,
                    event: {
                      name: race.name,
                      number: race.id,
                      startingAt: race.time,
                    },
                    competitors: t('under'),
                    option: {
                      outcome: t('under'),
                      decPrice: parseFloat(
                        raceInfo.odds.underover?.under || '0',
                      ),
                    },
                    track: getTrackName(6),
                  }}
                  variant="matchcard"
                  className="h-[49px] w-full text-[16px] text-black"
                />
              </div>

              <div className="flex flex-1 items-center justify-between border-b pl-16 pr-16">
                <BetEntryToggle
                  marketName={t('under_over')}
                  apiMarketName="under/over"
                  bet={{
                    discipline: race.discipline,
                    event: {
                      name: race.name,
                      number: race.id,
                      startingAt: race.time,
                    },
                    competitors: t('over'),
                    option: {
                      outcome: t('over'),
                      decPrice: parseFloat(
                        raceInfo.odds.underover?.over || '0',
                      ),
                    },
                    track: getTrackName(6),
                  }}
                  variant="matchcard"
                  className="h-[49px] w-full text-[16px] text-black"
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
        <CardHeader className="flex h-[73px] flex-row items-center justify-between px-[12px]">
          <div className="flex items-center gap-[8px]">
            {Object.entries(tabConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={activeTab === key ? 'marketSelected' : 'market'}
                className="h-12 w-[140px] px-[18px] pb-0 text-[16px] font-semibold uppercase hover:opacity-90"
                onClick={() => handleTabChange(key as TabType)}
              >
                {config.name}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Testo Evento */}
            <span className="p-[10px] text-[15px] font-semibold text-tertiary-foreground">
              {'ID'} {race.id}
            </span>

            {/* Pulsante Clear */}
            {(activeTab === 'couples' || activeTab === 'triplets') &&
              (position1Selection.length > 0 ||
                position2Selection.length > 0 ||
                position3Selection.length > 0 ||
                disorderSelection.length > 0 ||
                fixedSelection.length > 0) && (
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
                className="h-12 w-fit border-border bg-secondary px-[18px] pb-[1px] text-[15px] text-secondary-foreground hover:opacity-90"
                onClick={() => setIsLatecomersDialogOpen(true)}
              >
                <span>{t('latecomers').toUpperCase()}</span>
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
                    <TableCell className="relative left-1 p-2 text-[18px]">
                      <div className="flex items-center gap-[7px]">
                        <div
                          className="flex h-[33px] w-[33px] items-center justify-center rounded-md text-[21px] font-semibold tabular-nums"
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
                          <div className="pl-1 pt-0.5 text-[17px] font-semibold">
                            {racer.name}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="w-[1px] bg-border p-0" />

                    {/* Performance */}
                    <TableCell className="p-3 text-[15px] font-bold">
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex space-x-1">
                          <div className="flex flex-col items-center justify-center gap-2">
                            {racer.performance}%
                            <Progress
                              value={racer.performance}
                              className="relative bottom-[3px] w-[189px] [&>div]:rounded-r-full [&>div]:bg-tertiary"
                              style={{ height: '8px' }}
                            />
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="w-[1px] bg-border p-0" />

                    {/* Storico */}
                    <TableCell>
                      <div className="flex items-center justify-center gap-2.5">
                        <MedalsHistory history={racer.history} />
                      </div>
                    </TableCell>

                    <TableCell className="w-[1px] bg-border p-0" />

                    {renderTabSpecificCells(racer)}
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-none">
                  <TableCell
                    colSpan={12}
                    className="border-none py-6 text-center text-[19px]"
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
          fixedSelection={fixedSelection}
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
