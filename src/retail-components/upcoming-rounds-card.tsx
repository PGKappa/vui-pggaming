'use client'

import { Button } from '@/retail-components/ui/button'
import { Card, CardContent, CardHeader } from '@/retail-components/ui/card'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import { UpcomingRound } from '@/retail-lib/types'
import { CalendarIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useState } from 'react'

type UpcomingRoundsCardProps = {
  rounds?: UpcomingRound[]
  selectedRound?: UpcomingRound
  setSelectedRound: (round: UpcomingRound) => void
}

export default function UpcomingRoundsCard({
  rounds,
  selectedRound,
  setSelectedRound,
}: UpcomingRoundsCardProps) {
  const { t } = useTranslation()

  const formatStartTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <VisuallyHidden>
        <SheetTitle></SheetTitle>
      </VisuallyHidden>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="text-background"
          style={{ zoom: 2 }}
        >
          <CalendarIcon />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="h-full w-[300px] overflow-hidden p-0"
      >
        <Card className="flex h-full w-full flex-col overflow-hidden">
          <CardHeader className="sticky top-0 z-10 flex max-h-16 min-h-16 flex-row items-center justify-between">
            <h3 className="w-full text-center text-[19px] font-bold">
              {t('upcoming_events')}
            </h3>
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
                      className={`flex w-full cursor-pointer flex-row items-center justify-between border-b border-border p-1 px-4 ${round.scheduleId === selectedRound?.scheduleId ? 'bg-muted' : 'bg-muted-foreground'}`}
                      onClick={() => {
                        setSelectedRound(round)
                        setOpen(false)
                      }}
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
      </SheetContent>
    </Sheet>
  )
}
