import { BetEntry, SystemGroup } from '@/retail-lib/types'
import { t } from 'i18next'

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

  const nonFixedEntries: BetEntry[] = []
  const fixedEntries: BetEntry[] = []

  entries.forEach((entry) => {
    if (entry.fixed) {
      fixedEntries.push(entry)
    } else {
      nonFixedEntries.push(entry)
    }
  })

  // Average options per event, used to estimate combination count before computing
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
