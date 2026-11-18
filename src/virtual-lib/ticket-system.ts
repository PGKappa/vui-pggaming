import type { TicketDetailInfo } from '@/retail-lib/types'
import {
  computeGroupWinRounded,
  computeSystemMinWin,
  generateSystemGroups,
  winHalfUp,
} from './system-bets'
import { BetEntry, Discipline } from './types'

const DISCIPLINE_BY_GAME: Record<string, Discipline> = {
  dogs6: Discipline.DOGS,
  dogs8: Discipline.DOGS8,
  horses6: Discipline.HORSES,
  soccer: Discipline.FOOTBALL,
}

const disciplineOf = (gameId: string, channelId: number) =>
  DISCIPLINE_BY_GAME[gameId?.toLowerCase()] ??
  (channelId === 5
    ? Discipline.DOGS8
    : channelId === 3
      ? Discipline.HORSES
      : Discipline.DOGS)

/**
 * Giocate del ticket nello stesso formato della schedina: una per ogni
 * esito di ogni mercato, con la fissa dell'evento (isBanker). Così il
 * dettaglio usa esattamente gli stessi calcoli della Bet Slip.
 */
export function ticketToBetEntries(info: TicketDetailInfo): BetEntry[] {
  const entries: BetEntry[] = []
  for (const sel of info.selections) {
    const discipline = disciplineOf(sel.gameId, sel.channelId)
    const fixed = String(sel.isBanker).toLowerCase() === 'true'
    for (const market of sel.markets) {
      for (const outcome of market.selections) {
        entries.push({
          id: entries.length + 1,
          market: market.description,
          fixed,
          bet: {
            discipline,
            event: {
              name: sel.trackName,
              number: sel.eventId,
              startingAt: new Date(sel.startTime),
            },
            competitors: outcome.description,
            option: {
              outcome: outcome.description,
              decPrice: parseFloat(outcome.odds) || 0,
            },
          },
        } as BetEntry)
      }
    }
  }
  return entries
}

export type TicketSystemGroup = {
  size: number
  /** numero di colonne del gruppo */
  combinations: number
  /** importo per colonna */
  stake: number
  /** importo totale del gruppo, come salvato nel ticket */
  total: number
}

/**
 * Gruppi, colonne e vincite di un ticket. Nel ticket `system` vale
 * { dimensione: importo TOTALE del gruppo } (lo stesso che invia la
 * schedina): l'importo per colonna è il totale diviso per le colonne del
 * gruppo, calcolate con le stesse regole della schedina (fisse, più mercati
 * sulla stessa corsa).
 */
export function computeTicketSystem(
  info: TicketDetailInfo,
  isSystem: boolean,
): { groups: TicketSystemGroup[]; minWin: number; maxWin: number } {
  const entries = ticketToBetEntries(info)
  if (entries.length === 0) return { groups: [], minWin: 0, maxWin: 0 }

  if (!isSystem) {
    // singola/multipla: una colonna con tutte le quote
    const win = winHalfUp(
      entries.map((entry) => entry.bet.option.decPrice),
      parseFloat(String(info.amount)) || 0,
    )
    return { groups: [], minWin: win, maxWin: win }
  }

  const totals = Object.fromEntries(
    Object.entries(info.system ?? {}).map(([size, total]) => [
      parseInt(size, 10),
      parseFloat(String(total)) || 0,
    ]),
  )

  const played = generateSystemGroups(entries, {
    maxSelections: Number.MAX_SAFE_INTEGER,
    maxEvents: Number.MAX_SAFE_INTEGER,
  })
    .filter((group) => totals[group.size] > 0)
    .map((group) => ({
      ...group,
      stake:
        group.combinations.length > 0
          ? totals[group.size] / group.combinations.length
          : 0,
    }))

  const maxWin =
    Math.round(
      played.reduce(
        (sum, group) => sum + computeGroupWinRounded(group).maxWin,
        0,
      ) * 100,
    ) / 100

  const groups: TicketSystemGroup[] = played.map((group) => ({
    size: group.size,
    combinations: group.combinations.length,
    stake: group.stake,
    total: totals[group.size],
  }))
  // gruppo del ticket senza colonne ricalcolabili: resta visibile con il
  // suo totale, così nessun importo giocato sparisce dal dettaglio
  for (const [size, total] of Object.entries(totals)) {
    const n = Number(size)
    if (n > 0 && total > 0 && !groups.some((group) => group.size === n)) {
      groups.push({ size: n, combinations: 0, stake: 0, total })
    }
  }

  return {
    groups: groups.sort((a, b) => a.size - b.size),
    minWin: computeSystemMinWin(played, entries),
    maxWin,
  }
}
