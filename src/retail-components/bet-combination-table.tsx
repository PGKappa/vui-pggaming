import { Bet, UpcomingEvent, UpcomingRace } from '@/retail-lib/types'
import { useContext, useMemo, useState } from 'react'
import BetEntryToggle from './bet-entry-toggle'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { BetsContext } from '@/retail-contexts/bets-context'
import { useTranslation } from 'react-i18next'

type BetCombinationsTableProps = {
  race: UpcomingEvent
  isTris: boolean
  position1Selection: number[]
  position2Selection: number[]
  position3Selection: number[]
  disorderSelection: number[]
}

export default function BetCombinationsTable({
  race,
  isTris,
  position1Selection,
  position2Selection,
  position3Selection,
  disorderSelection,
}: BetCombinationsTableProps) {
  const { t } = useTranslation()
  const [sortMode, setSortMode] = useState<'default' | 'asc' | 'desc'>(
    'default',
  )
  const { addBets, betEntries, removeBets } = useContext(BetsContext)

  const combinations: Bet[] = useMemo(() => {
    const allCombinations: Bet[] = []
    const raceData = race.data as UpcomingRace

    // Determina modalità operativa
    const hasAnyOrder = disorderSelection.length > 0

    if (isTris) {
      if (hasAnyOrder) {
        // ANY ORDER: Solo BoxedTrifecta E solo se abbiamo almeno 3 corridori
        if (disorderSelection.length >= 3 && raceData.odds.boxedtrifecta) {
          const selectedRacers = disorderSelection.sort((a, b) => a - b)

          // Trova la prima combinazione disponibile per calcolare l'odds
          let boxOdds = 0
          let foundOdds = false

          for (let i = 0; i < selectedRacers.length && !foundOdds; i++) {
            for (let j = 0; j < selectedRacers.length && !foundOdds; j++) {
              for (let k = 0; k < selectedRacers.length && !foundOdds; k++) {
                if (i !== j && j !== k && i !== k) {
                  const odds =
                    raceData.odds.boxedtrifecta?.[selectedRacers[i]]?.[
                      selectedRacers[j]
                    ]?.[selectedRacers[k]]
                  if (odds) {
                    boxOdds = parseFloat(odds)
                    foundOdds = true
                  }
                }
              }
            }
          }

          if (foundOdds) {
            allCombinations.push({
              discipline: race.discipline,
              event: {
                name: race.name,
                number: race.id,
                startingAt: race.time,
              },
              competitors: `${selectedRacers.join('-')} any Order`,
              option: {
                outcome: `${selectedRacers.join('-')} any`,
                decPrice: boxOdds,
              },
            })
          }
        }
        // Se hasAnyOrder ma non abbastanza corridori, non mostrare nulla
      } else {
        // Trifecta (default o con selezioni posizioni)
        const pos1Options =
          position1Selection.length > 0
            ? position1Selection
            : Object.keys(raceData.odds.trifecta).map(Number)
        const pos2Options =
          position2Selection.length > 0 ? position2Selection : []
        const pos3Options =
          position3Selection.length > 0 ? position3Selection : []

        // Generate all valid trifecta combinations
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
                : Object.keys(
                    raceData.odds.trifecta[racer1]?.[racer2] || {},
                  ).map(Number)

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
                })
              }
            })
          })
        })
      }
    } else {
      if (hasAnyOrder) {
        // ANY ORDER: Solo Quinella E solo se abbiamo almeno 2 corridori
        if (disorderSelection.length >= 2 && raceData.odds.quinella) {
          const selectedRacers = disorderSelection.sort((a, b) => a - b)

          // Trova la prima combinazione quinella disponibile
          let quinellaOdds = 0
          let foundOdds = false

          for (let i = 0; i < selectedRacers.length && !foundOdds; i++) {
            for (let j = i + 1; j < selectedRacers.length && !foundOdds; j++) {
              const odds =
                raceData.odds.quinella?.[selectedRacers[i]]?.[
                  selectedRacers[j]
                ] ||
                raceData.odds.quinella?.[selectedRacers[j]]?.[selectedRacers[i]]
              if (odds) {
                quinellaOdds = parseFloat(odds)
                foundOdds = true
              }
            }
          }

          if (foundOdds) {
            allCombinations.push({
              discipline: race.discipline,
              event: {
                name: race.name,
                number: race.id,
                startingAt: race.time,
              },
              competitors: `${selectedRacers.join('-')} any Order`,
              option: {
                outcome: `${selectedRacers.join('-')} any`,
                decPrice: quinellaOdds,
              },
            })
          }
        }
        // Se hasAnyOrder ma non abbastanza corridori, non mostrare nulla
      } else {
        // Exacta (default o con selezioni posizioni)
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
              })
            }
          })
        })
      }
    }

    // Apply sorting based on sort mode
    if (sortMode === 'asc') {
      return allCombinations.sort(
        (a, b) => a.option.decPrice - b.option.decPrice,
      )
    } else if (sortMode === 'desc') {
      return allCombinations.sort(
        (a, b) => b.option.decPrice - a.option.decPrice,
      )
    }

    // Default order (no sorting)
    return allCombinations
  }, [
    isTris,
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
  ])

  const getTitle = () => {
    const hasAnyOrder = disorderSelection.length > 0

    if (isTris) {
      if (hasAnyOrder) {
        return `${t('trifecta').toUpperCase()} ${t('any_order').toUpperCase()}`
      } else {
        return `${t('trifecta').toUpperCase()} ${t('in_order').toUpperCase()}`
      }
    } else {
      if (hasAnyOrder) {
        return `${t('quinella').toUpperCase()}`
      } else {
        return `${t('exacta').toUpperCase()} ${t('in_order').toUpperCase()}`
      }
    }
  }

  const getMarketName = () => {
    const hasAnyOrder = disorderSelection.length > 0

    if (isTris) {
      return hasAnyOrder ? `${t('boxed_trifecta')}` : `${t('triplets')}`
    } else {
      return hasAnyOrder ? `${t('quinella')}` : `${t('couples')}`
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
                return
              }
              addBets(marketName, combinations)
            }}
          >
            {allBetsSelected
              ? `${t('deselect_all').toUpperCase()}`
              : `${t('select_all').toUpperCase()}`}
          </Button>
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
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
