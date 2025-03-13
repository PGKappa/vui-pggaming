import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RootContext } from '@/contexts/root-context'
import { t } from 'i18next'
import { useContext } from 'react'

export default function MatchEndBadge() {
  const { upcomingRounds } = useContext(RootContext)

  if (!upcomingRounds || upcomingRounds.length === 0) return null

  const nextRoundStart = new Date(upcomingRounds[0].startingAt)
  const timeLeftMs = Math.max(
    nextRoundStart.getTime() - new Date().getTime(),
    0,
  )

  const minutes = Math.floor(timeLeftMs / 60000)
  const seconds = Math.floor((timeLeftMs % 60000) / 1000)
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <Badge className="flex w-fit flex-row items-center justify-center gap-2 py-0">
      <span className="text-md">{t("end_play")}</span>
      <Separator orientation="vertical" className="h-5 bg-destructive" />
      <span className="text-md font-normal">{formattedTime}</span>
    </Badge>
  )
}
