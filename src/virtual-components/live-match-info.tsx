'use client'

import { RootContext } from '@/virtual-contexts/root-context'
import { Discipline } from '@/virtual-lib/types'
import i18n, { t } from 'i18next'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useContext, useEffect, useMemo, useState } from 'react'
import SearchResultsDialog from './search-results-dialog'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { SearchIcon } from 'lucide-react'

export default function LiveMatchInfo() {
  const { liveRound, upcomingEvents, upcomingRounds } = useContext(RootContext)
  const pathname = usePathname()
  const [nextEventStartTime, setNextEventStartTime] = useState<Date | null>(
    null,
  )

  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false)
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)

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
      <div className="flex h-12 w-full items-center justify-between">
        <div className="flex flex-row items-center gap-2">
          {disciplineInfo.icon}
          <span>
            {disciplineInfo.name}
            {(currentDiscipline === Discipline.DOGS ||
              currentDiscipline === Discipline.HORSES) &&
              ` ${t('race')}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl">{formattedTime}</span>
          {(currentDiscipline === Discipline.DOGS ||
            currentDiscipline === Discipline.HORSES) && (
            <>
              <Button
                variant="ghost"
                className="h-9 w-9 bg-secondary text-secondary-foreground"
                onClick={() => setIsSearchDialogOpen(true)}
              >
                <SearchIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                className="h-9 w-9 bg-secondary text-[18px] font-semibold text-secondary-foreground"
                onClick={() => setIsInfoDialogOpen(true)}
              >
                i
              </Button>
            </>
          )}
        </div>
      </div>

      <SearchResultsDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        discipline={currentDiscipline}
      />

      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="h-full w-full overflow-hidden bg-accent">
          <DialogHeader className="bg-secondary text-secondary-foreground">
            <DialogTitle>{t('game_rules').toUpperCase()}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 w-full flex-1">
            <iframe
              src={`https://d190050z3qr0m1.cloudfront.net/public/Gaming_manual_${i18n.language || 'en'}.html`}
              className="h-full w-full border-0"
              title="Game Rules"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
