import { Bet, UpcomingEvent, UpcomingRace } from '@/retail-lib/types'
import { useContext, useMemo, useState } from 'react'
import BetEntryToggle from './bet-entry-toggle'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { BetsContext } from '@/retail-contexts/bets-context'
import { useTranslation } from 'react-i18next'

type BetCombinationsTableProps = {
  race: UpcomingEvent
  position1Selection: number[]
  position2Selection: number[]
  position3Selection: number[]
  disorderSelection: number[]
  marketType?: 'exacta' | 'quinella' | 'trifecta' | 'boxtrifecta'
  onClearSelections?: () => void
}

export default function BetCombinationsTable({
  race,
  position1Selection,
  position2Selection,
  position3Selection,
  disorderSelection,
  marketType = 'exacta',
  onClearSelections,
}: BetCombinationsTableProps) {
  const { t } = useTranslation()
  const [sortMode, setSortMode] = useState<'default' | 'asc' | 'desc'>(
    'default',
  )
  const { addBets, betEntries, removeBets } = useContext(BetsContext)

  const combinations: Bet[] = useMemo(() => {
    const allCombinations: Bet[] = []
    const raceData = race.data as UpcomingRace

    console.log('Debug BetCombinationsTable:', {
      marketType,
      disorderSelection,
    })

    if (marketType === 'exacta') {
      const pos1Options =
        position1Selection.length > 0
          ? position1Selection
          : Object.keys(raceData.odds.exacta).map(Number)
      const pos2Options =
        position2Selection.length > 0 ? position2Selection : []

      pos1Options.forEach((racer1) => {
        const availablePos2 =
          pos2Options.length > 0
            ? pos2Options
            : Object.keys(raceData.odds.exacta[racer1] || {}).map(Number)

        availablePos2.forEach((racer2) => {
          if (racer1 === racer2) return
          const odds = raceData.odds.exacta[racer1]?.[racer2]
          if (odds) {
            allCombinations.push({
              discipline: race.discipline,
              event: {
                name: race.name,
                number: race.id,
                startingAt: race.time,
              },
              competitors: `${racer1}-${racer2}`,
              option: {
                outcome: `${racer1}-${racer2}`,
                decPrice: parseFloat(odds),
              },
              track: `Track  6`,
            })
          }
        })
      })
    } else if (marketType === 'quinella') {
      if (raceData.odds.quinella) {
        Object.keys(raceData.odds.quinella).forEach((racer1Str) => {
          const racer1 = parseInt(racer1Str)
          Object.keys(raceData.odds.quinella[racer1] || {}).forEach(
            (racer2Str) => {
              const racer2 = parseInt(racer2Str)
              if (racer1 < racer2) {
                if (disorderSelection.length > 0) {
                  const combinationRacers = [racer1, racer2]

                  if (disorderSelection.length === 1) {
                    // Un solo corridore selezionato
                    const hasSelectedRacer = combinationRacers.includes(
                      disorderSelection[0],
                    )
                    if (!hasSelectedRacer) return
                  } else if (disorderSelection.length === 2) {
                    // Due corridori selezionati
                    const exactMatch =
                      disorderSelection.length === combinationRacers.length &&
                      disorderSelection.every((selectedRacer) =>
                        combinationRacers.includes(selectedRacer),
                      ) &&
                      combinationRacers.every((racer) =>
                        disorderSelection.includes(racer),
                      )
                    if (!exactMatch) return
                  } else {
                    // Più di 2 corridori selezionati: non mostrare nulla (quinella ha solo 2 corridori)
                    return
                  }
                }

                const odds = raceData.odds.quinella[racer1]?.[racer2]
                if (odds) {
                  allCombinations.push({
                    discipline: race.discipline,
                    event: {
                      name: race.name,
                      number: race.id,
                      startingAt: race.time,
                    },
                    competitors: `${racer1}-${racer2} any Order`,
                    option: {
                      outcome: `${racer1}-${racer2} any`,
                      decPrice: parseFloat(odds),
                    },
                    track: `Track  6`,
                  })
                }
              }
            },
          )
        })
      }
    } else if (marketType === 'trifecta') {
      const pos1Options =
        position1Selection.length > 0
          ? position1Selection
          : Object.keys(raceData.odds.trifecta).map(Number)
      const pos2Options =
        position2Selection.length > 0 ? position2Selection : []
      const pos3Options =
        position3Selection.length > 0 ? position3Selection : []

      pos1Options.forEach((racer1) => {
        const availablePos2 =
          pos2Options.length > 0
            ? pos2Options
            : Object.keys(raceData.odds.trifecta[racer1] || {}).map(Number)

        availablePos2.forEach((racer2) => {
          if (racer1 === racer2) return
          const availablePos3 =
            pos3Options.length > 0
              ? pos3Options
              : Object.keys(raceData.odds.trifecta[racer1]?.[racer2] || {}).map(
                  Number,
                )

          availablePos3.forEach((racer3) => {
            if (racer1 === racer3 || racer2 === racer3) return
            const odds = raceData.odds.trifecta[racer1]?.[racer2]?.[racer3]
            if (odds) {
              allCombinations.push({
                discipline: race.discipline,
                event: {
                  name: race.name,
                  number: race.id,
                  startingAt: race.time,
                },
                competitors: `${racer1}-${racer2}-${racer3}`,
                option: {
                  outcome: `${racer1}-${racer2}-${racer3}`,
                  decPrice: parseFloat(odds),
                },
                track: `Track  6`,
              })
            }
          })
        })
      })
    } else if (marketType === 'boxtrifecta') {
      if (raceData.odds.boxedtrifecta) {
        const processedCombinations = new Set<string>()

        Object.keys(raceData.odds.boxedtrifecta).forEach((racer1Str) => {
          const racer1 = parseInt(racer1Str)
          Object.keys(raceData.odds.boxedtrifecta[racer1] || {}).forEach(
            (racer2Str) => {
              const racer2 = parseInt(racer2Str)
              Object.keys(
                raceData.odds.boxedtrifecta[racer1]?.[racer2] || {},
              ).forEach((racer3Str) => {
                const racer3 = parseInt(racer3Str)
                if (
                  racer1 !== racer2 &&
                  racer2 !== racer3 &&
                  racer1 !== racer3
                ) {
                  const sortedRacers = [racer1, racer2, racer3].sort(
                    (a, b) => a - b,
                  )
                  const combinationKey = sortedRacers.join('-')

                  if (!processedCombinations.has(combinationKey)) {
                    processedCombinations.add(combinationKey)

                    if (disorderSelection.length > 0) {
                      if (disorderSelection.length === 1) {
                        // Un corridore
                        const hasSelectedRacer = sortedRacers.includes(
                          disorderSelection[0],
                        )
                        if (!hasSelectedRacer) return
                      } else if (disorderSelection.length === 2) {
                        // Due corridori
                        const hasAllSelectedRacers = disorderSelection.every(
                          (selectedRacer) =>
                            sortedRacers.includes(selectedRacer),
                        )
                        if (!hasAllSelectedRacers) return
                      } else if (disorderSelection.length === 3) {
                        // Tre corridori
                        const exactMatch =
                          disorderSelection.length === sortedRacers.length &&
                          disorderSelection.every((selectedRacer) =>
                            sortedRacers.includes(selectedRacer),
                          ) &&
                          sortedRacers.every((racer) =>
                            disorderSelection.includes(racer),
                          )
                        if (!exactMatch) return
                      } else {
                        // Più di 3 corridori: non mostrare nulla
                        return
                      }
                    }

                    const odds =
                      raceData.odds.boxedtrifecta[racer1]?.[racer2]?.[racer3]
                    if (odds) {
                      allCombinations.push({
                        discipline: race.discipline,
                        event: {
                          name: race.name,
                          number: race.id,
                          startingAt: race.time,
                        },
                        competitors: `${combinationKey} any Order`,
                        option: {
                          outcome: `${combinationKey} any`,
                          decPrice: parseFloat(odds),
                        },
                        track: `Track  6`,
                      })
                    }
                  }
                }
              })
            },
          )
        })
      }
    }

    // Ordinamento delle combinazioni in base al sortMode
    if (sortMode === 'asc') {
      return allCombinations.sort(
        (a, b) => a.option.decPrice - b.option.decPrice,
      )
    } else if (sortMode === 'desc') {
      return allCombinations.sort(
        (a, b) => b.option.decPrice - a.option.decPrice,
      )
    }
    return allCombinations
  }, [
    position1Selection,
    position2Selection,
    position3Selection,
    disorderSelection,
    race.data,
    race.discipline,
    race.id,
    race.name,
    race.time,
    sortMode,
    marketType,
  ])

  const getTitle = () => {
    switch (marketType) {
      case 'exacta':
        return `${t('exacta').toUpperCase()}`
      case 'quinella':
        return `${t('quinella').toUpperCase()}`
      case 'trifecta':
        return `${t('trifecta').toUpperCase()}`
      case 'boxtrifecta':
        return `${t('boxed_trifecta').toUpperCase()}`
      default:
        return ''
    }
  }

  const getMarketName = () => {
    switch (marketType) {
      case 'exacta':
        return `${t('exacta')}`
      case 'quinella':
        return `${t('quinella')}`
      case 'trifecta':
        return `${t('trifecta')}`
      case 'boxtrifecta':
        return `${t('boxed_trifecta')}`
      default:
        return ''
    }
  }

  const marketName = getMarketName()

  const allBetsSelected = useMemo(() => {
    return combinations.every(
      (bet) =>
        !!betEntries.find(
          (entry) =>
            entry.market === marketName &&
            entry.bet.event.number === bet.event.number &&
            entry.bet.competitors === bet.competitors &&
            entry.bet.option.outcome === bet.option.outcome,
        ),
    )
  }, [combinations, betEntries, marketName])

  const shouldShowEmptyState =
    combinations.length === 0 &&
    (position1Selection.length > 0 ||
      position2Selection.length > 0 ||
      position3Selection.length > 0 ||
      disorderSelection.length > 0)

  if (shouldShowEmptyState) {
    return (
      <Card className="mt-4">
        <CardHeader className="flex h-14 items-center justify-center bg-accent px-4 text-accent-foreground">
          <CardTitle className="justify-center text-lg text-white">
            {getTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="pt-4 text-center text-[16px] text-black">
            {t('no_combinations_available')}
          </p>
        </CardContent>
      </Card>
    )
  }

  const getSortButtonText = () => {
    switch (sortMode) {
      case 'default':
        return `${t('sort_by_odds')} #`.toUpperCase()
      case 'asc':
        return `${t('sort_by_odds')} ↑`.toUpperCase()
      case 'desc':
        return `${t('sort_by_odds')} ↓`.toUpperCase()
      default:
        return t('sort_by_odds').toUpperCase()
    }
  }

  const handleSortClick = () => {
    setSortMode((current) => {
      switch (current) {
        case 'default':
          return 'asc'
        case 'asc':
          return 'desc'
        case 'desc':
          return 'default'
        default:
          return 'asc'
      }
    })
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex h-14 items-center justify-center bg-accent px-4 text-accent-foreground">
        <CardTitle className="justify-center text-lg text-white">
          {getTitle()}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="navbar"
            className="h-10 w-40 px-3 text-[16px] font-bold text-white"
            onClick={handleSortClick}
          >
            {getSortButtonText()}
          </Button>
          <Button
            variant="navbar"
            className="h-10 w-40 px-3 text-[16px] font-bold text-white"
            onClick={() => {
              if (allBetsSelected) {
                removeBets(
                  marketName,
                  combinations.map((bet) => ({
                    option: bet.option,
                    competitors: bet.competitors,
                  })),
                )
              } else {
                addBets(marketName, combinations)
              }
            }}
          >
            {allBetsSelected
              ? `${t('deselect_all').toUpperCase()}`
              : `${t('select_all').toUpperCase()}`}
          </Button>

          <div className="flex h-10 min-w-[60px] items-center justify-center rounded bg-accent-foreground px-3 text-accent">
            <span className="text-[16px] font-bold">{combinations.length}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-12 gap-2">
          {combinations.map((bet) => (
            <BetEntryToggle
              key={bet.option.outcome}
              bet={bet}
              marketName={marketName}
              variant="racecombination"
              onToggle={(isPressed) => {
                if (isPressed && onClearSelections) {
                  setTimeout(() => {
                    onClearSelections()
                  }, 100)
                }
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
