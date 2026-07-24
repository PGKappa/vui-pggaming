import { Bet, UpcomingEvent, UpcomingRace } from '@/retail-lib/types'
import { useContext, useMemo, useState } from 'react'
import BetEntryToggle from './bet-entry-toggle'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { BetsContext } from '@/retail-contexts/bets-context'
import { useTranslation } from 'react-i18next'
import { useRetailOriginalLayout } from '@/retail-lib/use-retail-compact-height'
import { cn } from '@/retail-lib/utils'

type BetCombinationsTableProps = {
  race: UpcomingEvent
  position1Selection: number[]
  position2Selection: number[]
  position3Selection: number[]
  disorderSelection: number[]
  fixedSelection: number[]
  marketType?: 'exacta' | 'quinella' | 'trifecta' | 'boxtrifecta'
  onBeforeToggle?: () => void
}

export default function BetCombinationsTable({
  race,
  position1Selection,
  position2Selection,
  position3Selection,
  disorderSelection,
  fixedSelection,
  marketType = 'exacta',
  onBeforeToggle,
}: BetCombinationsTableProps) {
  const { t } = useTranslation()
  const isOriginalLayout = useRetailOriginalLayout()

  const [sortMode, setSortMode] = useState<'default' | 'asc' | 'desc'>(
    'default',
  )
  const { addBets, betEntries, removeBets } = useContext(BetsContext)

  const combinations: Bet[] = useMemo(() => {
    const allCombinations: Bet[] = []
    const raceData = race.data as UpcomingRace

    // Helper to get racer name from number
    const getRacerName = (racerNumber: number | string): string => {
      const racer = raceData.racers.find(
        (r) => r.number === Number(racerNumber),
      )
      return racer?.name || racerNumber.toString()
    }

    // Helper to convert number key like "1-2-3" to names like "Black-White-Red"
    const getCombinationNames = (numberKey: string): string => {
      return numberKey
        .split('-')
        .map((num) => getRacerName(num))
        .join('-')
    }

    // Controlla se una combinazione include almeno una fissa
    const includesFixedRacer = (racers: number[]): boolean => {
      if (fixedSelection.length === 0) return true // Nessuna fissa = tutte valide
      return fixedSelection.some((fixed) => racers.includes(fixed))
    }

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
            const racer1Name = getRacerName(racer1)
            const racer2Name = getRacerName(racer2)

            allCombinations.push({
              discipline: race.discipline,
              event: {
                name: race.name,
                number: race.id,
                startingAt: race.time,
              },
              competitors: `${racer1Name}-${racer2Name}`,
              option: {
                outcome: `${racer1}-${racer2}`,
                decPrice: parseFloat(odds),
              },
              track: race.trackName || (race.discipline === 'DOGS8' ? 'Track 8' : 'Track 6'),
            })
          }
        })
      })
    } else if (marketType === 'quinella') {
      if (raceData.odds.quinella) {
        if (disorderSelection.length > 0) {
          if (disorderSelection.length === 1) {
            // 1 CORRIDORE: Mostra tutte le coppie che includono quel corridore
            const selectedRacer = disorderSelection[0]
            Object.keys(raceData.odds.quinella).forEach((racer1Str) => {
              const racer1 = parseInt(racer1Str)
              Object.keys(raceData.odds.quinella[racer1] || {}).forEach(
                (racer2Str) => {
                  const racer2 = parseInt(racer2Str)
                  if (
                    racer1 < racer2 &&
                    (racer1 === selectedRacer || racer2 === selectedRacer)
                  ) {
                    const combinationRacers = [racer1, racer2]

                    if (!includesFixedRacer(combinationRacers)) return

                    const odds = raceData.odds.quinella[racer1]?.[racer2]
                    if (odds) {
                      const racer1Name = getRacerName(racer1)
                      const racer2Name = getRacerName(racer2)

                      allCombinations.push({
                        discipline: race.discipline,
                        event: {
                          name: race.name,
                          number: race.id,
                          startingAt: race.time,
                        },
                        competitors: `${racer1Name}-${racer2Name}`,
                        option: {
                          outcome: `${racer1}-${racer2}`,
                          decPrice: parseFloat(odds),
                        },
                        track: race.trackName || (race.discipline === 'DOGS8' ? 'Track 8' : 'Track 6'),
                      })
                    }
                  }
                },
              )
            })
          } else {
            // 2+ CORRIDORI: Genera tutte le coppie possibili dal pool selezionato
            for (let i = 0; i < disorderSelection.length; i++) {
              for (let j = i + 1; j < disorderSelection.length; j++) {
                const racer1 = Math.min(
                  disorderSelection[i],
                  disorderSelection[j],
                )
                const racer2 = Math.max(
                  disorderSelection[i],
                  disorderSelection[j],
                )

                if (!includesFixedRacer([racer1, racer2])) continue

                const odds = raceData.odds.quinella[racer1]?.[racer2]
                if (odds) {
                  const racer1Name = getRacerName(racer1)
                  const racer2Name = getRacerName(racer2)

                  allCombinations.push({
                    discipline: race.discipline,
                    event: {
                      name: race.name,
                      number: race.id,
                      startingAt: race.time,
                    },
                    competitors: `${racer1Name}-${racer2Name}`,
                    option: {
                      outcome: `${racer1}-${racer2}`,
                      decPrice: parseFloat(odds),
                    },
                    track: race.trackName || (race.discipline === 'DOGS8' ? 'Track 8' : 'Track 6'),
                  })
                }
              }
            }
          }
        } else {
          // Se non ho selezioni, mostro TUTTE le combinazioni disponibili
          Object.keys(raceData.odds.quinella).forEach((racer1Str) => {
            const racer1 = parseInt(racer1Str)
            Object.keys(raceData.odds.quinella[racer1] || {}).forEach(
              (racer2Str) => {
                const racer2 = parseInt(racer2Str)
                if (racer1 < racer2) {
                  const combinationRacers = [racer1, racer2]

                  if (!includesFixedRacer(combinationRacers)) return

                  const odds = raceData.odds.quinella[racer1]?.[racer2]
                  if (odds) {
                    const racer1Name = getRacerName(racer1)
                    const racer2Name = getRacerName(racer2)

                    allCombinations.push({
                      discipline: race.discipline,
                      event: {
                        name: race.name,
                        number: race.id,
                        startingAt: race.time,
                      },
                      competitors: `${racer1Name}-${racer2Name}`,
                      option: {
                        outcome: `${racer1}-${racer2}`,
                        decPrice: parseFloat(odds),
                      },
                      track: race.trackName || (race.discipline === 'DOGS8' ? 'Track 8' : 'Track 6'),
                    })
                  }
                }
              },
            )
          })
        }
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
              const racer1Name = getRacerName(racer1)
              const racer2Name = getRacerName(racer2)
              const racer3Name = getRacerName(racer3)

              allCombinations.push({
                discipline: race.discipline,
                event: {
                  name: race.name,
                  number: race.id,
                  startingAt: race.time,
                },
                competitors: `${racer1Name}-${racer2Name}-${racer3Name}`,
                option: {
                  outcome: `${racer1}-${racer2}-${racer3}`,
                  decPrice: parseFloat(odds),
                },
                track: race.trackName || (race.discipline === 'DOGS8' ? 'Track 8' : 'Track 6'),
              })
            }
          })
        })
      })
    } else if (marketType === 'boxtrifecta') {
      if (raceData.odds.boxedtrifecta) {
        if (disorderSelection.length > 0) {
          if (disorderSelection.length === 1) {
            // 1 CORRIDORE: Mostra tutte le triple che includono quel corridore
            const selectedRacer = disorderSelection[0]
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

                      // Solo se include il corridore selezionato
                      if (
                        sortedRacers.includes(selectedRacer) &&
                        !processedCombinations.has(combinationKey)
                      ) {
                        processedCombinations.add(combinationKey)

                        if (!includesFixedRacer(sortedRacers)) return

                        const odds =
                          raceData.odds.boxedtrifecta[racer1]?.[racer2]?.[
                            racer3
                          ]
                        if (odds) {
                          allCombinations.push({
                            discipline: race.discipline,
                            event: {
                              name: race.name,
                              number: race.id,
                              startingAt: race.time,
                            },
                            competitors: `${getCombinationNames(combinationKey)}`,
                            option: {
                              outcome: `${combinationKey}`,
                              decPrice: parseFloat(odds),
                            },
                            track: race.trackName || (race.discipline === 'DOGS8' ? 'Track 8' : 'Track 6'),
                          })
                        }
                      }
                    }
                  })
                },
              )
            })
          } else if (disorderSelection.length === 2) {
            // 2 CORRIDORI: Mostra tutte le triple che includono ENTRAMBI quei corridori
            const [selectedRacer1, selectedRacer2] = disorderSelection
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

                      // Solo se include ENTRAMBI i corridori selezionati
                      if (
                        sortedRacers.includes(selectedRacer1) &&
                        sortedRacers.includes(selectedRacer2) &&
                        !processedCombinations.has(combinationKey)
                      ) {
                        processedCombinations.add(combinationKey)

                        if (!includesFixedRacer(sortedRacers)) return

                        const odds =
                          raceData.odds.boxedtrifecta[racer1]?.[racer2]?.[
                            racer3
                          ]
                        if (odds) {
                          allCombinations.push({
                            discipline: race.discipline,
                            event: {
                              name: race.name,
                              number: race.id,
                              startingAt: race.time,
                            },
                            competitors: `${getCombinationNames(combinationKey)}`,
                            option: {
                              outcome: `${combinationKey}`,
                              decPrice: parseFloat(odds),
                            },
                            track: race.trackName || (race.discipline === 'DOGS8' ? 'Track 8' : 'Track 6'),
                          })
                        }
                      }
                    }
                  })
                },
              )
            })
          } else {
            // 3+ CORRIDORI: Genera tutte le triple possibili dal pool selezionato
            for (let i = 0; i < disorderSelection.length; i++) {
              for (let j = i + 1; j < disorderSelection.length; j++) {
                for (let k = j + 1; k < disorderSelection.length; k++) {
                  const sortedRacers = [
                    disorderSelection[i],
                    disorderSelection[j],
                    disorderSelection[k],
                  ].sort((a, b) => a - b)
                  const [racer1, racer2, racer3] = sortedRacers
                  const combinationKey = sortedRacers.join('-')

                  if (!includesFixedRacer(sortedRacers)) continue

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
                      competitors: `${getCombinationNames(combinationKey)}`,
                      option: {
                        outcome: `${combinationKey}`,
                        decPrice: parseFloat(odds),
                      },
                      track: race.trackName || (race.discipline === 'DOGS8' ? 'Track 8' : 'Track 6'),
                    })
                  }
                }
              }
            }
          }
        } else {
          // Se non ho selezioni, mostro TUTTE le combinazioni disponibili
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

                      if (!includesFixedRacer(sortedRacers)) return

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
                          competitors: `${getCombinationNames(combinationKey)}`,
                          option: {
                            outcome: `${combinationKey}`,
                            decPrice: parseFloat(odds),
                          },
                          track: race.trackName || (race.discipline === 'DOGS8' ? 'Track 8' : 'Track 6'),
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
    fixedSelection,
    race.data,
    race.discipline,
    race.id,
    race.name,
    race.time,
    race.trackName,
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
        return 'Exacta'
      case 'quinella':
        return 'Quinella'
      case 'trifecta':
        return 'Trifecta'
      case 'boxtrifecta':
        return 'Boxed Trifecta'
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
        return `${t('sort_by_odds')}`.toUpperCase()
      case 'asc':
        return `${t('sort_by_odds')}`.toUpperCase()
      case 'desc':
        return `${t('sort_by_odds')}`.toUpperCase()
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
    <Card className="mt-2">
      <CardHeader className="relative flex h-14 items-center justify-end bg-accent px-3 text-accent-foreground">
        <CardTitle className="pointer-events-none absolute inset-0 flex items-center justify-center text-[16px] text-white">
          {getTitle()}
        </CardTitle>
        <div className="relative z-10 flex space-x-2 min-[1280px]:max-[1399px]:space-x-1.5">
          <Button
            variant="navbar"
            className="h-10 w-fit rounded-[1px] px-[18px] pt-[1px] text-[15px] font-semibold text-white active:bg-betHover hover:bg-navbarHover min-[1280px]:max-[1399px]:h-8 min-[1280px]:max-[1399px]:px-3 min-[1280px]:max-[1399px]:text-xs"
            onClick={handleSortClick}
          >
            {getSortButtonText()}
          </Button>
          <Button
            variant="navbar"
            className="h-10 w-[183px] rounded-[1px] px-[18px] pt-[1px] text-[15px] font-semibold text-white active:bg-betHover hover:bg-navbarHover min-[1280px]:max-[1399px]:h-8 min-[1280px]:max-[1399px]:w-[146px] min-[1280px]:max-[1399px]:px-3 min-[1280px]:max-[1399px]:text-xs"
            onClick={() => {
              if (onBeforeToggle) onBeforeToggle()
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

          <div className="flex h-10 min-w-[63px] items-center justify-center rounded-[1px] bg-background px-[18px] text-accent min-[1280px]:max-[1399px]:h-8 min-[1280px]:max-[1399px]:min-w-[50px] min-[1280px]:max-[1399px]:px-3">
            <span className="pt-[1px] text-[16px] font-semibold min-[1280px]:max-[1399px]:text-xs">
              {combinations.length}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 pr-2">
        <div
          className={cn(
            'grid grid-cols-12 gap-2 pt-2',
            isOriginalLayout ? 'pb-[44px]' : 'pb-6',
          )}
        >
          {combinations.map((bet) => (
            <BetEntryToggle
              key={bet.option.outcome}
              bet={bet}
              marketName={marketName}
              variant="racecombination"
              onToggle={() => {
                if (onBeforeToggle) onBeforeToggle()
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
