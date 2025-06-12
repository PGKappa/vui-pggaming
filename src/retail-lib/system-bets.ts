import { BetEntry, SystemGroup } from '@/retail-lib/types'

export function getCombinations(
  entries: BetEntry[],
  comboSize: number,
  fixed: BetEntry[] = [],
): BetEntry[][] {
  const result: BetEntry[][] = []

  // Helper to compute match key once
  const matchKey = (e: BetEntry) => `${e.bet.round.number}-${e.bet.teams}`

  // 1. Group fixed selections by match
  const fixedGroups: Record<string, BetEntry[]> = {}
  fixed.forEach((f) => {
    const key = matchKey(f)
    if (!fixedGroups[key]) fixedGroups[key] = []
    fixedGroups[key].push(f)
  })
  const fixedMatchKeys = Object.keys(fixedGroups)

  // 2. Generate cartesian product of one selection per fixed match
  const fixedCombos: BetEntry[][] = []
  const buildFixedCombo = (idx: number, path: BetEntry[]) => {
    if (idx === fixedMatchKeys.length) {
      fixedCombos.push([...path])
      return
    }
    const groupKey = fixedMatchKeys[idx]
    for (const option of fixedGroups[groupKey]) {
      path.push(option)
      buildFixedCombo(idx + 1, path)
      path.pop()
    }
  }
  buildFixedCombo(0, [])

  // 3. Prepare non-fixed list excluding any selections from fixed matches to prevent duplicates
  const nonFixed = entries.filter((e) => !fixedGroups[matchKey(e)])

  // 4. For each concrete fixed combination, pick remaining selections
  const chooseRest = (
    startIdx: number,
    needed: number,
    pool: BetEntry[],
    path: BetEntry[],
    usedMatches: Set<string>,
    sink: BetEntry[][],
  ) => {
    if (needed === 0) {
      sink.push([...path])
      return
    }
    if (startIdx >= pool.length) return

    for (let i = startIdx; i < pool.length; i++) {
      const item = pool[i]
      const key = matchKey(item)
      if (usedMatches.has(key)) continue // skip same match
      usedMatches.add(key)
      path.push(item)
      chooseRest(i + 1, needed - 1, pool, path, usedMatches, sink)
      path.pop()
      usedMatches.delete(key)
    }
  }

  for (const fc of fixedCombos) {
    const used = new Set<string>(fc.map(matchKey))
    const remainingNeeded = comboSize - fc.length
    if (remainingNeeded < 0) continue // impossible size
    if (remainingNeeded === 0) {
      result.push(fc)
      continue
    }
    const restCombos: BetEntry[][] = []
    chooseRest(0, remainingNeeded, nonFixed, [], used, restCombos)
    for (const rc of restCombos) {
      result.push([...fc, ...rc])
    }
  }

  return result
}

export function generateSystemGroups(entries: BetEntry[]): SystemGroup[] {
  const groups: SystemGroup[] = []

  const matchesSet = new Set<string>()
  entries.forEach((entry) => {
    const matchKey = `${entry.bet.round.number}.${entry.bet.teams}`
    matchesSet.add(matchKey)
  })
  const matchesNumber = matchesSet.size

  const nonFixedEntries: BetEntry[] = []
  const fixedEntries: BetEntry[] = []

  entries.forEach((entry) => {
    if (entry.fixed) {
      fixedEntries.push(entry)
    } else {
      nonFixedEntries.push(entry)
    }
  })

  for (let size = 1; size <= matchesNumber; size++) {
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
        name = 'Single'
        break
      case 2:
        name = 'Double'
        break
      case 3:
        name = 'Triple'
        break
      default:
        name = `Group ${size}`
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
