export function applyDigit(
  prev: string,
  digit: string,
  replace: boolean,
): string {
  if (replace) return digit
  if (prev === '0.00' || prev === '0') return digit
  const decimalIndex = prev.indexOf('.')
  if (decimalIndex !== -1 && prev.length - decimalIndex > 2) return prev
  return prev + digit
}

export function applyDecimal(prev: string, replace: boolean): string {
  if (replace) return '0.'
  return prev.includes('.') ? prev : prev + '.'
}

function stepToCents(step: number): number {
  return Math.round(step * 100)
}

export function canCompleteToStep(value: string, step: number): boolean {
  const stepCents = stepToCents(step)
  if (stepCents <= 1) return true
  const [intPart, decPart] = value.split('.')
  if (decPart === undefined) return true

  const base = (parseInt(intPart || '0', 10) || 0) * 100
  const typed = decPart.slice(0, 2)
  const fixed = typed.length === 0 ? 0 : parseInt(typed.padEnd(2, '0'), 10)
  const completions = Math.pow(10, 2 - typed.length)
  for (let d = 0; d < completions; d++) {
    if ((base + fixed + d) % stepCents === 0) return true
  }
  return false
}

export function isMultipleOfStep(value: string, step: number): boolean {
  const stepCents = stepToCents(step)
  if (stepCents <= 1) return true
  const [intPart, decPart = ''] = value.split('.')
  const cents =
    (parseInt(intPart || '0', 10) || 0) * 100 +
    (parseInt(decPart.slice(0, 2).padEnd(2, '0'), 10) || 0)
  return cents % stepCents === 0
}
