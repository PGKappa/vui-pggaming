import { Button } from '@/retail-components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/retail-components/ui/card'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import { ChevronDown, ChevronUp } from 'lucide-react'
import SearchDialog from './search-dialog'
import { RoundResults } from '@/retail-lib/types'

export default function LastRoundsResults(props: {
  roundResults: {
    round: { name: string; number: number }
    startTime: Date
  }[]
  upcomingRound?: {
    scheduleId: number
  }[]
  open: boolean
  toggleOpen: () => void
  setSearchRoundResults: (results: RoundResults[]) => void
}) {
  const formatStartTime = (date: Date) =>
    new Date(date).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })

  const firstUpcomingRound = props.upcomingRound?.[0]?.scheduleId ?? 0

  const filteredRounds = props.roundResults
    .filter((r) => r.round.number > firstUpcomingRound)
    .sort((a, b) => b.round.number - a.round.number)

  return (
    <Card className={`flex ${props.open ? 'h-1/2' : ''} w-full flex-col`}>
      <CardHeader className="relative flex max-h-16 min-h-16 flex-row items-center justify-between">
        <div className="w-full text-center">
          <h3 className="text-xl font-bold">Last Results</h3>
        </div>
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={props.toggleOpen}
          className="absolute right-1"
        >
          {props.open ? (
            <ChevronUp style={{ scale: 2 }} />
          ) : (
            <ChevronDown style={{ scale: 2 }} />
          )}
        </Button>
      </CardHeader>

      {props.open && (
        <CardContent className="flex-grow overflow-hidden p-0">
          <ScrollArea className="h-full">
            {filteredRounds.length < 0 ? (
              <div className="text-center text-sm text-muted-foreground">
                No past results available
              </div>
            ) : (
              filteredRounds.map((result) => (
                <button
                  key={result.round.number}
                  className="flex w-full cursor-pointer flex-row items-center justify-between border-b border-border bg-muted-foreground p-1 px-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-md">
                      {result.round.name} Round {result.round.number}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-md font-bold">
                      {formatStartTime(new Date(result.startTime))}
                    </span>
                    <span className="text-md">0:30</span>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </CardContent>
      )}
      <CardFooter>
        <SearchDialog setSearchRoundResults={props.setSearchRoundResults} />
      </CardFooter>
    </Card>
  )
}
