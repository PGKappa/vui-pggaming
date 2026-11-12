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
