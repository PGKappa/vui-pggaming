import { Bet, UpcomingEvent, UpcomingRace } from '@/retail-lib/types'
import { useMemo, useState } from 'react'
import BetEntryToggle from './bet-entry-toggle'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

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
  const [selectedBets, setSelectedBets] = useState<string[]>([])

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
                    event: {
                      name: race.name,
                      number: race.id,
                      startingAt: race.time,
                    },
                    competitor: `${racer}-${racer2}-${racer3}`,
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
              event: {
                name: race.name,
                number: race.id,
                startingAt: race.time,
              },
              competitor: `${racer}-${racer2}`,
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
    race.id,
    race.name,
    race.time,
    sortByOdds,
  ])

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
              ? 'Nessuna combinazione disponibile con queste selezioni.'
              : 'Seleziona una o più posizioni per visualizzare le combinazioni.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  /* const handleBetToggle = (betId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedBets([...selectedBets, betId])
    } else {
      setSelectedBets(selectedBets.filter((id) => id !== betId))
    }
  }

  const handleSelectAll = () => {
    if (selectedBets.length === sortedCombinations.length) {
      setSelectedBets([])
    } else {
      setSelectedBets(sortedCombinations.map((bet) => bet.option.outcome))
    }
  } */

  return (
    <Card className="mt-4">
      <CardHeader className="flex items-center justify-center bg-accent px-4 py-2 text-white">
        <CardTitle className="justify-center text-lg text-white">
          {isTris ? 'TRIS IN ORDINE' : 'ACCOPPIATA IN ORDINE'}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="navbar"
            className="h-8 w-full border-green-500 px-3 text-xs text-white hover:bg-green-800"
            onClick={() => setSortByOdds(!sortByOdds)}
          >
            ↓ ORDINA PER QUOTE
          </Button>
          <Button
            variant="navbar"
            className="h-8 w-full border-green-500 px-3 text-xs text-white hover:bg-green-800"
            /* onClick={handleSelectAll} */
          >
            {selectedBets.length === combinations.length
              ? 'DESELEZIONA TUTTO'
              : 'SELEZIONA TUTTO'}
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
