'use client'

import { RootContext } from '@/virtual-contexts/root-context'
import { Discipline, UpcomingRace } from '@/virtual-lib/types'
import { getOperatorFromUrl } from '@/virtual-lib/utils'
import { t } from 'i18next'
import Image from 'next/image'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import LatecomersDialog from './latecomers-dialog'
import { Clock } from 'lucide-react'

export default function LiveMatchInfo() {
  const { liveRound, upcomingEvents, upcomingRounds } = useContext(RootContext)
  const [nextEventStartTime, setNextEventStartTime] = useState<Date | null>(
    null,
  )
  const [isLatecomersOpen, setIsLatecomersOpen] = useState(false)
  const [raceInfo, setRaceInfo] = useState<UpcomingRace>()

  const getInitCode = () => localStorage.getItem('initCode')

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
          setNextEventStartTime(new Date(nextEvent.time))
          return
        }
      }

      setNextEventStartTime(null)
    }

    updateNextEvent()

    const intervalId = setInterval(updateNextEvent, 1000)

    return () => clearInterval(intervalId)
  }, [getCurrentDiscipline, liveRound, upcomingEvents, upcomingRounds])

  // Trova il prossimo evento per i latecomers
  const nextEvent = useMemo(() => {
    const discipline = getCurrentDiscipline()
    if (discipline === Discipline.FOOTBALL) return null

    const now = new Date()
    const disciplineEvents = upcomingEvents
      ?.filter((event) => event.discipline === discipline)
      ?.filter((event) => new Date(event.time) > now)
      ?.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

    return disciplineEvents?.[0] || null
  }, [getCurrentDiscipline, upcomingEvents])

  // Carica i dettagli della corsa quando cambia nextEvent
  useEffect(() => {
    const fetchEventInfo = async () => {
      if (!nextEvent || nextEvent.discipline === Discipline.FOOTBALL) {
        setRaceInfo(undefined)
        return
      }

      const initCode = getInitCode()
      if (!initCode) return

      try {
        const response = await fetch(
          `https://api-btprod.pgvirtual.eu/api/event/info/${nextEvent.extId}/${nextEvent.id}`,
          {
            headers: {
              accept: 'application/json',
              authorization: `Bearer ${initCode}`,
              operator: getOperatorFromUrl('sc'),
            },
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
          },
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        const upcomingRace: UpcomingRace = {
          ...data.current,
          id: parseInt(data.int_event_id),
        }
        setRaceInfo(upcomingRace)
      } catch (error) {
        console.error('Error fetching event info:', error)
        setRaceInfo(undefined)
      }
    }

    fetchEventInfo()
  }, [nextEvent])

  const shouldShowLatecomersButton = useMemo(() => {
    const discipline = getCurrentDiscipline()
    return discipline === Discipline.DOGS || discipline === Discipline.HORSES
  }, [getCurrentDiscipline])

  const disciplineInfo = useMemo(() => {
    const discipline = getCurrentDiscipline()

    switch (discipline) {
      case Discipline.DOGS:
        return {
          icon: (
            <Image
              src="/dog.png"
              alt="Dogs"
              width={64}
              height={64}
              className="size-8 object-contain"
            />
          ),
          name: t('dog_racing'),
        }
      case Discipline.HORSES:
        return {
          icon: (
            <Image
              src="/horse.png"
              alt="Horses"
              width={64}
              height={64}
              className="size-8 object-contain"
            />
          ),
          name: t('horse_racing'),
        }
      default:
        return {
          icon: (
            <Image
              src="/soccer.png"
              alt="Football"
              width={64}
              height={64}
              className="size-7 object-contain brightness-0 invert"
            />
          ),
          name: t('football'),
        }
    }
  }, [getCurrentDiscipline])

  if (!nextEventStartTime) return null

  // Formatta il tempo come HH:MM
  const formattedTime = nextEventStartTime.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <>
      <div className="flex h-12 w-full items-center justify-between gap-3 bg-card-header px-3 text-card-header-foreground shadow-sm">
        <div className="flex min-w-0 flex-row items-center gap-3">
          {disciplineInfo.icon}
          <span className="truncate text-md font-bold uppercase tracking-wide">
            {disciplineInfo.name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-semibold uppercase opacity-75 sm:inline">
              {t('next_race')}
            </span>
            <span className="rounded-sm bg-white px-2 py-0.5 text-lg font-bold tabular-nums text-card-foreground">
              {formattedTime}
            </span>
          </div>

          {shouldShowLatecomersButton && (
            <button
              type="button"
              className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-sm border border-white/15 bg-secondary px-3 text-sm font-semibold uppercase text-secondary-foreground transition-colors hover:bg-tertiary hover:text-tertiary-foreground"
              onClick={() => setIsLatecomersOpen(true)}
              title={t('latecomers')}
            >
              <Clock className="size-4" />
              <span className="hidden md:inline">{t('latecomers')}</span>
            </button>
          )}
        </div>
      </div>

      <LatecomersDialog
        isOpen={isLatecomersOpen}
        onOpenChange={setIsLatecomersOpen}
        raceInfo={raceInfo}
        discipline={getCurrentDiscipline() as 'DOGS' | 'HORSES'}
      />
    </>
  )
}
