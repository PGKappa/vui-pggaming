'use client'
import BettingSlip from '@/virtual-components/betting-slip'
import BettingSlipSheet from '@/virtual-components/betting-slip-sheet'
import Leaderboard from '@/virtual-components/leaderboard'
import LeaderboardSheet from '@/virtual-components/leaderboard-sheet'
import LiveMatchInfo from '@/virtual-components/live-match-info'
import LiveRoundScores from '@/virtual-components/live-round-scores'
import LiveRoundStatistics from '@/virtual-components/live-round-statistics'
import LoadingSpinner from '@/virtual-components/loading-spinner'
import MatchBettingOptions from '@/virtual-components/match-betting-options'
import MatchEndBadge from '@/virtual-components/match-end-badge'
import MatchResult from '@/virtual-components/match-result'
import MatchStatisticsCard from '@/virtual-components/match-statistics-card'
import VideoStreamCard from '@/virtual-components/video-stream-card'
import { RootContext } from '@/virtual-contexts/root-context'
import { Discipline, Market, MatchStatistics } from '@/virtual-lib/types'
import { useContext, useMemo, useState } from 'react'

export default function Home() {
  const { upcomingEvents, liveRound } = useContext(RootContext)
  const [matchBetOptions, setMatchBetOptions] = useState<{
    round: {
      name: string
      number: number
      startingAt: Date
    }
    teams: string
    markets: Market[]
  }>()

  const [selectedMatch, setSelectedMatch] = useState<MatchStatistics>()

  // Filtra eventi per cani
  const horseEvents = useMemo(() => {
    return (
      upcomingEvents?.filter(
        (event) => event.discipline === Discipline.HORSES,
      ) || []
    )
  }, [upcomingEvents])

  const highlightedTeams = useMemo(() => {
    return selectedMatch ? selectedMatch.teams.split(' - ') : []
  }, [selectedMatch])

  return (
    <>
      <div className="container mb-10 mt-1 grid grid-cols-1 justify-center gap-3 bg-columnL-background text-columnL-foreground lg:mb-4 lg:grid-cols-4">
        {/* First column - top content */}
        <div className="flex flex-col items-center gap-4 lg:col-span-2">
          <div className="flex w-full flex-col gap-1">
            <LiveMatchInfo />
            <VideoStreamCard streamUrl={liveRound?.streamUrl} />
          </div>
          <MatchEndBadge />
          {matchBetOptions && (
            <MatchBettingOptions
              round={matchBetOptions.round}
              teams={matchBetOptions.teams}
              markets={matchBetOptions.markets}
              close={() => setMatchBetOptions(undefined)}
            />
          )}
          {!horseEvents && (
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          )}

          {/* Upcoming horse events - visible on desktop */}
          <div className="hidden w-full lg:block">
            {horseEvents && !matchBetOptions && (
              <ol className="w-full space-y-7">
                {/* {upcomingRounds.map((round) => (
                  <li key={round.scheduleId}>
                    <UpcomingRoundCard
                      round={round}
                      viewMatchBettingOptions={setMatchBetOptions}
                    /> */}
                {horseEvents.map((event) => (
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
        <div className="space-y-3 lg:col-span-1">
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
        </div>

        {/* Upcoming horse events - visible only on mobile, appears at the bottom */}
        <div className="block lg:hidden">
          {horseEvents && !matchBetOptions && (
            <ol className="w-full space-y-7">
              {/* {upcomingRounds.map((round) => (
                <li key={round.scheduleId}>
                  <UpcomingRoundCard
                    round={round}
                    viewMatchBettingOptions={setMatchBetOptions}
                  /> */}
              {horseEvents.map((event) => (
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
        <LeaderboardSheet highlightedTeams={highlightedTeams} />
        <BettingSlipSheet />
      </div>
    </>
  )
}
