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
    G: 'W', // Ganador
    '2C': 'P', // Colocado 2°
    '3C': 'S', // Colocado 3°
    PA: 'EV', // Par
    IM: 'OD', // Impar
    ME: 'U', // Menos 3.5
    MA: 'O', // Más 3.5
    E: 'E', // Exacta
    Q: 'Q', // Quinella
    T: 'T', // Trifecta
    CT: 'BT', // Combinada Trifecta
  }

  // Mappatura Italiano -> Inglese
  const italianToEnglish: Record<string, string> = {
    V: 'W', // Vincente
    '2P': 'P', // Piazzato 1° 2°
    '3P': 'S', // Podio 1° 2° 3°
    AO: 'E', // Accoppiata in Ordine
    AG: 'Q', // Accoppiata a Girare
    TO: 'T', // Trio in Ordine
    TG: 'BT', // Trio a Girare
    P: 'EV', // Pari
    D: 'OD', // Dispari
    U: 'U', // Under 3.5
    O: 'O', // Over 3.5
  }

  // Se la lingua è spagnola, normalizza
  if (language === 'es') {
    return spanishToEnglish[upperCode] || upperCode
  }

  // Se la lingua è italiana, normalizza
  if (language === 'it') {
    return italianToEnglish[upperCode] || upperCode
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

  if (language === 'it') {
    const englishToItalian: Record<string, string> = {
      W: 'V',
      P: '2P',
      S: '3P',
      E: 'AO',
      Q: 'AG',
      T: 'TO',
      BT: 'TG',
      EV: 'P',
      OD: 'D',
      U: 'U',
      O: 'O',
    }
    return englishToItalian[upperCode] || upperCode
  }

  return upperCode
}

// Traduce i valori dei mercati (Even, Odd, Over, Under) nella lingua specificata
export function getLocalizedMarketValue(
  value: string,
  language: string = 'en',
): string {
  const upperValue = value.toUpperCase()

  if (language === 'es') {
    const translations: Record<string, string> = {
      EVEN: 'Par',
      ODD: 'Impar',
      UNDER: 'Menos',
      OVER: 'Más',
    }
    return translations[upperValue] || value
  }

  if (language === 'it') {
    const translations: Record<string, string> = {
      EVEN: 'Pari',
      ODD: 'Dispari',
      UNDER: 'Under',
      OVER: 'Over',
    }
    return translations[upperValue] || value
  }

  return value
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
  language: string = 'en',
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
            // Usa i nomi dei competitor per il confronto con la tabella
            const firstName = getCompetitorName(first)
            const secondName = getCompetitorName(second)
            const bet = {
              discipline: currentEvent.discipline,
              event: {
                name: currentEvent.name,
                number: currentEvent.id,
                startingAt: currentEvent.time,
              },
              competitors: `${firstName}-${secondName}`,
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
            // Usa i nomi dei competitor per il confronto con la tabella
            const firstName = getCompetitorName(first)
            const secondName = getCompetitorName(second)
            const bet = {
              discipline: currentEvent.discipline,
              event: {
                name: currentEvent.name,
                number: currentEvent.id,
                startingAt: currentEvent.time,
              },
              competitors: `${firstName}-${secondName}`,
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
            // Usa i nomi dei competitor per il confronto con la tabella
            const firstName = getCompetitorName(first)
            const secondName = getCompetitorName(second)
            const thirdName = getCompetitorName(third)
            const bet = {
              discipline: currentEvent.discipline,
              event: {
                name: currentEvent.name,
                number: currentEvent.id,
                startingAt: currentEvent.time,
              },
              competitors: `${firstName}-${secondName}-${thirdName}`,
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
            // Usa i nomi dei competitor per il confronto con la tabella
            const firstName = getCompetitorName(sortedRacers[0])
            const secondName = getCompetitorName(sortedRacers[1])
            const thirdName = getCompetitorName(sortedRacers[2])
            const bet = {
              discipline: currentEvent.discipline,
              event: {
                name: currentEvent.name,
                number: currentEvent.id,
                startingAt: currentEvent.time,
              },
              competitors: `${firstName}-${secondName}-${thirdName}`,
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
          const localizedEven = getLocalizedMarketValue('Even', language)
          const bet = {
            discipline: currentEvent.discipline,
            event: {
              name: currentEvent.name,
              number: currentEvent.id,
              startingAt: currentEvent.time,
            },
            competitors: localizedEven,
            option: {
              outcome: localizedEven,
              decPrice: parseFloat(odds.evenodd.even),
            },
            track: trackName,
          }
          bets.push(bet)
        }
        break

      case 'OD': // Dispari (Odd)
        if (odds.evenodd?.odd) {
          const localizedOdd = getLocalizedMarketValue('Odd', language)
          const bet = {
            discipline: currentEvent.discipline,
            event: {
              name: currentEvent.name,
              number: currentEvent.id,
              startingAt: currentEvent.time,
            },
            competitors: localizedOdd,
            option: {
              outcome: localizedOdd,
              decPrice: parseFloat(odds.evenodd.odd),
            },
            track: trackName,
          }
          bets.push(bet)
        }
        break

      case 'U': // Under
        if (odds.underover?.under) {
          const localizedUnder = getLocalizedMarketValue('Under', language)
          const bet = {
            discipline: currentEvent.discipline,
            event: {
              name: currentEvent.name,
              number: currentEvent.id,
              startingAt: currentEvent.time,
            },
            competitors: localizedUnder,
            option: {
              outcome: localizedUnder,
              decPrice: parseFloat(odds.underover.under),
            },
            track: trackName,
          }
          bets.push(bet)
        }
        break

      case 'O': // Over
        if (odds.underover?.over) {
          const localizedOver = getLocalizedMarketValue('Over', language)
          const bet = {
            discipline: currentEvent.discipline,
            event: {
              name: currentEvent.name,
              number: currentEvent.id,
              startingAt: currentEvent.time,
            },
            competitors: localizedOver,
            option: {
              outcome: localizedOver,
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
