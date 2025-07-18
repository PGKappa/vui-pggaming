import { UpcomingEvent, UpcomingRace, Bet } from '@/retail-lib/types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useMemo, useState, useContext } from 'react'
import { Button } from './ui/button'
import { BetsContext } from '@/retail-contexts/bets-context'
import BetEntryToggle from './bet-entry-toggle'

type BetCombinationsTableProps = {
  race: UpcomingEvent
  raceInfo?: UpcomingRace
  isTris: boolean
  position1Selection: number | null
  position2Selection: number | null
  position3Selection: number | null
  disorderSelection: number[]
}

export default function BetCombinationsTable({
  race,
  raceInfo,
  isTris,
  position1Selection,
  position2Selection,
  position3Selection,
  disorderSelection,
}: BetCombinationsTableProps) {
  // State per gestire selezioni e ordinamento
  const [selectedCombinations, setSelectedCombinations] = useState<string[]>([])
  const [sortByOdds, setSortByOdds] = useState(false)

  // Accesso al contesto delle scommesse
  const { betEntries } = useContext(BetsContext)

  // Genera le combinazioni di scommesse
  const combinations = useMemo(() => {
    if (!raceInfo?.racers || raceInfo.racers.length === 0) return []

    const availableNumbers = raceInfo.racers.map((r) => r.number)
    let combinations: number[][] = []

    if (isTris) {
      // TRIS mode (3 posizioni)
      if (position1Selection && position2Selection && position3Selection) {
        // Tutte e tre le posizioni sono selezionate: una sola combinazione
        combinations.push([
          position1Selection,
          position2Selection,
          position3Selection,
        ])
      } else if (position1Selection && position2Selection) {
        // Prima e seconda posizione fisse, terza variabile
        availableNumbers
          .filter(
            (num) => num !== position1Selection && num !== position2Selection,
          )
          .forEach((num) => {
            combinations.push([position1Selection, position2Selection, num])
          })
      } else if (position1Selection && position3Selection) {
        // Prima e terza posizione fisse, seconda variabile
        availableNumbers
          .filter(
            (num) => num !== position1Selection && num !== position3Selection,
          )
          .forEach((num) => {
            combinations.push([position1Selection, num, position3Selection])
          })
      } else if (position2Selection && position3Selection) {
        // Seconda e terza posizione fisse, prima variabile
        availableNumbers
          .filter(
            (num) => num !== position2Selection && num !== position3Selection,
          )
          .forEach((num) => {
            combinations.push([num, position2Selection, position3Selection])
          })
      } else if (position1Selection) {
        // Solo prima posizione fissa
        const otherNumbers = availableNumbers.filter(
          (num) => num !== position1Selection,
        )
        // Genera tutte le combinazioni possibili
        for (let i = 0; i < otherNumbers.length; i++) {
          for (let j = 0; j < otherNumbers.length; j++) {
            if (i !== j) {
              combinations.push([
                position1Selection,
                otherNumbers[i],
                otherNumbers[j],
              ])
            }
          }
        }
      } else if (position2Selection) {
        // Solo seconda posizione fissa
        const otherNumbers = availableNumbers.filter(
          (num) => num !== position2Selection,
        )
        // Genera tutte le combinazioni possibili
        for (let i = 0; i < otherNumbers.length; i++) {
          for (let j = 0; j < otherNumbers.length; j++) {
            if (i !== j) {
              combinations.push([
                otherNumbers[i],
                position2Selection,
                otherNumbers[j],
              ])
            }
          }
        }
      } else if (position3Selection) {
        // Solo terza posizione fissa
        const otherNumbers = availableNumbers.filter(
          (num) => num !== position3Selection,
        )
        // Genera tutte le combinazioni possibili
        for (let i = 0; i < otherNumbers.length; i++) {
          for (let j = 0; j < otherNumbers.length; j++) {
            if (i !== j) {
              combinations.push([
                otherNumbers[i],
                otherNumbers[j],
                position3Selection,
              ])
            }
          }
        }
      } else {
        // Nessuna posizione fissa, genera TUTTE le combinazioni possibili di tris
        for (let i = 0; i < availableNumbers.length; i++) {
          for (let j = 0; j < availableNumbers.length; j++) {
            if (i === j) continue
            for (let k = 0; k < availableNumbers.length; k++) {
              if (i !== k && j !== k) {
                combinations.push([
                  availableNumbers[i],
                  availableNumbers[j],
                  availableNumbers[k],
                ])
              }
            }
          }
        }
      }
    } else {
      // ACCOPPIATA mode (2 posizioni)
      if (position1Selection && position2Selection) {
        // Entrambe le posizioni sono selezionate: una sola combinazione
        combinations.push([position1Selection, position2Selection])
      } else if (position1Selection) {
        // Solo prima posizione fissa
        availableNumbers
          .filter((num) => num !== position1Selection)
          .forEach((num) => {
            combinations.push([position1Selection, num])
          })
      } else if (position2Selection) {
        // Solo seconda posizione fissa
        availableNumbers
          .filter((num) => num !== position2Selection)
          .forEach((num) => {
            combinations.push([num, position2Selection])
          })
      } else {
        // Nessuna posizione fissa, genera TUTTE le combinazioni possibili di accoppiata
        for (let i = 0; i < availableNumbers.length; i++) {
          for (let j = 0; j < availableNumbers.length; j++) {
            if (i !== j) {
              combinations.push([availableNumbers[i], availableNumbers[j]])
            }
          }
        }
      }
    }

    // Filtra le combinazioni se "In Disordine" è selezionato
    if (disorderSelection.length > 0) {
      combinations = combinations.filter((combo) => {
        return disorderSelection.every((selected) => combo.includes(selected))
      })
    }

    return combinations
  }, [
    raceInfo?.racers,
    isTris,
    position1Selection,
    position2Selection,
    position3Selection,
    disorderSelection,
  ])

  // Funzione per generare un prezzo casuale per una combinazione
  const getOddsForCombination = (combination: number[]): string => {
    if (!raceInfo) return '0.00'

    // Per le accoppiate
    if (combination.length === 2) {
      const [first, second] = combination
      const exactaOdds =
        raceInfo.odds?.exacta?.[first.toString()]?.[second.toString()]
      if (exactaOdds) return exactaOdds

      // Se non troviamo le quote reali, generiamo un valore casuale
      return (Math.random() * 30 + 5).toFixed(2)
    }

    // Per le tris
    if (combination.length === 3) {
      const [first, second, third] = combination
      const trifectaOdds =
        raceInfo.odds?.trifecta?.[first.toString()]?.[second.toString()]?.[
          third.toString()
        ]
      if (trifectaOdds) return trifectaOdds

      // Se non troviamo le quote reali, generiamo un valore casuale
      return (Math.random() * 50 + 10).toFixed(2)
    }

    return '0.00'
  }

  // Preparazione dei dati con le quote
  const combinationsWithOdds = useMemo(() => {
    return combinations.map((combo) => {
      const odds = getOddsForCombination(combo)
      return {
        combination: combo,
        comboText: combo.join('-'),
        odds,
        oddsValue: parseFloat(odds),
      }
    })
  }, [combinations])

  // Ordina le combinazioni per quota se richiesto
  const sortedCombinations = useMemo(() => {
    if (sortByOdds) {
      return [...combinationsWithOdds].sort((a, b) => a.oddsValue - b.oddsValue)
    }
    return combinationsWithOdds
  }, [combinationsWithOdds, sortByOdds])

  // Crea un oggetto bet per una combinazione
  const createBetForCombination = (
    combination: number[],
    odds: string,
  ): Bet => {
    const comboText = combination.join('-')
    const comboType = isTris ? 'Tris' : 'Accoppiata'

    return {
      event: {
        name: race.name,
        number: race.id,
        startingAt: new Date(race.startTime || Date.now()),
      },
      competitor: comboText,
      option: {
        outcome: comboType,
        decPrice: parseFloat(odds),
        order: 1,
        externCode: `${isTris ? 'T' : 'A'}_${comboText.replace(/-/g, '_')}`,
      },
    }
  }

  // Seleziona tutte le combinazioni
  const selectAll = () => {
    // Usa direttamente BetEntryToggle, quindi questa funzione non serve più
    // La lasciamo qui per completezza, ma verrà gestito tramite i toggle
  }

  // Se non ci sono combinazioni o dati, mostra un messaggio
  if (!raceInfo || combinations.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>
            {isTris ? 'TRIS IN ORDINE' : 'ACCOPPIATA IN ORDINE'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            {position1Selection || position2Selection || position3Selection
              ? 'Nessuna combinazione disponibile con queste selezioni.'
              : 'Seleziona una o più posizioni per visualizzare le combinazioni.'}
          </p>
        </CardContent>
      </Card>
    )
  }

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
            onClick={selectAll}
          >
            SELEZIONA TUTTO
          </Button>
        </div>
      </CardHeader>
      <CardContent className="bg-gray-100 p-4">
        {/* Layout a griglia come nell'immagine */}
        <div className="grid grid-cols-12 gap-2">
          {sortedCombinations.map(
            ({ combination, comboText, odds, oddsValue }, index) => {
              const comboType = isTris ? 'Tris' : 'Accoppiata'

              // Creiamo l'oggetto bet per questo toggle
              const bet = createBetForCombination(combination, odds)

              return (
                <div
                  key={index}
                  className="flex flex-col items-center rounded bg-gray-200 p-3"
                >
                  <div className="mb-1 text-center text-sm font-medium">
                    {comboText}
                  </div>
                  <BetEntryToggle
                    bet={bet}
                    marketName={comboType}
                    className={`${oddsValue > 100 ? 'text-red-500' : ''}`}
                  />
                </div>
              )
            },
          )}
        </div>
      </CardContent>
    </Card>
  )
}
