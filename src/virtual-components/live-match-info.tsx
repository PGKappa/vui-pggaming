'use client'

import { RootContext } from '@/virtual-contexts/root-context'
import { Discipline } from '@/virtual-lib/types'
import { t } from 'i18next'
import Image from 'next/image'
import { useCallback, useContext, useMemo } from 'react'

export default function LiveMatchInfo() {
  const { liveRound, upcomingEvents, upcomingRounds } = useContext(RootContext)

  const getCurrentDiscipline = useCallback((): Discipline => {
    if (typeof window === 'undefined') return Discipline.FOOTBALL

    const path = window.location.pathname
    if (path.includes('dogs')) {
      return Discipline.DOGS
    } else if (path.includes('horses')) {
      return Discipline.HORSES
    } else {
      return Discipline.FOOTBALL
    }
  }, [])

  const nextEventStartTime = useMemo(() => {
    const discipline = getCurrentDiscipline()

    if (discipline === Discipline.FOOTBALL) {
      // Per il calcio usa il liveRound o il prossimo round
      if (liveRound) {
        return new Date(liveRound.startingAt)
      }
      const nextRound = upcomingRounds?.[0]
      if (nextRound?.mag_event?.[0]?.startTime) {
        return new Date(nextRound.mag_event[0].startTime)
      }
    } else {
      // Per cani e cavalli usa upcomingEvents filtrati per disciplina
      const disciplineEvents = upcomingEvents?.filter(
        (event) => event.discipline === discipline,
      )
      const nextEvent = disciplineEvents?.[0] // Prende il primo evento (più vicino nel tempo)
      if (nextEvent) {
        return nextEvent.time
      }
    }

    return null
  }, [getCurrentDiscipline, liveRound, upcomingEvents, upcomingRounds])

  const disciplineInfo = useMemo(() => {
    const discipline = getCurrentDiscipline()

    switch (discipline) {
      case Discipline.DOGS:
        return {
          icon: (
            <Image
              src="/dog-image.png"
              alt="Dogs"
              width={36}
              height={36}
              className="object-contain"
            />
          ),
          name: t('dogs'),
        }
      case Discipline.HORSES:
        return {
          icon: (
            <Image
              src="/horse-image.png"
              alt="Horses"
              width={36}
              height={36}
              className="object-contain"
            />
          ),
          name: t('horses'),
        }
      default:
        return {
          icon: (
            <Image
              src="/icon-calcio.png"
              alt="Football"
              width={24}
              height={24}
              className="object-contain"
            />
          ),
          name: t('football'),
        }
    }
  }, [getCurrentDiscipline])

  if (!nextEventStartTime) return null

  const formattedTime = nextEventStartTime.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex w-full flex-row items-center justify-between">
      <div className="flex flex-row items-center gap-2">
        {disciplineInfo.icon}
        <span>{disciplineInfo.name}</span>
      </div>
      <span className="text-lg">{formattedTime}</span>
    </div>
  )
}
