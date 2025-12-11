import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API URLs - direttamente nel codice per evitare problemi con env online
export const API_URLS = {
  PGVIRTUAL: 'https://apisuprema.pgvirtual.eu',
  CASHIER_INIT: 'https://apisuprema.pgvirtual.eu/api/init/cashier',
  SOCCER: 'https://cvgl.it/football/incoming.php',
  // Base per altre chiamate se necessario
  BASE: 'https://pg-gaming.stg.startegois.com/proxy',
} as const

// Backwards compatibility
export const PGVIRTUAL_API_URL = API_URLS.PGVIRTUAL
export const CASHIER_API_URL = API_URLS.CASHIER_INIT
export const SOCCER_API_URL = API_URLS.SOCCER
export const BASE_API_URL = API_URLS.BASE

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

/**
 * Converte una stringa data/ora dal timezone dell'API al timezone locale del browser
 * @param dateString - La stringa data ricevuta dall'API (es. "2025-12-11T15:00:00" o "2025-12-11 15:00:00")
 * @param apiTimezone - Il timezone dell'API (es. "America/Bogota", "Europe/Rome")
 * @returns Date object nel timezone locale del browser
 */
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

    // 1. Prendi la data senza timezone (sarà interpretata come locale dal browser)
    const naiveDate = new Date(normalizedString)

    if (isNaN(naiveDate.getTime())) {
      console.warn('Failed to parse date:', dateString)
      return new Date()
    }

    // 2. Calcola l'offset del timezone dell'API in minuti
    // Creiamo una data di riferimento e vediamo come viene formattata nel timezone API vs UTC
    const year = naiveDate.getFullYear()
    const month = String(naiveDate.getMonth() + 1).padStart(2, '0')
    const day = String(naiveDate.getDate()).padStart(2, '0')
    const hours = String(naiveDate.getHours()).padStart(2, '0')
    const minutes = String(naiveDate.getMinutes()).padStart(2, '0')
    const seconds = String(naiveDate.getSeconds()).padStart(2, '0')

    const dateStringFormatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`

    // Crea la stessa data interpretata come UTC
    const utcDate = new Date(dateStringFormatted + 'Z')

    // Ottieni l'offset del timezone dell'API rispetto a UTC
    // Calcoliamo quante ore di differenza ci sono
    const apiDateStr = new Date(utcDate).toLocaleString('en-US', {
      timeZone: apiTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    const utcDateStr = new Date(utcDate).toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    // Parse these formatted strings back to dates to get the offset
    const apiMs = new Date(apiDateStr).getTime()
    const utcMs = new Date(utcDateStr).getTime()
    const offsetMs = utcMs - apiMs

    // La data originale nel timezone dell'API corrisponde a questa data UTC
    const correctDate = new Date(utcDate.getTime() - offsetMs)

    return isNaN(correctDate.getTime()) ? naiveDate : correctDate
  } catch (error) {
    console.error(
      'Error parsing date with timezone:',
      error,
      'dateString:',
      dateString,
      'timezone:',
      apiTimezone,
    )
    // Fallback: prova parse semplice
    const fallbackDate = new Date(dateString.replace(' ', 'T'))
    return isNaN(fallbackDate.getTime()) ? new Date() : fallbackDate
  }
}

/**
 * Formatta una data nel timezone specificato
 * @param date - Date object da formattare
 * @param timezone - Timezone target (es. "America/Bogota")
 * @param locale - Locale per la formattazione (default: 'it-IT')
 * @returns Stringa formattata
 */
export function formatDateInTimezone(
  date: Date,
  timezone: string,
  locale: string = 'it-IT',
  options?: Intl.DateTimeFormatOptions,
): string {
  return date.toLocaleString(locale, {
    timeZone: timezone,
    ...options,
  })
}

// Helper per chiamate API PGVirtual pulite
export function createPGVirtualAPICall(
  endpoint: string,
  initCode: string,
  options?: RequestInit,
) {
  return fetch(`${PGVIRTUAL_API_URL}${endpoint}`, {
    ...options,
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${initCode}`,
      'content-type': 'application/json',
      operator: 'pg',
      ...options?.headers,
    },
    mode: 'cors',
    credentials: 'include',
  })
}

// Enum per le discipline
export enum Discipline {
  SOCCER = 'SOCCER',
  DOGS = 'DOGS',
  HORSES = 'HORSES',
}

// Helper per ottenere l'URL API corretto basato sulla disciplina
export function getAPIUrlForDiscipline(discipline: Discipline): string {
  switch (discipline) {
    case Discipline.SOCCER:
      return API_URLS.SOCCER
    case Discipline.DOGS:
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
): Promise<any> {
  const baseUrl = getAPIUrlForDiscipline(discipline)

  if (discipline === Discipline.SOCCER) {
    // Per il calcio usiamo l'API cvgl.it
    const response = await fetch(`${baseUrl}?t=${new Date().getTime()}`)
    return response.json()
  } else {
    // Per cani e cavalli usiamo PGVirtual API
    if (!initCode) throw new Error('InitCode required for racing events')
    return createPGVirtualAPICall('/api/event/list', initCode)
  }
}

// Helper per l'inizializzazione cashier (sempre all'avvio)
export async function fetchCashierInit(initCode: string): Promise<any> {
  const response = await fetch(API_URLS.CASHIER_INIT, {
    headers: {
      accept: 'application/json',
      'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
      authorization: `Bearer ${initCode}`,
      operator: 'pg',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
    body: JSON.stringify({ init_code: initCode }),
  })

  if (!response.ok) {
    throw new Error(`Cashier API error: ${response.status}`)
  }

  return response.json()
}

// Colori delle pettorine per cani e cavalli con codici colore esadecimali
export function getRacerColors(
  racerNumber: number,
  discipline: 'DOGS' | 'HORSES',
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
