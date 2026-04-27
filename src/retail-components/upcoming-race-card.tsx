import { BetsContext } from '@/retail-contexts/bets-context'
import { RootContext } from '@/retail-contexts/root-context'
import { UpcomingEvent, UpcomingRace } from '@/retail-lib/types'
import {
  getRacerColors,
  createPGVirtualAPICall,
  normalizeMarketName,
  cn,
} from '@/retail-lib/utils'
import { t } from 'i18next'
import { useContext, useEffect, useRef, useState } from 'react'
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

// MODULE-LEVEL: persiste tra remount del componente
let moduleHasLoadedOnce = false
let lastRaceInfo: UpcomingRace | undefined = undefined

export default function UpcomingRaceCard({
  race,
  onSelectionChange,
}: UpcomingRaceCardProps) {
  const [raceInfo, setRaceInfo] = useState<UpcomingRace | undefined>(
    lastRaceInfo,
  )
  const [activeTab, setActiveTab] = useState<TabType>('main')

  const [position1Selection, setPosition1Selection] = useState<number[]>([])
  const [position2Selection, setPosition2Selection] = useState<number[]>([])
  const [position3Selection, setPosition3Selection] = useState<number[]>([])
  const [disorderSelection, setDisorderSelection] = useState<number[]>([])
  const [fixedSelection, setFixedSelection] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(!moduleHasLoadedOnce)
  const [isLatecomersDialogOpen, setIsLatecomersDialogOpen] = useState(false)

  const { betEntries } = useContext(BetsContext)
  const rootContext = useContext(RootContext)

  const [marketType, setMarketType] = useState<
    'exacta' | 'quinella' | 'trifecta' | 'boxtrifecta'
  >(() => {
    return activeTab === 'triplets' ? 'trifecta' : 'exacta'
  })

  useEffect(() => {
    if (activeTab === 'couples') {
      setMarketType('exacta')
    } else if (activeTab === 'triplets') {
      setMarketType('trifecta')
    }
    clearSelections()
  }, [activeTab])

  const prevRaceBetCountRef = useRef<number>(0)
  const betAddedFromUIRef = useRef<boolean>(false)

  useEffect(() => {
    const raceEntries = betEntries.filter(
      (entry) =>
        entry.bet.discipline === race.discipline &&
        entry.bet.event.number === race.id,
    )

    const prevCount = prevRaceBetCountRef.current
    const currentCount = raceEntries.length

    prevRaceBetCountRef.current = currentCount

    if (currentCount <= prevCount || currentCount === 0) {
      return
    }

    if (betAddedFromUIRef.current) {
      betAddedFromUIRef.current = false
      return
    }

    const latestEntry = raceEntries[raceEntries.length - 1]
    const normalized = normalizeMarketName(latestEntry.market)

    const newPosition1: number[] = []
    const newPosition2: number[] = []
    const newPosition3: number[] = []

    raceEntries.forEach((entry) => {
      const competitors = entry.bet.competitors
      const outcome = entry.bet.option.outcome
      const norm = normalizeMarketName(entry.market)

      if (norm === 'winner' || norm === 'placed' || norm === 'show') {
        const competitorNum = parseInt(outcome)
        if (!isNaN(competitorNum) && !newPosition1.includes(competitorNum)) {
          newPosition1.push(competitorNum)
        }
      } else if (norm === 'exacta' || norm === 'quinella') {
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
      } else if (norm === 'trifecta' || norm === 'boxed_trifecta') {
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
      }
    })

    if (normalized === 'exacta' || normalized === 'quinella') {
      setActiveTab('couples')
      setMarketType(normalized === 'exacta' ? 'exacta' : 'quinella')
    } else if (normalized === 'trifecta' || normalized === 'boxed_trifecta') {
      setActiveTab('triplets')
      setMarketType(normalized === 'trifecta' ? 'trifecta' : 'boxtrifecta')
    }

    if (newPosition1.length > 0) setPosition1Selection(() => newPosition1)
    if (newPosition2.length > 0) setPosition2Selection(() => newPosition2)
    if (newPosition3.length > 0) setPosition3Selection(() => newPosition3)
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
      columns: ['starters', 'performance', 'history', 'winner', 'place2', 'place3'],
    },
    couples: {
      name: t('couples'),
      showCombinations: true,
      columns: ['starters', 'performance', 'history', 'first', 'second', 'anyOrder'],
    },
    triplets: {
      name: t('triplets'),
      showCombinations: true,
      columns: ['starters', 'performance', 'history', 'first', 'second', 'third', 'anyOrder'],
    },
  }

  const shouldShowInfoButton = () => {
    return race.discipline === 'DOGS' || race.discipline === 'HORSES'
  }

  useEffect(() => {
    const fetchEventInfo = async () => {
      if (!moduleHasLoadedOnce) {
        setIsLoading(true)
      }
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
        lastRaceInfo = upcomingRace
        moduleHasLoadedOnce = true
      } catch (error) {
        console.error('Error fetching event info:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEventInfo()
  }, [race.id, race.extId, rootContext.initCode, rootContext.operator])

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
      if (activeTab === 'couples') setMarketType('exacta')
      else if (activeTab === 'triplets') setMarketType('trifecta')
      setDisorderSelection([])
    }
    setPosition1Selection((current) => {
      const isRemoving = current.includes(competitorId)
      const newSelection = isRemoving
        ? current.filter((id) => id !== competitorId)
        : [...current, competitorId]
      if (newSelection.length > 0) setDisorderSelection([])
      return newSelection
    })
  }

  const togglePosition2Selection = (competitorId: number) => {
    if (isAnyOrderMode) {
      if (activeTab === 'couples') setMarketType('exacta')
      else if (activeTab === 'triplets') setMarketType('trifecta')
      setDisorderSelection([])
    }
    setPosition2Selection((current) => {
      const isRemoving = current.includes(competitorId)
      const newSelection = isRemoving
        ? current.filter((id) => id !== competitorId)
        : [...current, competitorId]
      if (newSelection.length > 0) setDisorderSelection([])
      return newSelection
    })
  }

  const togglePosition3Selection = (competitorId: number) => {
    if (isAnyOrderMode) {
      if (activeTab === 'triplets') setMarketType('trifecta')
      setDisorderSelection([])
    }
    setPosition3Selection((current) => {
      const isRemoving = current.includes(competitorId)
      const newSelection = isRemoving
        ? current.filter((id) => id !== competitorId)
        : [...current, competitorId]
      if (newSelection.length > 0) setDisorderSelection([])
      return newSelection
    })
  }

  const toggleDisorderSelection = (competitorId: number) => {
    if (!isAnyOrderMode) {
      if (activeTab === 'couples') setMarketType('quinella')
      else if (activeTab === 'triplets') setMarketType('boxtrifecta')
      setPosition1Selection([])
      setPosition2Selection([])
      setPosition3Selection([])
    }
    setDisorderSelection((current) => {
      const isRemoving = current.includes(competitorId)
      const newSelection = isRemoving
        ? current.filter((id) => id !== competitorId)
        : [...current, competitorId]
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
      if (activeTab === 'couples') setMarketType('quinella')
      else if (activeTab === 'triplets') setMarketType('boxtrifecta')
      setPosition1Selection([])
      setPosition2Selection([])
      setPosition3Selection([])
    }
    setFixedSelection((current) => {
      const isRemoving = current.includes(competitorId)
      if (isRemoving) {
        return current.filter((id) => id !== competitorId)
      } else {
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
          <TableHead className="w-[249px] min-w-[150px] text-center font-semibold">
            <span className='inline-block w-full h-full leading-[54px] align-middle'>
              {t('starters_list').toUpperCase()}
            </span>
          </TableHead>
          <TableHead className="w-[1px] bg-border p-0" />

          <TableHead className="w-[249px] min-w-[140px] text-center font-semibold">
            <span className='inline-block w-full h-full leading-[54px] align-middle'>
              {t('performance').toUpperCase()}
            </span>
          </TableHead>
          <TableHead className="w-[1px] bg-border p-0" />

          <TableHead className="hidden w-[249px] min-w-[130px] text-center font-semibold min-[1440px]:table-cell">
            <span className='inline-block w-full h-full leading-[54px] align-middle'>
              {t('history').toUpperCase()}
              </span>
          </TableHead>
          <TableHead className="hidden w-[1px] bg-border p-0 min-[1440px]:table-cell" />

          {activeTab === 'main' && (
            <>
              <TableHead className="w-[249px] min-w-[100px] text-center font-bold">
                <span className='inline-block w-full h-full leading-[54px] align-middle'>
                  {t('winner').toUpperCase()}
                </span>
              </TableHead>
              <TableHead className="w-[1px] bg-border p-0" />
              <TableHead className="w-[249px] min-w-[100px] text-center font-semibold">
                <span className='inline-block w-full h-full leading-[54px] align-middle'>
                  {t('place_2').toUpperCase()}
                </span>
              </TableHead>
              <TableHead className="w-[1px] bg-border p-0" />
              <TableHead className="w-[249px] min-w-[100px] text-center font-semibold">
                <span className='inline-block w-full h-full leading-[54px] align-middle'>
                  {t('show_3').toUpperCase()}
                </span>
              </TableHead>
            </>
          )}

          {activeTab === 'couples' && (
            <>
              <TableHead className="text-center font-bold" colSpan={2}>
                <span className='inline-block w-full h-full leading-[54px] align-middle'>
                  {t('exacta').toUpperCase()}
                </span>
              </TableHead>
              <TableHead className="w-[1px] bg-border p-0" />
              <TableHead className="text-center font-bold" colSpan={2}>
                <span className='inline-block w-full h-full leading-[54px] align-middle'>
                  {t('quinella').toUpperCase()}
                </span>
              </TableHead>
            </>
          )}

          {activeTab === 'triplets' && (
            <>
              <TableHead className="text-center font-bold" colSpan={3}>
                <span className='inline-block w-full h-full leading-[54px] align-middle'>
                  {t('trifecta').toUpperCase()}
                </span>
              </TableHead>
              <TableHead className="w-[1px] bg-border p-0" />
              <TableHead className="text-center font-bold" colSpan={2}>
                <span className='inline-block w-full h-full leading-[54px] align-middle'>
                  {t('boxed_trifecta').toUpperCase()}
                </span>
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
                  extId: race.extId,
                  palimpsestId: race.palimpsestId,
                },
                competitors: racer.name,
                option: {
                  outcome: racer.number.toString(),
                  decPrice: parseFloat(
                    raceInfo?.odds?.winner?.[racer.number.toString()] || '0',
                  ),
                },
                track: race.trackName || 'Track 6',
              }}
              variant="racecard"
              className="h-[49px] w-[120px] bg-betEntry pt-[0px] text-[18px] tabular-nums text-betEntry-foreground hover:opacity-85"
              onToggle={() => { betAddedFromUIRef.current = true }}
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
                  extId: race.extId,
                  palimpsestId: race.palimpsestId,
                },
                competitors: racer.name,
                option: {
                  outcome: racer.number.toString(),
                  decPrice: parseFloat(
                    raceInfo?.odds?.placed?.[racer.number.toString()] || '0',
                  ),
                },
                track: race.trackName || 'Track 6',
              }}
              variant="racecard"
              className="h-[49px] w-[120px] bg-betEntry pt-[0px] text-[18px] tabular-nums text-betEntry-foreground hover:opacity-85"
              onToggle={() => { betAddedFromUIRef.current = true }}
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
                  extId: race.extId,
                  palimpsestId: race.palimpsestId,
                },
                competitors: racer.name,
                option: {
                  outcome: racer.number.toString(),
                  decPrice: parseFloat(
                    raceInfo?.odds?.show?.[racer.number.toString()] || '0',
                  ),
                },
                track: race.trackName || 'Track 6',
              }}
              variant="racecard"
              className="h-[49px] w-[120px] bg-betEntry pt-[0px] text-[18px] tabular-nums text-betEntry-foreground hover:opacity-85"
              onToggle={() => { betAddedFromUIRef.current = true }}
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
              <div className={`flex flex-1 items-center justify-center p-2 ${!isAnyOrderMode ? 'bg-gray-300' : ''}`}>
                <Toggle
                  pressed={fixedSelection.includes(racer.number)}
                  onPressedChange={() => toggleFixedSelection(racer.number)}
                  onClick={(e) => e.stopPropagation()}
                  className={`relative left-[17px] h-12 w-[56px] border-betEntry-border pt-[2px] ${fixedSelection.includes(racer.number) ? 'text-white' : ''}`}
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
              <div className={`flex flex-1 items-center justify-center p-2 ${!isAnyOrderMode ? 'bg-gray-300' : ''}`}>
                <Toggle
                  pressed={disorderSelection.includes(racer.number)}
                  onPressedChange={() => toggleDisorderSelection(racer.number)}
                  onClick={(e) => e.stopPropagation()}
                  className="relative right-[4px] h-12 w-[117px] border-betEntry-border pt-[2px]"
                >
                  {disorderSelection.includes(racer.number) && (
                    <Check className="h-12 w-12 text-background" style={{ zoom: 1.3 }} />
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
              <div className={`flex flex-1 items-center justify-center py-2 pl-[2px] ${!isAnyOrderMode ? 'bg-gray-300' : ''}`}>
                <Toggle
                  pressed={fixedSelection.includes(racer.number)}
                  onPressedChange={() => toggleFixedSelection(racer.number)}
                  onClick={(e) => e.stopPropagation()}
                  className={`relative left-[17px] h-12 w-[56px] border-betEntry-border pt-[2px] ${fixedSelection.includes(racer.number) ? 'text-white' : ''}`}
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
              <div className={`flex flex-1 items-center justify-center p-2 ${!isAnyOrderMode ? 'bg-gray-300' : ''}`}>
                <Toggle
                  pressed={disorderSelection.includes(racer.number)}
                  onPressedChange={() => toggleDisorderSelection(racer.number)}
                  onClick={(e) => e.stopPropagation()}
                  className="relative left-[3px] h-12 w-[116px] border-betEntry-border pt-[2px] tabular-nums"
                >
                  {disorderSelection.includes(racer.number) && (
                    <Check className="h-12 w-12 text-background" style={{ zoom: 1.3 }} />
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

  // ─────────────────────────────────────────────────────────────────────────
  // renderSpecialMarkets: TableBody separato dentro la stessa <Table>.
  // Le celle ereditano le larghezze di colonna esatte → separatori sempre
  // allineati a qualsiasi viewport.
  //
  // Colonne (activeTab === 'main'):
  //   0 PARTENTI  1 sep  2 PERFORMANCE  3 sep(hidden<1440)
  //   4 STORICO(hidden)  5 sep ← DA ALLINEARE
  //   6 VINCENTE  7 sep  8 PIAZZATO  9 sep  10 PODIO
  //
  // PARI/DISPARI → colSpan 3 (col 6+7+8)
  // sep centrale → col 9  (allineato con col 5)
  // UNDER/OVER   → col 10
  // ─────────────────────────────────────────────────────────────────────────
  const renderSpecialMarkets = () => {
  if (activeTab !== 'main' || !raceInfo?.odds) {
    return null
  }

  return (
    <TableBody>
      <TableRow className="border-0 hover:bg-transparent">
        <TableCell colSpan={11} className="h-2 p-0" />
      </TableRow>

      <TableRow className="border-0 hover:bg-transparent">
        {/* PARI / DISPARI — metà sinistra: colSpan 5 (PARTENTI + sep + PERFORMANCE + sep(hidden) + STORICO(hidden)) + sep */}
        <TableCell colSpan={6} className="p-0">
          <div className="flex h-16 items-center justify-center bg-accent text-[16px] font-bold text-accent-foreground border-r">
            {t('even_odd').toUpperCase()}
          </div>
          <div className="flex h-[66px]">
            <div className="flex flex-1 items-center justify-center pl-16 ">
              <BetEntryToggle
                marketName={t('even_odd')}
                apiMarketName="even/odd"
                bet={{
                  discipline: race.discipline,
                  event: { name: race.name, number: race.id, startingAt: race.time, extId: race.extId, palimpsestId: race.palimpsestId },
                  competitors: 'Even',
                  option: { outcome: 'even', decPrice: parseFloat(raceInfo.odds.evenodd?.even || '0') },
                  track: race.trackName || 'Track 6',
                }}
                variant="matchcard"
                className="h-[49px] w-full text-[16px] text-black"
                onToggle={() => { betAddedFromUIRef.current = true }}
              />
            </div>
            <div className="flex flex-1 items-center justify-center pl-16 pr-16 border-r">
              <BetEntryToggle
                marketName={t('even_odd')}
                apiMarketName="even/odd"
                bet={{
                  discipline: race.discipline,
                  event: { name: race.name, number: race.id, startingAt: race.time, extId: race.extId, palimpsestId: race.palimpsestId },
                  competitors: 'Odd',
                  option: { outcome: 'odd', decPrice: parseFloat(raceInfo.odds.evenodd?.odd || '0') },
                  track: race.trackName || 'Track 6',
                }}
                variant="matchcard"
                className="h-[49px] w-full text-[16px] text-black"
                onToggle={() => { betAddedFromUIRef.current = true }}
              />
            </div>
          </div>
        </TableCell>

        {/* UNDER / OVER — metà destra: colSpan 5 (VINCENTE + sep + PIAZZATO + sep + PODIO) */}
        <TableCell colSpan={5} className="p-0">
          <div className="flex h-16 items-center justify-center bg-accent text-[16px] font-bold text-accent-foreground">
            {t('under_over').toUpperCase()} 3.5
          </div>
          <div className="flex h-[66px]">
            <div className="flex flex-1 items-center justify-center pl-16 pr-16 ">
              <BetEntryToggle
                marketName={t('under_over')}
                apiMarketName="under/over"
                bet={{
                  discipline: race.discipline,
                  event: { name: race.name, number: race.id, startingAt: race.time, extId: race.extId, palimpsestId: race.palimpsestId },
                  competitors: 'Under',
                  option: { outcome: 'under', decPrice: parseFloat(raceInfo.odds.underover?.under || '0') },
                  track: race.trackName || 'Track 6',
                }}
                variant="matchcard"
                className="h-[49px] w-full text-[16px] text-black"
                onToggle={() => { betAddedFromUIRef.current = true }}
              />
            </div>
            <div className="flex flex-1 items-center justify-center pr-16">
              <BetEntryToggle
                marketName={t('under_over')}
                apiMarketName="under/over"
                bet={{
                  discipline: race.discipline,
                  event: { name: race.name, number: race.id, startingAt: race.time, extId: race.extId, palimpsestId: race.palimpsestId },
                  competitors: 'Over',
                  option: { outcome: 'over', decPrice: parseFloat(raceInfo.odds.underover?.over || '0') },
                  track: race.trackName || 'Track 6',
                }}
                variant="matchcard"
                className="h-[49px] w-full text-[16px] text-black"
                onToggle={() => { betAddedFromUIRef.current = true }}
              />
            </div>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  )
}

  return (
    <>
      <Card className="h-full w-full">
        <CardHeader className="flex h-[73px] flex-row items-center justify-between px-[12px]">
          <div className="flex items-center space-x-2">
  {Object.entries(tabConfig).map(([key, config]) => {
    const isActive = activeTab === key;

    return (
      <Button
        key={key}
        variant={isActive ? 'marketSelected' : 'market'}
        className={cn(
          "h-12 w-[140px] px-[18px] pb-0 text-[16px] font-semibold uppercase transition-colors",
          !isActive && "hover:bg-[#46474d]" // L'hover viene applicato solo se NON è attivo
        )}
        onClick={() => handleTabChange(key as TabType)}
      >
        {config.name}
      </Button>
    );
  })}
</div>

          <div className="flex items-center gap-2">
            <span className="p-[10px] text-[15px] font-semibold text-tertiary-foreground tabular-nums">
              {'ID'} {race.id}
            </span>

            {(activeTab === 'couples' || activeTab === 'triplets') &&
              (position1Selection.length > 0 ||
                position2Selection.length > 0 ||
                position3Selection.length > 0 ||
                disorderSelection.length > 0 ||
                fixedSelection.length > 0) && (
                <Button
                  variant="ghost"
                  className="h-12 w-fit bg-secondary px-4 text-[15px] font-semibold text-secondary-foreground"
                  onClick={clearSelections}
                >
                  {t('clear_all').toUpperCase()}
                </Button>
              )}

            {shouldShowInfoButton() && (
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-fit pt-[1px] border-border bg-secondary px-[18px] text-[15px] font-semibold text-secondary-foreground hover:bg-[#46474d]"
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
                    <TableCell className="relative left-1 p-2 text-[18px]">
                      <div className="flex items-center space-x-[7px]">
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

                    <TableCell className="p-3 text-[15px] font-bold">
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex space-x-1">
                          <div className="flex flex-col items-center justify-center">
                            {racer.performance}%
                            <Progress
                              value={racer.performance}
                              className="relative bottom-[0px] w-[189px] [&>div]:rounded-r-full [&>div]:bg-tertiary"
                              style={{ height: '8px' }}
                            />
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="hidden w-[1px] bg-border p-0 min-[1440px]:table-cell" />

                    <TableCell className="hidden min-[1440px]:table-cell">
                      <div className="flex items-center justify-center space-x-[10px]">
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

            {/* Mercati speciali: TableBody separato dentro la stessa Table */}
            {renderSpecialMarkets()}
          </Table>
        </CardContent>
      </Card>

      {!isLoading && raceInfo && tabConfig[activeTab].showCombinations && (
        <BetCombinationsTable
          race={{ ...race, data: raceInfo }}
          position1Selection={position1Selection}
          position2Selection={position2Selection}
          position3Selection={position3Selection}
          disorderSelection={disorderSelection}
          fixedSelection={fixedSelection}
          marketType={marketType}
          onBeforeToggle={() => {
            betAddedFromUIRef.current = true
          }}
        />
      )}

      <LatecomersDialog
        isOpen={isLatecomersDialogOpen}
        onOpenChange={setIsLatecomersDialogOpen}
        raceInfo={raceInfo}
        discipline={race.discipline as 'DOGS' | 'HORSES'}
      />
    </>
  )
}