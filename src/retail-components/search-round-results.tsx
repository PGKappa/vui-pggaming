import { RoundResults } from '@/retail-lib/types'
import { XIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ScrollArea } from './ui/scroll-area'

export default function SearchRoundResults(props: {
  roundResults: RoundResults[]
  onClose: () => void
}) {
  const formatStartTime = (date: Date) =>
    new Date(date).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <Card>
      <CardHeader className="relative flex max-h-16 min-h-16 flex-row items-center justify-between">
        <CardTitle>Search Round Results</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={props.onClose}
          className="absolute right-4"
        >
          <XIcon style={{ scale: 2 }} />
        </Button>
      </CardHeader>
      <CardContent className="h-full">
        {props.roundResults.length > 0 ? (
          <ScrollArea className="h-full">
            {props.roundResults.map((result) => (
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
            ))}
          </ScrollArea>
        ) : (
          <div className="flex h-full flex-col items-center justify-center">
            No results found
          </div>
        )}
      </CardContent>
    </Card>
  )
}
