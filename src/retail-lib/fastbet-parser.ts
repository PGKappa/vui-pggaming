import { Bet, Discipline, UpcomingEvent } from './types'

export type FastBetCode = {
  code: string
  selections?: number[]
}

export function parseFastBetInput(
  codeInput: string,
  selectionInput: string,
): FastBetCode | null {
  const code = codeInput.trim().toUpperCase()
  const selection = selectionInput.trim()

  // Codici FastBet che richiedono selezioni
  const racingCodesWithSelection = ['W', 'P', 'S', 'E', 'Q', 'T', 'BT']
  // Codici FastBet senza selezioni
  const racingCodesWithoutSelection = ['EV', 'OD', 'U', 'O']

  // Verifica se il codice è valido
  if (racingCodesWithSelection.includes(code)) {
    if (!selection) {
      return null
    }

    // Parse delle selezioni (numeri separati da virgola, spazio, o trattino)
    const selections = selection
      .split(/[,\s\-\/]+/)
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n) && n > 0)

    if (selections.length === 0) {
      return null
    }

    return { code, selections }
  } else if (racingCodesWithoutSelection.includes(code)) {
    return { code }
  } else {
    return null
  }
}

// Aggiungi funzione per fetch delle quote
async function fetchRaceData(
  event: UpcomingEvent,
  initCode: string,
): Promise<any> {
  if (!event) {
    throw new Error('Event is required')
  }

  try {
    const response = await fetch(
      `https://apisuprema.pgvirtual.eu/api/event/info/${event.extId}/${event.id}`,
      {
        headers: {
          accept: 'application/json',
          'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
          authorization: `Bearer ${initCode}`,
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

    return data
  } catch (error) {
    console.error('Error fetching race data:', error)
    throw error
  }
}

// Modifica la funzione per essere async
export async function createBetFromFastCode(
  fastCode: FastBetCode,
  currentEvent: UpcomingEvent,
  initCode: string,
): Promise<Bet[] | null> {
  if (!currentEvent) {
    return null
  }

  // Fetch delle quote dall'API
  const raceData = await fetchRaceData(currentEvent, initCode)

  if (!raceData) {
    return null
  }

  const odds = raceData.odds || raceData.current?.odds || null
  if (!odds) {
    return null
  }

  const trackName =
    raceData.track?.name || `Track ${raceData.current?.channel || '6'}`

  const bets: Bet[] = []

  if (
    currentEvent.discipline === Discipline.HORSES ||
    currentEvent.discipline === Discipline.DOGS
  ) {
    switch (fastCode.code) {
      case 'W': // Winner
        if (fastCode.selections && odds.winner) {
          fastCode.selections.forEach((selection) => {
            const oddsValue = odds.winner[selection.toString()]
            if (oddsValue) {
              const bet = {
                discipline: currentEvent.discipline,
                event: {
                  name: currentEvent.name,
                  number: currentEvent.id,
                  startingAt: currentEvent.time,
                },
                competitors: `${selection}`,
                option: {
                  outcome: `${selection}`,
                  decPrice: parseFloat(oddsValue),
                },
                track: trackName,
              }
              bets.push(bet)
            }
          })
        }
        break

      case 'P': // Place
        if (fastCode.selections && odds.placed) {
          fastCode.selections.forEach((selection) => {
            const oddsValue = odds.placed[selection.toString()]
            if (oddsValue) {
              const bet = {
                discipline: currentEvent.discipline,
                event: {
                  name: currentEvent.name,
                  number: currentEvent.id,
                  startingAt: currentEvent.time,
                },
                competitors: `${selection}`,
                option: {
                  outcome: `${selection}`,
                  decPrice: parseFloat(oddsValue),
                },
                track: trackName,
              }
              bets.push(bet)
            }
          })
        }
        break

      case 'S': // Show
        if (fastCode.selections && odds.show) {
          fastCode.selections.forEach((selection) => {
            const oddsValue = odds.show[selection.toString()]
            if (oddsValue) {
              const bet = {
                discipline: currentEvent.discipline,
                event: {
                  name: currentEvent.name,
                  number: currentEvent.id,
                  startingAt: currentEvent.time,
                },
                competitors: `${selection}`,
                option: {
                  outcome: `${selection}`,
                  decPrice: parseFloat(oddsValue),
                },
                track: trackName,
              }
              bets.push(bet)
            }
          })
        }
        break

      case 'E': // Exacta
        if (
          fastCode.selections &&
          fastCode.selections.length >= 2 &&
          odds.exacta
        ) {
          const [first, second] = fastCode.selections
          const oddsValue = odds.exacta[first.toString()]?.[second.toString()]
          if (oddsValue) {
            const bet = {
              discipline: currentEvent.discipline,
              event: {
                name: currentEvent.name,
                number: currentEvent.id,
                startingAt: currentEvent.time,
              },
              competitors: `${first}-${second}`,
              option: {
                outcome: `${first}-${second}`,
                decPrice: parseFloat(oddsValue),
              },
              track: trackName,
            }
            bets.push(bet)
          }
        }
        break

      case 'Q': // Quinella
        if (
          fastCode.selections &&
          fastCode.selections.length >= 2 &&
          odds.quinella
        ) {
          const [first, second] = fastCode.selections.sort((a, b) => a - b) // Ordina per quinella
          const oddsValue = odds.quinella[first.toString()]?.[second.toString()]
          if (oddsValue) {
            const bet = {
              discipline: currentEvent.discipline,
              event: {
                name: currentEvent.name,
                number: currentEvent.id,
                startingAt: currentEvent.time,
              },
              competitors: `${first}-${second} any Order`,
              option: {
                outcome: `${first}-${second} any`,
                decPrice: parseFloat(oddsValue),
              },
              track: trackName,
            }
            bets.push(bet)
          }
        }
        break

      case 'T': // Trifecta
        if (
          fastCode.selections &&
          fastCode.selections.length >= 3 &&
          odds.trifecta
        ) {
          const [first, second, third] = fastCode.selections
          const oddsValue =
            odds.trifecta[first.toString()]?.[second.toString()]?.[
              third.toString()
            ]
          if (oddsValue) {
            const bet = {
              discipline: currentEvent.discipline,
              event: {
                name: currentEvent.name,
                number: currentEvent.id,
                startingAt: currentEvent.time,
              },
              competitors: `${first}-${second}-${third}`,
              option: {
                outcome: `${first}-${second}-${third}`,
                decPrice: parseFloat(oddsValue),
              },
              track: trackName,
            }
            bets.push(bet)
          }
        }
        break

      case 'BT': // Boxed Trifecta
        if (
          fastCode.selections &&
          fastCode.selections.length >= 3 &&
          odds.boxedtrifecta
        ) {
          const [first, second, third] = fastCode.selections
          const oddsValue =
            odds.boxedtrifecta[first.toString()]?.[second.toString()]?.[
              third.toString()
            ]
          if (oddsValue) {
            const sortedRacers = [first, second, third].sort((a, b) => a - b)
            const bet = {
              discipline: currentEvent.discipline,
              event: {
                name: currentEvent.name,
                number: currentEvent.id,
                startingAt: currentEvent.time,
              },
              competitors: `${sortedRacers.join('-')} any Order`,
              option: {
                outcome: `${sortedRacers.join('-')} any`,
                decPrice: parseFloat(oddsValue),
              },
              track: trackName,
            }
            bets.push(bet)
          }
        }
        break

      case 'EV': // Even
        if (odds.evenodd?.even) {
          const bet = {
            discipline: currentEvent.discipline,
            event: {
              name: currentEvent.name,
              number: currentEvent.id,
              startingAt: currentEvent.time,
            },
            competitors: 'Even',
            option: {
              outcome: 'Even',
              decPrice: parseFloat(odds.evenodd.even),
            },
            track: trackName,
          }
          bets.push(bet)
        }
        break

      case 'OD': // Dispari (Odd)
        if (odds.evenodd?.odd) {
          const bet = {
            discipline: currentEvent.discipline,
            event: {
              name: currentEvent.name,
              number: currentEvent.id,
              startingAt: currentEvent.time,
            },
            competitors: 'Odd',
            option: {
              outcome: 'Odd',
              decPrice: parseFloat(odds.evenodd.odd),
            },
            track: trackName,
          }
          bets.push(bet)
        }
        break

      case 'U': // Under
        if (odds.underover?.under) {
          const bet = {
            discipline: currentEvent.discipline,
            event: {
              name: currentEvent.name,
              number: currentEvent.id,
              startingAt: currentEvent.time,
            },
            competitors: 'Under',
            option: {
              outcome: 'Under',
              decPrice: parseFloat(odds.underover.under),
            },
            track: trackName,
          }
          bets.push(bet)
        }
        break

      case 'O': // Over
        if (odds.underover?.over) {
          const bet = {
            discipline: currentEvent.discipline,
            event: {
              name: currentEvent.name,
              number: currentEvent.id,
              startingAt: currentEvent.time,
            },
            competitors: 'Over',
            option: {
              outcome: 'Over',
              decPrice: parseFloat(odds.underover.over),
            },
            track: trackName,
          }
          bets.push(bet)
        }
        break

      default:
        console.log('Unknown code:', fastCode.code)
    }
  }

  return bets.length > 0 ? bets : null
}
