'use client'
import { UpcomingEvent } from '@/virtual-lib/types'
import BettingSlip from '@/virtual-components/betting-slip'
import BettingSlipSheet from '@/virtual-components/betting-slip-sheet'
import LiveMatchInfo from '@/virtual-components/live-match-info'
import LoadingSpinner from '@/virtual-components/loading-spinner'
import MatchEndBadge from '@/virtual-components/match-end-badge'
import { UpcomingEventsCarousel } from '@/virtual-components/upcoming-events-carousel'
import VideoStreamCard from '@/virtual-components/video-stream-card'
import { RootContext } from '@/virtual-contexts/root-context'
import { Discipline, Market } from '@/virtual-lib/types'
import { useContext, useMemo, useState } from 'react'

export default function Home() {
  const { upcomingEvents, liveRound } = useContext(RootContext)
  const [matchBetOptions /* setMatchBetOptions */] = useState<{
    round: {
      name: string
      number: number
      startingAt: Date
    }
    teams: string
    markets: Market[]
  }>()

  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | undefined>(
    upcomingEvents?.filter((e) => e.discipline === Discipline.DOGS)[0],
  )

  // Filtra eventi per cani
  const dogEvents = useMemo(() => {
    return (
      upcomingEvents?.filter((event) => event.discipline === Discipline.DOGS) ||
      []
    )
  }, [upcomingEvents])

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
          />
          <MatchEndBadge />
          {!dogEvents && (
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          )}

          {/* Upcoming dog events - visible on desktop */}
          <div className="hidden w-full lg:block">
            {dogEvents && !matchBetOptions && (
              <ol className="w-full space-y-7">
                {dogEvents.map((event) => (
                  <li key={event.id}>
                    <div className="rounded-lg border bg-card p-4 text-card-foreground">
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="text-sm">ID: {event.id}</p>
                      <p className="text-sm text-muted-foreground">
                        Start time: {event.startTime}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Second column content - appears after first column but before upcoming rounds on mobile */}
        {/*<div className="space-y-3 lg:col-span-1">
           <LiveRoundScores />
          {selectedMatch ? (
            <MatchStatisticsCard
              match={selectedMatch}
              onBack={() => setSelectedMatch(undefined)}
            />
          ) : (
            <LiveRoundStatistics onMatchSelect={setSelectedMatch} />
          )}
          <MatchResult />
          <div className="hidden lg:block">
            <Leaderboard highlightedTeams={highlightedTeams} />
          </div>
        </div> */}

        {/* Upcoming dog events - visible only on mobile, appears at the bottom */}
        <div className="block lg:hidden">
          {dogEvents && !matchBetOptions && (
            <ol className="w-full space-y-7">
              {/* {upcomingRounds.map((round) => (
                <li key={round.scheduleId}>
                  <UpcomingRoundCard
                    round={round}
                    viewMatchBettingOptions={setMatchBetOptions}
                  /> */}
              {dogEvents.map((event) => (
                <li key={event.id}>
                  <div className="rounded-lg border bg-card p-4 text-card-foreground">
                    <h3 className="font-semibold">{event.name}</h3>
                    <p className="text-sm">ID: {event.id}</p>
                    <p className="text-sm text-muted-foreground">
                      Start time: {event.startTime}
                    </p>
                  </div>{' '}
                </li>
              ))}
            </ol>
          )}
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
