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
}) {
  const { addBet, removeBet, betEntries } = useContext(BetsContext)

  const isSelected = useMemo(
    () =>
      betEntries.some(
        (entry) =>
          entry.market === props.marketName &&
          entry.bet.event.number === props.bet.event.number &&
          entry.bet.competitor === props.bet.competitor &&
          entry.bet.option.outcome === props.bet.option.outcome,
      ),
    [betEntries, props.marketName, props.bet],
  )

  return (
    <Toggle
      pressed={isSelected}
      onPressedChange={() => {
        if (isSelected) {
          removeBet(props.marketName, props.bet.option, props.bet.competitor)
        } else {
          addBet(props.marketName, {
            event: {
              name: props.bet.event.name,
              number: props.bet.event.number,
              startingAt: props.bet.event.startingAt,
            },
            discipline: props.bet.discipline,
            competitor: props.bet.competitor,
            option: props.bet.option,
          })
        }
      }}
      className={cn(
        props.variant === 'matchcard'
          ? 'flex flex-row justify-between px-4 text-[19px]'
          : props.variant === 'roundcard'
            ? 'flex flex-col justify-between text-[19px]'
            : props.variant === 'racecard'
              ? 'text-center text-[19px]'
              : props.variant === 'racecombination'
                ? 'flex flex-col justify-between text-[19px]'
                : '',
        props.className,
      )}
    >
      {props.variant === 'matchcard' ? (
        <>
          <span>{props.bet.option.decPrice.toFixed(2)}</span>
          <span className="font-bold">{props.bet.option.outcome}</span>
        </>
      ) : props.variant === 'roundcard' ? (
        <>
          <span className="font-bold">{props.bet.option.outcome}</span>
          <span>{props.bet.option.decPrice.toFixed(2)}</span>
        </>
      ) : props.variant === 'racecard' ? (
        props.bet.option.decPrice.toFixed(2)
      ) : (
        <>
          <span className="font-bold">{props.bet.option.outcome}</span>
          <span>{props.bet.option.decPrice.toFixed(2)}</span>
        </>
      )}
    </Toggle>
  )
}
