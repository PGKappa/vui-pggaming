import { UpcomingRound } from '@/lib/types'
import { Card, CardHeader, CardTitle } from './ui/card'

export default function UpcomingRoundCard(props: { round: UpcomingRound }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {props.round.name} Round {props.round.number}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}
