import { BetsContext } from '@/retail-contexts/bets-context'
import { Bet } from '@/retail-lib/types'
import { useContext, useMemo } from 'react'
import { Toggle } from './ui/toggle'
import { cn } from '@/retail-lib/utils'

type BetEntryToggleVariants =
  | 'roundcard'
  | 'matchcard'
  | 'racecard'
  | 'racecombination'

export default function BetEntryToggle(props: {
  marketName: string
  bet: Bet
  variant: BetEntryToggleVariants
  className?: string
  onToggle?: (isPressed: boolean) => void
}) {
  const { addBet, removeBet, betEntries } = useContext(BetsContext)

  const isSelected = useMemo(
    () => {
      const found = betEntries.find(
        (entry) =>
          entry.market === props.marketName &&
          entry.bet.discipline === props.bet.discipline &&
          entry.bet.event.number === props.bet.event.number &&
          entry.bet.competitors === props.bet.competitors &&
          entry.bet.option.outcome === props.bet.option.outcome,
      )
      
      return !!found
    },
    [betEntries, props.marketName, props.bet],
  )

  const formatOutcome = (outcome: string, marketName: string): string => {
    if (marketName === 'Half Time\/ Full Time') {
      if (outcome.length === 2) {
        return `${outcome[0]}/${outcome[1]}`
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
        return `${prefix}+UN ${value}`
      } else if (suffix === 'O' || suffix.toLowerCase().includes('over')) {
        return `${prefix}+OV ${value}`
      }

      return outcome
    }

    if (
      outcome.includes('1+') &&
      (outcome.includes('Under') || outcome.includes('U'))
    ) {
      return `1+UN ${value}`
    } else if (
      outcome.includes('1+') &&
      (outcome.includes('Over') || outcome.includes('O'))
    ) {
      return `1+OV ${value}`
    } else if (
      outcome.includes('2+') &&
      (outcome.includes('Under') || outcome.includes('U'))
    ) {
      return `2+UN ${value}`
    } else if (
      outcome.includes('2+') &&
      (outcome.includes('Over') || outcome.includes('O'))
    ) {
      return `2+OV ${value}`
    }

    if (outcome.toLowerCase().includes('under') || outcome === 'U') {
      return `UN ${value}`
    } else if (outcome.toLowerCase().includes('over') || outcome === 'O') {
      return `OV ${value}`
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
          removeBet(props.marketName, props.bet.option, props.bet.competitors)
        } else {
          addBet(props.marketName, {
            event: {
              name: props.bet.event.name,
              number: props.bet.event.number,
              startingAt: props.bet.event.startingAt,
            },
            discipline: props.bet.discipline,
            competitors: props.bet.competitors,
            option: props.bet.option,
          })
        }
        if (props.onToggle) {
          props.onToggle(!isSelected)
        }
      }}
      className={cn(
        props.variant === 'matchcard'
          ? 'flex flex-row justify-between px-4 text-[19px]'
          : props.variant === 'roundcard'
            ? 'flex flex-col justify-between text-[19px]'
            : props.variant === 'racecard'
              ? 'text-center text-[19px] rounded-sm'
              : props.variant === 'racecombination'
                ? ' h-[52px] flex flex-col text-[18px] pb-0.5'
                : '',
        props.className,
      )}
    >
      {props.variant === 'matchcard' ? (
        <>
          <span>{props.bet.option.decPrice.toFixed(2)}</span>
          <span className="font-bold">{formattedOutcome}</span>
        </>
      ) : props.variant === 'roundcard' ? (
        <>
          <span className="font-bold">{formattedOutcome}</span>
          <span>{props.bet.option.decPrice.toFixed(2)}</span>
        </>
      ) : props.variant === 'racecard' ? (
        props.bet.option.decPrice.toFixed(2)
      ) : (
        <>
          <span className="font-bold text-[17px] top-1 relative">{formattedOutcome}</span>
          <span>{props.bet.option.decPrice.toFixed(2)}</span>
        </>
      )}
    </Toggle>
  )
}
