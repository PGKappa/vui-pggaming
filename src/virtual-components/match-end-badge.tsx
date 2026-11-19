import { Badge } from '@/virtual-components/ui/badge'
import { Separator } from '@/virtual-components/ui/separator'
import { RootContext } from '@/virtual-contexts/root-context'
import { Discipline } from '@/virtual-lib/types'
import { cn, getTimeDistanceFromNow } from '@/virtual-lib/utils'
import { t } from 'i18next'
import { useNow } from '@/virtual-lib/use-clock'
import { useContext, useMemo } from 'react'

export default function MatchEndBadge({
  discipline,
  className,
}: {
  discipline: Discipline
  className?: string
}) {
  const { upcomingRounds, upcomingEvents } = useContext(RootContext)
  const now = useNow()

  // orari di partenza ordinati: ricalcolati solo quando cambia il feed
  const startTimes = useMemo(() => {
    if (discipline === Discipline.FOOTBALL) {
      const startTime = upcomingRounds?.[0]?.mag_event?.[0]?.startTime
      return startTime ? [new Date(startTime).getTime()] : []
    }
    return (upcomingEvents ?? [])
      .filter((event) => event.discipline === discipline)
      .map((event) => new Date(event.time).getTime())
      .sort((a, b) => a - b)
  }, [upcomingRounds, upcomingEvents, discipline])

  // calcio: la prima giornata anche se già iniziata (come prima); corse: la
  // prima non ancora partita
  const nextEventTime =
    discipline === Discipline.FOOTBALL
      ? startTimes[0]
      : startTimes.find((time) => time > now)
  const timeToNextRound =
    nextEventTime !== undefined
      ? getTimeDistanceFromNow(new Date(nextEventTime))
      : ''

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
