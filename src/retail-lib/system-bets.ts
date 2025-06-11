import { BetEntry, SystemGroup } from '@/retail-lib/types'

export function getCombinations<T>(array: T[], comboSize: number): T[][] {
  const result: T[][] = []
  const helper = (start: number, path: T[]) => {
    if (path.length === comboSize) {
      result.push([...path])
      return
    }
    for (let i = start; i < array.length; i++) {
      path.push(array[i])
      helper(i + 1, path)
      path.pop()
    }
  }
  helper(0, [])
  return result
}

export function generateSystemGroups(
  entries: BetEntry[],
): SystemGroup[] {
  const groups: SystemGroup[] = []
  const fixed: BetEntry[] = entries.filter((e) => e.fixed)

  for (let size = 1; size <= entries.length; size++) {
    const combos = getCombinations(entries, size)
      .map((combo) => [...fixed, ...combo])
      .filter((combo) => combo.length === size + fixed.length)

    if (combos.length === 0) continue

    const winValues = combos.map((c) =>
      c.reduce((acc, e) => acc * e.bet.option.decPrice, 1),
    )

    groups.push({
      name: size + fixed.length === 1 ? 'Single' : `${size + fixed.length}-ple`,
      size: size + fixed.length,
      combinations: combos,
      stake: 1,
      minWin: Math.min(...winValues),
      maxWin: Math.max(...winValues),
    })
  }

  return groups
}
