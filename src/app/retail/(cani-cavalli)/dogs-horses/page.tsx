'use client'
import BettingSlip from '@/retail-components/betting-slip'
import SearchEventResults from '@/retail-components/search-event-results'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import { UpcomingEventsCarousel } from '@/retail-components/upcoming-events-carousel'
import UpcomingRaceCard from '@/retail-components/upcoming-race-card'
import { RootContext } from '@/retail-contexts/root-context'
import { Discipline, UpcomingEvent } from '@/retail-lib/types'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()
  const {
    upcomingEvents,
    searchEventResults: searchRoundResults,
    setSearchEventResults: setSearchRoundResults,
  } = useContext(RootContext)

  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | undefined>(
    upcomingEvents?.filter(
      (e) =>
        e.discipline === Discipline.DOGS || e.discipline === Discipline.HORSES,
    )[0],
  )

  useEffect(() => {
    if (!selectedEvent && upcomingEvents && upcomingEvents.length > 0) {
      const firstRaceEvent = upcomingEvents?.filter(
        (e) =>
          e.discipline === Discipline.DOGS ||
          e.discipline === Discipline.HORSES,
      )[0]
      setSelectedEvent(firstRaceEvent)
    }
  }, [upcomingEvents, selectedEvent])

  return (
    <div className="flex h-full flex-row overflow-hidden">
      <div className="flex flex-col">
        <div className="flex h-[80px] w-[1500px] flex-row items-center justify-center bg-accent pr-2">
          <UpcomingEventsCarousel
            selectedEvent={selectedEvent}
            setSelectedEvent={(event) => {
              setSelectedEvent(event)
              setSearchRoundResults(undefined)
            }}
          />
        </div>

        {/* Main content area */}
        <div className="flex h-full flex-row gap-2 overflow-hidden pr-2 pt-2">
          <div className="flex h-[942px] w-[1500px] flex-col gap-2 overflow-y-auto">
            <ScrollArea className="h-full w-full">
              {!!searchRoundResults ? (
                <SearchEventResults />
              ) : selectedEvent ? (
                <UpcomingRaceCard race={selectedEvent} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  {t('no_round_selected')}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Betting slip */}
      <div className="h-[942px] w-[410px] bg-background text-foreground">
        <BettingSlip selectedEvent={selectedEvent} />
      </div>
    </div>
  )
}
