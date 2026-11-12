'use client'
import BettingSlip from '@/virtual-components/betting-slip'
import BettingSlipSheet from '@/virtual-components/betting-slip-sheet'
import LiveMatchInfo from '@/virtual-components/live-match-info'
import { UpcomingEventsCarousel } from '@/virtual-components/upcoming-events-carousel'
import UpcomingRaceCard from '@/virtual-components/upcoming-race-card'
import VideoStreamCard from '@/virtual-components/video-stream-card'
import PreviousResultsCard from '@/virtual-components/previous-results-card'
import { RootContext } from '@/virtual-contexts/root-context'
import { Discipline, UpcomingEvent } from '@/virtual-lib/types'
import useAutoAdvanceEvent from '@/virtual-lib/use-auto-advance-event'
import { t } from 'i18next'
import { useContext, useEffect, useMemo, useState } from 'react'

export default function Home() {
  const { upcomingEvents, liveRound, previousResults } = useContext(RootContext)

  // Filtra eventi per cani come in retail
  const dogEvents = useMemo(() => {
    return upcomingEvents?.filter((e) => e.discipline === Discipline.DOGS) || []
  }, [upcomingEvents])

  // video e ultimi risultati, apribili/chiudibili dalla barra in alto
  const [mediaOpen, setMediaOpen] = useState(false)

  const [selectedEvent, setSelectedEvent] = useState<
    UpcomingEvent | undefined
  >()

  useEffect(() => {
    if (!selectedEvent && dogEvents.length > 0) {
      setSelectedEvent(dogEvents[0])
    }
  }, [dogEvents, selectedEvent])

  // quando l'evento selezionato scade passa subito a quello successivo
  useAutoAdvanceEvent(dogEvents, selectedEvent, setSelectedEvent)

  return (
    <>
      <div className="mx-auto mb-16 grid w-full max-w-[1920px] grid-cols-1 items-start gap-3 bg-columnL-background p-2 text-columnL-foreground sm:p-3 lg:mb-0 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* First column - contenuto principale */}
        <div className="flex min-w-0 flex-col items-center gap-3">
          <div className="flex w-full flex-col gap-3">
            <LiveMatchInfo
              mediaOpen={mediaOpen}
              onToggleMedia={() => setMediaOpen((open) => !open)}
            />
            {/* Video e Previous Results in due colonne affiancate; chiusi
                vengono smontati, così il video non scarica il flusso */}
            {mediaOpen && (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <VideoStreamCard
                    streamUrl={liveRound?.streamUrl}
                    discipline={Discipline.DOGS}
                  />
                </div>
                <div className="relative h-[380px] lg:col-span-1 lg:h-auto">
                  <div className="h-full lg:absolute lg:inset-0">
                    <PreviousResultsCard
                      results={previousResults?.[Discipline.DOGS]}
                      discipline="DOGS"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Carosello eventi a tutta larghezza */}
          <div className="w-full min-w-0">
            <UpcomingEventsCarousel
              selectedEvent={selectedEvent}
              setSelectedEvent={setSelectedEvent}
              events={dogEvents}
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
        <div className="hidden lg:block lg:h-[max(calc(100vh-84px),716px)] [@media(min-height:800px)]:lg:sticky [@media(min-height:800px)]:lg:top-3">
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
