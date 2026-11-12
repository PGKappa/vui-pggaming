// Storico "Le mie scommesse" per il web.
// L'elenco completo dei ticket (/api/ticket/list) è riservato al cassiere
// (risponde "Level error" con il codice giocatore), mentre il dettaglio del
// singolo ticket (/api/ticket/{id}) è accessibile. Per questo salviamo in
// locale i codici dei ticket giocati da questo browser e ne carichiamo il
// dettaglio aggiornato (importo, vincita, stato) dall'API.

const MAX_TICKETS = 50

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
 * Risposta nel formato di /api/ticket/list costruita dai ticket giocati da
 * questo browser (il cui dettaglio è accessibile anche al giocatore).
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
) {
  const from = parseDayParam(request.dateStart)
  const toDay = parseDayParam(request.dateEnd)
  const to = toDay
    ? new Date(toDay.getFullYear(), toDay.getMonth(), toDay.getDate() + 1)
    : undefined

  const infos = await Promise.all(
    getStoredTicketIds(initCode).map(async (id) => {
      try {
        const data = await fetchTicket(id)
        return data?.ret_code === 1024 ? data.info : undefined
      } catch {
        return undefined
      }
    }),
  )

  const items = infos
    .filter((info) => info?.ticket_id && Array.isArray(info.time))
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
        _date: date,
      }
    })
    .filter(
      (item) =>
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
