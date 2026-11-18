import {
  computeSameEventOddsRange,
  generateSystemGroups as generateRetailSystemGroups,
} from '@/retail-lib/system-bets'
import type {
  BetEntry as RetailBetEntry,
  SystemGroup as RetailSystemGroup,
} from '@/retail-lib/types'
import {
  normalizeMarketName,
  normalizeUnderOverValue,
} from '@/retail-lib/utils'
import { BetEntry, Discipline, SystemGroup } from './types'

// Soglia under/over delle corse virtual: il mercato arriva come "Under/Over"
// senza numero, ma il calcolo vincite ne ha bisogno (cani a 8: 4.5, come la
// cassa; corse a 6: 3.5)
const underOverThreshold = (entry: BetEntry) =>
  entry.bet.discipline === Discipline.DOGS8 ? '4.5' : '3.5'

// Partenti di una corsa virtual (cani a 8: 8, cani e cavalli: 6). Senza
// questo dato il calcolo vincite simula solo 3 partenti quando non ci sono
// numeri giocati (Under/Over, Pari/Dispari): l'Over non vincerebbe mai e
// l'Under sempre.
const fieldSizeOf = (entry: BetEntry) =>
  entry.bet.discipline === Discipline.DOGS8 ? 8 : 6

const fieldSizeByEventOf = (entries: BetEntry[]) =>
  Object.fromEntries(
    entries.map((entry) => [eventKeyOf(entry), fieldSizeOf(entry)]),
  )

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
      ({
        ...entry,
        market: toRetailMarket(entry),
        bet: {
          ...entry.bet,
          option: { ...entry.bet.option, outcome: toRetailOutcome(entry) },
        },
      }) as unknown as RetailBetEntry,
  )

  const toVirtual = (combos?: RetailBetEntry[][]): BetEntry[][] | undefined =>
    combos?.map((combo) =>
      combo.map((entry) => originalsById.get(entry.id) as BetEntry),
    )

  const eventOutcomes = computeEventOutcomes(entries)
  const eventMins = new Map(
    [...eventOutcomes].map(([key, outcome]) => [key, outcome.min]),
  )
  const maxWinnerIds = new Set(
    [...eventOutcomes.values()].flatMap((outcome) => [...outcome.maxIds]),
  )

  return generateRetailSystemGroups(retailEntries, {
    ...limits,
    fieldSizeByEvent: {
      ...fieldSizeByEventOf(entries),
      ...limits?.fieldSizeByEvent,
    },
  }).map((group: RetailSystemGroup) => {
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
      // vincita massima: le combinazioni le cui selezioni vincono tutte
      // nell'esito migliore di ogni corsa (con Accoppiata/Trio a girare,
      // che il retail sommerebbe anche quando non possono vincere insieme)
      maxWinAssignedCombinations: combinations.filter((combo) =>
        combo.every((entry) => maxWinnerIds.has(entry.id)),
      ),
    }
  })
}

const eventKeyOf = (entry: BetEntry) =>
  `${entry.bet.discipline}-${entry.bet.event.number}`

const toRetailMarket = (entry: BetEntry) =>
  normalizeMarketName(entry.market) === 'underover'
    ? `${entry.market} ${underOverThreshold(entry)}`
    : entry.market

// Pari/Dispari come "even"/"odd": il calcolo del retail riconosce il pari
// cercando "pari" nel testo e quindi tratterebbe anche "Dispari" come pari
const EVEN_ODD_OUTCOMES: Record<string, 'even' | 'odd'> = {
  even: 'even',
  pari: 'even',
  par: 'even',
  pair: 'even',
  odd: 'odd',
  dispari: 'odd',
  impar: 'odd',
  impair: 'odd',
}

const toRetailOutcome = (entry: BetEntry) => {
  const outcome = entry.bet.option.outcome
  if (normalizeMarketName(entry.market) !== 'even_odd') return outcome
  return EVEN_ODD_OUTCOMES[outcome.toLowerCase().trim()] ?? outcome
}

/**
 * Esito minimo di ogni corsa: le selezioni che vincono nell'esito vincente
 * più basso e se la corsa può anche essere persa del tutto.
 */
type EventMinOutcome = {
  canLose: boolean
  winnerIds: Set<BetEntry['id']>
  odds: number
}

type EventOutcome = {
  min: EventMinOutcome
  /** selezioni che vincono nell'esito con la vincita più alta */
  maxIds: Set<BetEntry['id']>
}

function computeEventOutcomes(entries: BetEntry[]): Map<string, EventOutcome> {
  const byEvent = new Map<string, BetEntry[]>()
  for (const entry of entries) {
    const key = eventKeyOf(entry)
    if (!byEvent.has(key)) byEvent.set(key, [])
    byEvent.get(key)!.push(entry)
  }

  const result = new Map<string, EventOutcome>()
  for (const [key, eventEntries] of byEvent) {
    if (eventEntries.length === 1) {
      const entry = eventEntries[0]
      result.set(key, {
        min: {
          canLose: true,
          winnerIds: new Set([entry.id]),
          odds: entry.bet.option.decPrice,
        },
        maxIds: new Set([entry.id]),
      })
      continue
    }

    // corse: si simulano gli arrivi, così anche Accoppiata e Trio a girare
    // vincono solo insieme agli esiti compatibili
    const race = simulateRace(eventEntries)
    if (race) {
      result.set(key, race)
      continue
    }

    // calcio (o mercato corse sconosciuto): stessa logica del retail
    const { minAssigned, maxAssigned, canLose } = computeSameEventOddsRange(
      eventEntries.map((entry) => ({
        odds: entry.bet.option.decPrice,
        market: toRetailMarket(entry),
        outcome: toRetailOutcome(entry),
        entry,
      })),
      fieldSizeOf(eventEntries[0]),
    )
    result.set(key, {
      min: {
        canLose: canLose || minAssigned.length === 0,
        winnerIds: new Set(minAssigned.map((a) => a.entry.id)),
        odds: minAssigned.reduce((sum, a) => sum + a.odds, 0),
      },
      maxIds: new Set(maxAssigned.map((a) => a.entry.id)),
    })
  }
  return result
}

// numeri dei partenti di un esito ("1-2 ordine libero" -> [1, 2])
const runnersOf = (outcome: string) =>
  (outcome.match(/\d+/g) ?? []).map((n) => parseInt(n, 10))

const sameRunners = (a: number[], b: number[]) =>
  a.length === b.length && a.every((n) => b.includes(n))

/**
 * Funzione che dice se una selezione vince con un certo ordine d'arrivo (i
 * primi tre), o null se il mercato non è un mercato corse conosciuto.
 */
function raceWinCheck(entry: BetEntry): ((finish: number[]) => boolean) | null {
  const market = normalizeMarketName(entry.market)
  const outcome = entry.bet.option.outcome
  const runners = runnersOf(outcome)
  switch (market) {
    case 'winner':
      return (finish) => finish[0] === runners[0]
    case 'placed':
      return (finish) => finish.slice(0, 2).includes(runners[0])
    case 'show':
      return (finish) => finish.slice(0, 3).includes(runners[0])
    case 'exacta':
      return (finish) => finish[0] === runners[0] && finish[1] === runners[1]
    case 'quinella':
      return (finish) => sameRunners(finish.slice(0, 2), runners)
    case 'trifecta':
      return (finish) =>
        finish[0] === runners[0] &&
        finish[1] === runners[1] &&
        finish[2] === runners[2]
    case 'boxed_trifecta':
      return (finish) => sameRunners(finish.slice(0, 3), runners)
    case 'even_odd': {
      const side = toRetailOutcome(entry)
      if (side !== 'even' && side !== 'odd') return null
      return (finish) => (finish[0] % 2 === 0) === (side === 'even')
    }
    case 'underover': {
      const side = normalizeUnderOverValue(outcome)
      const threshold = parseFloat(underOverThreshold(entry))
      if (side === 'under') return (finish) => finish[0] < threshold
      if (side === 'over') return (finish) => finish[0] > threshold
      return null
    }
    default:
      return null
  }
}

/**
 * Esiti minimo e massimo di una corsa provando tutti gli ordini d'arrivo dei
 * primi tre: in ogni arrivo vincono solo le selezioni compatibili, quindi
 * due esiti che non possono uscire insieme (es. Accoppiata a girare 1-2 e
 * Accoppiata in ordine 1-3) non si sommano mai. Null per il calcio o per un
 * mercato che non si sa simulare.
 */
function simulateRace(eventEntries: BetEntry[]): EventOutcome | null {
  if (eventEntries[0].bet.discipline === Discipline.FOOTBALL) return null
  const checks = eventEntries.map(raceWinCheck)
  if (checks.some((check) => check === null)) return null

  const fieldSize = Math.max(
    fieldSizeOf(eventEntries[0]),
    ...eventEntries.flatMap((entry) => runnersOf(entry.bet.option.outcome)),
  )

  let best = { odds: -1, ids: new Set<BetEntry['id']>() }
  let worst = { odds: Infinity, ids: new Set<BetEntry['id']>() }
  let canLose = false
  const finish: number[] = []
  const visit = () => {
    if (finish.length === 3) {
      const ids = new Set<BetEntry['id']>()
      let odds = 0
      eventEntries.forEach((entry, index) => {
        if (checks[index]!(finish)) {
          ids.add(entry.id)
          odds += entry.bet.option.decPrice
        }
      })
      if (odds > best.odds) best = { odds, ids }
      if (odds === 0) canLose = true
      else if (odds < worst.odds) worst = { odds, ids }
      return
    }
    for (let n = 1; n <= fieldSize; n++) {
      if (finish.includes(n)) continue
      finish.push(n)
      visit()
      finish.pop()
    }
  }
  visit()

  const hasWin = worst.odds !== Infinity
  return {
    min: {
      canLose: canLose || !hasWin,
      winnerIds: hasWin ? worst.ids : new Set(),
      odds: hasWin ? worst.odds : 0,
    },
    maxIds: best.ids,
  }
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

/**
 * Vincita di una colonna (puntata x prodotto delle quote) arrotondata al
 * centesimo con criterio HALF_UP. Il calcolo è fatto su interi: in virgola
 * mobile 3,35 x 0,70 vale 2,34499... e diventerebbe 2,34 invece di 2,35.
 */
const ODDS_SCALE = 10_000
// l'importo per colonna può avere frazioni di centesimo (template a importo
// esatto: 1,00 su 3 colonne = 0,3333...): si tiene al milionesimo
const STAKE_SCALE = 1_000_000
export function winHalfUp(odds: number[], stake: number): number {
  const stakeScaled = Math.round(stake * STAKE_SCALE)
  if (stakeScaled <= 0) return 0
  let numerator = BigInt(stakeScaled)
  // risultato in centesimi: importo / STAKE_SCALE * 100
  let denominator = BigInt(STAKE_SCALE / 100)
  for (const value of odds) {
    numerator *= BigInt(Math.round(value * ODDS_SCALE))
    denominator *= BigInt(ODDS_SCALE)
  }
  // centesimi arrotondati per eccesso da ,5 in su
  const two = BigInt(2)
  const cents = (two * numerator + denominator) / (two * denominator)
  return Number(cents) / 100
}

const comboWinRounded = (combo: BetEntry[], stake: number) =>
  winHalfUp(
    combo.map((entry) => entry.bet.option.decPrice),
    stake,
  )

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
  const eventMins = new Map(
    [...computeEventOutcomes(entries)].map(([key, o]) => [key, o.min]),
  )
  const winning = minWinCombinations(active, eventMins)
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
 * centesimo HALF_UP.
 */
export function computeGroupWinRounded(group: SystemGroup): {
  minWin: number
  maxWin: number
} {
  if (group.stake <= 0 || group.combinations.length === 0) {
    return { minWin: 0, maxWin: 0 }
  }

  const comboWin = (combo: BetEntry[]) => comboWinRounded(combo, group.stake)

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

/**
 * Ripartisce l'importo di DIVIDI tra i gruppi selezionati rispettando passo e
 * minimo per colonna: ogni gruppo riceve 0 oppure una puntata per colonna
 * >= minimo e multipla del passo, il totale giocato non supera mai l'importo
 * inserito e la parte che non si può distribuire viene restituita (mai
 * aggiunta d'ufficio). Si parte da una quota uguale per tutte le colonne; il
 * resto va, un passo alla volta, prima ai gruppi con meno combinazioni.
 * Calcoli in centesimi per evitare errori di arrotondamento.
 */
export function distributeSystemStake(
  groups: { name: string; combinations: number }[],
  total: number,
  step: number,
  minStake: number,
): {
  stakes: Record<string, number>
  undistributed: number
  minRequired: number
} {
  const totalCents = Math.round(total * 100)
  const stepCents = Math.max(1, Math.round(step * 100))
  // puntata minima per colonna: il primo multiplo del passo >= minimo
  const minCents =
    Math.max(1, Math.ceil(Math.round(minStake * 100) / stepCents)) * stepCents
  const valid = groups.filter((group) => group.combinations > 0)
  const totalCombinations = valid.reduce((sum, g) => sum + g.combinations, 0)

  const stakeCents: Record<string, number> = {}
  valid.forEach((group) => (stakeCents[group.name] = 0))

  let remaining = totalCents
  if (totalCombinations > 0) {
    const base =
      Math.floor(totalCents / totalCombinations / stepCents) * stepCents
    if (base >= minCents) {
      valid.forEach((group) => (stakeCents[group.name] = base))
      remaining -= base * totalCombinations
    }
  }

  const byPriority = [...valid].sort((a, b) => a.combinations - b.combinations)
  let progress = true
  while (progress) {
    progress = false
    for (const group of byPriority) {
      const increment = stakeCents[group.name] === 0 ? minCents : stepCents
      const cost = increment * group.combinations
      if (cost <= remaining) {
        stakeCents[group.name] += increment
        remaining -= cost
        progress = true
      }
    }
  }

  const stakes: Record<string, number> = {}
  for (const [name, cents] of Object.entries(stakeCents)) {
    stakes[name] = cents / 100
  }
  const cheapest = byPriority[0]
  return {
    stakes,
    undistributed: remaining / 100,
    // importo minimo per giocare almeno il gruppo con meno combinazioni
    minRequired: cheapest ? (minCents * cheapest.combinations) / 100 : 0,
  }
}
