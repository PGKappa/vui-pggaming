import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeMarketName(market: string): string {
  const m = market.toLowerCase().trim()

  if (m.includes('winn') || m.includes('vinc') || m.includes('ganador'))
    return 'winner'
  if (m.includes('place') || m.includes('piazz') || m.includes('colocado'))
    return 'placed'
  if (m.includes('show') || m.includes('podi')) return 'show'
  if (m.includes('exacta') || m.includes('accoppiata in ordine'))
    return 'exacta'
  if (m.includes('quinella') || m.includes('accoppiata a girare'))
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
    m.includes('even') ||
    m.includes('odd') ||
    m.includes('pari') ||
    m.includes('dispari') ||
    m.includes('par') ||
    m.includes('impar')
  )
    return 'even_odd'
  if (
    m.includes('under') ||
    m.includes('over') ||
    m.includes('menos') ||
    m.includes('más')
  ) {
    // Normalizza rimuovendo spazi extra e gestendo gli slash escapati
    return m.replace(/\s+/g, ' ').replace(/\\\//g, '/')
  }

  return m
}

// API URLs - direttamente nel codice per evitare problemi con env online
export const API_URLS = {
  PGVIRTUAL: 'http://localhost:8080',
  CASHIER_INIT: 'http://localhost:8080/api/init/cashier',
  SOCCER: 'http://localhost:8080/football/incoming.php',
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

// Helper per chiamate API PGVirtual pulite
export function createPGVirtualAPICall(
  endpoint: string,
  initCode: string,
  options?: RequestInit,
  operator?: string,
) {
  const finalOperator = operator || 'pg'

  const finalOptions = {
    ...options,
    headers: {
      ...options?.headers,
      accept: 'application/json',
      authorization: `Bearer ${initCode}`,
      'content-type': 'application/json',
      operator: finalOperator,
    },
    mode: 'cors' as const,
    credentials: 'include' as const,
  }

  console.log('🔐 createPGVirtualAPICall:', {
    endpoint,
    initCode,
    headers: finalOptions.headers,
    operator: finalOperator,
  })

  return fetch(`${PGVIRTUAL_API_URL}${endpoint}`, finalOptions)
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
export async function fetchCashierInit(
  initCode: string,
  operator?: string,
): Promise<any> {
  const finalOperator = operator || 'pg'

  const response = await fetch(API_URLS.CASHIER_INIT, {
    headers: {
      accept: 'application/json',
      'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
      authorization: `Bearer ${initCode}`,
      operator: finalOperator,
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
