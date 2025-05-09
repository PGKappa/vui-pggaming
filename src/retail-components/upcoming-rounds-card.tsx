'use client'

import { UpcomingRound } from '@/retail-lib/types'
import { Button } from '@/retail-components/ui/button'
import { Card, CardContent, CardHeader } from '@/retail-components/ui/card'
import { ChevronDown, ChevronUp } from 'lucide-react'
import BallSvg from './ball'

type UpcomingRoundsCardProps = {
  rounds?: UpcomingRound[]
  selectedRound?: UpcomingRound
  setSelectedRound: (round: UpcomingRound) => void
  collapsed: boolean
  toggleCollapse: () => void
}

export default function UpcomingRoundsCard({
  rounds,
  selectedRound,
  setSelectedRound,
  collapsed,
  toggleCollapse 
}: UpcomingRoundsCardProps) {
  // Function to format the date from the startTime
  const formatStartTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card className="h-full w-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="w-full text-center">
          <h3 className="text-xl font-bold">Next Events</h3>
        </div>
        <Button variant="ghost" size="icon-lg" onClick={toggleCollapse}>
          {collapsed ? <ChevronDown style={{scale: 2}} /> : <ChevronUp style={{scale: 2}} />}
        </Button>
      </CardHeader>
      <CardContent className="overflow-y-auto p-0">
        {rounds && rounds.length > 0 ? (
          <div>
            {rounds.map((round) => {
              // Take the first match in the round to get the start time
              const firstMatch = round.mag_event?.[0]
              if (!firstMatch) return null

              const startTime = formatStartTime(firstMatch.startTime)

              return (
                <button
                  key={round.scheduleId}
                  className={`flex w-full cursor-pointer flex-row items-center justify-between border-b border-border p-1 hover:bg-primary/80 ${round.scheduleId === selectedRound?.scheduleId ? 'bg-' : ''}`}
                  onClick={() => setSelectedRound(round)}
                >
                  <div className="flex items-center gap-3">
                    <BallSvg className="h-8 w-8 stroke-foreground" />
                    <span className="text-md">
                      {round.scheduleName} Round {round.scheduleId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{startTime}</span>
                    <span className="text-sm">0:30</span>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="p-4 text-center">No upcoming rounds</div>
        )}
      </CardContent>
    </Card>
  )
}
