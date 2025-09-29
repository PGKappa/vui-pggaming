'use client'

import { RootContext } from '@/virtual-contexts/root-context'
import { Discipline } from '@/virtual-lib/types'
import { t } from 'i18next'
import Image from 'next/image'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'

export default function LiveMatchInfo() {
  const { liveRound, upcomingEvents, upcomingRounds } = useContext(RootContext)
  const [nextEventStartTime, setNextEventStartTime] = useState<Date | null>(
    null,
  )

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

  // Aggiorna il prossimo evento periodicamente
  useEffect(() => {
    const updateNextEvent = () => {
      const discipline = getCurrentDiscipline()
      const now = new Date()

      if (discipline === Discipline.FOOTBALL) {
        if (liveRound) {
          setNextEventStartTime(new Date(liveRound.startingAt))
          return
        }
        const nextRound = upcomingRounds?.[0]
        if (nextRound?.mag_event?.[0]?.startTime) {
          setNextEventStartTime(new Date(nextRound.mag_event[0].startTime))
          return
        }
      } else {
        const disciplineEvents = upcomingEvents
          ?.filter((event) => event.discipline === discipline)
          ?.filter((event) => new Date(event.time) > now) // FILTRA EVENTI PASSATI
          ?.sort(
            (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
          ) // ORDINA PER TEMPO

        const nextEvent = disciplineEvents?.[0] // Prende il primo evento futuro
        if (nextEvent) {
          setNextEventStartTime(nextEvent.time)
          return
        }
      }

      setNextEventStartTime(null)
    }

    updateNextEvent()

    // Aggiorna ogni secondo
    const intervalId = setInterval(updateNextEvent, 1000)

    return () => clearInterval(intervalId)
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
    <div className="flex h-12 w-full flex-row items-center justify-between">
      <div className="flex flex-row items-center gap-2">
        {disciplineInfo.icon}
        <span>
          {disciplineInfo.name}
          {(getCurrentDiscipline() === Discipline.DOGS ||
            getCurrentDiscipline() === Discipline.HORSES) &&
            ` ${t('race')}`}
        </span>
      </div>
      <span className="text-xl">{formattedTime}</span>
    </div>
  )
}
