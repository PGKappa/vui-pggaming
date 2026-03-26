'use client'

import { RootContext } from '@/virtual-contexts/root-context'
import { Discipline, UpcomingRace } from '@/virtual-lib/types'
import { t } from 'i18next'
import Image from 'next/image'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import LatecomersDialog from './latecomers-dialog'
import { Button } from '@/retail-components/ui/button'
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
          `https://demo-pg.pgvirtual.eu/api/event/info/${nextEvent.extId}/${nextEvent.id}`,
          {
            headers: {
              accept: 'application/json',
              authorization: `Bearer ${initCode}`,
              operator: 'sc',
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

  // Formatta il tempo come HH:MM
  const formattedTime = nextEventStartTime.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <>
      {getCurrentDiscipline() === Discipline.FOOTBALL ? (
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
                  {(getCurrentDiscipline() === Discipline.DOGS ||
                    getCurrentDiscipline() === Discipline.HORSES) &&
                    ` ${t('race')}`}
                </span>
              </div>
              <div></div>
              <span className="text-xl">{formattedTime}</span>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="flex h-12 items-center justify-end">
              {shouldShowLatecomersButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 border-border text-secondary-foreground"
                  onClick={() => setIsLatecomersOpen(true)}
                  title="Late Comers"
                >
                  <Clock style={{ scale: 1.5 }} />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <LatecomersDialog
        isOpen={isLatecomersOpen}
        onOpenChange={setIsLatecomersOpen}
        raceInfo={raceInfo}
        discipline={getCurrentDiscipline() as 'DOGS' | 'HORSES'}
      />
    </>
  )
}
