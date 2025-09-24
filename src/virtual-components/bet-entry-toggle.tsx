import { BetsContext } from '@/virtual-contexts/bets-context'
import { Bet } from '@/virtual-lib/types'
import { useContext, useMemo } from 'react'
import { Toggle } from './ui/toggle'
import { cn } from '@/virtual-lib/utils'

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
      !!betEntries.find(
        (entry) =>
          entry.market === props.marketName &&
          entry.bet.event.number === props.bet.event.number &&
          entry.bet.competitors === props.bet.competitors &&
          entry.bet.option.outcome === props.bet.option.outcome,
      ),
    [betEntries, props.marketName, props.bet],
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
              name: props.bet.event?.name || '',
              number: props.bet.event?.number || 0,
              startingAt: props.bet.event?.startingAt || new Date(),
            },
            discipline: props.bet.discipline,
            competitors: props.bet.competitors || '',
            option: props.bet.option,
          })
        }
      }}
      className={cn(
        props.variant === 'matchcard'
          ? 'flex flex-row justify-between px-4 text-[19px]'
          : props.variant === 'roundcard'
            ? 'flex flex-col justify-center text-[16px]'
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
          <span>{props.bet.option.decPrice?.toFixed(2) || '0.00'}</span>
          <span className="font-bold">{props.bet.option.outcome || 'N/A'}</span>
          {/* <span className="font-bold">{props.marketName}</span> */}
        </>
      ) : props.variant === 'roundcard' ? (
        <>
          {/* <span className="font-bold">{props.bet.option.outcome || 'N/A'}</span>

          <span className="font-bold">{props.marketName}</span> */}
          <span>{props.bet.option.decPrice?.toFixed(2) || '0.00'}</span>
        </>
      ) : props.variant === 'racecard' ? (
        props.bet.option.decPrice?.toFixed(2) || '0.00'
      ) : (
        <>
          {/* <span className="font-bold">{props.bet.option.outcome || 'N/A'}</span>
          
          <span className="font-bold">{props.marketName}</span> */}
          <span>{props.bet.option.decPrice?.toFixed(2) || '0.00'}</span>
        </>
      )}
    </Toggle>
  )
}
