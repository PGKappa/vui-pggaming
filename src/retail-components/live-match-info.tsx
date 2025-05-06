'use client'

import { RootContext } from '@/retail-contexts/root-context'
import { t } from 'i18next'
import { useContext } from 'react'
import BallSvg from './ball'

export default function LiveMatchInfo() {
  const { liveRound } = useContext(RootContext)

  if (!liveRound) return null

  const startTime = new Date(liveRound.startingAt)
  const formattedTime = startTime.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex w-full flex-row items-center justify-between">
      <div className="flex flex-row items-center gap-1">
        <BallSvg className="stroke-columnL-foreground" />
        <span>{t('football')}</span>
      </div>
      <span className="text-lg">{formattedTime}</span>
    </div>
  )
}
