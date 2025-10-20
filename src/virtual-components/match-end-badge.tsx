import { Badge } from '@/virtual-components/ui/badge'
import { Separator } from '@/virtual-components/ui/separator'
import { RootContext } from '@/virtual-contexts/root-context'
import { Discipline } from '@/virtual-lib/types'
import { getTimeDistanceFromNow } from '@/virtual-lib/utils'
import { t } from 'i18next'
import { useContext, useEffect, useState } from 'react'

export default function MatchEndBadge({
  discipline,
}: {
  discipline: Discipline
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
    <Badge className="flex w-fit flex-row items-center justify-center gap-2 py-0">
      <span className="text-md">{t('end_play')}</span>
      <Separator orientation="vertical" className="h-5 bg-destructive" />
      <span className="text-md font-normal">{timeToNextRound}</span>
    </Badge>
  )
}
