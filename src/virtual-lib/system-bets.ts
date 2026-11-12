import { generateSystemGroups as generateRetailSystemGroups } from '@/retail-lib/system-bets'
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

  const retailEntries = entries.map((entry) => {
    const market =
      normalizeMarketName(entry.market) === 'underover'
        ? `${entry.market} ${underOverThreshold(entry)}`
        : entry.market
    return { ...entry, market } as unknown as RetailBetEntry
  })

  const toVirtual = (combos?: RetailBetEntry[][]): BetEntry[][] | undefined =>
    combos?.map((combo) =>
      combo.map((entry) => originalsById.get(entry.id) as BetEntry),
    )

  return generateRetailSystemGroups(retailEntries, limits).map(
    (group: RetailSystemGroup) => ({
      ...group,
      combinations: toVirtual(group.combinations) ?? [],
      minWinAssignedCombinations: toVirtual(group.minWinAssignedCombinations),
      maxWinAssignedCombinations: toVirtual(group.maxWinAssignedCombinations),
    }),
  )
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
