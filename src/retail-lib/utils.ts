import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalizes competitors/outcome for under/over markets to match toggles and fastBet
export function normalizeUnderOverValue(value: string): string {
  const v = value.toLowerCase().trim()
  // Map all variations of "under" to canonical form
  if (v === 'under' || v === 'un' || v === 'menos' || v === 'me' || v === 'm') {
    return 'under'
  }
  // Map all variations of "over" to canonical form
  if (v === 'over' || v === 'ov' || v === 'más' || v === 'ma' || v === 'o') {
    return 'over'
  }
  return v
}

export function normalizeMarketName(market: string): string {
  const m = market.toLowerCase().trim()

  // ── Racing markets ───────────────────────────────────────────────────────
  if (
    m.includes('winn') ||
    m.includes('vinc') ||
    m.includes('ganador') ||
    m.includes('gagnant')
  )
    return 'winner'

  if (m.includes('exacta') || m.includes('accoppiata in ordine'))
    return 'exacta'
  if (
    m.includes('quinella') ||
    m.includes('accoppiata a girare') ||
    (m.includes('accoppiata') && m.includes('piazz'))
  )
    return 'quinella'
  if (
    (m.includes('trifecta') || m.includes('trio in ordine')) &&
    !m.includes('box') &&
    !m.includes('a girare') &&
    !m.includes('combinada')
  )
    return 'trifecta'
  if (m.includes('box') || m.includes('a girare') || m.includes('combinada'))
    return 'boxed_trifecta'
  if (
    m.includes('show') ||
    m.includes('podi') ||
    m.includes('placé 1-3') ||
    (m.includes('colocado') && m.includes('3'))
  )
    return 'show'
  if (
    m.includes('place') ||
    m.includes('placé') ||
    m.includes('piazz') ||
    m.includes('colocado')
  )
    return 'placed'
  if (
    m.includes('even') ||
    m.includes('odd') ||
    m.includes('pari') ||
    m.includes('dispari') ||
    m.includes('par') ||
    m.includes('impar') ||
    m.includes('pair')
  )
    return 'even_odd'

  // ── Soccer markets ────────────────────────────────────────────────────────
  // Combo checks MUST come before under/over (combo market names contain "under/over")

  // Combo 1x2 + Goal/No Goal
  if (m.includes('combo') && (m.includes('goal/no goal') || m.includes('segna') || m.includes('gol/no gol')))
    return 'market_combo_vincente_segna'

  // Combo 1x2 + Under/Over 1.5
  if (m.includes('combo') && (m.includes('1.5') || m.includes('1,5')))
    return 'market_combo_vincente_goals_1_5'

  // Combo 1x2 + Under/Over 2.5
  if (m.includes('combo') && (m.includes('2.5') || m.includes('2,5')))
    return 'market_combo_vincente_goals_2_5'

  // Under/Over — preserve numeric value so 1.5/2.5/3.5/4.5 are distinct
  if (
    m.includes('under') ||
    m.includes('over') ||
    m.includes('menos') ||
    m.includes('más') ||
    m.includes('moins') ||
    /^plus\b/.test(m)
  ) {
    // Use last number match so "(1.5)" is preferred over "1" in "1x2"
    const allMatches = [...m.matchAll(/(\d+\.?\d*)/g)]
    const valueMatch = allMatches.length > 0 ? allMatches[allMatches.length - 1] : null
    if (valueMatch) {
      if (m.includes('casa') || m.includes('home')) return `home_underover_${valueMatch[1]}`
      if (m.includes('trasferta') || m.includes('away')) return `away_underover_${valueMatch[1]}`
      return `underover_${valueMatch[1]}`
    }
    return 'underover'
  }

  // 1X2 / Esito finale
  if (m === '1x2' || m.includes('esito finale') || m.includes('resultado final 1x2'))
    return 'market_esito_finale_1x2'

  // Double Chance / Doppia Chance
  if (m.includes('double chance') || m.includes('doppia chance') || m.includes('doble oportunidad'))
    return 'market_doppia_chance'

  // Gol no gol / Goal No Goal
  if (m.includes('gol no gol') || m.includes('goal no goal') || m.includes('gol / no gol'))
    return 'market_gol_no_gol'

  // Correct Score / Risultato esatto
  if (m.includes('correct score') || m.includes('risultato esatto') || m.includes('marcador exacto'))
    return 'market_risultato_esatto'

  // Half Time / Full Time / Parziale-Finale
  if (m.includes('half time') || m.includes('full time') || m.includes('parziale') || m.includes('parcial'))
    return 'market_parziale_finale'

  // First Scorer / Primo marcatore
  if (m.includes('first scorer') || m.includes('primo marcatore') || m.includes('primer goleador'))
    return 'market_primo_marcatore'

  // Red Card / Cartellino Rosso
  if (m.includes('red card') || m.includes('cartellino rosso') || m.includes('tarjeta roja'))
    return 'market_cartellino_rosso'

  // Multigoal Home / Somma gol Casa
  if ((m.includes('multigoal') || m.includes('somma gol')) && (m.includes('home') || m.includes('casa')))
    return 'market_somma_gol_casa'

  // Multigoal Away / Somma gol Trasferta
  if ((m.includes('multigoal') || m.includes('somma gol')) && (m.includes('away') || m.includes('trasferta')))
    return 'market_somma_gol_trasferta'

  // Multigoal (generic) / Somma gol
  if (m.includes('multigoal') || m.includes('somma gol') || m.includes('multi gol'))
    return 'market_somma_gol'

  return m
}

// API URLs - direttamente nel codice per evitare problemi con env online
export const API_URLS = {
  PGVIRTUAL: 'https://api-btprod.pgvirtual.eu',
  CASHIER_INIT: 'https://api-btprod.pgvirtual.eu/api/init/cashier',
  SOCCER: 'https://cvgl.it/football/incoming.php',
  // Base per altre chiamate se necessario
  BASE: 'https://pg-gaming.stg.startegois.com/proxy',
} as const

// Backend PGVirtual: stanleybet ha un'istanza dedicata, tutti gli altri
// operatori (pg, domenicano, ...) condividono il backend generico "suprema"
const STANLEYBET_BACKEND = API_URLS.PGVIRTUAL
const SUPREMA_BACKEND = 'https://api-btprod.pgvirtual.eu'

// Risolve il backend PGVirtual corretto in base all'operatore (default: suprema)
export function getPGVirtualBaseUrl(operator?: string): string {
  return operator === 'stanleybet' ? STANLEYBET_BACKEND : SUPREMA_BACKEND
}

// Backwards compatibility
export const PGVIRTUAL_API_URL = API_URLS.PGVIRTUAL
export const CASHIER_API_URL = API_URLS.CASHIER_INIT
export const SOCCER_API_URL = API_URLS.SOCCER
export const BASE_API_URL = API_URLS.BASE

// ===== Calcio (soccer) — endpoint PGVirtual =====
// Per ora l'ambiente calcio è quello DEMO (l'endpoint non è ancora attivo su
// api-btprod: risponde 404). Operator e init_code sono quelli forniti da Daniele
// per la demo; in futuro andranno parametrizzati come per dogs/horses.
export const SOCCER_CONFIG = {
  INIT: 'https://demo-pg.pgvirtual.eu/api/init/cashier/soccer',
  NEXT: 'https://demo-pg.pgvirtual.eu/api/next/cashier/soccer',
  OPERATOR: 'pg',
  INIT_CODE: 'TEST-EUR-en-US-1',
} as const

// Quante giornate calcio mostrare nella barra in alto.
export const SOCCER_ROUNDS_TO_SHOW = 10

// Tutte le chiamate soccer passano in fila: richieste simultanee con lo
// stesso token fanno scattare 401 casuali nel middleware di sessione.
let soccerQueue: Promise<unknown> = Promise.resolve()
function enqueueSoccer<T>(task: () => Promise<T>): Promise<T> {
  const run = soccerQueue.then(task)
  soccerQueue = run.catch(() => {})
  return run
}

// Richiesta soccer (Bearer + Operator; JSON solo se c'è body). Restituisce
// il JSON senza controllare ret_code.
function soccerRequest(
  url: string,
  method: 'GET' | 'POST',
  body?: object,
): Promise<any> {
  return enqueueSoccer(async () => {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${SOCCER_CONFIG.INIT_CODE}`,
        Operator: SOCCER_CONFIG.OPERATOR,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      mode: 'cors',
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    // HTTP non-2xx = rete / deploy mancante / metodo sbagliato (405).
    if (!response.ok) {
      throw new Error(`Soccer HTTP ${response.status} su ${url}`)
    }
    return response.json()
  })
}

// Token per il hub realtime (JWT con TTL 5 minuti: serve solo a connettersi).
export async function fetchSoccerRealtimeToken(): Promise<string | undefined> {
  const data = await soccerPost(SOCCER_CONFIG.INIT)
  return data?.realtime_token
}

// Risultato di una partita conclusa; ret_code va controllato dal chiamante
// ("04" = evento non trovato).
export function fetchSoccerResult(groupId: string, eventId: string): Promise<any> {
  const origin = new URL(SOCCER_CONFIG.INIT).origin
  return soccerRequest(
    `${origin}/api/soccer/event/results/${groupId}/${eventId}`,
    'GET',
  )
}

async function soccerPost(url: string, body?: object): Promise<any> {
  const data = await soccerRequest(url, 'POST', body)
  // Gli errori applicativi PGVirtual arrivano con HTTP 200: conta ret_code.
  // 1024 (numero) = successo; qualunque altro valore, incl. stringhe "04"/"17",
  // è errore. NB: soccer_available:false ha comunque ret_code 1024 (non è errore),
  // e viene gestito a valle come "nessuna giornata al momento".
  if (data?.ret_code !== 1024) {
    throw new Error(`Soccer ret_code ${data?.ret_code}: ${data?.description}`)
  }
  return data
}

// Next calcio: offset=N restituisce la giornata in posizione N (10 incontri).
export async function fetchSoccerNext(offset: number): Promise<any> {
  return soccerPost(SOCCER_CONFIG.NEXT, { offset })
}

// Init calcio: init copre le prime 2 giornate (offset 0 e 1); con next(offset)
// recuperiamo le successive fino ad avere SOCCER_ROUNDS_TO_SHOW giornate.
// Uniamo tutti gli "schedule" in un'unica risposta: il raggruppamento per
// groupId a valle deduplica eventuali giornate ripetute.
export async function fetchSoccerInit(): Promise<any> {
  const init = await soccerPost(SOCCER_CONFIG.INIT)
  const offsets = Array.from(
    { length: Math.max(0, SOCCER_ROUNDS_TO_SHOW - 2) },
    (_, i) => i + 2,
  )
  // In sequenza: più chiamate in parallelo con lo stesso token fanno
  // scattare 401 casuali nel middleware di sessione e la giornata va persa.
  const extra: any[] = []
  for (const o of offsets) {
    const page =
      (await fetchSoccerNext(o).catch(() => null)) ??
      (await fetchSoccerNext(o).catch(() => null))
    if (page) extra.push(page)
  }
  const schedule = [init, ...extra].flatMap(
    (r: any) => r?.schedules?.schedule || [],
  )
  return { ...init, schedules: { schedule } }
}

// Il feed demo NON manda il mercato "Doppia Chance": lo DERIVIAMO dalle quote
// 1X2 (formula standard 1/(1/oA + 1/oB)). Le quote reali potrebbero differire:
// se serve la doppia chance "vera" va aggiunta lato backend.
export function withDerivedDoppiaChance<T extends { markets?: any }>(
  event: T,
): T {
  const markets: any[] = event?.markets?.market || []
  if (markets.length === 0) return event
  // Già presente? non fare nulla.
  if (markets.some((m) => /doppia\s*chance|double\s*chance/i.test(m?.name || '')))
    return event

  const m1x2 = markets.find((m) =>
    /esito\s*finale|(^|\s)1x2($|\s)/i.test(m?.name || ''),
  )
  const sels = m1x2?.selections?.[0]?.selection || m1x2?.selection?.selection || []
  const price = (o: string) =>
    Number(sels.find((s: any) => String(s.outcome).toUpperCase() === o)?.decPrice)
  const o1 = price('1')
  const oX = price('X')
  const o2 = price('2')
  if (!o1 || !oX || !o2) return event

  const dc = (a: number, b: number) =>
    Math.round((1 / (1 / a + 1 / b)) * 100) / 100

  const doppiaChance = {
    name: 'Doppia Chance',
    selections: [
      {
        selection: [
          { outcome: '1X', decPrice: dc(o1, oX) },
          { outcome: 'X2', decPrice: dc(oX, o2) },
          { outcome: '12', decPrice: dc(o1, o2) },
        ],
      },
    ],
  }

  return {
    ...event,
    markets: { ...event.markets, market: [...markets, doppiaChance] },
  }
}

export function getTimeDistanceFromNow(targetTime: Date) {
  const diff = targetTime.getTime() - Date.now()

  if (diff < 0) {
    return '00:00'
  }

  const minutes = Math.floor(diff / 1000 / 60)
    .toString()
    .padStart(2, '0')
  const seconds = Math.floor((diff / 1000) % 60)
    .toString()
    .padStart(2, '0')

  return `${minutes}:${seconds}`
}

export function parseAPIDate(
  dateString: string | Date | number,
  apiTimezone: string,
): Date {
  // Se è già un Date object valido, restituiscilo direttamente
  if (dateString instanceof Date) {
    return isNaN(dateString.getTime()) ? new Date() : dateString
  }

  // Se è un numero (timestamp in millisecondi), convertilo
  if (typeof dateString === 'number') {
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? new Date() : date
  }

  // Se la stringa è vuota o invalida, restituisci la data corrente
  if (!dateString || typeof dateString !== 'string') {
    console.warn('Invalid dateString passed to parseAPIDate:', dateString)
    return new Date()
  }

  try {
    // Normalizza la stringa: sostituisci spazio con T per formato ISO
    let normalizedString = dateString.trim().replace(' ', 'T')

    // Se non ha la parte time, aggiungi mezzanotte
    if (!normalizedString.includes('T')) {
      normalizedString += 'T00:00:00'
    }

    // Se contiene già timezone info (Z o +/-offset), usala direttamente
    if (
      normalizedString.includes('Z') ||
      /[+-]\d{2}:\d{2}$/.test(normalizedString)
    ) {
      const date = new Date(normalizedString)
      if (!isNaN(date.getTime())) {
        return date
      }
    }

    // Estrai i componenti della data
    const parts = normalizedString.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/,
    )
    if (!parts) {
      console.warn('[parseAPIDate] Invalid format:', dateString)
      return new Date()
    }

    const [, year, month, day, hours, minutes, seconds] = parts

    // Crea una stringa nel formato locale che il browser capisce
    const localString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`

    // Ottieni il timezone offset per quel momento specifico nel timezone dell'API
    // Creiamo una data di test per trovare l'offset
    const testDate = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: apiTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'longOffset',
    })

    // Ottieni l'offset del timezone API rispetto a UTC
    const parts2 = formatter.formatToParts(testDate)
    const offsetString =
      parts2.find((p) => p.type === 'timeZoneName')?.value || '+00:00'

    // Estrai l'offset (es: "GMT+01:00" -> "+01:00")
    const offsetMatch = offsetString.match(/GMT([+-]\d{2}:\d{2})/)
    const offset = offsetMatch ? offsetMatch[1] : '+00:00'

    // Crea la data con il timezone corretto
    const dateWithTz = new Date(localString + offset)

    return isNaN(dateWithTz.getTime()) ? new Date(localString) : dateWithTz
  } catch (error) {
    console.error('[parseAPIDate] Error:', error, '| input:', dateString)
    const fallbackDate = new Date(dateString.replace(' ', 'T'))
    return isNaN(fallbackDate.getTime()) ? new Date() : fallbackDate
  }
}

// Module-level retail headers (Shop-Id, Terminal-Id) — set once at init
const retailHeaders: Record<string, string> = {}

export function setRetailHeaders(shopId?: string, terminalId?: string) {
  if (shopId) retailHeaders['Shop-Id'] = shopId
  if (terminalId) retailHeaders['Terminal-Id'] = terminalId
}

// Helper per chiamate API PGVirtual pulite
export function createPGVirtualAPICall(
  endpoint: string,
  initCode: string,
  options?: RequestInit,
  operator?: string,
) {
  if (!operator) {
    console.error(
      '❌ Operator is required but not provided for API call:',
      endpoint,
    )
    throw new Error(`Operator is required for API calls. Endpoint: ${endpoint}`)
  }

  const finalOptions = {
    ...options,
    headers: {
      ...options?.headers,
      accept: 'application/json',
      authorization: `Bearer ${initCode}`,
      'content-type': 'application/json',
      operator: operator,
      ...retailHeaders,
    },
    mode: 'cors' as const,
    credentials: 'include' as const,
  }

  return fetch(`${getPGVirtualBaseUrl(operator)}${endpoint}`, finalOptions)
}

// Enum per le discipline
export enum Discipline {
  SOCCER = 'SOCCER',
  DOGS = 'DOGS',
  DOGS8 = 'DOGS8',
  HORSES = 'HORSES',
}

// Helper per ottenere l'URL API corretto basato sulla disciplina
export function getAPIUrlForDiscipline(discipline: Discipline): string {
  switch (discipline) {
    case Discipline.SOCCER:
      return API_URLS.SOCCER
    case Discipline.DOGS:
    case Discipline.DOGS8:
    case Discipline.HORSES:
      return API_URLS.PGVIRTUAL
    default:
      return API_URLS.PGVIRTUAL
  }
}

// Helper per chiamate API basate su disciplina
export async function fetchEventsByDiscipline(
  discipline: Discipline,
  initCode?: string,
  operator?: string,
): Promise<any> {
  const baseUrl = getAPIUrlForDiscipline(discipline)

  if (discipline === Discipline.SOCCER) {
    // Per il calcio usiamo l'API cvgl.it
    const response = await fetch(`${baseUrl}?t=${new Date().getTime()}`)
    return response.json()
  } else {
    // Per cani e cavalli usiamo PGVirtual API
    if (!initCode) throw new Error('InitCode required for racing events')
    if (!operator) throw new Error('Operator required for racing events')
    return createPGVirtualAPICall(
      '/api/event/list',
      initCode,
      undefined,
      operator,
    )
  }
}

// Helper per l'inizializzazione cashier (sempre all'avvio)
export async function fetchCashierInit(
  initCode: string,
  operator?: string,
): Promise<any> {
  if (!operator) {
    console.error('❌ Operator is required but not provided for Cashier Init')
    throw new Error('Operator is required for Cashier initialization')
  }

  const response = await fetch(`${getPGVirtualBaseUrl(operator)}/api/init/cashier`, {
    headers: {
      accept: 'application/json',
      'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
      authorization: `Bearer ${initCode}`,
      operator: operator,
      'Content-Type': 'application/json',
      ...retailHeaders,
    },
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
    body: JSON.stringify({ init_code: initCode }),
  })

  if (!response.ok) {
    console.error(
      `❌ Cashier API error: ${response.status} - ${response.statusText}`,
    )
    throw new Error(`Cashier API error: ${response.status}`)
  }

  return response.json()
}

// Colori delle pettorine per cani e cavalli con codici colore esadecimali
export function getRacerColors(
  racerNumber: number,
  discipline: 'DOGS' | 'DOGS8' | 'HORSES',
) {
  if (discipline === 'HORSES') {
    switch (racerNumber) {
      case 1:
        return {
          bg: '#FF0000',
          text: '#FFFFFF',
          border: '',
          style: { backgroundColor: '#FF0000', color: '#FFFFFF' },
        }
      case 2:
        return {
          bg: '#FFFFFF',
          text: '#000000',
          border: '1px solid #000000',
          style: {
            backgroundColor: '#FFFFFF',
            color: '#000000',
            border: '1px solid #000000',
          },
        }
      case 3:
        return {
          bg: '#0000FF',
          text: '#FFFFFF',
          border: '',
          style: { backgroundColor: '#0000FF', color: '#FFFFFF' },
        }
      case 4:
        return {
          bg: '#F7F128',
          text: '#000000',
          border: '',
          style: { backgroundColor: '#F7F128', color: '#000000' },
        }
      case 5:
        return {
          bg: '#077448',
          text: '#FFFFFF',
          border: '',
          style: { backgroundColor: '#077448', color: '#FFFFFF' },
        }
      case 6:
        return {
          bg: '#363132',
          text: '#FFFF00',
          border: '',
          style: { backgroundColor: '#363132', color: '#FFFF00' },
        }
      default:
        return {
          bg: '#CCCCCC',
          text: '#000000',
          border: '1px solid #CCCCCC',
          style: {
            backgroundColor: '#CCCCCC',
            color: '#000000',
            border: '1px solid #CCCCCC',
          },
        }
    }
  } else if (discipline === 'DOGS') {
    switch (racerNumber) {
      case 1:
        return {
          bg: '#FF0000',
          text: '#FFFFFF',
          border: '',
          style: { backgroundColor: '#FF0000', color: '#FFFFFF' },
        }
      case 2:
        return {
          bg: '#0000FF',
          text: '#FFFFFF',
          border: '',
          style: { backgroundColor: '#0000FF', color: '#FFFFFF' },
        }
      case 3:
        return {
          bg: '#FFFFFF',
          text: '#000000',
          border: '1px solid #000000',
          style: {
            backgroundColor: '#FFFFFF',
            color: '#000000',
            border: '1px solid #000000',
          },
        }
      case 4:
        return {
          bg: '#000000',
          text: '#FFFFFF',
          border: '',
          style: { backgroundColor: '#000000', color: '#FFFFFF' },
        }
      case 5:
        return {
          bg: '#FFBB00',
          text: '#000000',
          border: '',
          style: { backgroundColor: '#FFBB00', color: '#000000' },
        }
      case 6:
        return {
          bg: '#FFFFFF',
          text: '#FF0000',
          border: '1px solid #000000',
          style: {
            background:
              'linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 8.333333333%, rgba(0,0,0,1) 8.333333334%, rgba(0,0,0,1) 25.000000001%, rgba(255,255,255,1) 25.000000002%, rgba(255,255,255,1) 41.666666669%, rgba(0,0,0,1) 41.66666667%, rgba(0,0,0,1) 58.333333337%, rgba(255,255,255,1) 58.333333338%, rgba(255,255,255,1) 75.000000005%, rgba(0,0,0,1) 75.000000006%, rgba(0,0,0,1) 91.666666673%, rgba(255,255,255,1) 91.666666674%, rgba(255,255,255,1) 100%)',
            color: '#FF0000',
            border: '1px solid #000000',
            textShadow:
              '2px 0 0 #fff, -2px 0 0 #fff, 0 2px 0 #fff, 0 -2px 0 #fff, 1px 1px #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff',
          },
        }
      default:
        return {
          bg: '#CCCCCC',
          text: '#000000',
          border: '1px solid #CCCCCC',
          style: {
            backgroundColor: '#CCCCCC',
            color: '#000000',
            border: '1px solid #CCCCCC',
          },
        }
    }
  } else if (discipline === 'DOGS8') {
    switch (racerNumber) {
      case 1:
        return {
          bg: '#FF0000',
          text: '#FFFFFF',
          border: '',
          style: { backgroundColor: '#FF0000', color: '#FFFFFF' },
        }
      case 2:
        return {
          bg: '#0000FF',
          text: '#FFFFFF',
          border: '',
          style: { backgroundColor: '#0000FF', color: '#FFFFFF' },
        }
      case 3:
        return {
          bg: '#FFFFFF',
          text: '#000000',
          border: '1px solid #000000',
          style: {
            backgroundColor: '#FFFFFF',
            color: '#000000',
            border: '1px solid #000000',
          },
        }
      case 4:
        return {
          bg: '#287957',
          text: '#FFFFFF',
          border: '',
          style: { backgroundColor: '#287957', color: '#FFFFFF' },
        }
      case 5:
        return {
          bg: '#000000',
          text: '#FFBB00',
          border: '',
          style: { backgroundColor: '#000000', color: '#FFBB00' },
        }
      case 6:
        return {
          bg: '#FFBB00',
          text: '#000000',
          border: '',
          style: { backgroundColor: '#FFBB00', color: '#000000' },
        }
      case 7:
        return {
          bg: '#1D6647',
          text: '#000000',
          border: '1px solid #000000',
          style: {
            background:
              'linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 8.333333333%, rgba(29,102,71,1) 8.333333334%, rgba(29,102,71,1) 25.000000001%, rgba(255,255,255,1) 25.000000002%, rgba(255,255,255,1) 41.666666669%, rgba(29,102,71,1) 41.66666667%, rgba(29,102,71,1) 58.333333337%, rgba(255,255,255,1) 58.333333338%, rgba(255,255,255,1) 75.000000005%, rgba(29,102,71,1) 75.000000006%, rgba(29,102,71,1) 91.666666673%, rgba(255,255,255,1) 91.666666674%, rgba(255,255,255,1) 100%)',
            color: '#000000',
            border: '1px solid #000000',
            textShadow:
              '2px 0 0 #fff, -2px 0 0 #fff, 0 2px 0 #fff, 0 -2px 0 #fff, 1px 1px #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff',
          },
        }
      case 8:
        return {
          bg: '#000000',
          text: '#FF0000',
          border: '',
          style: { backgroundColor: '#000000', color: '#FF0000' },
        }
      default:
        return {
          bg: '#CCCCCC',
          text: '#000000',
          border: '1px solid #CCCCCC',
          style: {
            backgroundColor: '#CCCCCC',
            color: '#000000',
            border: '1px solid #CCCCCC',
          },
        }
    }
  }

  // Fallback per altre discipline
  return {
    bg: '#CCCCCC',
    text: '#000000',
    border: '1px solid #CCCCCC',
    style: {
      backgroundColor: '#CCCCCC',
      color: '#000000',
      border: '1px solid #CCCCCC',
    },
  }
}
