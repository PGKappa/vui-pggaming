import { BetsContext } from '@/retail-contexts/bets-context'
import { Bet } from '@/retail-lib/types'
import { useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Toggle } from './ui/toggle'
import { cn, normalizeMarketName } from '@/retail-lib/utils'

type BetEntryToggleVariants =
  | 'roundcard'
  | 'matchcard'
  | 'racecard'
  | 'racecombination'

export default function BetEntryToggle(props: {
  marketName: string
  apiMarketName?: string
  bet: Bet
  variant: BetEntryToggleVariants
  className?: string
  onToggle?: (isPressed: boolean) => void
}) {
  const { t } = useTranslation()
  const { addBet, removeBet, betEntries } = useContext(BetsContext)

  const isSelected = useMemo(() => {
    const propsMarketNormalized = normalizeMarketName(props.marketName)

    const found = betEntries.find(
      (entry) =>
        normalizeMarketName(entry.market) === propsMarketNormalized &&
        entry.bet.discipline === props.bet.discipline &&
        entry.bet.event.number === props.bet.event.number &&
        entry.bet.competitors === props.bet.competitors &&
        entry.bet.option.outcome === props.bet.option.outcome,
    )

    return !!found
  }, [betEntries, props.marketName, props.bet])

  const formatOutcome = (outcome: string, marketName: string): string => {
    const underLabel = t('under') || 'Under'
    const overLabel = t('over') || 'Over'

    const lower = outcome.toLowerCase()
    if (lower === 'yes') return t('yes') || 'Sí'.toUpperCase()
    if (lower === 'no') return t('no') || 'No'.toUpperCase()

    if (marketName === 'Half Time\/ Full Time') {
      if (outcome.length === 2) {
        return `${outcome[0]} / ${outcome[1]}`
      }
    }

    if (marketName.toLowerCase().includes('multigoal')) {
      return outcome
    }

    if (
      marketName.toLowerCase().includes('combo') &&
      marketName.toLowerCase().includes('goal') &&
      outcome.includes('+')
    ) {
      const parts = outcome.split('+')
      if (parts.length === 2) {
        return `${parts[0]} + ${parts[1]}`
      }
    }

    const isUnderOverMarket =
      marketName.toLowerCase().includes('under') ||
      marketName.toLowerCase().includes('over') ||
      marketName.toLowerCase().includes('goals') ||
      (outcome.includes('+') &&
        (outcome.includes('U') || outcome.includes('O')))

    if (!isUnderOverMarket) {
      return outcome
    }

    const valueMatch = marketName.match(/(\d+\.?\d*)/)
    const value = valueMatch ? valueMatch[1] : ''

    if (outcome.includes('+')) {
      const [prefix, suffix] = outcome.split('+')

      if (suffix === 'U' || suffix.toLowerCase().includes('under')) {
        return `${prefix} + ${underLabel} ${value}`
      } else if (suffix === 'O' || suffix.toLowerCase().includes('over')) {
        return `${prefix} + ${overLabel} ${value}`
      }

      return outcome
    }

    if (
      outcome.includes('1+') &&
      (outcome.includes('Under') || outcome.includes('U'))
    ) {
      return `1 + ${underLabel} ${value}`
    } else if (
      outcome.includes('1+') &&
      (outcome.includes('Over') || outcome.includes('O'))
    ) {
      return `1 + ${overLabel} ${value}`
    } else if (
      outcome.includes('2+') &&
      (outcome.includes('Under') || outcome.includes('U'))
    ) {
      return `2 + ${underLabel} ${value}`
    } else if (
      outcome.includes('2+') &&
      (outcome.includes('Over') || outcome.includes('O'))
    ) {
      return `2 + ${overLabel} ${value}`
    }

    if (outcome.toLowerCase().includes('under') || outcome === 'U') {
      return `${underLabel} ${value}`
    } else if (outcome.toLowerCase().includes('over') || outcome === 'O') {
      return `${overLabel} ${value}`
    }

    return outcome
  }

  const formattedOutcome = formatOutcome(
    props.bet.option.outcome,
    props.marketName,
  )

  return (
    <Toggle
      pressed={isSelected}
      onPressedChange={() => {
        if (isSelected) {
          removeBet(
            props.marketName,
            props.bet.option,
            props.bet.competitors,
            props.bet.event.number,
            props.bet.discipline,
          )
        } else {
          addBet(
            props.marketName,
            {
              event: {
                name: props.bet.event.name,
                number: props.bet.event.number,
                startingAt: props.bet.event.startingAt,
              },
              discipline: props.bet.discipline,
              competitors: props.bet.competitors,
              option: props.bet.option,
            },
            props.apiMarketName || props.marketName,
          )
        }
        if (props.onToggle) {
          props.onToggle(!isSelected)
        }
      }}
      className={cn(
        props.variant === 'matchcard'
          ? 'flex flex-row justify-between px-4 text-[19px] capitalize'
          : props.variant === 'roundcard'
            ? 'flex flex-col justify-between text-[19px]'
            : props.variant === 'racecard'
              ? 'rounded-sm text-center text-[19px]'
              : props.variant === 'racecombination'
                ? 'flex h-[51px] flex-col pb-[3px] text-[18px] tabular-nums'
                : '',
        props.className,
      )}
    >
      {props.variant === 'matchcard' ? (
        <>
          <span className="pl-[1px] pt-[1px] text-[16px] font-semibold">
            {formattedOutcome}
          </span>
          <span className="pr-[1px] text-[18px] font-semibold tabular-nums">
            {props.bet.option.decPrice.toFixed(2)}
          </span>
        </>
      ) : props.variant === 'roundcard' ? (
        <>
          <span className="pt-[1px] font-semibold capitalize">{formattedOutcome}</span>
          <span className="relative bottom-[6px] text-[18px]">
            {props.bet.option.decPrice.toFixed(2)}
          </span>
        </>
      ) : props.variant === 'racecard' ? (
        props.bet.option.decPrice.toFixed(2)
      ) : (
        <>
          <span className="relative top-[5px] text-[16px] font-bold">
            {formattedOutcome}
          </span>
          <span>{props.bet.option.decPrice.toFixed(2)}</span>
        </>
      )}
    </Toggle>
  )
}
