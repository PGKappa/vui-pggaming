import { Bet, UpcomingEvent, UpcomingRace } from '@/retail-lib/types'
import { useContext, useMemo, useState } from 'react'
import BetEntryToggle from './bet-entry-toggle'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { BetsContext } from '@/retail-contexts/bets-context'
import { t } from 'i18next'

type BetCombinationsTableProps = {
  race: UpcomingEvent
  isTris: boolean
  position1Selection: number | null
  position2Selection: number | null
  position3Selection: number | null
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
  const [sortByOdds, setSortByOdds] = useState(false)
  const { addBets, betEntries, removeBets } = useContext(BetsContext)

  const combinations: Bet[] = useMemo(() => {
    const allCombinations: Bet[] = []
    const raceData = race.data as UpcomingRace

    // Determina modalità operativa
    const hasAnyOrder = disorderSelection.length > 0
    const hasPositions =
      position1Selection || position2Selection || position3Selection

    if (isTris) {
      if (hasAnyOrder && disorderSelection.length >= 3) {
        // ANY ORDER: Solo una singola scommessa BoxedTrifecta
        if (raceData.odds.boxedtrifecta) {
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
      } else {
        // Tutte le trifecta
        Object.entries(raceData.odds.trifecta)
          .filter(
            ([racer]) =>
              !hasPositions ||
              position1Selection === null ||
              parseInt(racer) === position1Selection,
          )
          .forEach(([racer, racerCombs]) => {
            Object.entries(racerCombs)
              .filter(
                ([racer2]) =>
                  !hasPositions ||
                  position2Selection === null ||
                  parseInt(racer2) === position2Selection,
              )
              .forEach(([racer2, racer3Combs]) => {
                Object.entries(racer3Combs)
                  .filter(
                    ([racer3]) =>
                      !hasPositions ||
                      position3Selection === null ||
                      parseInt(racer3) === position3Selection,
                  )
                  .forEach(([racer3, odds]) => {
                    allCombinations.push({
                      discipline: race.discipline,
                      event: {
                        name: race.name,
                        number: race.id,
                        startingAt: race.time,
                      },
                      competitors: `${racer}-${racer2}-${racer3}`,
                      option: {
                        outcome: `${racer}-${racer2}-${racer3}`,
                        decPrice: parseFloat(odds),
                      },
                    })
                  })
              })
          })
      }
    } else {
      if (hasAnyOrder && disorderSelection.length >= 2) {
        // Quinella
        if (raceData.odds.quinella) {
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
      } else {
        // Tutte le exacta
        Object.entries(raceData.odds.exacta)
          .filter(
            ([racer]) =>
              !hasPositions ||
              position1Selection === null ||
              parseInt(racer) === position1Selection,
          )
          .forEach(([racer, racerCombs]) => {
            Object.entries(racerCombs)
              .filter(
                ([racer2]) =>
                  !hasPositions ||
                  position2Selection === null ||
                  parseInt(racer2) === position2Selection,
              )
              .forEach(([racer2, odds]) => {
                allCombinations.push({
                  discipline: race.discipline,
                  event: {
                    name: race.name,
                    number: race.id,
                    startingAt: race.time,
                  },
                  competitors: `${racer}-${racer2}`,
                  option: {
                    outcome: `${racer}-${racer2}`,
                    decPrice: parseFloat(odds),
                  },
                })
              })
          })
      }
    }

    if (sortByOdds) {
      return allCombinations.sort(
        (a, b) => a.option.decPrice - b.option.decPrice,
      )
    }
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
    sortByOdds,
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
        return `${t('perfecta').toUpperCase()} ${t('in_order').toUpperCase()}`
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
    (position1Selection ||
      position2Selection ||
      position3Selection ||
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
          <p className="text-center text-[19px] text-muted-foreground">
            {t('no_combinations_available')}
          </p>
        </CardContent>
      </Card>
    )
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
            className="h-8 w-full border-green-500 px-3 text-[14px] font-bold text-white hover:bg-green-800"
            onClick={() => setSortByOdds(!sortByOdds)}
          >
            {t('sort_by_odds').toUpperCase()}
          </Button>
          <Button
            variant="navbar"
            className="h-8 w-full border-green-500 px-3 text-[14px] font-bold text-white hover:bg-green-800"
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
