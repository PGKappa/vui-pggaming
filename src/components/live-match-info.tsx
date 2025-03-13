'use client'

import { RootContext } from '@/contexts/root-context'
import { t } from 'i18next'
import { useContext } from 'react'

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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/calcio/ball.svg"
        alt="Football"
        className="h-8 w-8 invert filter"
      />
      <span>{t("football")}</span>
      <span className="ml-auto">{formattedTime}</span>
    </div>
  )
}
