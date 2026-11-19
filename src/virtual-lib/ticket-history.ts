// Storico "Le mie scommesse" per il web.
// L'elenco completo dei ticket (/api/ticket/list) è riservato al cassiere
// (risponde "Level error" con il codice giocatore), mentre il dettaglio del
// singolo ticket (/api/ticket/{id}) è accessibile. Per questo salviamo in
// locale i codici dei ticket giocati da questo browser e ne carichiamo il
// dettaglio aggiornato (importo, vincita, stato) dall'API.

// ticket ricordati per browser: bastano per una pagina da 100 della lista
const MAX_TICKETS = 200

const storageKey = (initCode: string) => `virtualTicketIds:${initCode}`

export function getStoredTicketIds(initCode: string): number[] {
  try {
    const raw = localStorage.getItem(storageKey(initCode))
    const ids = raw ? JSON.parse(raw) : []
    return Array.isArray(ids) ? ids.filter((id) => Number.isFinite(id)) : []
  } catch {
    return []
  }
}

export function storeTicketId(initCode: string, ticketId: number) {
  try {
    const ids = getStoredTicketIds(initCode).filter((id) => id !== ticketId)
    ids.unshift(ticketId)
    localStorage.setItem(
      storageKey(initCode),
      JSON.stringify(ids.slice(0, MAX_TICKETS)),
    )
  } catch {
    // storage non disponibile (es. navigazione privata): lo storico resta vuoto
  }
}

/** Ricava il codice ticket dalla risposta di /api/ticket/add. */
export function extractTicketId(result: any): number | undefined {
  const candidates = [
    result?.ticket?.ticket_id,
    result?.ticket?.id,
    result?.ticket_id,
    result?.data?.ticket?.ticket_id,
    result?.data?.ticket?.id,
    result?.data?.ticket_id,
    typeof result?.ticket !== 'object' ? result?.ticket : undefined,
  ]
  for (const value of candidates) {
    const id = Number(value)
    if (value !== undefined && value !== null && Number.isFinite(id) && id > 0)
      return id
  }
  return undefined
}

export type TicketHistoryItem = {
  ticketId: number
  date: Date
  amount: number
  amountWon: number
  status: number
}

// stessa conversione usata dal retail (parseTicketTime)
// Il backend manda l'orario del ticket in UTC, come
// [anno, mese (0-11), giorno, ora, minuti, secondi]: va letto come UTC e poi
// mostrato nel fuso del dispositivo (toLocaleTimeString), altrimenti in Italia
// risulta indietro di un'ora (due con l'ora legale).
function parseTicketTime(time: unknown): Date {
  if (!Array.isArray(time)) return new Date(NaN)
  const [year, month, day, hour, min, sec] = time
  return new Date(
    Date.UTC(
      parseInt(String(year)),
      Number(month),
      parseInt(String(day)),
      parseInt(String(hour)),
      parseInt(String(min)),
      parseInt(String(sec)) || 0,
    ),
  )
}

export function toTicketHistoryItem(info: any): TicketHistoryItem | undefined {
  if (!info?.ticket_id) return undefined
  return {
    ticketId: Number(info.ticket_id),
    date: parseTicketTime(info.time),
    amount: parseFloat(info.amount) || 0,
    amountWon: parseFloat(info.amount_won) || 0,
    status: Number(info.status),
  }
}

/** Chiave di traduzione dello stato, come sul retail (getStatusDisplay). */
export function ticketStatusKey(status: number): string {
  switch (status) {
    case 1:
      return 'active'
    case 2:
      return 'cancelled'
    case 3:
      return 'void'
    case 4:
    case 6:
      return 'won'
    case 5:
      return 'lost'
    default:
      return 'pending'
  }
}

// ===== Lista ticket (pagina "Le mie scommesse", identica alla cassa) =====

/** dd-MM-yyyy → mezzanotte locale */
function parseDayParam(value: string): Date | undefined {
  const [day, month, year] = value.split('-').map(Number)
  if (!day || !month || !year) return undefined
  return new Date(year, month - 1, day)
}

// filtro stato come i codici della cassa (STATUS_MAP / PAYMENT_MAP)
function matchesStatus(status: number, filter: number): boolean {
  switch (filter) {
    case 0:
      return true
    case 1:
      return status === 0 || status === 1
    case 4:
      return status === 4 || status === 6
    case 5:
      return status === 5 || status === 9
    default:
      return status === filter
  }
}

function matchesPayment(status: number, filter: number): boolean {
  if (filter === 1) return status === 6
  if (filter === 2) return status === 4
  return true
}

/**
 * Dettagli ticket già scaricati (stessa risposta di /api/ticket/{id}): il
 * dettaglio li mostra subito e intanto si aggiorna dalla rete.
 */
export const ticketDetailCache = new Map<number, any>()

// Stati definitivi: annullato, rimborsato, perso, pagato (e perso "9" come
// nel filtro della cassa). Un ticket in questi stati non cambia più.
const FINAL_STATUSES = new Set([2, 3, 5, 6, 9])

// ===== Riassunti dei ticket =====
// La lista mostra solo dati di riepilogo (data, importi, stato, giochi): li
// teniamo in locale, salvati alla giocata e aggiornati quando si apre il
// dettaglio, così la lista si apre subito senza scaricare ogni ticket.
// Il dettaglio completo si scarica solo quando si apre il ticket.

export type TicketSummary = {
  ticket_id: number
  /** [anno, mese 0-11, giorno, ora, min, sec] in UTC, come dal backend */
  time: unknown[]
  amount: string
  amount_won: string
  status: number
  intl?: any
  game_ids?: string[]
  /** quando è stato scaricato (ms): evita di riscaricarlo a ogni apertura */
  checkedAt?: number
}

const summariesKey = (initCode: string) => `virtualTicketSummaries:${initCode}`
// formato precedente: dettagli completi dei soli ticket in stato definitivo
const legacyDetailsKey = (initCode: string) =>
  `virtualTicketDetails:${initCode}`

export function toTicketSummary(info: any): TicketSummary | undefined {
  if (!info?.ticket_id || !Array.isArray(info.time)) return undefined
  return {
    ticket_id: Number(info.ticket_id),
    time: info.time,
    amount: String(info.amount ?? '0'),
    amount_won: String(info.amount_won ?? '0'),
    status: Number(info.status),
    intl: info.intl,
    game_ids: Array.isArray(info.selections)
      ? info.selections.map((sel: any) => String(sel?.gameId ?? ''))
      : undefined,
    checkedAt: Date.now(),
  }
}

// all'apertura i ticket aperti di oggi già controllati da meno di così non
// si riscaricano (aprire e chiudere la lista più volte di fila)
const OPEN_TICKET_RECHECK_MS = 30 * 1000

const isToday = (summary: TicketSummary) => {
  const date = parseTicketTime(summary.time)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

function readSummaries(initCode: string): Record<string, TicketSummary> {
  try {
    const raw = localStorage.getItem(summariesKey(initCode))
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed
    }
    // primo avvio dopo l'aggiornamento: si recuperano i vecchi dettagli
    const legacyRaw = localStorage.getItem(legacyDetailsKey(initCode))
    const legacy = legacyRaw ? JSON.parse(legacyRaw) : {}
    const migrated: Record<string, TicketSummary> = {}
    if (legacy && typeof legacy === 'object') {
      for (const [id, info] of Object.entries(legacy)) {
        const summary = toTicketSummary(info)
        if (summary) migrated[id] = summary
      }
    }
    return migrated
  } catch {
    return {}
  }
}

function writeSummaries(
  initCode: string,
  summaries: Record<string, TicketSummary>,
) {
  // solo i ticket ancora nello storico
  const kept: Record<string, TicketSummary> = {}
  for (const id of getStoredTicketIds(initCode)) {
    if (summaries[id]) kept[id] = summaries[id]
  }
  try {
    localStorage.setItem(summariesKey(initCode), JSON.stringify(kept))
    localStorage.removeItem(legacyDetailsKey(initCode))
  } catch {
    // storage non disponibile: la lista riscaricherà i ticket
  }
}

/** Salva il riassunto di un ticket dal suo dettaglio (/api/ticket/{id}). */
export function saveTicketSummary(initCode: string, info: any) {
  const summary = toTicketSummary(info)
  if (!summary) return
  const summaries = readSummaries(initCode)
  summaries[summary.ticket_id] = summary
  writeSummaries(initCode, summaries)
}

const isFinal = (summary: TicketSummary) => FINAL_STATUSES.has(summary.status)

const summaryTime = (summary: TicketSummary) =>
  parseTicketTime(summary.time).getTime()

// Ticket il cui dettaglio non è stato trovato (codice errato, ticket di un
// altro ambiente...): non si richiede a ogni apertura della lista, si
// riprova solo dopo un po'.
const MISSING_RETRY_MS = 10 * 60 * 1000
const missingKey = (initCode: string) => `virtualTicketMissing:${initCode}`

function readMissing(initCode: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(missingKey(initCode))
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeMissing(initCode: string, missing: Record<string, number>) {
  try {
    localStorage.setItem(missingKey(initCode), JSON.stringify(missing))
  } catch {
    // storage non disponibile
  }
}

// dettagli in download: aprire DETTAGLI mentre la lista lo sta già
// scaricando (o dopo il passaggio del mouse) non rifà la chiamata
const detailInFlight = new Map<number, Promise<any>>()

/** download del dettaglio già in corso (lista, passaggio del mouse...) */
export function pendingTicketDetail(
  ticketId: number,
): Promise<any> | undefined {
  return detailInFlight.get(ticketId)
}

/**
 * Dettaglio di un ticket (info di /api/ticket/{id}), una sola chiamata per
 * volta per ticket. Aggiorna la cache in memoria e il riassunto della lista.
 */
export function loadTicketDetail(
  initCode: string,
  ticketId: number,
  fetchTicket: (ticketId: number) => Promise<any>,
): Promise<any> {
  const pending = detailInFlight.get(ticketId)
  if (pending) return pending
  const request = fetchTicket(ticketId)
    .then((data) => {
      if (data?.ret_code === 1024 && data.info) {
        ticketDetailCache.set(ticketId, data.info)
        saveTicketSummary(initCode, data.info)
        return data.info
      }
      return undefined
    })
    .finally(() => detailInFlight.delete(ticketId))
  detailInFlight.set(ticketId, request)
  return request
}

/**
 * Risposta nel formato di /api/ticket/list costruita dai ticket giocati da
 * questo browser, a partire dai riassunti salvati in locale: si risponde
 * subito, senza nessuna chiamata. In background, poi `onUpdate` ridisegna:
 * - i ticket senza riassunto (giocati prima di questo aggiornamento, o il cui
 *   riassunto non si è potuto salvare), scaricati una volta;
 * - i ticket ancora aperti, per aggiornarne lo stato: all'apertura quelli di
 *   oggi (non controllati negli ultimi 30 secondi), con `refreshOpen`
 *   ("Ricarica") tutti quelli del periodo cercato.
 * Il dettaglio di un ticket si scarica quando lo si apre.
 * Gli orari sono convertiti da UTC all'ora locale, come li mostra la lista.
 */
export async function fetchStoredTicketList(
  initCode: string,
  request: {
    dateStart: string
    dateEnd: string
    status: number
    payment: number
  },
  fetchTicket: (ticketId: number) => Promise<any>,
  onUpdate?: (response: ReturnType<typeof buildListResponse>) => void,
  refreshOpen = false,
) {
  const from = parseDayParam(request.dateStart)
  const toDay = parseDayParam(request.dateEnd)
  const to = toDay
    ? new Date(toDay.getFullYear(), toDay.getMonth(), toDay.getDate() + 1)
    : undefined
  const inRange = (summary: TicketSummary) => {
    const time = summaryTime(summary)
    return (
      !Number.isFinite(time) ||
      ((!from || time >= from.getTime()) && (!to || time < to.getTime()))
    )
  }

  const ids = getStoredTicketIds(initCode)
  const summaries = readSummaries(initCode)
  const missing = readMissing(initCode)
  const now = Date.now()

  const build = () => {
    const latest = readSummaries(initCode)
    return buildListResponse(
      ids.map((id) => latest[id] ?? summaries[id]).filter(Boolean),
      from,
      to,
      request,
    )
  }

  // da scaricare in background: ticket senza riassunto (salvo quelli non
  // trovati di recente) e, con "Ricarica", gli aperti del periodo
  const unknown = ids.filter(
    (id) =>
      !summaries[id] && !(missing[id] && now - missing[id] < MISSING_RETRY_MS),
  )
  // ticket ancora aperti da aggiornare: con "Ricarica" quelli del periodo
  // cercato; all'apertura quelli di oggi, se non controllati da poco
  const open = ids.filter((id) => {
    const summary = summaries[id]
    if (!summary || isFinal(summary)) return false
    if (refreshOpen) return inRange(summary)
    return (
      isToday(summary) &&
      !(summary.checkedAt && now - summary.checkedAt < OPEN_TICKET_RECHECK_MS)
    )
  })
  const toLoad = [...unknown, ...open]

  if (toLoad.length && onUpdate) {
    Promise.all(
      toLoad.map((id) =>
        loadTicketDetail(initCode, id, fetchTicket)
          .then((info) => {
            if (info) delete missing[id]
            else if (unknown.includes(id)) missing[id] = Date.now()
          })
          .catch(() => {
            // rete non disponibile: si riprova alla prossima apertura
          }),
      ),
    ).then(() => {
      writeMissing(initCode, missing)
      onUpdate(build())
    })
  }

  // pending: arriveranno ticket mai visti (la lista può mostrare il
  // caricamento invece di "nessun ticket")
  return { ...build(), pending: unknown.length > 0 && !!onUpdate }
}

function buildListResponse(
  summaries: TicketSummary[],
  from: Date | undefined,
  to: Date | undefined,
  request: { status: number; payment: number },
) {
  const items = summaries
    .map((info) => {
      const date = parseTicketTime(info.time)
      return {
        ticket_id: Number(info.ticket_id),
        time: [
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          date.getHours(),
          date.getMinutes(),
          date.getSeconds(),
        ],
        amount: String(info.amount ?? '0'),
        amount_won: String(info.amount_won ?? '0'),
        intl: info.intl,
        // la lista cassa ha la colonna terminale: sul web è sempre "WEB"
        terminal_id: 'WEB',
        status: Number(info.status),
        // disciplina dal riassunto, come game_ids della cassa
        game_ids: info.game_ids,
        _date: date,
      }
    })
    .filter(
      (item) =>
        !isNaN(item._date.getTime()) &&
        (!from || item._date >= from) &&
        (!to || item._date < to) &&
        matchesStatus(item.status, request.status) &&
        matchesPayment(item.status, request.payment),
    )
    .sort((a, b) => b._date.getTime() - a._date.getTime())
    .map(({ _date, ...item }) => item)

  const sum = (values: number[]) =>
    Math.round(values.reduce((acc, value) => acc + value, 0) * 100) / 100
  const totIn = sum(items.map((item) => parseFloat(item.amount) || 0))
  const totOut = sum(items.map((item) => parseFloat(item.amount_won) || 0))
  const totCancelled = sum(
    items
      .filter((item) => item.status === 2)
      .map((item) => parseFloat(item.amount) || 0),
  )

  return {
    ret_code: 1024,
    description: 'Success',
    items,
    info: {
      count: items.length,
      count_paid: items.filter((item) => item.status === 6).length,
      count_won: items.filter((item) => item.status === 4 || item.status === 6)
        .length,
      tot_in: totIn.toFixed(2),
      tot_cancelled: totCancelled.toFixed(2),
      tot_out: totOut.toFixed(2),
      tot_profit: Math.round((totIn - totOut) * 100) / 100,
      grandtotal: {
        in: totIn,
        cancelled: totCancelled.toFixed(2),
        out: totOut.toFixed(2),
      },
    },
  }
}
