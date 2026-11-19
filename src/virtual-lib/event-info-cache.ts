import { UpcomingRace } from '@/virtual-lib/types'
import { getOperatorFromUrl, PGVIRTUAL_API_URL } from '@/virtual-lib/utils'

// Dettagli delle corse (/api/event/info) tenuti in memoria: riaprire una corsa
// già vista o passare alla successiva (già caricata in anticipo) è immediato.

// Oltre questa età il dato si mostra comunque, ma si riscarica in background
export const EVENT_INFO_FRESH_MS = 30 * 1000
// Oltre questa età la voce si elimina (la corsa è ormai partita)
const EVENT_INFO_MAX_AGE_MS = 15 * 60 * 1000

type CacheEntry = { data: UpcomingRace; fetchedAt: number }

const cache = new Map<string, CacheEntry>()
const inFlight = new Map<string, Promise<UpcomingRace>>()

const cacheKey = (extId: string | number | undefined, id: number) =>
  `${extId}/${id}`

function pruneCache() {
  const now = Date.now()
  cache.forEach((entry, key) => {
    if (now - entry.fetchedAt > EVENT_INFO_MAX_AGE_MS) cache.delete(key)
  })
}

export function getCachedEventInfo(
  extId: string | number | undefined,
  id: number,
): CacheEntry | undefined {
  const entry = cache.get(cacheKey(extId, id))
  if (!entry) return undefined
  if (Date.now() - entry.fetchedAt > EVENT_INFO_MAX_AGE_MS) {
    cache.delete(cacheKey(extId, id))
    return undefined
  }
  return entry
}

// Scarica i dettagli della corsa; richieste uguali in corso vengono unite
export function fetchEventInfo(
  extId: string | number | undefined,
  id: number,
): Promise<UpcomingRace> {
  const key = cacheKey(extId, id)
  const pending = inFlight.get(key)
  if (pending) return pending

  const initCode = localStorage.getItem('initCode')
  if (!initCode) return Promise.reject(new Error('Missing init_code'))

  const request = fetch(`${PGVIRTUAL_API_URL}/api/event/info/${key}`, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${initCode}`,
      operator: getOperatorFromUrl('sc'),
    },
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const upcomingRace: UpcomingRace = {
        ...data.current,
        id: parseInt(data.int_event_id),
      }
      pruneCache()
      cache.set(key, { data: upcomingRace, fetchedAt: Date.now() })
      return upcomingRace
    })
    .finally(() => {
      inFlight.delete(key)
    })

  inFlight.set(key, request)
  return request
}

// Carica in anticipo, senza errori a video, se non c'è già un dato fresco
export function prefetchEventInfo(
  extId: string | number | undefined,
  id: number,
) {
  const entry = getCachedEventInfo(extId, id)
  if (entry && Date.now() - entry.fetchedAt < EVENT_INFO_FRESH_MS) return
  fetchEventInfo(extId, id).catch(() => {})
}
