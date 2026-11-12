/**
 * Limiti di gioco letti dal cashier_init, con le stesse chiavi e gli stessi
 * default del retail (vedi retail-contexts/cashier-context.tsx).
 */
export type BettingLimits = {
  minStake: number
  minBet: number
  maxWin: number
  minStakeIncrement: number
  systemStakeIncrement: number
  maxEvents: number
  maxSelections: number
  maxCombinations: number
}

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value)
  return NaN
}

const positive = (fallback: number, ...values: unknown[]): number => {
  for (const value of values) {
    const parsed = toNumber(value)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return fallback
}

const nonNegative = (fallback: number, value: unknown): number => {
  const parsed = toNumber(value)
  return !isNaN(parsed) && parsed >= 0 ? parsed : fallback
}

export function getBettingLimits(cashierData: any): BettingLimits {
  const intl = cashierData?.intl ?? {}
  return {
    minStake: positive(0.05, intl.min_stake),
    minBet: nonNegative(0.05, intl.min_bet),
    maxWin: positive(1000000000, intl.max_win),
    minStakeIncrement: positive(
      0.05,
      intl.min_stake_increment_step,
      cashierData?.configs?.min_stake_increment,
    ),
    systemStakeIncrement: positive(0.1, intl.min_stake_increment_step_sys),
    maxEvents: Math.floor(
      positive(
        10,
        intl.MAX_EVENTS,
        intl.max_events,
        cashierData?.MAX_EVENTS,
        cashierData?.max_events,
      ),
    ),
    maxSelections: Math.floor(
      positive(
        100,
        intl.MAX_SELECTIONS,
        intl.max_selections,
        cashierData?.MAX_SELECTIONS,
        cashierData?.max_selections,
      ),
    ),
    maxCombinations: Math.floor(
      positive(
        512,
        intl.MAX_COMBINATIONS,
        intl.max_combinations,
        intl.max_combination,
        cashierData?.MAX_COMBINATIONS,
        cashierData?.max_combinations,
      ),
    ),
  }
}
