'use client'

// Sorgente alternativa per la Lista ticket. La cassa retail non la usa (valori
// di default: /api/ticket/list, pagamento attivo, orari mostrati così come
// arrivano). Il web la imposta perché /api/ticket/list è riservato al cassiere
// ("Level error" con il codice giocatore).
import { createContext } from 'react'
import type { TicketListResponse } from './types'

export type TicketListRequest = {
  /** dd-MM-yyyy */
  dateStart: string
  /** dd-MM-yyyy */
  dateEnd: string
  status: number
  payment: number
}

export type TicketListSource = {
  /** sostituisce la chiamata a /api/ticket/list */
  fetchList?: (request: TicketListRequest) => Promise<TicketListResponse>
  /** nasconde le azioni di cassa (pagamento del ticket) */
  readOnly?: boolean
  /** l'orario del ticket arriva in UTC: va mostrato nel fuso del dispositivo */
  utcTimes?: boolean
}

export const TicketListSourceContext = createContext<TicketListSource>({})

type TicketTime = [
  string | number,
  number,
  string | number,
  string | number,
  string | number,
  string | number,
]

/** [anno, mese 0-11, giorno, ora, min, sec] in UTC → stesso formato in ora locale */
export function utcTicketTimeToLocal<T extends ReadonlyArray<unknown>>(
  time: T,
): T {
  if (!Array.isArray(time)) return time
  const [year, month, day, hour, min, sec] = time as unknown as TicketTime
  const date = new Date(
    Date.UTC(
      Number(year),
      Number(month),
      Number(day),
      Number(hour),
      Number(min),
      Number(sec) || 0,
    ),
  )
  if (isNaN(date.getTime())) return time
  return [
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ] as unknown as T
}
