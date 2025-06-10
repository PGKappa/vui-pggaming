import { BetsContext } from '@/retail-contexts/bets-context'
import { Selection } from '@/retail-lib/types'
import { useContext } from 'react'
import { Toggle } from './ui/toggle'

export default function BetEntryToggle(props: {
  matchStart: Date
  round: {
    scheduleName: string
    scheduleId: number
  }
  teams: string
  marketName: string
  option: Selection
  showOutcome?: boolean
  className?: string
}) {
  const { addBet, removeBet, betEntries } = useContext(BetsContext)

  const isSelected = betEntries.some(
    (entry) =>
      entry.market === props.marketName &&
      entry.bet.round.number === props.round.scheduleId &&
      entry.bet.teams === props.teams &&
      entry.bet.option.outcome === props.option.outcome,
  )
  return (
    <Toggle
      pressed={isSelected}
      onPressedChange={() => {
        if (isSelected) {
          removeBet(props.marketName, props.option, props.teams)
        } else {
          addBet(props.marketName, {
            round: {
              name: props.round.scheduleName,
              number: props.round.scheduleId,
              startingAt: props.matchStart,
            },
            teams: props.teams,
            option: props.option,
          })
        }
      }}
      className={`w-full ${props.showOutcome ? 'flex flex-row justify-between' : ''} ${props.className}`}
    >
      <span className="text-[19px]">{props.option.decPrice.toFixed(2)}</span>
      {props.showOutcome && (
        <span className="text-[19px] font-bold">{props.option.outcome}</span>
      )}
    </Toggle>
  )
}
