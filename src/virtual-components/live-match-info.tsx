'use client'

import { RootContext } from '@/virtual-contexts/root-context'
import { Discipline, UpcomingRace } from '@/virtual-lib/types'
import { getOperatorFromUrl, PGVIRTUAL_API_URL } from '@/virtual-lib/utils'
import i18n, { t } from 'i18next'
import Image from 'next/image'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import LatecomersDialog from './latecomers-dialog'
import { ChevronDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/virtual-components/ui/dialog'
import { usePathname, useRouter } from 'next/navigation'

export default function LiveMatchInfo(
  props: {
    /** se passati, mostra il tasto che apre/chiude video e ultimi risultati */
    mediaOpen?: boolean
    onToggleMedia?: () => void
  } = {},
) {
  const { mediaOpen, onToggleMedia } = props
  const { liveRound, upcomingEvents, upcomingRounds } = useContext(RootContext)
  const [nextEventStartTime, setNextEventStartTime] = useState<Date | null>(
    null,
  )
  const [isLatecomersOpen, setIsLatecomersOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [raceInfo, setRaceInfo] = useState<UpcomingRace>()
  const router = useRouter()

  // apre la pagina ricerca risultati mantenendo init_code, skin, operator...
  const openSearchResults = () =>
    router.push(`/virtual/results${window.location.search}`)

  const getInitCode = () => localStorage.getItem('initCode')

  // Regolamento del gioco, come il tasto "i" della cassa: manuale diverso per
  // i levrieri a 8; disponibile in it/en/es/fr, altrimenti in inglese
  const getInfoLink = () => {
    const language = (i18n.language || 'en').slice(0, 2)
    const lang = ['it', 'en', 'es', 'fr'].includes(language) ? language : 'en'
    const manual = pathname?.includes('dogs8')
      ? 'RD-RH_8_Gamingmanual'
      : 'RD-RH_Gamingmanual'
    // copia locale (public/manuals) del manuale su cloudfront: stessa origine,
    // così si può applicare la scrollbar sottile dentro l'iframe
    return `/manuals/${manual}_${lang}.html`
  }

  const applyThinScrollbar = (
    event: React.SyntheticEvent<HTMLIFrameElement>,
  ) => {
    const doc = event.currentTarget.contentDocument
    if (!doc || doc.getElementById('thin-scrollbar-style')) return
    const style = doc.createElement('style')
    style.id = 'thin-scrollbar-style'
    style.textContent = `
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-thumb { background: #cdd2dc; border-radius: 2px; }
      ::-webkit-scrollbar-thumb:hover { background: #b8bec9; }
      ::-webkit-scrollbar-track { background: transparent; }
      @supports not selector(::-webkit-scrollbar) {
        html { scrollbar-width: thin; scrollbar-color: #cdd2dc transparent; }
      }`
    doc.head.appendChild(style)
  }

  // percorso dal router: window.location, durante la navigazione interna,
  // può essere ancora quello della pagina precedente (es. /virtual/bets)
  const pathname = usePathname()

  const getCurrentDiscipline = useCallback((): Discipline => {
    const path = pathname ?? ''
    // dogs8 prima di dogs: '/virtual/dogs8' contiene anche 'dogs'
    if (path.includes('dogs8')) {
      return Discipline.DOGS8
    } else if (path.includes('dogs')) {
      return Discipline.DOGS
    } else if (path.includes('horses')) {
      return Discipline.HORSES
    } else {
      return Discipline.FOOTBALL
    }
  }, [pathname])

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
          `${PGVIRTUAL_API_URL}/api/event/info/${nextEvent.extId}/${nextEvent.id}`,
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
    return (
      discipline === Discipline.DOGS ||
      discipline === Discipline.DOGS8 ||
      discipline === Discipline.HORSES
    )
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
          name: `${t('real_greyhounds')} - ${t('track')} 6`,
        }
      case Discipline.DOGS8:
        return {
          icon: (
            <Image
              src="/dog.png"
              alt="Dogs 8"
              width={64}
              height={64}
              className="size-8 object-contain"
            />
          ),
          name: `${t('real_greyhounds')} - ${t('track')} 8`,
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
          name: `${t('real_horses')} - ${t('track')} 6`,
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

  // Formatta il tempo come HH:MM. Le corse partono al minuto esatto: l'orario
  // calcolato da `since` può cadere qualche istante prima (12:19:59), quindi
  // si arrotonda al minuto più vicino invece di troncare
  const formattedTime = new Date(
    Math.round(nextEventStartTime.getTime() / 60000) * 60000,
  ).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <>
      {/* Corse: su desktop la barra segue la griglia video (2/3) + ultimi
          risultati (1/3), così "Prossima corsa" finisce dove finisce il video
          e i tasti stanno sopra gli ultimi risultati. Se i tasti non entrano
          nel terzo, la colonna destra si allarga quanto serve invece di
          sovrapporsi all'orario; sotto xl i tasti hanno testo più piccolo e
          sotto 2xl si nasconde la scritta "Prossima corsa". Sotto lg (tablet e
          mobile) va su due righe: titolo e orario, poi tasti e accordion */}
      <div
        className={`flex min-h-12 w-full flex-wrap items-center gap-x-3 gap-y-2 bg-card-header px-3 py-2 text-card-header-foreground shadow-sm lg:h-12 lg:flex-nowrap lg:py-0 ${
          shouldShowLatecomersButton
            ? 'lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(max-content,1fr)] lg:px-0'
            : ''
        }`}
      >
        <div className="flex min-w-0 flex-1 basis-full items-center justify-between gap-3 lg:basis-auto lg:pl-3">
          <div className="flex min-w-0 flex-row items-center gap-3">
            {disciplineInfo.icon}
            <span className="truncate text-md font-bold uppercase tracking-wide">
              {disciplineInfo.name}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-xs font-semibold uppercase opacity-75 2xl:inline">
              {t('next_race')}
            </span>
            <span className="rounded-sm bg-white px-2 py-0.5 text-lg font-bold tabular-nums text-card-foreground">
              {formattedTime}
            </span>
          </div>
        </div>

        {(shouldShowLatecomersButton || onToggleMedia) && (
          <div className="flex w-full shrink-0 items-center justify-end gap-3 lg:w-auto lg:pr-3">
            {/* i tre tasti hanno tutti la larghezza del più largo: colonne
                uguali (1fr) in una griglia larga quanto il contenuto */}
            {shouldShowLatecomersButton && (
              <div className="grid flex-1 grid-cols-3 gap-2 lg:flex-none lg:auto-cols-fr lg:grid-flow-col lg:grid-cols-none lg:gap-3">
                <button
                  type="button"
                  className="flex h-9 items-center justify-center rounded-sm border border-white/15 bg-secondary px-1 text-center text-[11px] font-semibold uppercase leading-tight text-secondary-foreground transition-colors hover:bg-tertiary hover:text-tertiary-foreground sm:px-2 sm:text-xs lg:whitespace-nowrap xl:px-3 xl:text-sm"
                  onClick={() => setIsLatecomersOpen(true)}
                  title={t('latecomers')}
                >
                  <span>{t('latecomers')}</span>
                </button>

                <button
                  type="button"
                  className="flex h-9 items-center justify-center rounded-sm border border-white/15 bg-secondary px-1 text-center text-[11px] font-semibold uppercase leading-tight text-secondary-foreground transition-colors hover:bg-tertiary hover:text-tertiary-foreground sm:px-2 sm:text-xs lg:whitespace-nowrap xl:px-3 xl:text-sm"
                  onClick={openSearchResults}
                  title={t('search_results')}
                >
                  <span>{t('search_results')}</span>
                </button>

                <button
                  type="button"
                  className="flex h-9 items-center justify-center rounded-sm border border-white/15 bg-secondary px-1 text-center text-[11px] font-semibold uppercase leading-tight text-secondary-foreground transition-colors hover:bg-tertiary hover:text-tertiary-foreground sm:px-2 sm:text-xs lg:whitespace-nowrap xl:px-3 xl:text-sm"
                  onClick={() => setIsInfoOpen(true)}
                  title={t('game_rules')}
                >
                  <span>Info</span>
                </button>
              </div>
            )}

            {onToggleMedia && (
              <button
                type="button"
                aria-expanded={mediaOpen}
                onClick={onToggleMedia}
                className="flex size-9 shrink-0 items-center justify-center text-card-header-foreground transition-opacity hover:opacity-75"
              >
                <ChevronDown
                  className={`size-5 transition-transform ${
                    mediaOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            )}
          </div>
        )}
      </div>

      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent className="left-0 top-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden border-0 p-0 [&>button:last-child]:top-3">
          <DialogHeader className="flex h-12 shrink-0 items-center justify-center bg-card-header px-4 py-0 text-card-header-foreground">
            <DialogTitle>{t('game_rules').toUpperCase()}</DialogTitle>
          </DialogHeader>
          {isInfoOpen && (
            <iframe
              src={getInfoLink()}
              onLoad={applyThinScrollbar}
              className="min-h-0 w-full flex-1 border-0 bg-white"
              title={t('game_rules')}
            />
          )}
        </DialogContent>
      </Dialog>

      <LatecomersDialog
        isOpen={isLatecomersOpen}
        onOpenChange={setIsLatecomersOpen}
        raceInfo={raceInfo}
        discipline={getCurrentDiscipline() as 'DOGS' | 'DOGS8' | 'HORSES'}
      />
    </>
  )
}
