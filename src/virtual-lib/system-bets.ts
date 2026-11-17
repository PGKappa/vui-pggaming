import {
  computeSameEventOddsRange,
  generateSystemGroups as generateRetailSystemGroups,
} from '@/retail-lib/system-bets'
import type {
  BetEntry as RetailBetEntry,
  SystemGroup as RetailSystemGroup,
} from '@/retail-lib/types'
import { normalizeMarketName } from '@/retail-lib/utils'
import { BetEntry, Discipline, SystemGroup } from './types'

// Soglia under/over delle corse virtual: il mercato arriva come "Under/Over"
// senza numero, ma il calcolo vincite ne ha bisogno (cani a 8: 4.5, come la
// cassa; corse a 6: 3.5)
const underOverThreshold = (entry: BetEntry) =>
  entry.bet.discipline === Discipline.DOGS8 ? '4.5' : '3.5'

/**
 * Gruppi del sistema calcolati con la stessa logica del retail: chiave evento
 * disciplina+numero, fisse, più selezioni sullo stesso evento (vincita min/max
 * sulle combinazioni che possono vincere insieme) e limiti da cashier_init.
 * Le combinazioni restituite contengono le BetEntry originali del virtual.
 */
export function generateSystemGroups(
  entries: BetEntry[],
  limits?: {
    maxSelections?: number
    maxEvents?: number
    fieldSizeByEvent?: Record<string, number>
  },
): SystemGroup[] {
  const originalsById = new Map(entries.map((entry) => [entry.id, entry]))

  const retailEntries = entries.map(
    (entry) =>
      ({ ...entry, market: toRetailMarket(entry) }) as unknown as RetailBetEntry,
  )

  const toVirtual = (combos?: RetailBetEntry[][]): BetEntry[][] | undefined =>
    combos?.map((combo) =>
      combo.map((entry) => originalsById.get(entry.id) as BetEntry),
    )

  const eventMins = computeEventMinOutcomes(entries)

  return generateRetailSystemGroups(retailEntries, limits).map(
    (group: RetailSystemGroup) => {
      const combinations = toVirtual(group.combinations) ?? []
      return {
        ...group,
        combinations,
        // vincita minima positiva del gruppo calcolata su tutte le corse
        // insieme (il retail la calcola solo sulle combinazioni di una corsa)
        minWinAssignedCombinations: minWinCombinations(
          [{ stake: 1, combinations }],
          eventMins,
        )[0],
        maxWinAssignedCombinations: toVirtual(group.maxWinAssignedCombinations),
      }
    },
  )
}

const eventKeyOf = (entry: BetEntry) =>
  `${entry.bet.discipline}-${entry.bet.event.number}`

const toRetailMarket = (entry: BetEntry) =>
  normalizeMarketName(entry.market) === 'underover'
    ? `${entry.market} ${underOverThreshold(entry)}`
    : entry.market

/**
 * Esito minimo di ogni corsa: le selezioni che vincono nell'esito vincente
 * più basso e se la corsa può anche essere persa del tutto.
 */
type EventMinOutcome = {
  canLose: boolean
  winnerIds: Set<BetEntry['id']>
  odds: number
}

function computeEventMinOutcomes(
  entries: BetEntry[],
): Map<string, EventMinOutcome> {
  const byEvent = new Map<string, BetEntry[]>()
  for (const entry of entries) {
    const key = eventKeyOf(entry)
    if (!byEvent.has(key)) byEvent.set(key, [])
    byEvent.get(key)!.push(entry)
  }

  const result = new Map<string, EventMinOutcome>()
  for (const [key, eventEntries] of byEvent) {
    if (eventEntries.length === 1) {
      const entry = eventEntries[0]
      result.set(key, {
        canLose: true,
        winnerIds: new Set([entry.id]),
        odds: entry.bet.option.decPrice,
      })
      continue
    }
    const { minAssigned, canLose } = computeSameEventOddsRange(
      eventEntries.map((entry) => ({
        odds: entry.bet.option.decPrice,
        market: toRetailMarket(entry),
        outcome: entry.bet.option.outcome,
        entry,
      })),
    )
    result.set(key, {
      canLose: canLose || minAssigned.length === 0,
      winnerIds: new Set(minAssigned.map((a) => a.entry.id)),
      odds: minAssigned.reduce((sum, a) => sum + a.odds, 0),
    })
  }
  return result
}

/**
 * Per un insieme di gruppi con le loro puntate trova l'esito delle corse con
 * la vincita totale positiva più bassa e restituisce, per ogni gruppo, le
 * combinazioni vincenti in quell'esito.
 *
 * La vincita cresce con la somma delle quote vincenti di ogni corsa, quindi
 * il minimo positivo si ottiene con ogni corsa persa (se possibile) o al suo
 * esito vincente più basso: si provano tutte queste alternative (al massimo
 * 2^corse). Le combinazioni di un gruppo sono il prodotto completo delle
 * selezioni delle loro corse, quindi la vincita di un insieme di corse è il
 * prodotto delle quote vincenti di ciascuna.
 */
function minWinCombinations(
  groups: { stake: number; combinations: BetEntry[][] }[],
  eventMins: Map<string, EventMinOutcome>,
): BetEntry[][][] {
  const signatures = groups.map((group) => {
    const unique = new Map<string, string[]>()
    for (const combo of group.combinations) {
      const keys = [...new Set(combo.map(eventKeyOf))].sort()
      unique.set(keys.join('|'), keys)
    }
    return [...unique.values()]
  })

  const eventKeys = [...new Set(signatures.flat(2))]
  const optional = eventKeys.filter(
    (key) => eventMins.get(key)?.canLose !== false,
  )
  if (optional.length > 16) return groups.map(() => [])

  let bestValue = Infinity
  let bestWinning: Set<string> | null = null
  for (let mask = 0; mask < 1 << optional.length; mask++) {
    const winning = new Set(
      eventKeys.filter((key) => {
        const index = optional.indexOf(key)
        return index === -1 || (mask & (1 << index)) !== 0
      }),
    )
    const oddsOf = (key: string) =>
      winning.has(key) ? (eventMins.get(key)?.odds ?? 0) : 0
    const value = groups.reduce(
      (sum, group, index) =>
        sum +
        group.stake *
          signatures[index].reduce(
            (acc, keys) =>
              acc + keys.reduce((prod, key) => prod * oddsOf(key), 1),
            0,
          ),
      0,
    )
    if (value > 1e-9 && value < bestValue) {
      bestValue = value
      bestWinning = winning
    }
  }

  if (!bestWinning) return groups.map(() => [])
  const winningIds = new Set<BetEntry['id']>()
  for (const key of bestWinning) {
    eventMins.get(key)?.winnerIds.forEach((id) => winningIds.add(id))
  }
  return groups.map((group) =>
    group.combinations.filter((combo) =>
      combo.every((entry) => winningIds.has(entry.id)),
    ),
  )
}

const comboWinRounded = (combo: BetEntry[], stake: number) =>
  Math.round(
    combo.reduce((acc, entry) => acc * entry.bet.option.decPrice, 1) *
      stake *
      100,
  ) / 100

/**
 * Vincita minima positiva dell'intero sistema: lo stesso esito delle corse
 * vale per tutti i gruppi giocati, quindi le loro vincite si sommano.
 */
export function computeSystemMinWin(
  groups: SystemGroup[],
  entries: BetEntry[],
): number {
  const active = groups.filter((group) => group.stake > 0)
  if (active.length === 0) return 0
  const winning = minWinCombinations(active, computeEventMinOutcomes(entries))
  const total = active.reduce(
    (sum, group, index) =>
      sum +
      winning[index].reduce(
        (acc, combo) => acc + comboWinRounded(combo, group.stake),
        0,
      ),
    0,
  )
  return Math.round(total * 100) / 100
}

/**
 * Vincita minima e massima di un gruppo, con ogni combinazione arrotondata al
 * centesimo (come il retail).
 */
export function computeGroupWinRounded(group: SystemGroup): {
  minWin: number
  maxWin: number
} {
  if (group.stake <= 0 || group.combinations.length === 0) {
    return { minWin: 0, maxWin: 0 }
  }

  const comboWin = (combo: BetEntry[]) => {
    const odds = combo.reduce(
      (acc, entry) => acc * entry.bet.option.decPrice,
      1,
    )
    return Math.round(odds * group.stake * 100) / 100
  }

  const maxCombos = group.maxWinAssignedCombinations ?? group.combinations
  const maxWin = maxCombos.reduce((acc, combo) => acc + comboWin(combo), 0)

  let minWin: number
  if (group.minWinAssignedCombinations !== undefined) {
    minWin = group.minWinAssignedCombinations.reduce(
      (acc, combo) => acc + comboWin(combo),
      0,
    )
  } else {
    minWin = group.combinations.reduce(
      (min, combo) => Math.min(min, comboWin(combo)),
      Infinity,
    )
    if (minWin === Infinity) minWin = 0
  }

  return {
    minWin: Math.round(minWin * 100) / 100,
    maxWin: Math.round(maxWin * 100) / 100,
  }
}
