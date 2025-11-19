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
      <div className="container mb-10 mt-1 grid grid-cols-1 justify-center gap-3 bg-columnL-background text-columnL-foreground lg:mb-4 lg:grid-cols-4">
        {/* First column - contenuto principale */}
        <div className="flex flex-col items-center gap-4 lg:col-span-3">
          <div className="flex w-full flex-col gap-1">
            <LiveMatchInfo />
            {/* Video e Previous Results in due colonne affiancate */}
            <div className="grid h-full grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <VideoStreamCard
                  streamUrl={liveRound?.streamUrl}
                  discipline={Discipline.HORSES}
                />
              </div>
              <div className="h-[425px] overflow-y-auto lg:col-span-1">
                <PreviousResultsCard
                  results={previousResultsMock.horses}
                  discipline="HORSES"
                />
              </div>
            </div>
          </div>
          <UpcomingEventsCarousel
            selectedEvent={selectedEvent}
            setSelectedEvent={setSelectedEvent}
            events={horseEvents}
          />

          <MatchEndBadge discipline={Discipline.HORSES} />
          {selectedEvent ? (
            <UpcomingRaceCard race={selectedEvent} />
          ) : (
            <div className="flex h-full items-center justify-center">
              {t('no_event_selected')}
            </div>
          )}
        </div>

        {/* Second column - Betting slip */}
        <div className="bg-background text-foreground lg:col-span-1">
          <div className="hidden lg:block">
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
