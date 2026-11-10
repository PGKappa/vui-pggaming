import { Badge } from '@/virtual-components/ui/badge'
import { Separator } from '@/virtual-components/ui/separator'
import { RootContext } from '@/virtual-contexts/root-context'
import { Discipline } from '@/virtual-lib/types'
import { cn, getTimeDistanceFromNow } from '@/virtual-lib/utils'
import { t } from 'i18next'
import { useContext, useEffect, useState } from 'react'

export default function MatchEndBadge({
  discipline,
  className,
}: {
  discipline: Discipline
  className?: string
}) {
  const { upcomingRounds, upcomingEvents } = useContext(RootContext)
  const [timeToNextRound, setTimeToNextRound] = useState('')

  useEffect(() => {
    const updateTimeToNextRound = () => {
      let nextEventTime: Date | null = null
      const now = new Date()

      if (discipline === Discipline.FOOTBALL) {
        if (
          upcomingRounds &&
          upcomingRounds.length > 0 &&
          upcomingRounds[0].mag_event[0]
        ) {
          nextEventTime = new Date(upcomingRounds[0].mag_event[0].startTime)
        }
      } else {
        const disciplineEvents = upcomingEvents
          ?.filter((event) => event.discipline === discipline)
          ?.filter((event) => new Date(event.time) > now) // FILTRA EVENTI PASSATI
          ?.sort(
            (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
          ) // ORDINA PER TEMPO

        if (disciplineEvents && disciplineEvents.length > 0) {
          nextEventTime = new Date(disciplineEvents[0].time)
        }
      }

      if (!nextEventTime) {
        setTimeToNextRound('')
        return
      }

      const formatted = getTimeDistanceFromNow(nextEventTime)
      setTimeToNextRound(formatted)
    }

    updateTimeToNextRound()

    const intervalId = setInterval(updateTimeToNextRound, 1000)

    return () => clearInterval(intervalId)
  }, [upcomingRounds, upcomingEvents, discipline])

  return (
    <Badge
      className={cn(
        'flex w-fit flex-row items-center justify-center gap-3 rounded-sm px-4 py-1.5 shadow-sm hover:bg-badge',
        className,
      )}
    >
      <span className="text-sm font-semibold uppercase tracking-wide">
        {t('end_play')}
      </span>
      <Separator orientation="vertical" className="h-4 bg-white/40" />
      <span className="min-w-[44px] text-md font-bold tabular-nums">
        {timeToNextRound}
      </span>
    </Badge>
  )
}
