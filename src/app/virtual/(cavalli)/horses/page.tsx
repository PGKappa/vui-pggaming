'use client'
import BettingSlip from '@/virtual-components/betting-slip'
import BettingSlipSheet from '@/virtual-components/betting-slip-sheet'
import LiveMatchInfo from '@/virtual-components/live-match-info'
import MatchEndBadge from '@/virtual-components/match-end-badge'
import { UpcomingEventsCarousel } from '@/virtual-components/upcoming-events-carousel'
import UpcomingRaceCard from '@/virtual-components/upcoming-race-card'
import VideoStreamCard from '@/virtual-components/video-stream-card'
import PreviousResultsCard from '@/virtual-components/previous-results-card'
import { RootContext } from '@/virtual-contexts/root-context'
import { Discipline, UpcomingEvent } from '@/virtual-lib/types'
import previousResultsMock from '@/virtual-lib/previous-results-mock.json'
import { t } from 'i18next'
import { useContext, useEffect, useMemo, useState } from 'react'

export default function Home() {
  const { upcomingEvents, liveRound } = useContext(RootContext)

  // Filtra eventi per cavalli
  const horseEvents = useMemo(() => {
    return (
      upcomingEvents?.filter((e) => e.discipline === Discipline.HORSES) || []
    )
  }, [upcomingEvents])

  const [selectedEvent, setSelectedEvent] = useState<
    UpcomingEvent | undefined
  >()

  useEffect(() => {
    if (!selectedEvent && horseEvents.length > 0) {
      setSelectedEvent(horseEvents[0])
    }
  }, [horseEvents, selectedEvent])

  // Auto-refresh: seleziona automaticamente il prossimo evento quando quello corrente scade
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedEvent) {
        const now = new Date()
        const eventTime =
          selectedEvent.time instanceof Date
            ? selectedEvent.time
            : new Date(selectedEvent.time)

        if (eventTime <= now) {
          // Filtra gli eventi futuri
          const futureEvents = horseEvents.filter((e) => {
            const time = e.time instanceof Date ? e.time : new Date(e.time)
            return time > now
          })

          // Seleziona il primo evento futuro, o l'ultimo disponibile se non ce ne sono
          if (futureEvents.length > 0) {
            setSelectedEvent(futureEvents[0])
          } else if (horseEvents.length > 0) {
            setSelectedEvent(horseEvents[horseEvents.length - 1])
          }
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedEvent, horseEvents])

  return (
    <>
      <div className="container mb-16 grid grid-cols-1 items-start gap-3 bg-columnL-background p-2 text-columnL-foreground sm:p-3 lg:mb-0 lg:grid-cols-4">
        {/* First column - contenuto principale */}
        <div className="flex min-w-0 flex-col items-center gap-3 lg:col-span-3">
          <div className="flex w-full flex-col gap-3">
            <LiveMatchInfo />
            {/* Video e Previous Results in due colonne affiancate */}
            <div className="grid h-full grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <VideoStreamCard
                  streamUrl={liveRound?.streamUrl}
                  discipline={Discipline.HORSES}
                />
              </div>
              <div className="relative h-[380px] lg:col-span-1 lg:h-auto">
                <div className="h-full lg:absolute lg:inset-0">
                  <PreviousResultsCard
                    results={previousResultsMock.horses}
                    discipline="HORSES"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Carosello eventi + termine giocata sulla stessa riga */}
          <div className="flex w-full flex-col items-center gap-3 md:flex-row md:items-stretch">
            <div className="w-full min-w-0 md:flex-1">
              <UpcomingEventsCarousel
                selectedEvent={selectedEvent}
                setSelectedEvent={setSelectedEvent}
                events={horseEvents}
              />
            </div>
            <MatchEndBadge
              discipline={Discipline.HORSES}
              className="shrink-0 gap-2 px-3 py-1 md:h-14 md:self-center"
            />
          </div>
          {selectedEvent ? (
            <UpcomingRaceCard race={selectedEvent} />
          ) : (
            <div className="flex h-40 w-full items-center justify-center bg-card text-muted-foreground shadow-sm">
              {t('no_event_selected')}
            </div>
          )}
        </div>

        {/* Second column - Betting slip */}
        <div className="hidden lg:sticky lg:top-3 lg:col-span-1 lg:block lg:h-[calc(100vh-84px)]">
          <div className="h-full">
            <BettingSlip />
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 flex w-full justify-center gap-2 lg:hidden">
        <BettingSlipSheet />
      </div>
    </>
  )
}
