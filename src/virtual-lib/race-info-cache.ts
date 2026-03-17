import { UpcomingEvent, UpcomingRace } from './types'
import { createPGVirtualAPICall } from './utils'

// Shared race info cache — used by upcoming-race-card and events-context
export const raceInfoCache = new Map<string, UpcomingRace>()
export let moduleHasLoadedOnce = false
export let lastRaceInfo: UpcomingRace | undefined = undefined

export function setModuleHasLoadedOnce(value: boolean) {
  moduleHasLoadedOnce = value
}

export function setLastRaceInfo(value: UpcomingRace | undefined) {
  lastRaceInfo = value
}

export function getCacheKey(extId: string | number, id: number): string {
  return `${extId}_${id}`
}

// Pre-fetch race info for a list of events in background (fire-and-forget)
export function prefetchRaceInfo(
  events: UpcomingEvent[],
  initCode: string,
  operator?: string,
) {
  for (const event of events) {
    const key = getCacheKey(event.extId!, event.id)
    if (raceInfoCache.has(key)) continue

    createPGVirtualAPICall(
      `/api/event/info/${event.extId}/${event.id}`,
      initCode,
      undefined,
      operator,
    )
      .then((response) => {
        if (!response.ok) return
        return response.json()
      })
      .then((data) => {
        if (!data) return
        const upcomingRace: UpcomingRace = {
          ...data.current,
          id: parseInt(data.int_event_id),
        }
        raceInfoCache.set(key, upcomingRace)
        lastRaceInfo = upcomingRace
        moduleHasLoadedOnce = true
      })
      .catch(() => {
        // Silent fail — pre-fetch is best-effort
      })
  }
}
