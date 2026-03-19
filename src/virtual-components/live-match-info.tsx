'use client'

import { RootContext } from '@/virtual-contexts/root-context'
import { Discipline } from '@/virtual-lib/types'
import { t } from 'i18next'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useContext, useEffect, useMemo, useState } from 'react'

export default function LiveMatchInfo() {
  const { liveRound, upcomingEvents, upcomingRounds } = useContext(RootContext)
  const pathname = usePathname()
  const [nextEventStartTime, setNextEventStartTime] = useState<Date | null>(
    null,
  )

  const currentDiscipline = useMemo((): Discipline => {
    if (pathname.includes('dogs')) {
      return Discipline.DOGS
    }
    if (pathname.includes('horses')) {
      return Discipline.HORSES
    }
    return Discipline.FOOTBALL
  }, [pathname])

  // Aggiorna il prossimo evento periodicamente
  useEffect(() => {
    const updateNextEvent = () => {
      const discipline = currentDiscipline
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
          setNextEventStartTime(new Date(nextEvent.time))
          return
        }
      }

      setNextEventStartTime(null)
    }

    updateNextEvent()

    const intervalId = setInterval(updateNextEvent, 1000)

    return () => clearInterval(intervalId)
  }, [currentDiscipline, liveRound, upcomingEvents, upcomingRounds])

  const disciplineInfo = useMemo(() => {
    const discipline = currentDiscipline

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
  }, [currentDiscipline])

  if (!nextEventStartTime) return null

  // Formatta il tempo come HH:MM
  const formattedTime = nextEventStartTime.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <>
      {currentDiscipline === Discipline.FOOTBALL ? (
        // Layout semplice per calcio
        <div className="flex h-12 w-full items-center justify-between">
          <div className="flex flex-row items-center gap-2">
            {disciplineInfo.icon}
            <span>{disciplineInfo.name}</span>
          </div>
          <span className="text-xl">{formattedTime}</span>
        </div>
      ) : (
        <div className="grid h-12 w-full grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div
              className="grid h-12 w-full items-center"
              style={{ gridTemplateColumns: 'auto 1fr auto' }}
            >
              <div className="flex flex-row items-center gap-2">
                {disciplineInfo.icon}
                <span>
                  {disciplineInfo.name}
                  {(currentDiscipline === Discipline.DOGS ||
                    currentDiscipline === Discipline.HORSES) &&
                    ` ${t('race')}`}
                </span>
              </div>
              <div></div>
              <span className="text-xl">{formattedTime}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
