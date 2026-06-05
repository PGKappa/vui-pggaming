import { BetEntry, SystemGroup } from './types'
import { t } from 'i18next'

export function getCombinations(
  entries: BetEntry[],
  comboSize: number,
  fixed: BetEntry[] = [],
): BetEntry[][] {
  const result: BetEntry[][] = []

  const eventKey = (e: BetEntry) => e.bet.event.number.toString()

  const fixedGroups: Record<string, BetEntry[]> = {}
  fixed.forEach((f) => {
    const key = eventKey(f)
    if (!fixedGroups[key]) {
      fixedGroups[key] = []
    }
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

export function generateSystemGroups(entries: BetEntry[]): SystemGroup[] {
  const groups: SystemGroup[] = []

  if (entries.length > 50) {
    console.warn(
      'Too many bet entries for system groups generation:',
      entries.length,
    )
    return groups
  }

  const eventsSet = new Set<string>()
  entries.forEach((entry) => {
    const eventKey = entry.bet.event.number.toString()
    eventsSet.add(eventKey)
  })
  const eventsNumber = eventsSet.size

  if (eventsNumber > 10) {
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

  for (let size = 1; size <= Math.min(eventsNumber, 10); size++) {
    const combos = getCombinations(nonFixedEntries, size, fixedEntries)
    if (combos.length === 0) continue
    const minWin = Math.min(
      ...combos.map((combo) =>
        combo.reduce((acc, entry) => acc * entry.bet.option.decPrice, 1),
      ),
    )
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
