import {
  fetchSlotStandingsPayload,
  invalidateSlotStandings,
  mapBackendStandings,
} from '@/retail-lib/soccer-stats'
import { TeamRanking } from '@/retail-lib/types'
import { fetchSoccerRealtimeToken } from '@/retail-lib/utils'
import { useEffect, useState } from 'react'

export { mapBackendStandings }

// Hub realtime soccer: protocollo SignalR JSON su WebSocket diretto. Il
// negotiate del hub non ha CORS per il dominio, il WebSocket non ne ha bisogno.
const REALTIME_HUB = 'wss://soccer-realtime-dev.pgvirtual.eu/hubs/soccer'
const REALTIME_API = 'https://soccer-realtime-dev.pgvirtual.eu'
const RS = '\u001e'
const STORAGE_KEY = 'soccer_standings_v3'
// I "finished" di una giornata arrivano in raffica: si aspetta la fine della
// raffica prima di rileggere la classifica.
const BURST_WAIT_MS = 3000
// Ricontrollo periodico: intercetta il cambio di torneo anche se si perde
// qualche messaggio del hub.
const REFRESH_MS = 5 * 60 * 1000

export type StandingsSource = 'backend' | 'nessuna'

export type StandingsState = {
  rankings: TeamRanking[]
  source: StandingsSource
  /** Quando il fornitore ha calcolato questa classifica, non quando l'abbiamo letta. */
  updatedAt?: string
  /** Torneo a cui si riferisce: serve a non mischiare campionati diversi. */
  tournamentId?: string
  /** Giornata, es. "7/38". */
  round?: string
  /** Numero di giornata, per confrontare due classifiche dello stesso torneo. */
  roundNumber?: number
  note?: string
}

const EMPTY: StandingsState = { rankings: [], source: 'nessuna' }

function tempo(value: unknown): number {
  const t = new Date(String(value ?? '')).getTime()
  return Number.isFinite(t) ? t : 0
}

// Dal hub l'identificativo del torneo arriva come eventId, dalla REST come
// tournamentId.
function tournamentIdOf(p: any): string | undefined {
  return String(p?.tournamentId ?? p?.eventId ?? '') || undefined
}

function standingsFromPayload(p: any): StandingsState | undefined {
  const rankings = mapBackendStandings(p?.standings)
  if (!rankings.length) return undefined
  const round = Number(p?.roundNumber) || undefined
  const totale = p?.maxRoundCount
  return {
    rankings,
    source: 'backend',
    updatedAt: p?.occurredAt ?? p?.updatedAt ?? undefined,
    tournamentId: tournamentIdOf(p),
    round: round ? `${round}${totale ? '/' + totale : ''}` : undefined,
    roundNumber: round,
  }
}

function torneoInCorso(list: any): any | undefined {
  const tornei = (Array.isArray(list) ? list : [list]).filter(
    (x: any) => x?.standings?.length,
  )
  const recenti = [...tornei].sort((a, b) => tempo(b.updatedAt) - tempo(a.updatedAt))
  return recenti.find((x) => x.isFinished !== true) ?? recenti[0]
}

// Riserva usata solo quando non si sa quale partita e' in cartellone: la rotta
// generale restituisce anche i campionati gia' conclusi, tutti fermi all'ultima
// giornata, quindi si prende quello ancora in corso.
async function fetchStandingsGenerali(): Promise<StandingsState | undefined> {
  try {
    const r = await fetch(`${REALTIME_API}/api/standings?limit=5`)
    if (!r.ok) return undefined
    const scelto = torneoInCorso(await r.json())
    return scelto ? standingsFromPayload(scelto) : undefined
  } catch {
    return undefined
  }
}

function load(): StandingsState | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StandingsState) : undefined
  } catch {
    return undefined
  }
}

function save(view: StandingsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(view))
  } catch {}
}

/**
 * Classifica del campionato in corso, quello a cui appartengono le partite in
 * cartellone: si legge da /api/standings/by-event della partita mostrata, la
 * stessa fonte che usa il riquadro statistiche, e si aggiorna a ogni fine
 * giornata con l'evento SoccerTournamentStandings del hub.
 *
 * L'ancoraggio alla partita e' quello che tiene insieme le due cose: la rotta
 * generale restituisce anche i campionati conclusi, e prendendo "il piu'
 * recente" si finiva sull'ultima giornata di un campionato finito mentre le
 * statistiche mostravano quello vero.
 */
export function useSoccerStandings(
  eventId?: string | number,
  groupId?: string | number,
): StandingsState {
  const [state, setState] = useState<StandingsState>(EMPTY)

  useEffect(() => {
    const saved = load()
    if (saved?.rankings?.length) setState(saved)

    let ws: WebSocket | null = null
    let pingTimer: ReturnType<typeof setInterval> | undefined
    let burstTimer: ReturnType<typeof setTimeout> | undefined
    let retry = 0
    let disposed = false
    // Torneo a cui si riferisce la classifica mostrata: i messaggi del hub che
    // parlano di un altro campionato non devono sovrascriverla.
    let torneo: string | undefined = saved?.tournamentId

    const applica = (next: StandingsState | undefined) => {
      if (disposed || !next) return
      setState((prev) => {
        const stessoTorneo =
          !!next.tournamentId && next.tournamentId === prev.tournamentId
        // Dentro lo stesso torneo si va solo avanti; cambiando torneo si
        // riparte, perche' la giornata torna a 1 e le date non sono confrontabili.
        if (
          stessoTorneo &&
          prev.rankings.length > 0 &&
          (next.roundNumber ?? 0) < (prev.roundNumber ?? 0)
        ) {
          return prev
        }
        torneo = next.tournamentId ?? torneo
        save(next)
        return next
      })
    }

    async function carica() {
      if (disposed) return
      const payload = await fetchSlotStandingsPayload(eventId, groupId)
      if (payload) {
        applica(standingsFromPayload(payload))
        return
      }
      // Nessuna partita in cartellone (di notte il palinsesto e' vuoto):
      // si ripiega sulla rotta generale.
      applica(await fetchStandingsGenerali())
    }

    carica()
    const refreshTimer = setInterval(carica, REFRESH_MS)

    function onStandings(p: any) {
      const id = tournamentIdOf(p)
      // Un campionato concluso puo' pubblicare la sua classifica finale mentre
      // ne e' gia' partito un altro: si ignora, e si ricontrolla qual e' quello
      // in cartellone.
      if (torneo && id && id !== torneo) {
        invalidateSlotStandings()
        carica()
        return
      }
      applica(standingsFromPayload(p))
    }

    function onFineGiornata() {
      clearTimeout(burstTimer)
      burstTimer = setTimeout(() => {
        invalidateSlotStandings()
        carica()
      }, BURST_WAIT_MS)
    }

    function scheduleRetry() {
      if (disposed) return
      const delay = [1, 2, 5, 10, 15, 30][Math.min(retry++, 5)] * 1000
      setTimeout(connect, delay)
    }

    async function connect() {
      if (disposed) return
      let token: string | undefined
      try {
        token = await fetchSoccerRealtimeToken()
      } catch {}
      if (!token) return scheduleRetry()

      ws = new WebSocket(`${REALTIME_HUB}?access_token=${encodeURIComponent(token)}`)
      ws.onopen = () => ws?.send(JSON.stringify({ protocol: 'json', version: 1 }) + RS)
      ws.onmessage = (m) => {
        for (const frame of String(m.data).split(RS)) {
          if (!frame) continue
          let msg: any
          try {
            msg = JSON.parse(frame)
          } catch {
            continue
          }
          if (msg.type === undefined && !msg.error) {
            retry = 0
            clearInterval(pingTimer)
            pingTimer = setInterval(() => {
              try {
                ws?.send(JSON.stringify({ type: 6 }) + RS)
              } catch {}
            }, 15000)
          } else if (msg.type === 1 && msg.target === 'SoccerTournamentStandings') {
            for (const arg of msg.arguments ?? []) onStandings(arg)
          } else if (msg.type === 1 && msg.target === 'SoccerEventStatusChanged') {
            for (const arg of msg.arguments ?? []) {
              if (arg?.status === 'finished') onFineGiornata()
            }
          }
        }
      }
      ws.onclose = () => {
        clearInterval(pingTimer)
        scheduleRetry()
      }
    }

    connect()

    return () => {
      disposed = true
      clearInterval(refreshTimer)
      clearInterval(pingTimer)
      clearTimeout(burstTimer)
      try {
        ws?.close()
      } catch {}
    }
  }, [eventId, groupId])

  return state
}
