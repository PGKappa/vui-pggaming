'use client'

import { Button } from '@/retail-components/ui/button'
import { Card, CardContent, CardHeader } from '@/retail-components/ui/card'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import { UpcomingRound } from '@/retail-lib/types'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
  toggleCollapse,
}: UpcomingRoundsCardProps) {
  const { t } = useTranslation()

  // Function to format the date from the startTime
  const formatStartTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card
      className={`flex ${collapsed ? 'h-1/2' : 'h-full'} w-full flex-col overflow-hidden`}
    >
      <CardHeader className="relative flex max-h-16 min-h-16 flex-row items-center justify-between">
        <div className="w-full text-center">
          <h3 className="text-[19px] font-bold">{t('upcoming_events')}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="absolute right-1"
        >
          {collapsed ? (
            <ChevronDown style={{ scale: 2 }} />
          ) : (
            <ChevronUp style={{ scale: 2 }} />
          )}
        </Button>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full">
          {rounds && rounds.length > 0 ? (
            rounds.map((round) => {
              // Take the first match in the round to get the start time
              const firstMatch = round.mag_event?.[0]
              if (!firstMatch) return null

              const startTime = formatStartTime(firstMatch.startTime)

              return (
                <button
                  key={round.scheduleId}
                  className={`flex w-full cursor-pointer flex-row items-center justify-between border-b border-border p-1 px-4 ${round.scheduleId === selectedRound?.scheduleId ? 'bg-muted' : 'bg-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                  onClick={() => setSelectedRound(round)}
                >
                  <div className="flex flex-row items-center gap-3">
                    <span className="text-md">
                      {round.scheduleName} Round {round.scheduleId}
                    </span>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <span className="text-md font-bold">{startTime}</span>
                    <span className="text-md italic">0:30</span>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="p-4 text-center">{t('no_upcoming_rounds')}</div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
