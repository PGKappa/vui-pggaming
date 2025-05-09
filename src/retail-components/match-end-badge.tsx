import { Badge } from '@/retail-components/ui/badge'
import { Separator } from '@/retail-components/ui/separator'
import { RootContext } from '@/retail-contexts/root-context'
import { getTimeDistanceFromNow } from '@/retail-lib/utils'
import { t } from 'i18next'
import { useContext, useEffect, useState } from 'react'

export default function MatchEndBadge() {
  const { upcomingRounds } = useContext(RootContext)
  const [timeToNextRound, setTimeToNextRound] = useState('')

  useEffect(() => {
    const updateTimeToNextRound = () => {
      if (!upcomingRounds || upcomingRounds.length === 0) {
        setTimeToNextRound('')
        return
      }

      const nextRoundStart = new Date(upcomingRounds[0].mag_event[0].startTime)
      const formatted = getTimeDistanceFromNow(nextRoundStart)

      setTimeToNextRound(formatted)
    }

    updateTimeToNextRound()

    const intervalId = setInterval(updateTimeToNextRound, 1000)

    return () => clearInterval(intervalId)
  }, [upcomingRounds])

  return (
    <Badge className="flex w-fit flex-row items-center justify-center gap-2 py-0">
      <span className="text-md">{t('end_play')}</span>
      <Separator orientation="vertical" className="h-5 bg-destructive" />
      <span className="text-md font-normal">{timeToNextRound}</span>
    </Badge>
  )
}
