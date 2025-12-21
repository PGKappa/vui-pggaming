import { Bet, Discipline, UpcomingEvent } from './types'
import { createPGVirtualAPICall } from './utils'

export type FastBetCode = {
  code: string
  selections?: number[]
}

// Mappatura codici FastBet per lingua
export function normalizeMarketCode(
  code: string,
  language: string = 'en',
): string {
  const upperCode = code.toUpperCase()

  // Mappatura Spagnolo -> Inglese
  const spanishToEnglish: Record<string, string> = {
    G: 'W', // Ganador -> Winner
    '2C': 'P', // Colocado 2°
    '3C': 'S', // Colocado 3°
    PA: 'EV', // Par -> Even
    IM: 'OD', // Impar -> Odd
    ME: 'U', // Menos 3.5
    MA: 'O', // Más 3.5
    E: 'E', // Exacta
    Q: 'Q', // Quinella
    T: 'T', // Trifecta
    CT: 'BT', // Combinada Trifecta
  }

  // Se la lingua è spagnola, normalizza
  if (language === 'es') {
    return spanishToEnglish[upperCode] || upperCode
  }

  // Altrimenti ritorna il codice originale
  return upperCode
}

// Mappatura inversa: Inglese -> Lingua specifica (per display)
export function getLocalizedMarketCode(
  code: string,
  language: string = 'en',
): string {
  const upperCode = code.toUpperCase()

  if (language === 'es') {
    const englishToSpanish: Record<string, string> = {
      W: 'G',
      P: '2C',
      S: '3C',
      EV: 'PA',
      OD: 'IM',
      U: 'ME',
      O: 'MA',
      E: 'E',
      Q: 'Q',
      T: 'T',
      BT: 'CT',
    }
    return englishToSpanish[upperCode] || upperCode
  }

  return upperCode
}

export function parseFastBetInput(
  codeInput: string,
  selectionInput: string,
  language: string = 'en',
): FastBetCode | null {
  const inputCode = codeInput.trim().toUpperCase()
  // Normalizza il codice alla versione inglese
  const code = normalizeMarketCode(inputCode, language)
  const selection = selectionInput.trim()

  // Codici FastBet che richiedono selezioni (sempre in inglese internamente)
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
  operator?: string,
): Promise<any> {
  if (!event) {
    throw new Error('Event is required')
  }

  try {
    const response = await createPGVirtualAPICall(
      `/api/event/info/${event.extId}/${event.id}`,
      initCode,
      undefined,
      operator,
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
  getTrackName?: (channel?: number) => string,
  operator?: string,
): Promise<Bet[] | null> {
  if (!currentEvent) {
    return null
  }

  // Fetch delle quote dall'API
  const raceData = await fetchRaceData(currentEvent, initCode, operator)

  if (!raceData) {
    return null
  }

  const odds = raceData.odds || raceData.current?.odds || null
  if (!odds) {
    return null
  }

  // Usa getTrackName se disponibile, altrimenti usa il nome dall'API o fallback
  const channel = raceData.current?.channel
  const trackName = getTrackName
    ? getTrackName(channel)
    : raceData.track?.name || `Track ${channel || '6'}`

  // Helper per ottenere il nome del competitor dal numero
  const getCompetitorName = (number: number): string => {
    // Prova diversi percorsi nell'oggetto API
    const competitors =
      raceData.racers ||
      raceData.current?.competitors ||
      raceData.current?.racers ||
      []
    const competitor = competitors.find((c: any) => c.number === number)
    return competitor?.name || ''
  }

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
              const competitorName = getCompetitorName(selection)
              const bet = {
                discipline: currentEvent.discipline,
                event: {
                  name: currentEvent.name,
                  number: currentEvent.id,
                  startingAt: currentEvent.time,
                },
                competitors: competitorName,
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
              const competitorName = getCompetitorName(selection)
              const bet = {
                discipline: currentEvent.discipline,
                event: {
                  name: currentEvent.name,
                  number: currentEvent.id,
                  startingAt: currentEvent.time,
                },
                competitors: competitorName,
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
              const competitorName = getCompetitorName(selection)
              const bet = {
                discipline: currentEvent.discipline,
                event: {
                  name: currentEvent.name,
                  number: currentEvent.id,
                  startingAt: currentEvent.time,
                },
                competitors: competitorName,
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
              competitors: `${sortedRacers.join('-')}`,
              option: {
                outcome: `${sortedRacers.join('-')}`,
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
