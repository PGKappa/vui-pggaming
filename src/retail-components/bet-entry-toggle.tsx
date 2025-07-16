import { BetsContext } from '@/retail-contexts/bets-context'
import { Bet } from '@/retail-lib/types'
import { useContext, useMemo } from 'react'
import { Toggle } from './ui/toggle'

export default function BetEntryToggle(props: {
  marketName: string
  bet: Bet
  showOutcome?: boolean
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
            competitor: props.bet.competitor,
            option: props.bet.option,
          })
        }
      }}
      className={`w-full px-4 ${props.showOutcome ? 'flex flex-row justify-between' : ''} ${props.className}`}
    >
      <span className="text-[19px]">
        {props.bet.option.decPrice.toFixed(2)}
      </span>
      {props.showOutcome && (
        <span className="text-[19px] font-bold">
          {props.bet.option.outcome}
        </span>
      )}
    </Toggle>
  )
}
