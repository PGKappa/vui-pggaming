import { BetEntry, SystemGroup } from '@/retail-lib/types'

export function getCombinations(
  entries: BetEntry[],
  comboSize: number,
  fixed: BetEntry[] = [],
): BetEntry[][] {
  const result: BetEntry[][] = []
  const helper = (start: number, path: BetEntry[]) => {
    if (path.length === comboSize) {
      const fullCombo = [...fixed, ...path]
      const matchIds = new Set(
        fullCombo.map((e) => `${e.bet.round.number}-${e.bet.teams}`),
      )
      if (matchIds.size === fullCombo.length) {
        result.push(fullCombo)
      }
      return
    }
    for (let i = start; i < entries.length; i++) {
      path.push(entries[i])
      helper(i + 1, path)
      path.pop()
    }
  }
  helper(0, [])
  return result
}

export function generateSystemGroups(entries: BetEntry[]): SystemGroup[] {
  const groups: SystemGroup[] = []
  //const fixedEntries: BetEntry[] = entries.filter((e) => e.fixed)

  const matchesSet = new Set<string>()
  entries.forEach((entry) => {
    const matchKey = `${entry.bet.round.number}.${entry.bet.teams}`
    matchesSet.add(matchKey)
  })
  const matchesNumber = matchesSet.size

  for (let size = 1; size <= matchesNumber; size++) {
    const combos = getCombinations(entries, size)
    console.log(size, combos)

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
