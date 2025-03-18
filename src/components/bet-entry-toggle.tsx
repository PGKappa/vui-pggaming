import { BetsContext } from '@/contexts/bets-context'
import { Selection, UpcomingRound } from '@/lib/types'
import { useContext } from 'react'
import { Toggle } from './ui/toggle'

export default function BetEntryToggle(props: {
  matchStart: Date
  round: UpcomingRound
  teams: string
  marketName: string
  option: Selection
}) {
  const { addBet, removeBet, betEntries } = useContext(BetsContext)

  const isSelected = betEntries.some(
    (entry) =>
      entry.market === props.marketName &&
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
      className="w-full"
    >
      {props.option.decPrice}
    </Toggle>
  )
}
