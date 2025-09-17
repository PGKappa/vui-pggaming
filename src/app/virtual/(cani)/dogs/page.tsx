'use client'
import BettingSlip from '@/virtual-components/betting-slip'
import BettingSlipSheet from '@/virtual-components/betting-slip-sheet'
import LiveMatchInfo from '@/virtual-components/live-match-info'
import MatchEndBadge from '@/virtual-components/match-end-badge'
import { UpcomingEventsCarousel } from '@/virtual-components/upcoming-events-carousel'
import VideoStreamCard from '@/virtual-components/video-stream-card'
import { RootContext } from '@/virtual-contexts/root-context'
import { Discipline, UpcomingEvent } from '@/virtual-lib/types'
import { useContext, useEffect, useMemo, useState } from 'react'

export default function Home() {
  const { upcomingEvents, liveRound } = useContext(RootContext)

  // Filtra eventi per cani come in retail
  const dogEvents = useMemo(() => {
    return upcomingEvents?.filter((e) => e.discipline === Discipline.DOGS) || []
  }, [upcomingEvents])

  const [selectedEvent, setSelectedEvent] = useState<
    UpcomingEvent | undefined
  >()

  useEffect(() => {
    if (!selectedEvent && dogEvents.length > 0) {
      setSelectedEvent(dogEvents[0])
    }
  }, [dogEvents, selectedEvent])

  return (
    <>
      <div className="container mb-10 mt-1 grid grid-cols-1 justify-center gap-3 bg-columnL-background text-columnL-foreground lg:mb-4 lg:grid-cols-3">
        {/* First column - top content */}
        <div className="flex flex-col items-center gap-4 lg:col-span-2">
          <div className="flex w-full flex-col gap-1">
            <LiveMatchInfo />
            <VideoStreamCard streamUrl={liveRound?.streamUrl} />
          </div>
          <UpcomingEventsCarousel
            selectedEvent={selectedEvent}
            setSelectedEvent={setSelectedEvent}
            events={dogEvents}
          />

          <MatchEndBadge />
          <div className="flex h-full flex-row gap-2 overflow-hidden pr-2 pt-2">
            {/* {selectedEvent ? (
              <UpcomingRaceCard race={selectedEvent} />
            ) : (
              <div className="flex h-full items-center justify-center">
                {t('no_round_selected')}
              </div>
            )} */}
          </div>
        </div>

        {/* Betting slip - rightmost column */}
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
