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
  position3Selection /* 
  disorderSelection, */,
}: BetCombinationsTableProps) {
  const [sortByOdds, setSortByOdds] = useState(false)
  const { addBets, betEntries, removeBets } = useContext(BetsContext)

  const combinations: Bet[] = useMemo(() => {
    const allCombinations: Bet[] = []
    const raceData = race.data as UpcomingRace

    if (isTris) {
      Object.entries(raceData.odds.trifecta)
        .filter(
          ([racer]) =>
            position1Selection === null ||
            parseInt(racer) === position1Selection,
        )
        .forEach(([racer, racerCombs]) => {
          Object.entries(racerCombs)
            .filter(
              ([racer2]) =>
                position2Selection === null ||
                parseInt(racer2) === position2Selection,
            )
            .forEach(([racer2, racer3Combs]) => {
              Object.entries(racer3Combs)
                .filter(
                  ([racer3]) =>
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
      if (sortByOdds) {
        return allCombinations.sort(
          (a, b) => a.option.decPrice - b.option.decPrice,
        )
      }
      return allCombinations
    }

    Object.entries(raceData.odds.exacta)
      .filter(
        ([racer]) =>
          position1Selection === null || parseInt(racer) === position1Selection,
      )
      .forEach(([racer, racerCombs]) => {
        Object.entries(racerCombs)
          .filter(
            ([racer2]) =>
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
    race.data,
    race.discipline,
    race.id,
    race.name,
    race.time,
    sortByOdds,
  ])

  const allBetsSelected = useMemo(
    () =>
      combinations.every(
        (bet) =>
          !!betEntries.find(
            (entry) =>
              entry.market === (isTris ? 'tris' : 'accoppiata') &&
              entry.bet.event.number === bet.event.number &&
              entry.bet.competitors === bet.competitors &&
              entry.bet.option.outcome === bet.option.outcome,
          ),
      ),
    [combinations, betEntries, isTris],
  )

  if (combinations.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>
            {isTris ? 'TRIS IN ORDINE' : 'ACCOPPIATA IN ORDINE'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-[19px] text-muted-foreground">
            {position1Selection || position2Selection || position3Selection
              ? `${t('no_combinations')}`
              : `${t('select_positions')}`}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex h-14 items-center justify-center bg-accent px-4 text-accent-foreground">
        <CardTitle className="justify-center text-lg text-white">
          {isTris
            ? `${t('trifecta').toUpperCase()} ${t('in_order').toUpperCase()}`
            : `${t('perfecta').toUpperCase()} ${t('in_order').toUpperCase()}`}
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
                  isTris ? 'tris' : 'accoppiata',
                  combinations.map((bet) => ({
                    option: bet.option,
                    competitors: bet.competitors,
                  })),
                )
                return
              }
              addBets(isTris ? 'tris' : 'accoppiata', combinations)
            }}
          >
            {allBetsSelected
              ? `${t('deselect_all').toUpperCase()}`
              : `${t('select_all').toUpperCase()}`}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {/* Layout a griglia come nell'immagine */}
        <div className="grid grid-cols-12 gap-2">
          {combinations.map((bet) => (
            <BetEntryToggle
              key={bet.option.outcome}
              bet={bet}
              marketName={isTris ? 'tris' : 'accoppiata'}
              variant="racecombination"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
