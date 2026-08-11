import { BetEntry, SystemGroup } from '@/retail-lib/types'
import { normalizeMarketName } from '@/retail-lib/utils'
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

export function computeSameEventOddsRange<T extends { odds: number; market: string }>(
  entries: T[],
): { minOdds: number; maxOddsSum: number; maxAssigned: T[] } {
  if (entries.length === 0) return { minOdds: 0, maxOddsSum: 0, maxAssigned: [] }

  const withSlots = entries.map((e) => ({
    entry: e,
    slots: getMarketSlotCount(normalizeMarketName(e.market)),
  }))

  const minOdds = Math.min(...entries.map((e) => e.odds))
  const podiumSize = Math.max(...withSlots.map((e) => e.slots))
  const slotUsed = new Array(podiumSize + 1).fill(false) // 1-indexed

  const maxAssigned: T[] = []
  const sortedDesc = [...withSlots].sort((a, b) => b.entry.odds - a.entry.odds)
  for (const { entry, slots } of sortedDesc) {
    const reach = Math.min(slots, podiumSize)
    for (let slot = reach; slot >= 1; slot--) {
      if (!slotUsed[slot]) {
        slotUsed[slot] = true
        maxAssigned.push(entry)
        break
      }
    }
  }

  return {
    minOdds,
    maxOddsSum: maxAssigned.reduce((sum, e) => sum + e.odds, 0),
    maxAssigned,
  }
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

export function generateSystemGroups(
  entries: BetEntry[],
  limits?: { maxSelections?: number; maxEvents?: number },
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

  // La classificazione fisso/non-fisso va fatta per EVENTO, non per singola
  // selezione: se un evento ha almeno una selezione marcata "fissa" (banker),
  // TUTTE le sue selezioni sono alternative dello stesso slot obbligatorio —
  // esattamente come il backend tratta un evento banker con più esiti nello
  // stesso selection object. Se si classificasse per singola selezione, una
  // nuova selezione aggiunta a un evento già fisso verrebbe scartata dal
  // generatore di combinazioni (il suo evento risulta già "occupato" dalla
  // selezione fissa), facendo apparire il conteggio combinazioni bloccato su
  // un valore vecchio mentre il ticket realmente inviato (che include TUTTE
  // le selezioni dell'evento banker) ne contiene molte di più.
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
      entry: e,
    }))
    const { minOdds, maxAssigned } = computeSameEventOddsRange(withOdds)

    groups.push({
      name: t('single'),
      size: 1,
      combinations: entries.map((e) => [e]),
      stake: 0,
      minWin: minOdds,
      maxWin: 0,
      minWinOverride: minOdds,
      maxWinAssignedCombinations: maxAssigned.map((a) => [a.entry]),
    })
    return groups
  }

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
    const minWin = combos.reduce((min, combo) => {
      const win = combo.reduce(
        (acc, entry) => acc * entry.bet.option.decPrice,
        1,
      )
      return win < min ? win : min
    }, Infinity)
    const maxWin = combos.reduce(
      (acc, combo) =>
        acc + combo.reduce((acc, entry) => acc * entry.bet.option.decPrice, 1),
      0,
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
      minWin,
      maxWin,
    })
  }

  return groups
}
