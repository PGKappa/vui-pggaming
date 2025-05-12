import { Button } from '@/retail-components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/retail-components/ui/card'
import { ChevronDown, ChevronUp, SearchIcon } from 'lucide-react'
import BallSvg from './ball'

export default function LastRoundsResults(props: {
  roundsResults: {
    round: { name: string; number: number }
    startTime: Date
  }[]
  upcomingRound?: {
    scheduleId: number
  }[]
  open: boolean
  toggleOpen: () => void
}) {
  const formatStartTime = (date: Date) =>
    new Date(date).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })

  const firstUpcomingRound = props.upcomingRound?.[0]?.scheduleId ?? 0

  const filteredRounds = props.roundsResults
    .filter((r) => r.round.number > firstUpcomingRound)
    .sort((a, b) => b.round.number - a.round.number)

    console.log('LastRoundsResults', props.roundsResults)
    console.log('UpcomingRound', props.upcomingRound)
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Last Results</CardTitle>
        <div className="flex flex-row gap-1">
          <Button variant="ghost" size="icon-lg">
            <SearchIcon style={{ scale: 2 }} />
          </Button>
          <Button variant="ghost" size="icon-lg" onClick={props.toggleOpen}>
            {props.open ? (
              <ChevronUp style={{ scale: 2 }} />
            ) : (
              <ChevronDown style={{ scale: 2 }} />
            )}
          </Button>
        </div>
      </CardHeader>

      {props.open && (
        <CardContent className="overflow-y-auto p-0">
          {filteredRounds.length < 0 ? (
            <div className="text-center text-sm text-muted-foreground">
              No past results available
            </div>
          ) : (
            <div>
              {filteredRounds.map((result) => (
                <button
                  key={result.round.number}
                  className={`flex w-full cursor-pointer flex-row items-center justify-between border-b border-border p-1`}
                >
                  <div className="flex items-center gap-3">
                    <BallSvg className="h-8 w-8 stroke-foreground" />
                    <span className="text-md">
                      {result.round.name} Round {result.round.number}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">
                      {formatStartTime(new Date(result.startTime))}
                    </span>
                    <span className="text-sm">0:30</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
    
  
}
