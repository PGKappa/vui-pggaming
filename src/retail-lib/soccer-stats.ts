import type { Market, TeamRanking } from '@/retail-lib/types'

export type MatchProbabilities = { home: number; draw: number; away: number }
export type FormResult = 'W' | 'D' | 'L'

// Il feed non pubblica statistiche per la singola partita: le percentuali si
// ricavano dalle quote 1X2 gia' presenti nel palinsesto (probabilita' implicite
// normalizzate a 100), lo storico dalla classifica del torneo.
const MARKET_1X2 = ['1x2', 'esito finale 1x2']

function normalize(s: string): string {
  return s.trim().toLowerCase()
}

// Percentuali dalle quote: 1/quota e' la probabilita' implicita, la somma delle
// tre supera 100 per via del margine del bookmaker, quindi si riporta a 100.
export function probabilitiesFromOdds(
  markets: Market[] | undefined,
): MatchProbabilities | undefined {
  const market = (markets ?? []).find((m) =>
    MARKET_1X2.includes(normalize(m.name)),
  )
  const selections = market?.selections?.[0]?.selection
  if (!selections?.length) return undefined

  const priceOf = (outcome: string) =>
    selections.find((s) => normalize(s.outcome) === outcome)?.decPrice

  const prices = [priceOf('1'), priceOf('x'), priceOf('2')]
  if (prices.some((p) => !p || p <= 0)) return undefined

  const implied = prices.map((p) => 1 / (p as number))
  const total = implied.reduce((a, b) => a + b, 0)
  const exact = implied.map((v) => (v / total) * 100)

  // Arrotondamento che tiene la somma a 100: i resti piu' alti prendono +1.
  const floors = exact.map((v) => Math.floor(v))
  let left = 100 - floors.reduce((a, b) => a + b, 0)
  const order = exact
    .map((v, i) => ({ i, rest: v - Math.floor(v) }))
    .sort((a, b) => b.rest - a.rest)
  for (const { i } of order) {
    if (left <= 0) break
    floors[i]++
    left--
  }

  const [home, draw, away] = floors
  return { home, draw, away }
}

// I nomi nel palinsesto e nella classifica possono differire per contorno
// (sigla, maiuscole, spazi): si confronta la forma normalizzata, poi per
// contenimento.
function matchesTeam(ranking: TeamRanking, team: string): boolean {
  const a = normalize(ranking.team)
  const b = normalize(team)
  if (!a || !b) return false
  return a === b || a.startsWith(b) || b.startsWith(a)
}

// last8 e' gia' ordinato dalla partita piu' recente alla meno recente, come
// si legge a schermo: le ultime N sono le prime della lista.
export function formForTeam(
  standings: TeamRanking[] | undefined,
  team: string,
  count = 5,
): FormResult[] | undefined {
  const row = (standings ?? []).find((r) => matchesTeam(r, team))
  const form = row?.last8
  if (!form?.length) return undefined
  return form.slice(0, count)
}

type TeamAcc = Omit<TeamRanking, 'position'>

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function pick(o: any, keys: string[]): any {
  for (const k of keys) if (o?.[k] !== undefined) return o[k]
  return undefined
}

// Il fornitore scrive il pareggio come X; qui si usa D come nel resto del
// codice. Il fornitore manda la stringa in ordine cronologico, con la partita
// piu' recente in fondo: la si rovescia, perche' a schermo si legge da
// sinistra a destra partendo dalla piu' recente.
function toForm(v: unknown): FormResult[] {
  const arr = Array.isArray(v) ? v : String(v ?? '').split('')
  return arr
    .map((x) => String(x).toUpperCase())
    .map((x) => (x === 'X' ? 'D' : x))
    .filter((x): x is FormResult => x === 'W' || x === 'D' || x === 'L')
    .slice(-8)
    .reverse()
}

function rank(list: TeamAcc[]): TeamRanking[] {
  return [...list]
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.team.localeCompare(b.team),
    )
    .map((t, i) => ({ ...t, position: i + 1 }))
}

// Lettura tollerante della classifica del fornitore: i nomi dei campi sono
// cambiati piu' volte, quindi si accettano le varianti viste finora.
export function mapBackendStandings(raw: any): TeamRanking[] {
  const rows = Array.isArray(raw)
    ? raw
    : (pick(raw, ['standing', 'standings', 'team', 'teams', 'rows', 'table']) ?? [])
  const list: TeamRanking[] = (Array.isArray(rows) ? rows : [rows])
    .map((r: any) => {
      const gf = num(pick(r, ['goalsFor', 'gf', 'for', 'goalsScored']))
      const ga = num(pick(r, ['goalsAgainst', 'ga', 'against', 'goalsConceded']))
      const gd = pick(r, ['goalDifference', 'gd'])
      return {
        position: num(pick(r, ['position', 'pos', 'rank'])),
        team: String(
          pick(r, ['team', 'teamName', 'name', 'shortName', 'code']) ?? '',
        ),
        played: num(pick(r, ['played', 'p', 'matchesPlayed', 'gamesPlayed'])),
        wins: num(pick(r, ['wins', 'won', 'w'])),
        draws: num(pick(r, ['draws', 'drawn', 'd'])),
        losses: num(pick(r, ['losses', 'lost', 'l', 'loses'])),
        points: num(pick(r, ['points', 'pts'])),
        goalsFor: gf,
        goalsAgainst: ga,
        goalDifference: gd !== undefined ? num(gd) : gf - ga,
        last8: toForm(pick(r, ['last8', 'form', 'last', 'lastResults'])),
      }
    })
    .filter((t) => t.team)
  if (list.length && list.every((t) => t.position > 0)) {
    return [...list].sort((a, b) => a.position - b.position)
  }
  return rank(list)
}

export function teamsOf(teams: string): [string, string] {
  const [home = '', away = ''] = teams.split(' - ')
  return [home.trim(), away.trim()]
}

// ---------------------------------------------------------------------------
// Classifica e precedenti: rotte del servizio realtime del fornitore.
// ---------------------------------------------------------------------------
const STANDINGS_BASE_URL = 'https://soccer-realtime-dev.pgvirtual.eu'

export type HeadToHeadMatch = {
  eventId: string
  playedAt: string
  // Chi giocava in casa in QUEL precedente: non e' detto sia la squadra di casa
  // della partita di oggi.
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  winner: 'home' | 'away' | 'draw'
  // Esito gia' riletto dal punto di vista della squadra di casa di oggi.
  resultForHomeTeam: FormResult
}

export type HeadToHead = {
  eventId: string
  homeTeam: string
  awayTeam: string
  summary: {
    played: number
    homeTeamWins: number
    awayTeamWins: number
    draws: number
  }
  matches: HeadToHeadMatch[]
}

// 404 = dato non ancora disponibile (torneo appena iniziato, oppure rotta non
// ancora pubblicata): non e' un errore, il riquadro si adatta.
async function getJson(path: string): Promise<any | undefined> {
  try {
    const response = await fetch(`${STANDINGS_BASE_URL}${path}`)
    if (!response.ok) return undefined
    return await response.json()
  } catch {
    return undefined
  }
}

// La classifica cambia a ogni fine giornata (circa ogni 5 minuti): la si
// tiene da parte per poco, giusto per non ripetere la stessa chiamata per
// tutte le partite dello slot.
const CACHE_MS = 60 * 1000

type Voce<T> = { quando: number; dato: Promise<T> }

function daCache<T>(
  mappa: Map<string, Voce<T>>,
  chiave: string,
  carica: () => Promise<T>,
): Promise<T> {
  const ora = Date.now()
  const voce = mappa.get(chiave)
  if (voce && ora - voce.quando < CACHE_MS) return voce.dato
  const dato = carica()
  mappa.set(chiave, { quando: ora, dato })
  return dato
}

// Tutte le partite di una giornata appartengono allo stesso torneo: si chiede
// la classifica una volta sola e si riusa per ogni partita dello slot.
const standingsBySlot = new Map<string, Voce<any | undefined>>()

/** Butta via la classifica tenuta da parte: si usa a fine giornata. */
export function invalidateSlotStandings(): void {
  standingsBySlot.clear()
}

/** La risposta intera di /api/standings/by-event: torneo, giornata, squadre. */
export function fetchSlotStandingsPayload(
  eventId: string | number | undefined,
  groupId?: string | number,
): Promise<any | undefined> {
  if (eventId === undefined) return Promise.resolve(undefined)
  return daCache(standingsBySlot, String(groupId ?? eventId), () =>
    getJson(
      `/api/standings/by-event/${encodeURIComponent(String(eventId))}`,
    ).then((data) => (data?.standings?.length ? data : undefined)),
  )
}

export function fetchSlotStandings(
  eventId: string | number | undefined,
  groupId?: string | number,
): Promise<TeamRanking[] | undefined> {
  return fetchSlotStandingsPayload(eventId, groupId).then((data) => {
    const rows = data?.standings ? mapBackendStandings(data.standings) : undefined
    return rows?.length ? rows : undefined
  })
}

// I precedenti dipendono dalla coppia di squadre: una chiamata per partita,
// fatta all'apertura del dettaglio.
const headToHeadByEvent = new Map<string, Voce<HeadToHead | undefined>>()

export function fetchHeadToHead(
  eventId: string | number | undefined,
  limit = 5,
): Promise<HeadToHead | undefined> {
  if (eventId === undefined) return Promise.resolve(undefined)
  const key = String(eventId)
  return daCache(headToHeadByEvent, key, () =>
    getJson(
      `/api/head-to-head/by-event/${encodeURIComponent(key)}?limit=${limit}`,
    ).then((data) => (data?.matches ? (data as HeadToHead) : undefined)),
  )
}

export type HeadToHeadRow = {
  eventId: string
  scoreline: string
  date: string
  result: FormResult
}

// Il punteggio di un precedente, con le squadre nell'ordine in cui giocarono
// QUELLA partita. Non vanno riordinate per mettere a sinistra la squadra di
// casa di oggi: si rovescerebbe il punteggio, cioe' si mostrerebbe un
// risultato falso.
function scoreline(match: HeadToHeadMatch): string {
  return `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`
}

function playedAt(match: HeadToHeadMatch, locale: string): string {
  const date = new Date(match.playedAt)
  if (Number.isNaN(date.getTime())) return ''
  return date
    .toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(',', '')
}

// Le righe pronte da stampare, dal precedente piu' recente: punteggio, data e
// esito visto dalla squadra di casa di oggi (resultForHomeTeam, gia' orientato
// dal fornitore).
export function headToHeadRows(
  headToHead: HeadToHead | undefined,
  locale = 'it-IT',
  count = 5,
): HeadToHeadRow[] {
  return (headToHead?.matches ?? [])
    .filter(
      (m) =>
        m.resultForHomeTeam === 'W' ||
        m.resultForHomeTeam === 'D' ||
        m.resultForHomeTeam === 'L',
    )
    .slice(0, count)
    .map((match) => ({
      eventId: String(match.eventId),
      scoreline: scoreline(match),
      date: playedAt(match, locale),
      result: match.resultForHomeTeam,
    }))
}
