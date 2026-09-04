import { BetEntry, SystemGroup } from '@/retail-lib/types'
import { normalizeMarketName, normalizeUnderOverValue } from '@/retail-lib/utils'
import { t } from 'i18next'

export function getMarketSlotCount(normalizedMarket: string): number {
  switch (normalizedMarket) {
    case 'winner':
      return 1
    case 'placed':
      return 2
    case 'show':
      return 3
    default:
      return 1
  }
}

function assignToRealSlots<T extends { odds: number }>(
  withSlots: { entry: T; slots: number }[],
  podiumSize: number,
  order: 'asc' | 'desc',
  limit?: number,
): T[] {
  const slotUsed = new Array(podiumSize + 1).fill(false) // 1-indexed
  const assigned: T[] = []
  const sorted = [...withSlots].sort((a, b) =>
    order === 'desc' ? b.entry.odds - a.entry.odds : a.entry.odds - b.entry.odds,
  )
  for (const { entry, slots } of sorted) {
    if (limit !== undefined && assigned.length >= limit) break
    const reach = Math.min(slots, podiumSize)
    for (let slot = reach; slot >= 1; slot--) {
      if (!slotUsed[slot]) {
        slotUsed[slot] = true
        assigned.push(entry)
        break
      }
    }
  }
  return assigned
}
function isFinishOrderMarket(normalizedMarket: string): boolean {
  return (
    normalizedMarket === 'winner' ||
    normalizedMarket === 'placed' ||
    normalizedMarket === 'show' ||
    normalizedMarket === 'exacta' ||
    normalizedMarket === 'trifecta' ||
    normalizedMarket === 'quinella' ||
    normalizedMarket === 'boxed_trifecta' ||
    normalizedMarket === 'even_odd' ||
    normalizedMarket.startsWith('underover') ||
    normalizedMarket.startsWith('home_underover') ||
    normalizedMarket.startsWith('away_underover')
  )
}

function underOverThreshold(
  rawMarket: string,
  fieldSize?: number,
): number | null {
  const fromName = rawMarket.match(/(\d+\.?\d*)/)
  if (fromName) return parseFloat(fromName[1])
  if (fieldSize !== undefined && fieldSize > 0) return fieldSize / 2 + 0.5
  return null
}

function isUnderOverMarket(normalizedMarket: string): boolean {
  return (
    normalizedMarket.startsWith('underover') ||
    normalizedMarket.startsWith('home_underover') ||
    normalizedMarket.startsWith('away_underover')
  )
}

// I mercati che elencano piu' corridori nell'esito ("1-4", "1-4-7").
function isMultiRunnerMarket(normalizedMarket: string): boolean {
  return (
    normalizedMarket === 'exacta' ||
    normalizedMarket === 'trifecta' ||
    normalizedMarket === 'quinella' ||
    normalizedMarket === 'boxed_trifecta'
  )
}

function evaluatesAsWin(
  normalizedMarket: string,
  rawMarket: string,
  outcome: string,
  finishOrder: number[],
  fieldSize?: number,
): boolean {
  const winnerNumber = finishOrder[0]

  if (normalizedMarket === 'winner') {
    return parseInt(outcome, 10) === winnerNumber
  }
  if (normalizedMarket === 'placed') {
    const n = parseInt(outcome, 10)
    return !isNaN(n) && finishOrder.slice(0, 2).includes(n)
  }
  if (normalizedMarket === 'show') {
    const n = parseInt(outcome, 10)
    return !isNaN(n) && finishOrder.slice(0, 3).includes(n)
  }
  if (normalizedMarket === 'exacta') {
    const [r1, r2] = outcome.split('-').map((n) => parseInt(n, 10))
    return finishOrder[0] === r1 && finishOrder[1] === r2
  }
  if (normalizedMarket === 'trifecta') {
    const [r1, r2, r3] = outcome.split('-').map((n) => parseInt(n, 10))
    return finishOrder[0] === r1 && finishOrder[1] === r2 && finishOrder[2] === r3
  }
  // Accoppiata "a girare": i due corridori nei primi due posti in QUALSIASI
  // ordine.
  if (normalizedMarket === 'quinella') {
    const picks = outcome.split('-').map((n) => parseInt(n, 10))
    if (picks.length !== 2 || picks.some(isNaN)) return false
    const top2 = finishOrder.slice(0, 2)
    return picks.every((n) => top2.includes(n))
  }
  // Trifecta "a girare"/Combinada: i tre corridori nei primi tre posti in
  // QUALSIASI ordine.
  if (normalizedMarket === 'boxed_trifecta') {
    const picks = outcome.split('-').map((n) => parseInt(n, 10))
    if (picks.length !== 3 || picks.some(isNaN)) return false
    const top3 = finishOrder.slice(0, 3)
    return picks.every((n) => top3.includes(n))
  }
  if (normalizedMarket === 'even_odd') {
    const isEven = winnerNumber % 2 === 0
    const side = normalizeEvenOddValue(outcome)
    return side === 'even' ? isEven : !isEven
  }
  if (isUnderOverMarket(normalizedMarket)) {
    const threshold = underOverThreshold(rawMarket, fieldSize)
    if (threshold === null) return false
    const side = normalizeUnderOverValue(outcome)
    return side === 'under' ? winnerNumber < threshold : winnerNumber > threshold
  }
  return false
}

function normalizeEvenOddValue(value: string): 'even' | 'odd' {
  const v = value.toLowerCase().trim()
  if (v.includes('impar') || v.includes('dispari') || v.includes('odd'))
    return 'odd'
  return 'even'
}

function forEachFinishOrder(
  fieldSize: number,
  positions: number,
  callback: (order: number[]) => void,
) {
  const used = new Array(fieldSize + 1).fill(false)
  const current: number[] = []
  const recurse = (depth: number) => {
    if (depth === positions) {
      callback(current)
      return
    }
    for (let n = 1; n <= fieldSize; n++) {
      if (used[n]) continue
      used[n] = true
      current.push(n)
      recurse(depth + 1)
      current.pop()
      used[n] = false
    }
  }
  recurse(0)
}

function independentGroupCanBeZero(
  normalizedMarket: string,
  picks: number,
  podiumSize: number,
  fieldSize?: number,
): boolean {
  if (fieldSize === undefined) return true

  const n = fieldSize
  switch (normalizedMarket) {
    case 'winner':
    case 'placed':
    case 'show':
      // Mercati posizionali: se i partenti NON coperti sono almeno quanti i
      // posti utili, esiste un arrivo che li occupa tutti e fa perdere tutto.
      return n - picks >= podiumSize
    case 'exacta':
      return picks < n * (n - 1)
    case 'quinella':
      return picks < (n * (n - 1)) / 2
    case 'trifecta':
      return picks < n * (n - 1) * (n - 2)
    case 'boxed_trifecta':
      return picks < (n * (n - 1) * (n - 2)) / 6
    case 'even_odd':
      // Due soli esiti: se sono giocati entrambi, uno vince comunque.
      return picks < 2
    default:
      if (isUnderOverMarket(normalizedMarket)) return picks < 2
      // Mercato sconosciuto: non possiamo affermare che vinca comunque.
      return true
  }
}

export function computeSameEventOddsRange<
  T extends { odds: number; market: string; outcome?: string },
>(
  entries: T[],
  fieldSize?: number,
): {
  minOdds: number
  maxOddsSum: number
  maxAssigned: T[]
  minAssigned: T[]
  canBeZero: boolean
} {
  if (entries.length === 0)
    return {
      minOdds: 0,
      maxOddsSum: 0,
      maxAssigned: [],
      minAssigned: [],
      canBeZero: true,
    }

  const simulableEntries: { entry: T; normalized: string }[] = []
  const independentEntries: T[] = []
  for (const entry of entries) {
    const normalized = normalizeMarketName(entry.market)
    const thresholdKnown =
      !isUnderOverMarket(normalized) ||
      underOverThreshold(entry.market, fieldSize) !== null
    if (
      isFinishOrderMarket(normalized) &&
      entry.outcome !== undefined &&
      thresholdKnown
    ) {
      simulableEntries.push({ entry, normalized })
    } else {
      independentEntries.push(entry)
    }
  }

  let maxOddsSum = 0
  let maxAssigned: T[] = []
  let minOdds = 0
  let minAssigned: T[] = []
  let simulableCanBeZero = false
  let independentAlwaysWins = false
  // Minimo della parte simulata e di cio' che vince COMUNQUE; piu' i
  // candidati "opzionali", cioe' i modi piu' economici di far vincere
  // qualcosa quando nulla e' obbligato a vincere.
  let simulableMinOdds = 0
  let simulableMinAssigned: T[] = []
  let forcedMinOdds = 0
  let forcedMinAssigned: T[] = []
  const optionalMinCandidates: { odds: number; assigned: T[] }[] = []

  if (simulableEntries.length > 0) {
    const numbersInPlay = simulableEntries
      .flatMap(({ entry, normalized }) =>
        normalized === 'winner' ||
        normalized === 'placed' ||
        normalized === 'show' ||
        isMultiRunnerMarket(normalized)
          ? (entry.outcome as string).split('-').map((n) => parseInt(n, 10))
          : [NaN],
      )
      .filter((n) => !isNaN(n))
    const effectiveFieldSize = Math.max(
      fieldSize ?? 0,
      3,
      numbersInPlay.length > 0 ? Math.max(...numbersInPlay) : 0,
    )
    const positions = Math.min(3, effectiveFieldSize)

    let bestSum = -1
    let bestWinners: T[] = []
    let worstPositiveSum = Infinity
    let worstPositiveWinners: T[] = []
    forEachFinishOrder(effectiveFieldSize, positions, (finishOrder) => {
      let sum = 0
      const winners: T[] = []
      for (const { entry, normalized } of simulableEntries) {
        if (
          evaluatesAsWin(
            normalized,
            entry.market,
            entry.outcome as string,
            finishOrder,
            fieldSize,
          )
        ) {
          sum += entry.odds
          winners.push(entry)
        }
      }
      if (sum > bestSum) {
        bestSum = sum
        bestWinners = winners
      }
      if (sum === 0) simulableCanBeZero = true
      if (sum > 0 && sum < worstPositiveSum) {
        worstPositiveSum = sum
        worstPositiveWinners = winners
      }
    })
    maxOddsSum += Math.max(0, bestSum)
    maxAssigned = maxAssigned.concat(bestWinners)
    simulableMinOdds = worstPositiveSum === Infinity ? 0 : worstPositiveSum
    simulableMinAssigned = worstPositiveWinners
  }

  if (independentEntries.length > 0) {
    const groups = new Map<string, T[]>()
    for (const entry of independentEntries) {
      const key = normalizeMarketName(entry.market)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(entry)
    }
    for (const groupEntries of groups.values()) {
      const withSlots = groupEntries.map((e) => ({
        entry: e,
        slots: getMarketSlotCount(normalizeMarketName(e.market)),
      }))
      const podiumSize = Math.max(...withSlots.map((e) => e.slots))
      const groupMaxAssigned = assignToRealSlots(withSlots, podiumSize, 'desc')
      maxOddsSum += groupMaxAssigned.reduce((sum, e) => sum + e.odds, 0)
      maxAssigned = maxAssigned.concat(groupMaxAssigned)
    }
  }

  if (independentEntries.length > 0) {
    const groups = new Map<string, T[]>()
    for (const entry of independentEntries) {
      const key = normalizeMarketName(entry.market)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(entry)
    }

    for (const [normalizedMarket, groupEntries] of groups) {
      const withSlots = groupEntries.map((e) => ({
        entry: e,
        slots: getMarketSlotCount(normalizeMarketName(e.market)),
      }))

      const podiumSize = Math.max(...withSlots.map((e) => e.slots))

      const uncovered =
        fieldSize !== undefined
          ? Math.max(0, fieldSize - groupEntries.length)
          : podiumSize
      const forcedWinCount = Math.max(
        1,
        Math.min(groupEntries.length, podiumSize - uncovered),
      )
      const groupMinAssigned = assignToRealSlots(
        withSlots,
        podiumSize,
        'asc',
        forcedWinCount,
      )

      if (
        independentGroupCanBeZero(
          normalizedMarket,
          groupEntries.length,
          podiumSize,
          fieldSize,
        )
      ) {
        // Il gruppo puo' perdere tutto: non va incluso a forza nel minimo
        // dell'evento, ma resta un candidato per renderlo positivo se non
        // vince nulla di obbligato.
        const cheapest = groupEntries.reduce((best, e) =>
          e.odds < best.odds ? e : best,
        )
        optionalMinCandidates.push({
          odds: cheapest.odds,
          assigned: [cheapest],
        })
      } else {
        independentAlwaysWins = true
        forcedMinOdds += groupMinAssigned.reduce((sum, e) => sum + e.odds, 0)
        forcedMinAssigned = forcedMinAssigned.concat(groupMinAssigned)
      }
    }
  }

  // Minimo dell'evento: prima cio' che vince OBBLIGATORIAMENTE (mercati a
  // copertura totale). Se non c'e' nulla di obbligato, l'evento puo' non
  // vincere niente: il suo minimo POSITIVO e' allora il modo piu' economico
  // per fargli vincere qualcosa.
  if (simulableEntries.length > 0 && !simulableCanBeZero) {
    forcedMinOdds += simulableMinOdds
    forcedMinAssigned = forcedMinAssigned.concat(simulableMinAssigned)
  }

  if (forcedMinAssigned.length > 0) {
    minOdds = forcedMinOdds
    minAssigned = forcedMinAssigned
  } else {
    const candidates = [...optionalMinCandidates]
    if (simulableMinAssigned.length > 0) {
      candidates.push({
        odds: simulableMinOdds,
        assigned: simulableMinAssigned,
      })
    }
    const best = candidates.reduce<{ odds: number; assigned: T[] } | null>(
      (acc, c) => (acc === null || c.odds < acc.odds ? c : acc),
      null,
    )
    minOdds = best ? best.odds : 0
    minAssigned = best ? best.assigned : []
  }

  const canBeZero =
    !independentAlwaysWins &&
    (simulableEntries.length === 0 || simulableCanBeZero)

  return { minOdds, maxOddsSum, maxAssigned, minAssigned, canBeZero }
}

export function getCombinations(
  entries: BetEntry[],
  comboSize: number,
  fixed: BetEntry[] = [],
): BetEntry[][] {
  const result: BetEntry[][] = []

  // Include disciplina + numero evento per distinguere eventi con stesso numero ma discipline diverse
  const eventKey = (e: BetEntry) => `${e.bet.discipline}-${e.bet.event.number}`

  const fixedGroups: Record<string, BetEntry[]> = {}
  fixed.forEach((f) => {
    const key = eventKey(f)
    if (!fixedGroups[key]) fixedGroups[key] = []
    fixedGroups[key].push(f)
  })
  const fixedEventKeys = Object.keys(fixedGroups)

  const fixedCombos: BetEntry[][] = []
  const buildFixedCombo = (idx: number, path: BetEntry[]) => {
    if (idx === fixedEventKeys.length) {
      fixedCombos.push([...path])
      return
    }
    const groupKey = fixedEventKeys[idx]
    for (const option of fixedGroups[groupKey]) {
      path.push(option)
      buildFixedCombo(idx + 1, path)
      path.pop()
    }
  }
  buildFixedCombo(0, [])

  const nonFixed = entries.filter((e) => !fixedGroups[eventKey(e)])

  const chooseRest = (
    needed: number,
    pool: BetEntry[],
    usedEvents: Set<string>,
    sink: BetEntry[][],
  ) => {
    if (needed === 0) {
      sink.push([])
      return
    }
    if (needed > pool.length) return

    const stack: {
      startIdx: number
      path: BetEntry[]
      used: Set<string>
      remaining: number
    }[] = [
      { startIdx: 0, path: [], used: new Set(usedEvents), remaining: needed },
    ]

    while (stack.length > 0) {
      const { startIdx, path, used, remaining } = stack.pop()!

      if (remaining === 0) {
        sink.push([...path])
        continue
      }

      if (startIdx >= pool.length || remaining > pool.length - startIdx)
        continue

      for (let i = startIdx; i < pool.length; i++) {
        const item = pool[i]
        const key = eventKey(item)
        if (used.has(key)) continue

        const newUsed = new Set(used)
        newUsed.add(key)
        const newPath = [...path, item]

        stack.push({
          startIdx: i + 1,
          path: newPath,
          used: newUsed,
          remaining: remaining - 1,
        })
      }
    }
  }

  for (const fc of fixedCombos) {
    const used = new Set<string>(fc.map(eventKey))
    const remainingNeeded = comboSize - fc.length
    if (remainingNeeded < 0) continue
    if (remainingNeeded === 0) {
      result.push(fc)
      continue
    }
    const restCombos: BetEntry[][] = []
    chooseRest(remainingNeeded, nonFixed, used, restCombos)
    for (const rc of restCombos) {
      result.push([...fc, ...rc])
    }
  }

  return result
}

const eventKeyOf = (e: BetEntry) => `${e.bet.discipline}-${e.bet.event.number}`
function crossProductEntries(groups: BetEntry[][][]): BetEntry[][] {
  let result: BetEntry[][] = [[]]
  for (const group of groups) {
    const next: BetEntry[][] = []
    for (const combo of result) {
      for (const alt of group) next.push([...combo, ...alt])
    }
    result = next
  }
  return result
}
type EventCombosInfo = {
  maxAssigned: BetEntry[][]
  positiveAssigned: BetEntry[][]
  positiveOdds: number
  canBeZero: boolean
}

function computeEventCombosInfo(
  candidateEntries: BetEntry[],
  fieldSize?: number,
): EventCombosInfo {
  if (candidateEntries.length <= 1) {
    return {
      maxAssigned: [candidateEntries],
      positiveAssigned: [candidateEntries],
      positiveOdds: candidateEntries.reduce(
        (sum, e) => sum + e.bet.option.decPrice,
        0,
      ),
      canBeZero: true,
    }
  }
  const withOdds = candidateEntries.map((e) => ({
    odds: e.bet.option.decPrice,
    market: e.market,
    outcome: e.bet.option.outcome,
    entry: e,
  }))
  const { minAssigned, maxAssigned, minOdds, canBeZero } =
    computeSameEventOddsRange(withOdds, fieldSize)
  return {
    maxAssigned: maxAssigned.map((a) => [a.entry]),
    positiveAssigned: minAssigned.map((a) => [a.entry]),
    positiveOdds: minOdds,
    canBeZero,
  }
}

// Sottoinsiemi di eventi che possono formare una combinazione di taglia
// `size`: devono contenere TUTTE le corse fisse, che compaiono in ogni
// combinazione.
function validEventSubsets(
  eventKeys: string[],
  fixedEventKeys: Set<string>,
  size: number,
): string[][] {
  if (size < fixedEventKeys.size || size > eventKeys.length) return []
  const free = eventKeys.filter((k) => !fixedEventKeys.has(k))
  const need = size - fixedEventKeys.size
  const out: string[][] = []
  const cur: string[] = []
  const rec = (start: number) => {
    if (cur.length === need) {
      out.push([...fixedEventKeys, ...cur])
      return
    }
    for (let i = start; i < free.length; i++) {
      cur.push(free[i])
      rec(i + 1)
      cur.pop()
    }
  }
  rec(0)
  return out
}

function buildMinScenario(
  eventInfo: Map<string, EventCombosInfo>,
  fixedEventKeys: Set<string>,
  playedSizes: number[],
): Map<string, BetEntry[][]> {
  const eventKeys = [...eventInfo.keys()]
  // Gli eventi che vincono comunque (mercati a copertura totale del campo)
  // fanno parte di OGNI scenario: non e' possibile azzerarli.
  const alwaysWinning = new Set(
    eventKeys.filter((k) => !eventInfo.get(k)!.canBeZero),
  )

  // Quanto paga uno scenario, a meno della puntata: somma, su ogni taglia
  // giocata, delle combinazioni interamente comprese negli eventi attivi.
  const scoreOf = (active: Set<string>) => {
    let score = 0
    for (const size of playedSizes) {
      for (const subset of validEventSubsets(eventKeys, fixedEventKeys, size)) {
        if (!subset.every((k) => active.has(k))) continue
        score += subset.reduce(
          (prod, k) => prod * eventInfo.get(k)!.positiveOdds,
          1,
        )
      }
    }
    return score
  }

  const scenarioOf = (active: Set<string>) => {
    const scenario = new Map<string, BetEntry[][]>()
    for (const [eventKey, info] of eventInfo) {
      scenario.set(eventKey, active.has(eventKey) ? info.positiveAssigned : [])
    }
    return scenario
  }

  // 1) Se cio' che vince comunque basta a far pagare almeno una combinazione
  //    di una taglia giocata, quello E' il minimo.
  if (scoreOf(alwaysWinning) > 0) return scenarioOf(alwaysWinning)

  // 2) Altrimenti serve far vincere qualche evento in piu': si attiva il piu'
  //    piccolo insieme capace di far pagare una combinazione (se si gioca
  //    solo la Doppia servono DUE corse vincenti, non una) e tra le
  //    alternative si tiene la piu' economica. Il confronto usa le quote:
  //    e' esatto quando le taglie hanno la stessa puntata per combinazione.
  let bestActive: Set<string> | null = null
  let bestScore = Infinity
  for (const size of [...playedSizes].sort((a, b) => a - b)) {
    for (const subset of validEventSubsets(eventKeys, fixedEventKeys, size)) {
      const active = new Set([...alwaysWinning, ...subset])
      const score = scoreOf(active)
      if (score > 0 && score < bestScore) {
        bestScore = score
        bestActive = active
      }
    }
    if (bestActive) break
  }

  return scenarioOf(bestActive ?? alwaysWinning)
}

// Ricalcola SOLO le combinazioni vincenti nel caso minimo, riusando le
// combinazioni gia' generate: il minimo dipende da quali taglie sono
// effettivamente giocate, e le puntate si conoscono solo dopo la generazione.
export function reassignMinCombinations(
  groups: SystemGroup[],
  entries: BetEntry[],
  limits?: {
    fieldSizeByEvent?: Record<string, number>
    playedSizes?: number[]
  },
): SystemGroup[] {
  if (groups.length === 0) return groups

  const eventKeys = [...new Set(entries.map(eventKeyOf))]
  const eventInfo = new Map<string, EventCombosInfo>()
  for (const eventKey of eventKeys) {
    eventInfo.set(
      eventKey,
      computeEventCombosInfo(
        entries.filter((e) => eventKeyOf(e) === eventKey),
        limits?.fieldSizeByEvent?.[eventKey],
      ),
    )
  }

  const fixedEventKeys = new Set(entries.filter((e) => e.fixed).map(eventKeyOf))
  const playedSizes =
    limits?.playedSizes && limits.playedSizes.length > 0
      ? limits.playedSizes
      : groups.map((g) => g.size)
  const minScenario = buildMinScenario(eventInfo, fixedEventKeys, playedSizes)

  return groups.map((group) => {
    const signatures = new Set<string>()
    for (const combo of group.combinations) {
      signatures.add([...new Set(combo.map(eventKeyOf))].sort().join('|'))
    }
    const minCombos: BetEntry[][] = []
    for (const signature of signatures) {
      minCombos.push(
        ...crossProductEntries(
          signature.split('|').map((key) => minScenario.get(key) ?? []),
        ),
      )
    }
    return { ...group, minWinAssignedCombinations: minCombos }
  })
}

function computeTierAssignedCombos(
  combos: BetEntry[][],
  eventInfo: Map<string, EventCombosInfo>,
  minScenario: Map<string, BetEntry[][]>,
): { maxCombos: BetEntry[][]; minCombos: BetEntry[][] } {
  const signatures = new Set<string>()
  for (const combo of combos) {
    signatures.add([...new Set(combo.map(eventKeyOf))].sort().join('|'))
  }

  const maxCombos: BetEntry[][] = []
  const minCombos: BetEntry[][] = []

  for (const signature of signatures) {
    const eventKeyList = signature.split('|')

    maxCombos.push(
      ...crossProductEntries(
        eventKeyList.map((key) => eventInfo.get(key)!.maxAssigned),
      ),
    )

    // Tutte le combinazioni vincenti nello stesso scenario di minimo vanno
    // SOMMATE: quelle che coinvolgono un evento che non vince nulla si
    // azzerano da sole (prodotto incrociato con insieme vuoto).
    minCombos.push(
      ...crossProductEntries(
        eventKeyList.map((key) => minScenario.get(key) ?? []),
      ),
    )
  }

  return { maxCombos, minCombos }
}

export function generateSystemGroups(
  entries: BetEntry[],
  limits?: {
    maxSelections?: number
    maxEvents?: number
    fieldSizeByEvent?: Record<string, number>
    // Taglie realmente giocate (quelle con puntata > 0). Serve al minimo: se
    // per esempio si gioca solo la Doppia, il pagamento minimo positivo
    // richiede che vincano DUE corse, non una.
    playedSizes?: number[]
  },
): SystemGroup[] {
  const groups: SystemGroup[] = []
  const maxSelections = limits?.maxSelections ?? 100
  const maxEvents = limits?.maxEvents ?? 10

  if (entries.length > maxSelections) {
    console.warn(
      'Too many bet entries for system groups generation:',
      entries.length,
    )
    return groups
  }

  const eventsSet = new Set<string>()
  entries.forEach((entry) => {
    // Usa la stessa logica di getCombinations per essere coerente
    const eventKey = `${entry.bet.discipline}-${entry.bet.event.number}`
    eventsSet.add(eventKey)
  })
  const eventsNumber = eventsSet.size

  if (eventsNumber > maxEvents) {
    console.warn('Too many events for system groups generation:', eventsNumber)
    return groups
  }

  const fixedEventKeys = new Set<string>()
  entries.forEach((entry) => {
    if (entry.fixed) {
      const eventKey = `${entry.bet.discipline}-${entry.bet.event.number}`
      fixedEventKeys.add(eventKey)
    }
  })

  const nonFixedEntries: BetEntry[] = []
  const fixedEntries: BetEntry[] = []

  entries.forEach((entry) => {
    const eventKey = `${entry.bet.discipline}-${entry.bet.event.number}`
    if (fixedEventKeys.has(eventKey)) {
      fixedEntries.push(entry)
    } else {
      nonFixedEntries.push(entry)
    }
  })

  if (eventsNumber === 1 && entries.length > 1) {
    const withOdds = entries.map((e) => ({
      odds: e.bet.option.decPrice,
      market: e.market,
      outcome: e.bet.option.outcome,
      entry: e,
    }))
    const soleEventKey = eventKeyOf(entries[0])
    const { minAssigned, maxAssigned } = computeSameEventOddsRange(
      withOdds,
      limits?.fieldSizeByEvent?.[soleEventKey],
    )

    groups.push({
      name: t('single'),
      size: 1,
      combinations: entries.map((e) => [e]),
      stake: 0,
      minWin: 0,
      maxWin: 0,
      minWinAssignedCombinations: minAssigned.map((a) => [a.entry]),
      maxWinAssignedCombinations: maxAssigned.map((a) => [a.entry]),
    })
    return groups
  }

  const eventInfo = new Map<string, EventCombosInfo>()
  for (const eventKey of eventsSet) {
    eventInfo.set(
      eventKey,
      computeEventCombosInfo(
        entries.filter((e) => eventKeyOf(e) === eventKey),
        limits?.fieldSizeByEvent?.[eventKey],
      ),
    )
  }

  const playedSizes =
    limits?.playedSizes && limits.playedSizes.length > 0
      ? limits.playedSizes
      : Array.from({ length: eventsNumber }, (_, i) => i + 1)
  const minScenario = buildMinScenario(eventInfo, fixedEventKeys, playedSizes)

  const avgOptionsPerEvent = entries.length / Math.max(eventsNumber, 1)

  for (let size = 1; size <= Math.min(eventsNumber, maxEvents); size++) {
    let nCk = 1
    for (let i = 0; i < size; i++) {
      nCk = (nCk * (eventsNumber - i)) / (i + 1)
    }
    const estimated = nCk * Math.pow(avgOptionsPerEvent, size)
    if (estimated > 50_000) break
    const combos = getCombinations(nonFixedEntries, size, fixedEntries)
    if (combos.length === 0) continue
    const { minCombos, maxCombos } = computeTierAssignedCombos(
      combos,
      eventInfo,
      minScenario,
    )

    let name = ''

    switch (size) {
      case 1:
        name = t('single')
        break
      case 2:
        name = t('double')
        break
      case 3:
        name = t('triple')
        break
      default:
        name = `${size}${t('-ple')}`
        break
    }

    groups.push({
      name,
      size,
      combinations: combos,
      stake: 0,
      minWin: 0,
      maxWin: 0,
      minWinAssignedCombinations: minCombos,
      maxWinAssignedCombinations: maxCombos,
    })
  }

  return groups
}
