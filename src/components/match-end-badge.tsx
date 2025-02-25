import { useContext, useState } from 'react'
import { RootContext } from '@/contexts/root-context'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function MatchEndBadge() {
  const { upcomingRounds } = useContext(RootContext)

  if (!upcomingRounds || upcomingRounds.length === 0) return null

  const nextRoundStart = new Date(upcomingRounds[0].startingAt)
  const timeLeftMs = Math.max(nextRoundStart.getTime() - new Date().getTime(), 0)

  const minutes = Math.floor(timeLeftMs / 60000)
  const seconds = Math.floor((timeLeftMs % 60000) / 1000)
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
      <Badge className="flex flex-row items-center justify-center w-fit gap-2 py-0">
        <span>TERMINE GIOCATA</span>
        <Separator orientation="vertical" className="h-4 bg-destructive"/>
        <span>{formattedTime}</span>
      </Badge>
  )
}
